const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Interview = require("../models/Interview");

const { evaluateAnswer } = require("../services/aiServices");

const submitAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;

    // 1. Validate input
    if (!questionId || !answer || !answer.trim()) {
      return res.status(400).json({
        message: "Question ID and answer are required",
      });
    }

    // 2. Find the question
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // 3. Check whether the interview exists
    const interview = await Interview.findOne({
      _id: question.interview,
      user: req.user,
    });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    // 4. Prevent duplicate answers
    const existingAnswer = await Answer.findOne({
      interview: question.interview,
      question: question._id,
    });

    if (existingAnswer) {
      return res.status(409).json({
        message: "You have already answered this question",
      });
    }

    // 5. Evaluate the answer using Gemini
    const evaluation = await evaluateAnswer({
      question: question.question,
      candidateAnswer: answer,
      difficulty: question.difficulty,
    });

    console.log("AI Evaluation:", evaluation);

    // 6. Save the answer and evaluation
    const savedAnswer = await Answer.create({
      interview: question.interview,
      question: question._id,
      answer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
    });

    // 7. Count total and answered questions
    const totalQuestions = await Question.countDocuments({
      interview: question.interview,
    });

    const answeredQuestions = await Answer.countDocuments({
      interview: question.interview,
    });
    // Find the next question
const nextQuestion = await Question.findOne({
  interview: question.interview,
  order: question.order + 1,
});

    // 8. Update interview status
    const isCompleted =
      totalQuestions > 0 && answeredQuestions >= totalQuestions;

    await Interview.findByIdAndUpdate(question.interview, {
      status: isCompleted ? "completed" : "in-progress",
    });

    // 9. Send response
    return res.status(201).json({
      message: "Answer submitted successfully",
      answer: savedAnswer,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
      },
      progress: {
        totalQuestions,
        answeredQuestions,
        remainingQuestions: totalQuestions - answeredQuestions,
        percentage: Math.round((answeredQuestions / totalQuestions) * 100),
      },
      nextQuestion: nextQuestion || null,
    });
  } catch (error) {
    console.error("Submit answer error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already answered this question",
      });
    }

    return res.status(500).json({
      message: "Failed to submit answer",
      error: error.message,
    });
  }
};

module.exports = {
  submitAnswer,
};
