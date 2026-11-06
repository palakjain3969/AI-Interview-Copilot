
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const {
    generateQuestions,
    generateTopicSuggestions
} = require("../services/aiServices");

// CREATE INTERVIEW
// CREATE INTERVIEW
const createInterview = async (req, res) => {
    console.log("CREATE INTERVIEW CONTROLLER CALLED");

    try {
        const {
            role,
            experience,
            difficulty,
            topics,
            numberOfQuestions
        } = req.body;

        if (!role || !experience || !difficulty) {
            return res.status(400).json({
                message: "Role, experience and difficulty are required"
            });
        }

        const questionCount = Number(numberOfQuestions ?? 5);

        if (
            !Number.isInteger(questionCount) ||
            questionCount < 1 ||
            questionCount > 20
        ) {
            return res.status(400).json({
                message: "Number of questions must be between 1 and 20"
            });
        }

        if (topics !== undefined && !Array.isArray(topics)) {
            return res.status(400).json({
                message: "Topics must be an array"
            });
        }

        const selectedTopics = topics || [];

        // Generate questions according to the selected count
        const generatedQuestions = await generateQuestions({
            role,
            experience,
            difficulty,
            topics: selectedTopics,
            numberOfQuestions: questionCount
        });

        console.log("Generated questions:", generatedQuestions);

        // Create interview after successful question generation
        const interview = await Interview.create({
            user: req.user,
            role,
            experience,
            difficulty,
            topics: selectedTopics,
            numberOfQuestions: questionCount
        });

        const questionsToSave = generatedQuestions.map((q, index) => ({
            interview: interview._id,
            question: q.question,
            topic: q.topic,
            difficulty: q.difficulty,
            order: index + 1
        }));

        const savedQuestions = await Question.insertMany(questionsToSave);

        return res.status(201).json({
            message: "Interview created successfully",
            interview,
            questions: savedQuestions
        });

    } catch (error) {
        console.error("Error creating interview:", error);

        return res.status(500).json({
            message: "Failed to create interview",
            error: error.message
        });
    }
};

// SUGGEST INTERVIEW TOPICS
const suggestTopics = async (req, res) => {
    try {
        const { role, experience, difficulty } = req.body;

        if (!role || !experience || !difficulty) {
            return res.status(400).json({
                message: "Role, experience and difficulty are required"
            });
        }

        const topics = await generateTopicSuggestions({
            role,
            experience,
            difficulty
        });

        return res.status(200).json({
            message: "Topics suggested successfully",
            topics
        });

    } catch (error) {
        console.error("Error suggesting topics:", error);

        return res.status(500).json({
            message: "Failed to suggest topics",
            error: error.message
        });
    }
};

// GET ALL INTERVIEWS OF LOGGED-IN USER
const getUserInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({
            user: req.user
        }).sort({ createdAt: -1 });

        const interviewHistory = await Promise.all(
            interviews.map(async (interview) => {

                const questions = await Question.find({
                    interview: interview._id
                });

                const answers = await Answer.find({
                    interview: interview._id
                }).sort({ createdAt: -1, _id: -1 });

                // Keep only the latest answer for each question
                const uniqueAnswers = new Map();

                answers.forEach((answer) => {
                    const questionId = answer.question.toString();

                    if (!uniqueAnswers.has(questionId)) {
                        uniqueAnswers.set(questionId, answer);
                    }
                });

                const finalAnswers = Array.from(uniqueAnswers.values());

                const totalScore = finalAnswers.reduce(
                    (sum, answer) => sum + answer.score,
                    0
                );

                const overallScore =
                    finalAnswers.length > 0
                        ? totalScore / finalAnswers.length
                        : 0;

                return {
                    _id: interview._id,
                    role: interview.role,
                    experience: interview.experience,
                    difficulty: interview.difficulty,
                    topics: interview.topics,
                    status: interview.status,
                    totalQuestions: questions.length,
                    answeredQuestions: finalAnswers.length,
                    overallScore: Number(overallScore.toFixed(2)),
                    createdAt: interview.createdAt,
                };
            })
        );

        return res.status(200).json({
            message: "Interview history fetched successfully",
            totalInterviews: interviewHistory.length,
            interviews: interviewHistory,
        });

    } catch (error) {
        console.error("Error fetching interview history:", error);

        return res.status(500).json({
            message: "Failed to fetch interview history",
            error: error.message,
        });
    }
};


// GET RESULT OF A SPECIFIC INTERVIEW
const getInterviewResult = async (req, res) => {
    try {
        const { id } = req.params;

        const interview = await Interview.findOne({
            _id: id,
            user: req.user
        });

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found"
            });
        }

        const questions = await Question.find({
            interview: id
        }).sort({ order: 1 });

        const answers = await Answer.find({
            interview: id
        }).sort({ createdAt: -1, _id: -1 });

        // Keep only one answer per question
        const uniqueAnswers = new Map();

        answers.forEach((answer) => {
            const questionId = answer.question.toString();

            if (!uniqueAnswers.has(questionId)) {
                uniqueAnswers.set(questionId, answer);
            }
        });

        const finalAnswers = Array.from(uniqueAnswers.values());

        const totalScore = finalAnswers.reduce(
            (sum, answer) => sum + answer.score,
            0
        );

        const overallScore =
            finalAnswers.length > 0
                ? totalScore / finalAnswers.length
                : 0;

        const results = questions.map((question) => {
            const answer = uniqueAnswers.get(
                question._id.toString()
            );

            return {
                question: question.question,
                topic: question.topic,
                difficulty: question.difficulty,
                answer: answer ? answer.answer : null,
                score: answer ? answer.score : null,
                feedback: answer ? answer.feedback : null,
                strengths: answer ? answer.strengths : [],
                weaknesses: answer ? answer.weaknesses : []
            };
        });

        return res.status(200).json({
            interviewId: interview._id,
            status: interview.status,
            role: interview.role,
            experience: interview.experience,
            difficulty: interview.difficulty,
            totalQuestions: questions.length,
            answeredQuestions: finalAnswers.length,
            overallScore: Number(overallScore.toFixed(2)),
            results
        });

    } catch (error) {
        console.error("Error getting interview result:", error);

        return res.status(500).json({
            message: "Failed to get interview result",
            error: error.message
        });
    }
};

module.exports = {
    createInterview,
    suggestTopics,
    getUserInterviews,
    getInterviewResult
};