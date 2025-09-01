import React, { useEffect, useState } from "react";
import { Calendar, Clock, FileText, Save, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import "./CreateMock.scss";
import { DateTimePicker } from "./Datepicker";
import { toast } from "react-toastify";
import { useAppSelector } from "../../redux/hook";
import type { CreateMockFormData, FormErrors } from "../../Interface";
import { ScheduledMock } from "../../function/testScheduled";
import { AttemptCount } from "../../function/atmPerDay";
import { useNavigate } from "react-router-dom";

export const CreateMock: React.FC = () => {
  const [formData, setFormData] = useState<CreateMockFormData>({
    testName: "",
    scheduleMock: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const userId = useAppSelector((state) => state?.user?.user?.id);
  const navigate=useNavigate();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (userId == null || !userId.trim()) {
      newErrors.userId = "User ID is required";
      toast.error("User ID is required");
    }
    if (!formData.testName.trim()) {
      newErrors.testName = "Test name is required";
      toast.error("Test name is required");
    } else if (formData.testName.trim().length < 3) {
      newErrors.testName = "Test name must be at least 3 characters";
      toast.error("Test name must be at least 3 characters");
    }

    if (!formData.scheduleMock) {
      newErrors.scheduleMock = "Schedule date and time is required";
      toast.error("Schedule date and time is required");
    } else {
      const scheduledTime = new Date(formData.scheduleMock);
      const now = new Date();
      if (scheduledTime <= now) {
        newErrors.scheduleMock = "Schedule time must be in the future";
        toast.error("Schedule time must be in the future");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleScheduleChange = (isoLocal: string) => {
    setFormData((p) => ({ ...p, scheduleMock: isoLocal }));
    if (errors.scheduleMock)
      setErrors((prev) => ({ ...prev, scheduleMock: "" }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
       await ScheduledMock(formData, userId);
      setShowSuccess(true);
      console.log(formData);
    } catch (error: any) {
      toast.error(error);

    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && formData.testName.trim().length >= 3) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  useEffect(()=>{
    const fetchCount=async()=>{
      const res=await AttemptCount(userId);
      if(res["mock count : "]===2){
        toast.warn("you reached your limit for today try after 24 hrs");
        navigate(-1);
      }
    }
    fetchCount();
  },[userId, navigate])

  if (showSuccess) {
    return (
      <div className="create-mock">
        <div className="success-container">
          <div className="success-card">
            <div className="success-decoration"></div>
            <div className="success-content">
              <div className="success-icon-animated">
                <CheckCircle size={32} />
              </div>
              
              <h2 className="success-title">
                Mock Test Created! 🎉
              </h2>
              
              <p className="success-description">
                Your mock test <span className="test-name">"{formData.testName}"</span> has been scheduled successfully for{" "}
                <span className="scheduled-time">
                  {new Date(formData.scheduleMock).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </p>
              
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setFormData({ testName: "", scheduleMock: "" });
                  setStep(1);
                }}
                className="success-btn"
              >
                Create Another Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-mock">
      {/* Header */}
      <div className="mock-header">
        <div className="header-content">
          <div className="header-icon">
            <FileText size={20} />
          </div>
          <div className="header-text">
            <h1>Create Mock Test</h1>
            <p>Schedule a new assessment session</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-counter">{step}/2</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Form */}
        <div className="form-card-enhanced">
          <div className="form-content">
            {step === 1 && (
              <div className="step-container">
                <div className="step-header">
                  <Sparkles className="step-icon" />
                  <h2 className="step-title">Test Details</h2>
                  <p className="step-subtitle">Give your mock test a descriptive name</p>
                </div>

                <div className="form-group-enhanced">
                  <label className="label-enhanced">
                    <FileText size={16} />
                    Test Name
                  </label>
                  <input
                    type="text"
                    name="testName"
                    value={formData.testName}
                    onChange={handleInputChange}
                    placeholder="e.g., Quantitative Aptitude - Practice Set 01"
                    className={`input-enhanced ${errors.testName ? 'error' : ''}`}
                  />
                  {errors.testName && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.testName}
                    </div>
                  )}
                </div>

                <div className="step-actions">
                  <button
                    onClick={nextStep}
                    disabled={!formData.testName.trim() || formData.testName.trim().length < 3}
                    className="btn-primary"
                  >
                    Next: Schedule Test
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-container">
                <div className="step-header">
                  <Calendar className="step-icon" />
                  <h2 className="step-title">Schedule Test</h2>
                  <p className="step-subtitle">Choose when you want to take this mock test</p>
                </div>

                <div className="form-group-enhanced">
                  <label className="label-enhanced">
                    <Calendar size={16} />
                    Date & Time
                  </label>
                  
                  <div className="datetime-container">
                    <DateTimePicker
                      value={formData.scheduleMock}
                      onChange={handleScheduleChange}
                    />
                  </div>

                  {formData.scheduleMock && (
                    <div className="datetime-preview-enhanced">
                      <Clock size={20} />
                      <div className="preview-content">
                        <p className="preview-label">Scheduled for:</p>
                        <p className="preview-time">
                          {new Date(formData.scheduleMock).toLocaleString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {errors.scheduleMock && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.scheduleMock}
                    </div>
                  )}
                </div>

                <div className="step-actions-split">
                  <button
                    onClick={prevStep}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.scheduleMock}
                    className="btn-success"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Create Mock Test
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};