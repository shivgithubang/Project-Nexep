import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const SalaryRangeSchema = new Schema(
  {
    role: String,
    min: Number,
    max: Number,
    median: Number,
    location: String,
  },
  { _id: false }
);

const IndustryInsightSchema = new Schema(
  {
    industry: { type: String, unique: true },
    salaryRanges: [SalaryRangeSchema],
    growthRate: Number,
    demandLevel: String,
    topSkills: [String],
    marketOutlook: String,
    keyTrends: [String],
    recommendedSkills: [String],
    nextUpdate: Date,
  },
  { timestamps: true }
);

export default models.IndustryInsight || model("IndustryInsight", IndustryInsightSchema);
