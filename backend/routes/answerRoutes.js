const express = require('express');
const {submitAnswer} = require('../controllers/answerController');

const protect = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, submitAnswer);
module.exports = router;