"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import connectMongoose from "@/lib/mongoose";
import User from "@/models/User";
import IndustryInsight from "@/models/IndustryInsight";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectMongoose();

  const user = await User.findOne({ clerkUserId: userId });
  if (!user) throw new Error("User not found");

  try {
    // Find or create industry insight
    let industryInsight = await IndustryInsight.findOne({ industry: data.industry });
    if (!industryInsight) {
      const insights = await generateAIInsights(data.industry);
      industryInsight = await IndustryInsight.create({
        industry: data.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Update user fields
    user.industry = data.industry || null;
    user.experience = data.experience ?? null;
    user.bio = data.bio ?? null;
    user.skills = data.skills ?? [];

    await user.save();

    revalidatePath("/");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile: " + error.message);
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectMongoose();

  const user = await User.findOne({ clerkUserId: userId }).select("industry").lean();
  if (!user) throw new Error("User not found");

  try {
    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}
