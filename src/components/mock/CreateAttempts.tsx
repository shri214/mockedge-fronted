import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  Users,
  Calendar,
  BookOpen,
  Target,
  Database,
  Clock,
  Shield,
  AlertTriangle,
} from "lucide-react";
import "./createAttempts.scss";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../redux/hook";
import type { RootState } from "../../store";
import {SubjectOptions } from "../../function/subjectOptions";
import { useDispatch } from "react-redux";
import { setQuestionQuery } from "../../redux/questionQuery.slice";
import type { UnifiedDto } from "../../Interface";



const useUserRole = () => {
  const userRole = useAppSelector((state: RootState) => state.user.user?.role); 
  return {
    role: userRole || "user", 
    isLoading: false,
  };
};

export const CreateAttempts = () => {
  const {userId, testId } = useParams();
  const { role, isLoading: roleLoading } = useUserRole();
  const testData = useAppSelector((state: RootState) =>
    state.testSchedule.data.filter((val) => val.id === testId)
  );

  const [currentStep, setCurrentStep] = useState<string>("selection-type");
  const [selectionType, setSelectionType] = useState<string>("");
  const [formData, setFormData] = useState<UnifiedDto>({
    attemptId: testId || "",
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string>("");
  const [subjectOptions, setSubjectOptions]=useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate =useNavigate();
  const dispatch=useDispatch();

  const isAdmin = role === "admin" || role === "ROLE_SYS_ADMIN";
  const currentYear = new Date().getFullYear();

  // Available options - in real app, you might fetch these from API
  const examOptions = ["JEE", "NEET", "UPSC", "SSC"];
  const chapterOptions = [
    "Mechanics",
    "Thermodynamics",
    "Optics",
    "Modern Physics",
  ];
  const sourceOptions = [
    "NCERT",
    "Previous Papers",
    "Mock Tests",
    "Reference Books",
  ];
  const difficultyOptions = ["EASY", "MODERATE", "HARD"];

  const selectionTypes = [
    {
      id: "previous-year",
      title: "Previous Year Papers",
      description: "Access questions from specific exam years",
      icon: <Calendar size={22} />,
      requires: ["exam", "previousYear", "limit"],
      optional: [],
      adminOnly: false,
      userRestrictions: "Users can access only last 2 years",
    },
    {
      id: "subject-chapter",
      title: "Subject & Chapter",
      description: "Target specific subjects and chapters",
      icon: <BookOpen size={22} />,
      requires: ["subject", "chapter", "limit"],
      optional: ["difficultyLevel"],
      adminOnly: true,
      userRestrictions: "Admin only feature",
    },
    {
      id: "subject-only",
      title: "Subject Based",
      description: "Questions filtered by subject",
      icon: <Target size={22} />,
      requires: ["subject", "limit"],
      optional: ["difficultyLevel"],
      adminOnly: false,
      userRestrictions: "Max 50 questions for users",
    },
    {
      id: "source-based",
      title: "Source Based",
      description: "Questions from specific sources",
      icon: <Database size={22} />,
      requires: ["source", "limit"],
      optional: ["difficultyLevel"],
      adminOnly: true,
      userRestrictions: "Admin only feature",
    },
    {
      id: "difficulty",
      title: "Difficulty Level",
      description: "Filter by question difficulty",
      icon: <Users size={22} />,
      requires: ["difficultyLevel", "limit"],
      optional: [],
      adminOnly: false,
      userRestrictions:
        "Max 50 questions for users. Hard difficulty gets mixed with moderate.",
    },
    {
      id: "random",
      title: "Random Selection",
      description: "Get random questions with limit",
      icon: <Clock size={22} />,
      requires: ["limit"],
      optional: ["difficultyLevel"],
      adminOnly: false,
      userRestrictions: "No specific restrictions",
    },
  ];

  // Filter selection types based on user role
  const availableSelectionTypes = selectionTypes.filter(
    (type) => isAdmin || !type.adminOnly
  );

  // Update default limit when role changes
  useEffect(() => {
    if (!roleLoading) {
      setFormData((prev) => ({
        ...prev,
        limit: isAdmin ? 100 : 10,
      }));
    }
  }, [role, isAdmin, roleLoading]);

  // Memoized form validation - this prevents infinite re-renders
  const isFormValid = useMemo((): boolean => {
    const selectedType = selectionTypes.find(
      (type) => type.id === selectionType
    );

    if (!selectedType) return false;

    // Check required fields only
    for (const field of selectedType.requires) {
      const value = formData[field as keyof UnifiedDto];
      if (value === undefined || value === null || value === "") {
        return false;
      }
    }

    // User-specific validations
    if (!isAdmin) {
      // Limit validation for users
      if (formData.limit && formData.limit > 50) {
        return false;
      }

      // Previous year validation for users
      if (selectionType === "previous-year" && formData.previousYear) {
        if (formData.previousYear < currentYear - 2) {
          return false;
        }
      }
    }

    // Previous year should not be future
    if (formData.previousYear && formData.previousYear > currentYear) {
      return false;
    }

    return true;
  }, [selectionType, formData, isAdmin, currentYear]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const selectedType = selectionTypes.find(
      (type) => type.id === selectionType
    );

    if (!selectedType) return false;

    // Check required fields only
    selectedType.requires.forEach((field) => {
      const value = formData[field as keyof UnifiedDto];
      if (value === undefined || value === null || value === "") {
        newErrors[field] = `${field} is required`;
      }
    });

    // User-specific validations
    if (!isAdmin) {
      // Limit validation for users
      if (formData.limit && formData.limit > 50) {
        newErrors.limit = "Maximum 50 questions allowed for users";
      }

      // Previous year validation for users
      if (selectionType === "previous-year" && formData.previousYear) {
        if (formData.previousYear < currentYear - 2) {
          newErrors.previousYear = "Users can only access last 2 years";
        }
      }
    }

    // Previous year should not be future
    if (formData.previousYear && formData.previousYear > currentYear) {
      newErrors.previousYear = "Previous year cannot be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectionTypeChange = (type: string) => {
    setSelectionType(type);
    setFormData({
      attemptId:"",
      limit: isAdmin ? 100 : 10,
    });
    setCurrentStep("configure");
    setErrors({});
  };

  useEffect(()=>{
    const response=async ()=>{
      const res=await SubjectOptions();
      setSubjectOptions(res["subject"])
    }
    response()
  },[])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    dispatch(setQuestionQuery(formData))
    navigate(`/exam-env/${userId}/${testId}/${testData[0].testName}`);
  };

  const renderConfigField = (field: string, isOptional: boolean = false) => {
    
    switch (field) {
      case "exam":
        return (
          <div className="field" key={field}>
            <label>Exam {isOptional ? "(Optional)" : "*"}</label>
            <select
              value={formData.exam || ""}
              onChange={(e) => handleInputChange("exam", e.target.value)}
              className={errors[field] ? "error" : ""}
            >
              <option value="">Select Exam</option>
              {examOptions.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
            {errors[field] && (
              <span className="error-text">{errors[field]}</span>
            )}
          </div>
        );

      case "previousYear": {
        const minYear = isAdmin ? 2015 : currentYear - 2;
        const maxYear = currentYear - 1;
        return (
          <div className="field" key={field}>
            <label>Previous Year {isOptional ? "(Optional)" : "*"}</label>
            <select
              value={formData.previousYear || ""}
              onChange={(e) =>
                handleInputChange("previousYear", parseInt(e.target.value))
              }
              className={errors[field] ? "error" : ""}
            >
              <option value="">Select Year</option>
              {Array.from(
                { length: maxYear - minYear + 1 },
                (_, i) => maxYear - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors[field] && (
              <span className="error-text">{errors[field]}</span>
            )}
          </div>
        );
      }
      case "subject":
        return (
          <div className="field" key={field}>
            <label>Subject {isOptional ? "(Optional)" : "*"}</label>
            <select
              value={formData.subject || ""}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              className={errors[field] ? "error" : ""}
            >
              <option value="">Select Subject</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {errors[field] && (
              <span className="error-text">{errors[field]}</span>
            )}
          </div>
        );

      case "chapter":
        return (
          <div className="field" key={field}>
            <label>Chapter {isOptional ? "(Optional)" : "*"}</label>
            <select
              value={formData.chapter || ""}
              onChange={(e) => handleInputChange("chapter", e.target.value)}
              className={errors[field] ? "error" : ""}
            >
              <option value="">Select Chapter</option>
              {chapterOptions.map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
            {errors[field] && (
              <span className="error-text">{errors[field]}</span>
            )}
          </div>
        );

      case "source":
        return (
          <div className="field" key={field}>
            <label>Source {isOptional ? "(Optional)" : "*"}</label>
            <select
              value={formData.source || ""}
              onChange={(e) => handleInputChange("source", e.target.value)}
              className={errors[field] ? "error" : ""}
            >
              <option value="">Select Source</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {errors[field] && (
              <span className="error-text">{errors[field]}</span>
            )}
          </div>
        );

      case "difficultyLevel":
        return (
          <div className="field" key={field}>
            <label>Difficulty Level {isOptional ? "(Optional)" : "*"}</label>
            <select
              value={formData.difficultyLevel || ""}
              onChange={(e) =>
                handleInputChange("difficultyLevel", e.target.value)
              }
              className={errors[field] ? "error" : ""}
            >
              <option value="">Select Difficulty</option>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {!isAdmin && formData.difficultyLevel === "HARD" && (
              <div className="info-text">
                <AlertTriangle size={16} />
                For users, HARD difficulty gives 50% hard + 50% moderate
                questions
              </div>
            )}
            {isOptional && (
              <div className="field-help">
                Leave empty to include all difficulty levels
              </div>
            )}
            {errors[field] && (
              <span className="error-text">{errors[field]}</span>
            )}
          </div>
        );

      case "limit": {
        const maxLimit = isAdmin ? 1000 : 50;
        return (
          <div className="field" key={field}>
            <label>Number of Questions {isOptional ? "(Optional)" : "*"}</label>
            <input
              type="number"
              min="1"
              max={maxLimit}
              value={formData.limit || ""}
              onChange={(e) =>
                handleInputChange("limit", parseInt(e.target.value))
              }
              className={errors[field] ? "error" : ""}
            />
            <div className="field-help">
              {isAdmin
                ? "No limit for admin users"
                : "Maximum 50 questions for users"}
            </div>
            {errors[field] && (
              <span className="error-text">{errors[field]}</span>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (roleLoading) {
    return <div className="loading">Loading user permissions...</div>;
  }

  const selectedType = selectionTypes.find((type) => type.id === selectionType);

  return (
    <div className="create-attempts">
      {/* Header */}
      <header className="ca-header">
        <div className="title-section">
          <h1>Create Test Attempt</h1>
          <div className={`role-badge ${isAdmin ? "admin" : ""}`}>
            <Shield size={16} />
            {isAdmin ? "Admin User" : "Regular User"}
          </div>
        </div>
        {testData.length > 0 && (
          <p>
            Setting up questions for:{" "}
            <span className="highlight">{testData[0].testName}</span>
          </p>
        )}
      </header>

      {/* Progress */}
      <div className="ca-progress">
        <div
          className={`step ${currentStep === "selection-type" ? "active" : ""}`}
        >
          <div className="circle">1</div>
          <span>Select Method</span>
        </div>
        <ChevronRight size={18} />
        <div className={`step ${currentStep === "configure" ? "active" : ""}`}>
          <div className="circle">2</div>
          <span>Configure</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="ca-content">
        {currentStep === "selection-type" && (
          <div className="selection-grid">
            {availableSelectionTypes.map((type) => (
              <div
                key={type.id}
                className={`card ${
                  expandedCard === type.id ? "expanded" : ""
                } ${type.adminOnly ? "admin-only" : ""}`}
                onClick={() =>
                  setExpandedCard(expandedCard === type.id ? "" : type.id)
                }
              >
                <div className="card-header">
                  <div className="card-icon">{type.icon}</div>
                  {type.adminOnly && (
                    <div className="admin-badge">
                      <Shield size={14} />
                    </div>
                  )}
                </div>
                <h3>{type.title}</h3>
                <p>{type.description}</p>

                {expandedCard === type.id && (
                  <>
                    <div className="requirements">
                      <h4>Required fields:</h4>
                      {type.requires.map((field) => (
                        <span key={field} className="req-badge">
                          {field}
                        </span>
                      ))}
                    </div>

                    {type.optional && type.optional.length > 0 && (
                      <div className="optional-fields">
                        <h4>Optional fields:</h4>
                        {type.optional.map((field) => (
                          <span key={field} className="opt-badge">
                            {field}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="restrictions">
                      <h4>Restrictions:</h4>
                      <p className="restriction-text">
                        {type.userRestrictions}
                      </p>
                    </div>

                    <button
                      className="select-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectionTypeChange(type.id);
                      }}
                    >
                      Select This Method
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {currentStep === "configure" && selectedType && (
          <div className="config-step">
            <div className="config-header">
              <h2>Configure Question Selection</h2>
              <p>
                Selected method: <strong>{selectedType.title}</strong>
              </p>
            </div>

            <div className="config-fields">
              {/* Render required fields */}
              {selectedType.requires.map((field) => 
                renderConfigField(field, false)
              )}
              
              {/* Render optional fields */}
              {selectedType.optional && selectedType.optional.length > 0 && (
                <>
                  <div className="optional-section-divider">
                    <span>Optional Filters</span>
                  </div>
                  {selectedType.optional.map((field) => 
                    renderConfigField(field, true)
                  )}
                </>
              )}
            </div>

            <div className="actions">
              <button onClick={() => setCurrentStep("selection-type")}>
                Back
              </button>
              <button
                className="primary"
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? "Generating..." : "Generate Questions"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};