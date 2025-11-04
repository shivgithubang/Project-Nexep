import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const ResumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    content: String, // Markdown content
    atsScore: Number,
    feedback: String,
  },
  { timestamps: true }
);

export default models.Resume || model("Resume", ResumeSchema);
