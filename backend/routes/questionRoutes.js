const express = require("express");
const { createQuestion } = require("../controllers/questionController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createQuestion);

module.exports = router;