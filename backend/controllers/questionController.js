const Question = require("../models/Question");
const Interview = require("../models/Interview");

const createQuestion = async (req, res) => {
    try {
        const { interviewId, question, topic, difficulty, order } = req.body;

        if(!interviewId || !question || !topic || !order) {
            return res.status(400).json({
                message: "Interview ID, question, topic, and order are required"
            });
        }
        const interview = await Interview.findOne({
            _id: interviewId,
            user: req.user
        });
        if(!interview){
            return res.status(404).json({
                message: "Interview not found"
            });
        }

        const newQuestion = await Question.create({
            interview: interviewId,
            question,
            topic,
            difficulty,
            order
        });

        res.status(201).json({
            message: "Question created successfully",
            question: newQuestion
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating question",
            error: error.message
        });
    }
};

module.exports={createQuestion};