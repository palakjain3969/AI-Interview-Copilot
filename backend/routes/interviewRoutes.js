const express = require("express");

const {
    createInterview,
    suggestTopics,
    getUserInterviews,
    getInterviewResult
} = require("../controllers/interviewController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/suggest-topics", protect, suggestTopics);

router.post("/", protect, createInterview);

router.get("/", protect, getUserInterviews);

router.get("/:id/result", protect, getInterviewResult);

module.exports = router;