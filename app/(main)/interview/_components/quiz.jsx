"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { Clock } from "lucide-react";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState("Technical");
  const [currentCategory, setCurrentCategory] = useState("Technical");

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
    error: quizError,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      // Set timer based on difficulty: 60 seconds per question for a total of 10 minutes for 10 questions
      const totalTime = quizData.length * 60; // 60 seconds per question
      setTimeLeft(totalTime);
      setTimerActive(true);
    }
  }, [quizData]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0 && quizData) {
        toast.error("Time's up! Submitting quiz...");
        finishQuiz();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeLeft, quizData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    setTimerActive(false);
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score, currentCategory);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeLeft(null);
    setTimerActive(false);
    // reset category to default
    setSelectedCategory("Technical");
    setCurrentCategory("Technical");
    generateQuizFn("Technical", questionCount);
    setResultData(null);
  };

  if (generatingQuiz) {
    return <BarLoader className="mt-4" width={"100%"} color="gray" />;
  }

  // Show results if quiz is completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Select the number of questions for your quiz. Questions will be specific to your industry and skills.
            </p>
            <div className="flex flex-col space-y-2">
              <Label>Number of Questions</Label>
              <RadioGroup
                value={questionCount.toString()}
                onValueChange={(value) => setQuestionCount(parseInt(value))}
                className="flex space-x-4"
              >
                {[10, 15, 20].map((count) => (
                  <div key={count} className="flex items-center space-x-2">
                    <RadioGroupItem value={count.toString()} id={`q-${count}`} />
                    <Label htmlFor={`q-${count}`}>{count}</Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-muted-foreground mt-2">
                Time limit: {questionCount} minutes
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Quiz Type</Label>
              <RadioGroup
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
                className="flex flex-row space-x-4"
              >
                {[
                  "Technical",
                  "DSA",
                  "Aptitude",
                  "Behavioral",
                  "System Design",
                ].map((cat) => (
                  <div key={cat} className="flex items-center space-x-2">
                    <RadioGroupItem value={cat} id={`cat-${cat}`} />
                    <Label htmlFor={`cat-${cat}`}>{cat}</Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-muted-foreground mt-2">
                Recommended: Technical (based on your profile)
              </p>
            </div>
            {quizError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Failed to generate quiz</p>
                <p className="text-red-600 text-sm mt-1">
                  {quizError.message || "Please try again or check your profile settings."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              setCurrentCategory(selectedCategory);
              generateQuizFn(selectedCategory, questionCount);
            }}
            className="w-full"
            disabled={generatingQuiz}
          >
            {generatingQuiz ? "Generating Quiz..." : "Start Quiz"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];

  return (
    <Card className="mx-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Question {currentQuestion + 1} of {quizData.length}
          </CardTitle>
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeLeft < 60
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                  : timeLeft < 180
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <p className="text-lg font-medium flex-1">{question.question}</p>
          {question.difficulty && (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                question.difficulty === "easy"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                  : question.difficulty === "medium"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
              }`}
            >
              {question.difficulty.toUpperCase()}
            </span>
          )}
        </div>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-2"
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>

      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="ml-auto"
        >
          {savingResult && (
            <BarLoader className="mt-4" width={"100%"} color="gray" />
          )}
          {currentQuestion < quizData.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}
