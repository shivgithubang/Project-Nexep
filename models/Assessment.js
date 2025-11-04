import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const QuestionSchema = new Schema(
  {
    question: String,
    answer: String,
    userAnswer: String,
    isCorrect: Boolean,
    explanation: String,
  },
  { _id: false }
);

const AssessmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quizScore: Number,
    questions: [QuestionSchema],
    category: String,
    improvementTip: String,
  },
  { timestamps: true }
);

export default models.Assessment || model("Assessment", AssessmentSchema);
