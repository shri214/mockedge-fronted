import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  SkipForward,
  FileText,
  Loader,
} from "lucide-react";
import "./OngoingExam.scss";
import { useAppSelector } from "../../redux/hook";
import type { RootState } from "../../store";
import { AssignQuestionApi } from "../../function/assignQuestion";
import { GetQuestion } from "../../function/getQuestions";
import { UpdateAnswer } from "../../function/updateAnswer";
import { MockSubmission } from "../../function/mockSubmission";
import { toast } from "react-toastify";
import type {
  ApiResponse,
  OngoingExamProps,
  PaginationInfo,
  Question,
  UnifiedDto,
} from "../../Interface";

interface ExamState {
  isLoading: boolean;
  currentPage: number;
  selectedAnswer: string;
  timeSpent: number;
  isSubmitting: boolean;
  error: string | null;
  isInitialized: boolean; // Add this to track initialization
}

export const OngoingExam: React.FC<OngoingExamProps> = ({
  cleanupSecureMode,
  onExitSecure,
}) => {
  // const { userId } = useParams<{ userId: string }>();
  const { questionQuery } = useAppSelector((state: RootState) => state);

  const hasInitialized = useRef(false);

  // const navigate = useNavigate();

  console.log("questionQuery ", questionQuery);

  // State management
  const [examState, setExamState] = useState<ExamState>({
    isLoading: true,
    currentPage: 0,
    selectedAnswer: "",
    timeSpent: 0,
    isSubmitting: false,
    error: null,
    isInitialized: false,
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalQuestions: 0,
    currentPage: 0,
    hasNext: false,
  });

  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [examStartTime] = useState<number>(Date.now());

  // Memoized values
  const currentQuestionNumber = useMemo(
    () => examState.currentPage + 1,
    [examState.currentPage]
  );

  const canGoPrevious = useMemo(
    () => examState.currentPage > 0,
    [examState.currentPage]
  );

  const canGoNext = useMemo(
    () => paginationInfo.hasNext,
    [paginationInfo.hasNext]
  );

  const progressPercentage = useMemo(
    () =>
      ((examState.currentPage + 1) /
        Math.max(paginationInfo.totalQuestions, 1)) *
      100,
    [examState.currentPage, paginationInfo.totalQuestions]
  );

  // Error handling wrapper with better error logging
  const withErrorHandling = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      try {
        setExamState((prev) => ({ ...prev, error: null }));
        return await operation();
      } catch (error) {
        console.error(`${errorMessage}:`, error);

        // More detailed error handling
        let errorMsg = errorMessage;
        if (error instanceof Error) {
          errorMsg = `${errorMessage}: ${error.message}`;
        } else if (typeof error === "string") {
          errorMsg = `${errorMessage}: ${error}`;
        }

        setExamState((prev) => ({
          ...prev,
          error: errorMsg,
          isLoading: false,
        }));
        return null;
      }
    },
    []
  );

  // Load question with better error handling and validation
  const loadQuestion = useCallback(
    async (page: number): Promise<Question | null> => {
      console.log(`Loading question for page: ${page}`);

      setExamState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Validate attemptId before making the call
      if (!questionQuery?.attemptId) {
        setExamState((prev) => ({
          ...prev,
          error: "No attempt ID found. Please restart the exam.",
          isLoading: false,
        }));
        return null;
      }

      const response = await withErrorHandling(
        () =>
          GetQuestion(questionQuery.attemptId, page) as Promise<ApiResponse>,
        `Failed to load question for page ${page}`
      );

      console.log("GetQuestion response:", response);

      if (response) {
        // Validate response structure
        if (!response.questions || !Array.isArray(response.questions)) {
          setExamState((prev) => ({
            ...prev,
            error: "Invalid response format from server",
            isLoading: false,
          }));
          return null;
        }

        if (response.questions.length === 0) {
          setExamState((prev) => ({
            ...prev,
            error: "No questions found for this page",
            isLoading: false,
          }));
          return null;
        }

        const question = response.questions[0];

        // Validate question structure
        if (
          !question.questionId ||
          !question.questionText ||
          !question.options
        ) {
          setExamState((prev) => ({
            ...prev,
            error: "Invalid question data received",
            isLoading: false,
          }));
          return null;
        }
        //...............................................................................
        setCurrentQuestion(question);
        setPaginationInfo({
          totalQuestions: response.totalQuestions ?? 0,
          currentPage: response.currentPage ?? page,
          hasNext: response.hasNext ?? false,
        });

        setExamState((prev) => ({
          ...prev,
          isLoading: false,
          currentPage: response.currentPage ?? page,
          selectedAnswer: question.givenAnswer || "",
          isInitialized: true,
        }));

        setQuestionStartTime(Date.now());
        return question;
      }

      // If we get here, the API call failed
      setExamState((prev) => ({
        ...prev,
        isLoading: false,
        error: prev.error || "Failed to load question",
      }));
      return null;
    },
    [questionQuery?.attemptId, withErrorHandling]
  );

  // Initialize exam with better flow control
  useEffect(() => {
    if (hasInitialized.current) return; // stop re-runs
    hasInitialized.current = true;

    const initializeExam = async () => {
      console.log("Initializing exam...");

      if (!questionQuery) {
        setExamState((prev) => ({
          ...prev,
          error: "No exam configuration found. Please restart the exam.",
          isLoading: false,
        }));
        return;
      }

      setExamState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const attemptId = questionQuery.attemptId;

        if (!attemptId) {
          toast.error("No attemptId found, assigning questions...");
          return;
        }

        if (attemptId) {
          console.log("Loading first question with attemptId:", attemptId);
          const config: Partial<UnifiedDto> = Object.fromEntries(
            Object.entries(questionQuery).filter(
              ([, value]) =>
                value !== "" && value !== undefined && value !== null
            )
          );

          const assignResult = await withErrorHandling(
            () => AssignQuestionApi(config),
            "Failed to initialize exam questions"
          );

          if (!assignResult) {
            console.error("Failed to assign questions");
            return;
          }

          console.log("AssignQuestion result:", assignResult);

          const question = await loadQuestion(0);

          if (!question) {
            console.error("Failed to load first question");
            setExamState((prev) => ({
              ...prev,
              error: "Failed to load the first question. Please try again.",
              isLoading: false,
            }));
          }
        } else {
          setExamState((prev) => ({
            ...prev,
            error: "Failed to initialize exam. No attempt ID available.",
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error("Exam initialization error:", error);
        setExamState((prev) => ({
          ...prev,
          error: "Failed to initialize exam. Please try again.",
          isLoading: false,
        }));
      }
    };

    initializeExam();
  }, []); // 👈 empty deps, runs only once

  // Timer for tracking time
  useEffect(() => {
    const timer = setInterval(() => {
      setExamState((prev) => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - examStartTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [examStartTime]);

  // Answer selection
  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (examState.isSubmitting || examState.isLoading) return;

      setExamState((prev) => ({
        ...prev,
        selectedAnswer: answer,
        error: null,
      }));
    },
    [examState.isSubmitting, examState.isLoading]
  );

  // Save answer
  const saveCurrentAnswer = useCallback(
    async (answer: string, timeTaken: number): Promise<boolean> => {
      if (!currentQuestion) return false;

      setExamState((prev) => ({ ...prev, isSubmitting: true }));

      const success = await withErrorHandling(async () => {
        // TODO: Replace with actual API call (updateAnswer)
        await UpdateAnswer(
          questionQuery.attemptId,
          currentQuestion.questionId,
          answer
        );
        return true;
      }, "Failed to save answer");

      setExamState((prev) => ({ ...prev, isSubmitting: false }));

      if (success) {
        setCurrentQuestion((prev) =>
          prev
            ? {
                ...prev,
                givenAnswer: answer,
                isAnswered: true,
                timeTakenSeconds: timeTaken,
              }
            : null
        );
        return true;
      }

      return false;
    },
    [currentQuestion, withErrorHandling, questionQuery.attemptId]
  );

  // Navigation handlers
  const handlePrevious = useCallback(async () => {
    if (!canGoPrevious || examState.isLoading || examState.isSubmitting) return;
    await loadQuestion(examState.currentPage - 1);
  }, [
    canGoPrevious,
    examState.isLoading,
    examState.isSubmitting,
    examState.currentPage,
    loadQuestion,
  ]);

  const handleNext = useCallback(async () => {
    if (!canGoNext || examState.isLoading) return;

    // Save current answer if selected
    if (examState.selectedAnswer) {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      const saved = await saveCurrentAnswer(
        examState.selectedAnswer,
        timeTaken
      );
      if (!saved) return;
    }

    await loadQuestion(examState.currentPage + 1);
  }, [
    canGoNext,
    examState.isLoading,
    examState.selectedAnswer,
    questionStartTime,
    saveCurrentAnswer,
    loadQuestion,
    examState.currentPage,
  ]);

  // Jump to specific question
  const handleJumpToQuestion = useCallback(async () => {
    const input = prompt(
      `Jump to question (1-${paginationInfo.totalQuestions}):`
    );
    const questionNum = parseInt(input || "");

    if (
      isNaN(questionNum) ||
      questionNum < 1 ||
      questionNum > paginationInfo.totalQuestions
    ) {
      alert("Please enter a valid question number");
      return;
    }

    const targetPage = questionNum - 1;
    if (targetPage === examState.currentPage) return;

    // Save current answer before jumping
    if (examState.selectedAnswer) {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      await saveCurrentAnswer(examState.selectedAnswer, timeTaken);
    }

    await loadQuestion(targetPage);
  }, [
    paginationInfo.totalQuestions,
    examState.currentPage,
    examState.selectedAnswer,
    questionStartTime,
    saveCurrentAnswer,
    loadQuestion,
  ]);

  // Submit exam
  const handleSubmission = useCallback(async () => {
    if (examState.isSubmitting) return;

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit your answer? This action cannot be undone."
    );
    if (!confirmSubmit) return;

    setExamState((prev) => ({ ...prev, isSubmitting: true }));

    // Save current answer if any
    if (examState.selectedAnswer) {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      await saveCurrentAnswer(examState.selectedAnswer, timeTaken);
    }

    const res = await MockSubmission(questionQuery.attemptId);
    console.log(res);
    if (!res || res.error) {
      toast.error(res.error);
    }
    // Navigate after submission
    setTimeout(() => {
      cleanupSecureMode();
      onExitSecure();
      // navigate(`/dashboard/${userId}`);
    }, 2000);
  }, [
    examState.isSubmitting,
    examState.selectedAnswer,
    questionStartTime,
    saveCurrentAnswer,
    cleanupSecureMode,
    onExitSecure,
    questionQuery,
  ]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Retry function for error recovery
  const handleRetry = useCallback(() => {
    setExamState((prev) => ({
      ...prev,
      isInitialized: false,
      error: null,
    }));
  }, []);

  // Loading state - show more detailed loading info
  if (examState.isLoading && !currentQuestion) {
    return (
      <div className="exam-container">
        <div className="loading-spinner">
          <Loader className="animate-spin" size={32} />
          <p>
            {!examState.isInitialized
              ? "Initializing examination..."
              : "Loading question..."}
          </p>
          {questionQuery && (
            <div
              className="debug-info"
              style={{ fontSize: "12px", marginTop: "10px", opacity: 0.7 }}
            >
              AttemptId: {questionQuery.attemptId || "Not assigned"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (examState.error) {
    return (
      <div className="exam-container">
        <div className="error-message">
          <AlertCircle size={24} className="text-red-500" />
          <p>{examState.error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="retry-button">
              Restart Exam
            </button>
            <button
              onClick={() => loadQuestion(examState.currentPage)}
              className="retry-button"
            >
              Retry Current Question
            </button>
          </div>
          <div
            className="debug-info"
            style={{ fontSize: "12px", marginTop: "10px", opacity: 0.7 }}
          >
            Debug: Page {examState.currentPage}, AttemptId:{" "}
            {questionQuery?.attemptId || "None"}
          </div>
        </div>
      </div>
    );
  }

  // No question state
  if (!currentQuestion) {
    return (
      <div className="exam-container">
        <div className="error-message">
          <FileText size={24} />
          <p>No questions available. Please contact support.</p>
          <button onClick={handleRetry} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="exam-container">
        {/* Header */}
        <div className="exam-header">
          <div className="exam-title">
            <h1>MCQ Examination</h1>
            <div className="question-counter">
              Question {currentQuestionNumber} of{" "}
              {paginationInfo.totalQuestions}
            </div>
          </div>
          <div className="exam-info">
            <div className="time-info">
              <Clock size={20} />
              <span>Time: {formatTime(examState.timeSpent)}</span>
            </div>
            <div className="status-info">
              {currentQuestion.isAnswered && (
                <div className="answered-status">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Answered</span>
                </div>
              )}
              {examState.isSubmitting && (
                <div className="submitting-status">
                  <Loader className="animate-spin" size={16} />
                  <span>Saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="question-container">
          <div className="question-header">
            <h2 className="question-text">{currentQuestion.questionText}</h2>
            {currentQuestion.timeTakenSeconds > 0 && (
              <div className="previous-time">
                Previously spent: {formatTime(currentQuestion.timeTakenSeconds)}
              </div>
            )}
          </div>

          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <div
                key={`${currentQuestion.questionId}-${index}`}
                className={`option-item ${
                  examState.selectedAnswer === option ? "selected" : ""
                } ${
                  currentQuestion.givenAnswer === option
                    ? "previously-answered"
                    : ""
                }`}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className="option-radio">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.questionId}`}
                    value={option}
                    checked={
                      examState.selectedAnswer === option ||
                      currentQuestion.givenAnswer === option
                    }
                    onChange={() => handleAnswerSelect(option)}
                    disabled={examState.isSubmitting}
                  />
                </div>
                <div className="option-text">{option}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="navigation-container">
          <button
            className="nav-button prev-button"
            onClick={handlePrevious}
            disabled={
              !canGoPrevious || examState.isLoading || examState.isSubmitting
            }
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="center-actions">
            <span className="navigation-info">
              {examState.selectedAnswer
                ? "Answer selected"
                : examState.isSubmitting
                ? "Saving..."
                : "Select an answer"}
            </span>
            <button
              className="jump-button"
              onClick={handleJumpToQuestion}
              disabled={examState.isLoading || examState.isSubmitting}
            >
              <SkipForward size={16} />
              Jump to Question
            </button>
          </div>

          <button
            className="nav-button next-button"
            onClick={handleNext}
            disabled={
              !canGoNext || examState.isLoading || examState.isSubmitting
            }
          >
            {examState.selectedAnswer ? "Save & Next" : "Skip & Next"}
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="question-navigation">
          <div className="question-progress">
            <div className="progress-info">
              <span className="current-question">
                Question {currentQuestionNumber}
              </span>
              <span className="total-questions">
                of {paginationInfo.totalQuestions}
              </span>
              <span className="progress-percentage">
                ({Math.round(progressPercentage)}% complete)
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="navigation-stats">
            <div className="stat-item">
              <span className="stat-label">Current Page:</span>
              <span className="stat-value">{examState.currentPage + 1}</span>
            </div>
            {paginationInfo.hasNext && (
              <div className="stat-item">
                <span className="stat-label">Has Next:</span>
                <span className="stat-value">Yes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="submit-container">
        <button
          className="submit-button"
          onClick={handleSubmission}
          disabled={examState.isSubmitting || examState.isLoading}
          title="Submit current answer and continue"
        >
          <Save size={18} />
          {examState.isSubmitting ? "Submitting..." : "Submit Answer"}
        </button>
      </div>
    </>
  );
};
