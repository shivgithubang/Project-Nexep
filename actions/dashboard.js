"use server";

import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectMongoose from "@/lib/mongoose";
import IndustryInsight from "@/models/IndustryInsight";
import User from "@/models/User";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  const insights = JSON.parse(cleanedText);
  
  // Convert salary ranges from USD to INR
  insights.salaryRanges = insights.salaryRanges.map(range => ({
    ...range,
    min: Math.round(range.min * 83.5), // USD to INR conversion
    max: Math.round(range.max * 83.5),
    median: Math.round(range.median * 83.5),
    currency: 'INR' // Add currency indicator
  }));

  return insights;
};

// Helper function to convert MongoDB document to plain object
const convertToPlainObject = (doc) => {
  if (!doc) return null;
  const obj = JSON.parse(JSON.stringify(doc));
  // Convert dates to ISO strings
  if (obj.nextUpdate) obj.nextUpdate = new Date(obj.nextUpdate).toISOString();
  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).toISOString();
  // Remove MongoDB specific fields if needed
  delete obj.__v;
  return obj;
};

export async function updateUserIndustry(newIndustry) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await connectMongoose();

  const user = await User.findOneAndUpdate(
    { clerkUserId: userId }, 
    { industry: newIndustry }, 
    { new: true }
  ).lean();

  // Generate new insights for the new industry
  const insights = await generateAIInsights(newIndustry);

  // Update or create industry insights
  const industryInsight = await IndustryInsight.findOneAndUpdate(
    { industry: newIndustry },
    { ...insights, nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { upsert: true, new: true, setDefaultsOnInsert: true, lean: true }
  );

  return convertToPlainObject(industryInsight);
}

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await connectMongoose();

  const user = await User.findOne({ clerkUserId: userId }).lean();
  if (!user) throw new Error("User not found");

  // If no insights exist, generate them
  const existing = await IndustryInsight.findOne({ industry: user.industry }).lean();
  if (!existing) {
    const insights = await generateAIInsights(user.industry);
    const industryInsight = await IndustryInsight.create({
      industry: user.industry,
      ...insights,
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return convertToPlainObject(industryInsight.toObject());
  }

  return convertToPlainObject(existing);
}
