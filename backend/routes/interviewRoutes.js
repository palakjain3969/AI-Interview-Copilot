
const express = require("express");

const {
    createInterview,
    getUserInterviews,
    getInterviewResult
} = require("../controllers/interviewController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new interview
router.post("/", protect, createInterview);

// Get all interviews of logged-in user
router.get("/", protect, getUserInterviews);

// Get result of a specific interview
router.get("/:id/result", protect, getInterviewResult);

module.exports = router;
