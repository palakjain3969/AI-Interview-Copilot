const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const questionRoutes = require("./routes/questionRoutes");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");
const interviewRoutes = require("./routes/interviewRoutes");
const answerRoutes = require("./routes/answerRoutes");
const { generateQuestions, evaluateAnswer } = require("./services/aiServices");

const app = express();

app.get("/api/test-ai", async(req,res)=>{
    try {
        const questions = await generateQuestions({
            role: "Software Engineer",
            experience: "3 years",
            difficulty: "Medium",
            topics: ["JavaScript", "DSA", "Databases"]
        });
        res.json(questions);
    }catch(error){
        res.status(500).json({
            message: error.message
        });
    }
});






app.post("/api/test-evaluate", async (req, res) => {

    try {

        const result = await evaluateAnswer({
            question: "What is a closure in JavaScript?",
            candidateAnswer: "A closure is a function that remembers variables from its outer scope even after the outer function has finished.",
            difficulty: "Medium"
        });

        res.json(result);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
});


app.use(cors());
app.use(express.json());
app.use("/api/interviews", interviewRoutes);
app.use("/api/questions", questionRoutes);
connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/answers", answerRoutes);

app.get("/", (req, res) => {
    res.send("AI Interview Copilot Backend is running");
});
app.get("/api/test-protected", protect, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        userId: req.user
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});