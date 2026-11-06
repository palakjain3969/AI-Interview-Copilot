const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const generateQuestions = async ({
    role,
    experience,
    difficulty,
    topics = [],
    numberOfQuestions = 5
}) => {
    const prompt = `
You are an expert technical interviewer.

Generate exactly ${numberOfQuestions} interview questions for a candidate.

Role: ${role}
Experience: ${experience}
Difficulty: ${difficulty}
Topics: ${topics.length > 0 ? topics.join(", ") : "Relevant topics for the selected role"}

Requirements:
- Generate exactly ${numberOfQuestions} questions.
- Questions should be relevant to the given role.
- Cover the given topics.
- Match the candidate's experience level.
- Follow the requested difficulty.
- Avoid repeating questions.
- Do not provide answers.
- Return ONLY a JSON array.
- Each object must contain:
  question
  topic
  difficulty
`;

    const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
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

            if (
                !Array.isArray(questions) ||
                questions.length !== numberOfQuestions
            ) {
                throw new Error(
                    `Gemini did not return exactly ${numberOfQuestions} questions`
                );
            }

            console.log(`Successfully generated ${questions.length} questions using ${model}`);

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

const generateTopicSuggestions = async ({
    role,
    experience,
    difficulty
}) => {
    const prompt = `
You are an expert technical interviewer.

Suggest exactly 8 important interview topics for a candidate.

Role: ${role}
Experience: ${experience}
Difficulty: ${difficulty}

Requirements:
- Topics must be relevant to the given role.
- Match the candidate's experience level.
- Include a balanced mix of core and role-specific topics.
- Avoid duplicate or overly broad topics.
- Return ONLY a JSON array of strings.
- Do not include explanations.

Example format:
["Data Structures and Algorithms", "Object-Oriented Programming"]
`;

    const models = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
    ];

    let lastError;

    for (const model of models) {
        try {
            console.log(`Generating topic suggestions using ${model}`);

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

            const topics = JSON.parse(text.substring(start, end + 1));

            if (
                !Array.isArray(topics) ||
                topics.length !== 8 ||
                !topics.every(topic => typeof topic === "string")
            ) {
                throw new Error("Gemini did not return exactly 8 valid topics");
            }

            return topics;
        } catch (error) {
            lastError = error;
            console.error(`Topic suggestion failed using ${model}:`, error.message);
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
    generateQuestions, generateTopicSuggestions, evaluateAnswer
};