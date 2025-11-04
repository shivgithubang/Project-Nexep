import { currentUser } from "@clerk/nextjs/server";
import connectMongoose from "@/lib/mongoose";
import User from "@/models/User";

export const checkUser = async () => {
  try {
    const user = await currentUser();

    if (!user) return null;

    await connectMongoose();

    const loggedInUser = await User.findOne({ clerkUserId: user.id }).lean();
    if (loggedInUser) return loggedInUser;

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

    const newUser = await User.create({
      clerkUserId: user.id,
      name,
      imageUrl: user.imageUrl || "",
      email: user.emailAddresses?.[0]?.emailAddress || "",
    });

    return newUser;
  } catch (error) {
    // Silently handle Clerk errors to prevent constant recompilation
    if (error.message?.includes("clerkMiddleware")) return null;
    console.log("checkUser error:", error.message);
    return null;
  }
};
