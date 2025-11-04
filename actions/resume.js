"use server";

import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import connectMongoose from "@/lib/mongoose";
import User from "@/models/User";
import Resume from "@/models/Resume";
import IndustryInsight from "@/models/IndustryInsight";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectMongoose();
  const user = await User.findOne({ clerkUserId: userId }).lean();
  if (!user) throw new Error("User not found");

  try {
    const resume = await Resume.findOneAndUpdate(
      { userId: user._id },
      { content },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectMongoose();
  const user = await User.findOne({ clerkUserId: userId }).lean();
  if (!user) throw new Error("User not found");

  return await Resume.findOne({ userId: user._id }).lean();
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await connectMongoose();
  const user = await User.findOne({ clerkUserId: userId }).lean();
  if (!user) throw new Error("User not found");

  const industryInsight = await IndustryInsight.findOne({ industry: user.industry }).lean();

  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}

export async function analyzeResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectMongoose();
  const user = await User.findOne({ clerkUserId: userId }).lean();
  if (!user) throw new Error("User not found");

  const industryInsight = await IndustryInsight.findOne({ industry: user.industry }).lean();

  // Build prompt to evaluate ATS score and provide targeted suggestions
  const prompt = `
    You are an expert resume reviewer and ATS specialist.
    The user profile: industry: ${user.industry || "N/A"}; experience: ${user.experience || "N/A"}; skills: ${user.skills || "N/A"}.
    Evaluate the following resume content and return a JSON object ONLY in this format:
    {
      "atsScore": number,       // 0-100
      "issues": ["string"],   // short list of issues affecting ATS or clarity
      "suggestions": [
        { "area": "Summary|Skills|Experience|Formatting|Keywords", "advice": "string" }
      ],
      "improvedSummary": "string" // a short improved professional summary (max 45 words)
    }

    Resume content:
    """
    ${content}
    """

    Score the resume for ATS friendliness: consider keywords, section headings, formatting, and use of metrics. Be concise. Return valid JSON only.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Basic validation
    if (typeof parsed.atsScore !== "number") {
      throw new Error("Invalid ATS score returned from AI");
    }

    return parsed;
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw new Error("Failed to analyze resume");
  }
}
