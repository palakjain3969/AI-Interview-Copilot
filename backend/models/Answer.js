
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
    {
        interview: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Interview",
            required: true
        },

        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true
        },

        answer: {
            type: String,
            required: true
        },

        score: {
            type: Number,
            min: 0,
            max: 10
        },

        feedback: {
            type: String
        },

        strengths: {
            type: [String],
            default: []
        },

        weaknesses: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Allow only one answer per question in each interview
answerSchema.index(
    { interview: 1, question: 1 },
    { unique: true }
);

module.exports = mongoose.model("Answer", answerSchema);
