const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const generateQuestions = async ({
    role,
    experience,
    difficulty,
    topics
}) => {
    const prompt = `
You are an expert technical interviewer.

Generate 5 interview questions for a candidate.

Role: ${role}
Experience: ${experience}
Difficulty: ${difficulty}
Topics: ${topics.join(", ")}

Requirements:
- Questions should be relevant to the given role.
- Cover the given topics.
- Match the candidate's experience level.
- Follow the requested difficulty.
- Do not provide answers.
- Return ONLY a JSON array.
- Each object must contain:
  question
  topic
  difficulty
`;

    const models = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash"
    ];

    let lastError;

    for (const model of models) {
        try {
            console.log(`Generating questions using ${model}`);

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.text;

            if (!text) {
                throw new Error("Gemini returned an empty response");
            }

            const start = text.indexOf("[");
            const end = text.lastIndexOf("]");

            if (start === -1 || end === -1) {
                throw new Error("Gemini did not return a JSON array");
            }

            const questions = JSON.parse(
                text.substring(start, end + 1)
            );

            if (!Array.isArray(questions) || questions.length !== 5) {
                throw new Error("Gemini did not return exactly 5 questions");
            }

            console.log(`Questions generated successfully using ${model}`);

            return questions;

        } catch (error) {
            lastError = error;

            console.error(
                `Question generation failed using ${model}:`,
                error.message
            );
        }
    }

    throw new Error(
        `All Gemini models failed. Last error: ${lastError.message}`
    );
};


const evaluateAnswer = async ({
    question,
    candidateAnswer,
    difficulty
}) => {

    const prompt = `
You are an expert technical interviewer.

Evaluate the candidate's answer to the interview question.

Question:
${question}

Candidate's Answer:
${candidateAnswer}

Difficulty:
${difficulty}

Evaluate the answer based on:
- Technical correctness
- Understanding of the concept
- Completeness
- Clarity

Give a score from 0 to 10.

Return ONLY valid JSON in this exact format:

{
    "score": 8,
    "feedback": "Good explanation of the concept.",
    "strengths": [
        "Correct understanding of the main concept"
    ],
    "weaknesses": [
        "Could provide a practical example"
    ]
}
`;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt
        });

       const text = response.text;
       console.log("RAW GEMINI RESPONSE:");
       console.log(text);

        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start === -1 || end === -1) {
            throw new Error("Gemini did not return valid JSON");
        }
        const cleanedText = text.substring(start, end + 1);
        return JSON.parse(cleanedText);

    } catch (error) {

        console.error(
            "AI answer evaluation failed:",
            error.message
        );

        throw error;
    }
};

module.exports = {
    generateQuestions, evaluateAnswer
};