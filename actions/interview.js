"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateQuiz(category = "Technical", questionCount = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Validate question count
  if (![10, 15, 20].includes(questionCount)) {
    questionCount = 10; // Default to 10 if invalid
  }

  // Validate category
  const allowed = ["Technical", "DSA", "Aptitude", "Behavioral", "System Design"];
  if (!allowed.includes(category)) category = "Technical";

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");
  if (!user.industry) throw new Error("Please complete your profile first to generate quiz questions");

  // Build category-specific instructions
  let categoryInstruction = "technical";
  if (category === "DSA") {
    categoryInstruction = "data structures and algorithms (DSA) focusing on algorithmic problem solving and complexity";
  } else if (category === "Aptitude") {
    categoryInstruction = "aptitude, logical reasoning and quantitative problems";
  } else if (category === "Behavioral") {
    categoryInstruction = "behavioral and situational judgment questions focused on communication, teamwork, and problem-solving";
  } else if (category === "System Design") {
    categoryInstruction = "system design concepts and architecture-focused multiple choice questions (design trade-offs, scalability, components)";
  }

  const prompt = `
    Generate ${questionCount} ${categoryInstruction} questions for a ${user.industry} professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    Include a mix of difficulty levels: ${Math.floor(questionCount * 0.3)} easy, ${Math.floor(questionCount * 0.4)} medium, and ${Math.floor(questionCount * 0.3)} hard questions.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string",
          "difficulty": "easy" | "medium" | "hard"
        }
      ]
    }
  `;

  try {
    console.log("Generating quiz for industry:", user.industry);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log("Raw AI response:", text.substring(0, 200));
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    if (!quiz.questions || quiz.questions.length === 0) {
      throw new Error("No questions generated");
    }

    console.log("Successfully generated", quiz.questions.length, "questions");
    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    if (error.message.includes("API key") || error.message.includes("API_KEY")) {
      throw new Error("API key error. Please check your Gemini API key configuration.");
    }
    if (error.message.includes("quota") || error.message.includes("limit")) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    if (error.message.includes("JSON")) {
      throw new Error("Failed to parse quiz data. Please try again.");
    }
    if (error.message.includes("network") || error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection and try again.");
    }
    throw new Error("Failed to generate quiz questions. Please try again or contact support if the issue persists.");
  }
}

export async function saveQuizResult(questions, answers, score, category = "Technical") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category,
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}
