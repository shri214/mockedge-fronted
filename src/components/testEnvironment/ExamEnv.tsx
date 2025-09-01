import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SecureExamEnvironment from "./SecureEnv";
import { Shield, AlertTriangle, Loader } from "lucide-react";
import "./ExamEnv.scss"
import type { ExamFormData, TestData } from "../../Interface";


// TODO we can handle security from here and pass to its child
export const ExamEnv = () => {
  const { userId, testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get form data from navigation state or URL params
  const initialFormData: ExamFormData = location.state?.formData || {
    attemptId: testId || "",
    limit: 10,
  };

  // State management
  const [showSecureEnvironment, setShowSecureEnvironment] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExamFormData>(initialFormData);
  const [testData, setTestData] = useState<TestData[]>([]);
  const [error, setError] = useState<string>("");
  const [initializationStep, setInitializationStep] = useState<'loading' | 'permissions' | 'ready' | 'error'>('loading');

  // Fetch test data  component mount
  const fetchTestData = useCallback(async () => {
    if (!testId) {
      setError("No test ID provided");
      setInitializationStep('error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const test = await response.json();
        setTestData([test]);
        
        // Update form data with test info if available
        setFormData(prev => ({
          ...prev,
          attemptId: testId,
          // You can set default values based on test configuration
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch test data");
      }
    } catch (error:any) {
      console.error("Error fetching test data:", error);
      setError("Failed to load test information. Please try again.");
      setInitializationStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  // Permission check functions
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      return result.state === "granted";
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  };

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      return result.state === "granted";
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  };

  const requestFullscreenCapability = (): boolean => {
    return !!(
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).msRequestFullscreen
    );
  };

  // Updated permissions check and request
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setInitializationStep('permissions');
    
    try {
      // Check camera permission
      const cameraGranted = await checkCameraPermission();
      if (!cameraGranted) {
        alert('Camera access is required for secure exam monitoring. Please grant permission when prompted.');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          alert('Camera access denied. Please refresh the page and grant camera permissions to continue.');
          setInitializationStep('error');
          return false;
        }
      }

      // Check microphone permission
      const micGranted = await checkMicrophonePermission();
      if (!micGranted) {
        alert('Microphone access is required for secure exam monitoring.');
        setInitializationStep('error');
        return false;
      }

      // Check fullscreen capability
      const fullscreenSupported = requestFullscreenCapability();
      if (!fullscreenSupported) {
        alert('Your browser does not support fullscreen mode, which is required for secure exams.');
        setInitializationStep('error');
        return false;
      }

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support required media APIs. Please use a modern browser.');
        setInitializationStep('error');
        return false;
      }

      setPermissionsGranted(true);
      setInitializationStep('ready');
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      alert('Failed to verify browser permissions. Please try again.');
      setInitializationStep('error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize exam environment
  useEffect(() => {
    const initializeExam = async () => {
      // Step 1: Fetch test data
      await fetchTestData();
      
      // Step 2: Request permissions
      const permissionsOk = await requestPermissions();
      if (!permissionsOk) {
        return;
      }
      
      // Step 3: Show secure environment setup
      setShowSecureEnvironment(true);
    };

    initializeExam();
  }, [fetchTestData, requestPermissions]);

  // Handle when exam actually starts (called from SecureExamEnvironment)
  const handleExamStart = useCallback(() => {
    
    console.log("Exam started with data:");

    // Navigate to actual exam interface
    navigate(`/exam/${testId}/questions`, { 
      state: { 
        securityEnabled: true 
      } 
    });
  }, [navigate, testId]);

  // Handle exit from secure environment
  const handleExitSecure = useCallback(() => {
    setShowSecureEnvironment(false);
    setPermissionsGranted(false);
    
    // Navigate back to test selection or dashboard
    navigate(`/dashboard/${userId}`, { 
      replace: true,
      state: { message: 'Exam session terminated' }
    });
  }, [navigate, userId]);

  // Handle security violations
  const handleSecurityViolation = useCallback((
    violation: string,
    severity: "warning" | "critical"
  ) => {
    console.log(`Security violation [${severity}]:`, violation);

    // Log violation to backend
    fetch("/api/security/violation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        testId,
        violation,
        severity,
        timestamp: new Date().toISOString(),
        formData,
        sessionInfo: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        }
      }),
    }).catch(console.error);

    // Handle critical violations by terminating exam
    if (severity === "critical") {
      alert(
        `Critical security violation: ${violation}\nExam will be terminated.`
      );
      handleExitSecure();
    }
  }, [userId, testId, formData, handleExitSecure]);

  // Retry initialization
  const handleRetry = () => {
    setError("");
    setInitializationStep('loading');
    fetchTestData();
  };

  // Go back to test selection
  const handleGoBack = () => {
    navigate(`/dashboard/${userId}`);
  };

  // Show secure environment if activated
  if (showSecureEnvironment) {
    return (
      <SecureExamEnvironment
        formData={formData}
        testData={testData}
        onStartExam={handleExamStart}
        onExitSecure={handleExitSecure}
        onSecurityViolation={handleSecurityViolation}
      />
    );
  }

  // Loading state
  if (initializationStep === 'loading' || isLoading) {
    return (
      <div className="exam-env-loading-container">
        <div className="exam-env-loading-card">
          <Loader className="exam-env-loading-icon" />
          <h2 className="exam-env-loading-title">
            Initializing Exam Environment
          </h2>
          <p className="exam-env-loading-text">
            Loading test data and checking system requirements...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (initializationStep === 'error' || error) {
    return (
      <div className="exam-env-error-container">
        <div className="exam-env-error-card">
          <AlertTriangle className="exam-env-error-icon" />
          <h2 className="exam-env-error-title">
            Setup Failed
          </h2>
          <p className="exam-env-error-text">
            {error || "Failed to initialize exam environment. Please check your browser permissions and try again."}
          </p>
          <div className="exam-env-error-actions">
            <button
              onClick={handleGoBack}
              className="exam-env-error-back-btn"
            >
              Go Back
            </button>
            <button
              onClick={handleRetry}
              className="exam-env-error-retry-btn"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Permissions checking state
  if (initializationStep === 'permissions') {
    return (
      <div className="exam-env-permissions-container">
        <div className="exam-env-permissions-card">
          <Shield className="exam-env-permissions-icon" />
          <h2 className="exam-env-permissions-title">
            Checking Browser Permissions
          </h2>
          <p className="exam-env-permissions-text">
            Please allow camera and microphone access when prompted.
          </p>
          <div className="exam-env-permissions-notice">
            <p className="exam-env-permissions-notice-text">
              These permissions are required for secure exam monitoring and identity verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - should not normally be visible as it immediately shows SecureExamEnvironment
  return (
    <div className="exam-env-ready-container">
      <div className="exam-env-ready-card">
        <div className="exam-env-ready-notice">
          <div className="exam-env-ready-notice-content">
            <Shield className="exam-env-ready-icon" />
            <div className="exam-env-ready-text-content">
              <h4 className="exam-env-ready-notice-title">
                Secure Exam Mode Ready
              </h4>
              <p className="exam-env-ready-notice-text">
                All permissions granted. Preparing secure exam environment...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};