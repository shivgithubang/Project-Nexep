"use server";

import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectMongoose from "@/lib/mongoose";
import User from "@/models/User";
import Assessment from "@/models/Assessment";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateQuiz(category = "Technical", questionCount = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectMongoose();

  // Validate question count
  if (![10, 15, 20].includes(questionCount)) {
    questionCount = 10; // Default to 10 if invalid
  }

  // Validate category
  const allowed = ["Technical", "DSA", "Aptitude", "Behavioral", "System Design"];
  if (!allowed.includes(category)) category = "Technical";

  const user = await User.findOne({ clerkUserId: userId }).select("industry skills").lean();

  if (!user) throw new Error("User not found");
  if (!user.industry) throw new Error("Please complete your profile first to generate quiz questions");

  // Build category-specific and industry-specific instructions
  let categoryInstruction = "";
  let industryContext = "";

  // Set industry context based on user's industry
  switch (user.industry) {
    case "energy":
      industryContext = "energy sector, including renewable energy, power systems, energy management, and utility operations";
      break;
    case "tech":
      industryContext = "technology sector, including software development, IT systems, and digital solutions";
      break;
    case "finance":
      industryContext = "financial services, including banking, investment, and financial analysis";
      break;
    case "healthcare":
      industryContext = "healthcare industry, including medical systems, healthcare management, and patient care";
      break;
    case "manufacturing":
      industryContext = "manufacturing sector, including production systems, industrial processes, and quality control";
      break;
    case "telecom":
      industryContext = "telecommunications industry, including network systems, communication infrastructure, and telecom services";
      break;
    default:
      industryContext = user.industry;
  }

  // Set category instruction with industry context
  if (category === "DSA") {
    categoryInstruction = "data structures and algorithms (DSA) questions relevant to solving problems in the " + industryContext;
  } else if (category === "Aptitude") {
    categoryInstruction = "aptitude and logical reasoning problems commonly encountered in the " + industryContext;
  } else if (category === "Behavioral") {
    categoryInstruction = "behavioral and situational judgment questions specific to roles in the " + industryContext;
  } else if (category === "System Design") {
    categoryInstruction = "system design and architecture questions focused on " + industryContext;
  } else {
    categoryInstruction = "technical questions specific to working in the " + industryContext;
  }

  const prompt = `
    Generate ${questionCount} ${categoryInstruction}.
    
    The questions should be highly specific to the ${user.industry} industry${
    user.skills?.length ? ` and incorporate concepts from ${user.skills.join(", ")}` : ""
    }.
    
    Important guidelines:
    1. Questions must be directly related to real-world scenarios in the ${user.industry} industry
    2. Include industry-specific terminology and concepts
    3. Focus on practical knowledge needed for ${user.industry} roles
    4. Each question should test understanding of industry-standard practices
    
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

  await connectMongoose();

  const user = await User.findOne({ clerkUserId: userId }).lean();
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
    const assessment = await Assessment.create({
      userId: user._id,
      quizScore: score,
      questions: questionResults,
      category,
      improvementTip,
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

  await connectMongoose();

  const user = await User.findOne({ clerkUserId: userId }).lean();
  if (!user) throw new Error("User not found");

  try {
    const assessments = await Assessment.find({ userId: user._id }).sort({ createdAt: 1 }).lean();

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}
