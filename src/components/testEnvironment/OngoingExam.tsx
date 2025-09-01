import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Clock, CheckCircle } from 'lucide-react';
import type { ExamState, Question } from '../../Interface';
import "./OngoingExam.scss"


export const OngoingExam: React.FC = () => {
  const [examState, setExamState] = useState<ExamState>({
    currentQuestionIndex: 0,
    questions: [],
    selectedAnswer: null,
    isLoading: true,
    timeSpent: 0
  });

  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Mock API functions - replace with your actual API calls
  const saveAnswer = async (questionId: number, answer: string, timeTaken: number) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Saving answer:', { questionId, answer, timeTaken });
        resolve(true);
      }, 500);
    });
  };

  const fetchQuestion = async (questionId: number): Promise<Question> => {
    // Simulate API call - replace with your actual API endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockQuestions: Question[] = [
          {
            questionId: 1,
            questionText: "What is the capital of India?",
            options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
            givenAnswer: null,
            isAnswered: false,
            timeTakenSeconds: 0
          },
          {
            questionId: 2,
            questionText: "Which planet is known as the Red Planet?",
            options: ["Earth", "Mars", "Jupiter", "Venus"],
            givenAnswer: null,
            isAnswered: false,
            timeTakenSeconds: 0
          },
          {
            questionId: 3,
            questionText: "Who developed the theory of relativity?",
            options: ["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Galileo Galilei"],
            givenAnswer: null,
            isAnswered: false,
            timeTakenSeconds: 0
          },
          {
            questionId: 4,
            questionText: "Which is the largest ocean on Earth?",
            options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
            givenAnswer: null,
            isAnswered: false,
            timeTakenSeconds: 0
          },
          {
            questionId: 5,
            questionText: "What is the chemical symbol for gold?",
            options: ["Au", "Ag", "Gd", "Go"],
            givenAnswer: null,
            isAnswered: false,
            timeTakenSeconds: 0
          }
        ];
        resolve(mockQuestions[questionId - 1] || mockQuestions[0]);
      }, 300);
    });
  };

  // Initialize exam - load first question
  useEffect(() => {
    const initializeExam = async () => {
      try {
        const firstQuestion = await fetchQuestion(1);
        setExamState(prev => ({
          ...prev,
          questions: [firstQuestion],
          selectedAnswer: firstQuestion.givenAnswer,
          isLoading: false
        }));
        setQuestionStartTime(Date.now());
      } catch (error) {
        console.error('Error initializing exam:', error);
        setExamState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeExam();
  }, []);

  const currentQuestion = examState.questions[examState.currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setExamState(prev => ({
      ...prev,
      selectedAnswer: answer
    }));
  };

  const calculateTimeTaken = () => {
    return Math.floor((Date.now() - questionStartTime) / 1000);
  };

  const saveAndNavigate = async (direction: 'next' | 'prev') => {
    if (!currentQuestion) return;

    const timeTaken = calculateTimeTaken();
    
    try {
      setExamState(prev => ({ ...prev, isLoading: true }));

      // Save current answer if selected
      if (examState.selectedAnswer) {
        await saveAnswer(currentQuestion.questionId, examState.selectedAnswer, timeTaken);
        
        // Update current question in state
        const updatedQuestions = [...examState.questions];
        updatedQuestions[examState.currentQuestionIndex] = {
          ...currentQuestion,
          givenAnswer: examState.selectedAnswer,
          isAnswered: true,
          timeTakenSeconds: timeTaken
        };
        
        setExamState(prev => ({
          ...prev,
          questions: updatedQuestions
        }));
      }

      // Navigate to next/previous question
      let nextIndex: number;
      if (direction === 'next') {
        nextIndex = examState.currentQuestionIndex + 1;
      } else {
        nextIndex = examState.currentQuestionIndex - 1;
      }

      // Fetch question if not already loaded
      let nextQuestion: Question;
      if (examState.questions[nextIndex]) {
        nextQuestion = examState.questions[nextIndex];
      } else {
        nextQuestion = await fetchQuestion(nextIndex + 1);
        const updatedQuestions = [...examState.questions];
        updatedQuestions[nextIndex] = nextQuestion;
        
        setExamState(prev => ({
          ...prev,
          questions: updatedQuestions
        }));
      }

      // Update state for new question
      setExamState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        selectedAnswer: nextQuestion.givenAnswer,
        isLoading: false
      }));
      
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error saving and navigating:', error);
      setExamState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleNext = () => saveAndNavigate('next');
  const handlePrevious = () => saveAndNavigate('prev');

  const canGoNext = examState.currentQuestionIndex < 4; // Assuming 5 questions total
  const canGoPrev = examState.currentQuestionIndex > 0;

  if (examState.isLoading) {
    return (
      <div className="exam-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading question...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="exam-container">
        <div className="error-message">
          <p>Error loading question. Please try again.</p>
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
              Question {examState.currentQuestionIndex + 1} of 5
            </div>
          </div>
          <div className="exam-info">
            <div className="time-info">
              <Clock size={20} />
              <span>Time: {Math.floor(examState.timeSpent / 60)}:{(examState.timeSpent % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="status-info">
              {currentQuestion.isAnswered && (
                <div className="answered-status">
                  <CheckCircle size={20} />
                  <span>Answered</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="question-container">
          <div className="question-header">
            <h2 className="question-text">{currentQuestion.questionText}</h2>
          </div>

          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${examState.selectedAnswer === option ? 'selected' : ''} ${
                  currentQuestion.givenAnswer === option ? 'previously-answered' : ''
                }`}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className="option-radio">
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={examState.selectedAnswer === option}
                    onChange={() => handleAnswerSelect(option)}
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
            disabled={!canGoPrev || examState.isLoading}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="center-actions">
            <span className="navigation-info">
              {examState.selectedAnswer ? 'Answer selected' : 'Select an answer'}
            </span>
          </div>

          <button
            className="nav-button next-button"
            onClick={handleNext}
            disabled={!canGoNext || examState.isLoading}
          >
            Save & Next
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Question Navigation - Smart Pagination */}
        <div className="question-navigation">
          <div className="question-progress">
            <div className="progress-info">
              <span className="current-question">Question {examState.currentQuestionIndex + 1}</span>
              <span className="total-questions">of 5</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((examState.currentQuestionIndex + 1) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Show dots only for small question sets, otherwise show compact navigation */}
          {5 <= 10 ? (
            <div className="question-dots">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className={`question-dot ${
                    index === examState.currentQuestionIndex ? 'current' : ''
                  } ${
                    examState.questions[index]?.isAnswered ? 'answered' : ''
                  }`}
                  onClick={() => {
                    // Add quick navigation functionality here if needed
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          ) : (
            <div className="compact-navigation">
              <div className="nav-group">
                <button 
                  className="jump-button"
                  onClick={() => {
                    const jumpTo = prompt(`Jump to question (1-5):`);
                    const questionNum = parseInt(jumpTo || '');
                    if (questionNum >= 1 && questionNum <= 5) {
                      // Add jump functionality here
                      console.log(`Jump to question ${questionNum}`);
                    }
                  }}
                >
                  Jump to Question
                </button>
                
                <div className="question-status">
                  <div className="status-item">
                    <div className="status-indicator answered"></div>
                    <span>Answered: {examState.questions.filter(q => q?.isAnswered).length}</span>
                  </div>
                  <div className="status-item">
                    <div className="status-indicator unanswered"></div>
                    <span>Remaining: {5 - examState.questions.filter(q => q?.isAnswered).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button - Placed at bottom right */}
      <div className="submit-container">
        <button
          className="submit-button"
          onClick={async () => {
            if (examState.selectedAnswer) {
              const timeTaken = calculateTimeTaken();
              await saveAnswer(currentQuestion.questionId, examState.selectedAnswer, timeTaken);
              // You can add a toast notification or success message here
              alert('Answer submitted successfully!');
            }
          }}
          disabled={!examState.selectedAnswer || examState.isLoading}
          title="Submit current answer"
        >
          <Save size={18} />
          Submit Answer
        </button>
      </div>

     
    </>
  );
};

