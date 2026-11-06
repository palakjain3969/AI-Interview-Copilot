const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        role: {
            type: String,
            required: true
        },

        experience: {
            type: String,
            required: true
        },

        difficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            required: true
        },

        topics: {
            type: [String],
            default: []
        },

        numberOfQuestions: {
            type: Number,
            default: 5,
            min: 1,
            max: 20
        },

        status: {
            type: String,
            enum: ['created', 'in-progress', 'completed'],
            default: 'created'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Interview', interviewSchema);