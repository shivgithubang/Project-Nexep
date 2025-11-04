import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const UserSchema = new Schema(
  {
    clerkUserId: { type: String, unique: true, index: true },
    email: { type: String, unique: true, index: true },
    name: String,
    imageUrl: String,
    industry: String,
    bio: String,
    experience: Number,
    skills: [String],
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
