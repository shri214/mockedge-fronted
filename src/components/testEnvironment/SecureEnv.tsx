import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Camera,
  Monitor,
  AlertTriangle,
  Clock,
  Lock,
  Eye,
  Wifi,
  Battery,
  Volume2,
} from "lucide-react";
import "./SecureEnv.scss";
import { OngoingExam } from "./OngoingExam";
import HTTP from "../../BackendApis";
import { useAppSelector } from "../../redux/hook";
import type { RootState } from "../../store";
import { useParams } from "react-router-dom";
import { CreateAttempts } from "../../function/createAttempts";
import { useDispatch } from "react-redux";
import { setQuestionQuery } from "../../redux/questionQuery.slice";
import { toast } from "react-toastify";

interface SecureExamEnvironmentProps {
  onExitSecure: () => void;
  onSecurityViolation: (
    violation: string,
    severity: "warning" | "critical"
  ) => void;
}

interface SecurityViolation {
  type: string;
  timestamp: Date;
  severity: "warning" | "critical";
  description: string;
}

interface SystemChecks {
  camera: boolean;
  microphone: boolean;
  fullscreen: boolean;
  networkStable: boolean;
  batteryLevel: boolean;
  noOtherApps: boolean;
}

type ExamStep = "agreement" | "setup" | "verification" | "exam";

const SecureExamEnvironment: React.FC<SecureExamEnvironmentProps> = ({
  onExitSecure,
  onSecurityViolation,
}) => {
  const { testName, userId, testId } = useParams<{
    testName: string;
    userId: string;
    testId: string;
  }>();
  const { questionQuery } = useAppSelector((state: RootState) => state);
  const dispatch = useDispatch();

  // State management
  const [currentStep, setCurrentStep] = useState<ExamStep>("agreement");
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemChecks>({
    camera: false,
    microphone: false,
    fullscreen: false,
    networkStable: false,
    batteryLevel: false,
    noOtherApps: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Refs
  const cameraRef = useRef<HTMLVideoElement>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Security monitoring
  const addViolation = useCallback(
    (type: string, severity: "warning" | "critical", description: string) => {
      const violation: SecurityViolation = {
        type,
        timestamp: new Date(),
        severity,
        description,
      };

      setViolations((prev) => [...prev, violation]);
      //TODO WHEN IT CALL IT LEFT CAMERA OPEN
      onSecurityViolation(description, severity);

      // Auto-terminate on critical violations
      if (severity === "critical") {
        handleSecurityTermination(description);
      }
    },
    [onSecurityViolation]
  );

  // System monitoring effects
  useEffect(() => {
    if (!isSecureMode) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addViolation("fullscreen-exit", "critical", "Exited fullscreen mode");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation(
          "tab-switch",
          "critical",
          "Switched tabs or minimized window"
        );
      }
    };

    const handleBlur = () => {
      addViolation("focus-loss", "warning", "Lost window focus");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        "F11",
        "F12",
        "Escape",
        "PrintScreen",
        "Insert",
        "Delete",
        "Meta",
      ];

      const blockedCombos = [
        "Alt+Tab",
        "Ctrl+Shift+I",
        "Ctrl+Shift+J",
        "Ctrl+U",
        "Ctrl+R",
        "F5",
      ];

      const combo = `${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${
        e.altKey ? "Alt+" : ""
      }${e.key}`;

      if (blockedKeys.includes(e.key) || blockedCombos.includes(combo)) {
        e.preventDefault();
        e.stopPropagation();
        addViolation(
          "blocked-key",
          "warning",
          `Attempted to use blocked key: ${combo}`
        );
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("context-menu", "warning", "Attempted to open context menu");
    };

    const handleMouseLeave = () => {
      addViolation("mouse-leave", "warning", "Mouse left the exam window");
    };

    // Add event listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isSecureMode, addViolation]);

  // Network monitoring
  useEffect(() => {
    if (!isSecureMode) return;

    const handleOnline = () => {
      setSystemChecks((prev) => ({ ...prev, networkStable: true }));
    };

    const handleOffline = () => {
      setSystemChecks((prev) => ({ ...prev, networkStable: false }));
      addViolation("network-loss", "critical", "Internet connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Heartbeat to monitor connection
    heartbeatRef.current = setInterval(() => {
      HTTP.get("/user").catch(() =>
        addViolation(
          "network-unstable",
          "warning",
          "Network connection unstable"
        )
      );
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [isSecureMode, addViolation]);

  // Battery monitoring
  useEffect(() => {
    if (!isSecureMode || !("getBattery" in navigator)) return;

    (navigator as any)
      .getBattery()
      .then((battery: any) => {
        const updateBatteryStatus = () => {
          const isCharging = battery.charging;
          const level = battery.level * 100;

          setSystemChecks((prev) => ({
            ...prev,
            batteryLevel: isCharging || level > 20,
          }));

          if (!isCharging && level < 20) {
            addViolation(
              "battery-low",
              "warning",
              `Battery level low: ${level.toFixed(0)}%`
            );
          }
        };

        battery.addEventListener("chargingchange", updateBatteryStatus);
        battery.addEventListener("levelchange", updateBatteryStatus);
        updateBatteryStatus();
      })
      .catch(() => {
        // Battery API not supported, assume battery is OK
        setSystemChecks((prev) => ({ ...prev, batteryLevel: true }));
      });
  }, [isSecureMode, addViolation]);

  // Camera setup
  const setupCamera = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: true,
      });

      setCameraStream(stream);

      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        await cameraRef.current.play();
      }

      setSystemChecks((prev) => ({ ...prev, camera: true, microphone: true }));
      return true;
    } catch (error) {
      console.error("Camera setup failed:", error);
      addViolation(
        "camera-denied",
        "critical",
        "Camera access denied or unavailable"
      );
      return false;
    }
  };

  // Enter fullscreen
  const enterFullscreen = async (): Promise<boolean> => {
    try {
      const element = document.documentElement;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }

      setSystemChecks((prev) => ({ ...prev, fullscreen: true }));
      return true;
    } catch (error) {
      console.error("Fullscreen failed:", error);
      addViolation("fullscreen-denied", "critical", "Fullscreen mode denied");
      return false;
    }
  };

  // Security termination
  const handleSecurityTermination = (reason: string) => {
    alert(`Security violation detected: ${reason}\nExam will be terminated.`);
    cleanupSecureMode();
    onExitSecure();
  };

  // Cleanup function
  const cleanupSecureMode = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    setSystemChecks({
      camera: false,
      microphone: false,
      fullscreen: false,
      networkStable: false,
      batteryLevel: false,
      noOtherApps: false,
    });
    setIsSecureMode(false);
  };

  // Start secure mode setup
  const startSecureSetup = async () => {
    if (!agreementAccepted) return;

    setIsLoading(true);
    setCurrentStep("setup");

    try {
      const cameraOk = await setupCamera();
      if (!cameraOk) throw new Error("Camera setup failed");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const fullscreenOk = await enterFullscreen();
      if (!fullscreenOk) throw new Error("Fullscreen setup failed");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSystemChecks((prev) => ({
        ...prev,
        networkStable: navigator.onLine,
        noOtherApps: true,
      }));

      setIsSecureMode(true);
      setCurrentStep("verification");
    } catch (error) {
      console.error("Secure setup failed:", error);
      cleanupSecureMode();
      alert("Failed to setup secure environment. Please try again.");
      setCurrentStep("agreement");
    } finally {
      setIsLoading(false);
    }
  };

  // Start exam
  const startExam = async () => {
    setIsLoading(true);

    try {
      const config = {
        mockName: testName,
        userId: userId,
        testScheduledId: testId,
      };

      const res = await CreateAttempts(config);
      console.log(res);
      if (!res.data) {
        throw new Error(res?.error || "Failed to create exam attempt");
      }
      toast.success(res?.message);
      dispatch(
        setQuestionQuery({
          ...questionQuery,
          attemptId: res.data.id,
        })
      );
      setCurrentStep("exam");
    } catch (error) {
      console.error("Error starting exam:", error);
      addViolation("exam-start-failed", "critical", "Failed to start exam");
      handleSecurityTermination("Exam initialization failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSecureMode();
    };
  }, []);

  // Render methods
  const renderAgreement = () => (
    <div className="secure-agreement-overlay">
      <div className="secure-agreement-container">
        <div className="secure-agreement-header">
          <div className="secure-agreement-header-content">
            <Shield className="secure-agreement-icon" />
            <div className="secure-agreement-title-section">
              <h1 className="secure-agreement-title">
                Secure Exam Environment
              </h1>
              <p className="secure-agreement-subtitle">
                Industry-Standard Security Protocol
              </p>
            </div>
          </div>
        </div>

        <div className="secure-agreement-content">
          <div className="secure-agreement-section">
            <h2 className="secure-agreement-section-title">
              Security Requirements & Monitoring
            </h2>
            <div className="secure-agreement-requirements">
              <div className="secure-requirement-item">
                <Camera className="secure-requirement-icon camera-icon" />
                <span>
                  <strong>Camera & Audio:</strong> Continuous monitoring for
                  identity verification
                </span>
              </div>
              <div className="secure-requirement-item">
                <Monitor className="secure-requirement-icon monitor-icon" />
                <span>
                  <strong>Screen Monitoring:</strong> Full-screen lock with
                  activity monitoring
                </span>
              </div>
              <div className="secure-requirement-item">
                <Lock className="secure-requirement-icon lock-icon" />
                <span>
                  <strong>System Lock:</strong> Disable shortcuts, context
                  menus, and system functions
                </span>
              </div>
              <div className="secure-requirement-item">
                <Wifi className="secure-requirement-icon wifi-icon" />
                <span>
                  <strong>Network Monitoring:</strong> Continuous connectivity
                  verification
                </span>
              </div>
            </div>
          </div>

          <div className="secure-agreement-section">
            <h2 className="secure-agreement-section-title">
              Prohibited Actions
            </h2>
            <div className="secure-prohibited-box">
              <ul className="secure-prohibited-list">
                <li>• Exiting fullscreen mode or minimizing window</li>
                <li>
                  • Switching tabs, opening new windows, or using other
                  applications
                </li>
                <li>
                  • Using keyboard shortcuts (F11, Alt+Tab, Ctrl+Shift+I, etc.)
                </li>
                <li>• Disconnecting camera or blocking camera view</li>
                <li>
                  • Having unauthorized materials or people in camera view
                </li>
                <li>• Network disconnection or using VPN/proxy</li>
              </ul>
            </div>
          </div>

          <div className="secure-agreement-checkbox-container">
            <label className="secure-agreement-checkbox-label">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="secure-agreement-checkbox"
              />
              <span className="secure-agreement-checkbox-text">
                I understand and agree to all security requirements. I
                acknowledge that this exam session will be monitored and
                recorded. Any violation may result in exam termination.
              </span>
            </label>
          </div>
        </div>

        <div className="secure-agreement-actions">
          <button
            onClick={onExitSecure}
            className="secure-agreement-cancel-btn"
          >
            Cancel & Return to Dashboard
          </button>
          <button
            onClick={startSecureSetup}
            disabled={!agreementAccepted || isLoading}
            className="secure-agreement-enter-btn"
          >
            {isLoading ? "Initializing..." : "Enter Secure Mode"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="secure-setup-overlay">
      <div className="secure-setup-container">
        <div className="secure-setup-content">
          <div className="secure-setup-icon-container">
            <Lock className="secure-setup-icon" />
          </div>
          <h2 className="secure-setup-title">Setting Up Secure Environment</h2>
          <p className="secure-setup-subtitle">
            Please allow all permissions when prompted
          </p>
        </div>

        <div className="secure-setup-checks">
          <div
            className={`secure-setup-check ${
              systemChecks.camera ? "check-success" : "check-pending"
            }`}
          >
            <Camera className="secure-setup-check-icon" />
            <span>Camera Access {systemChecks.camera ? "✓" : "..."}</span>
          </div>
          <div
            className={`secure-setup-check ${
              systemChecks.fullscreen ? "check-success" : "check-pending"
            }`}
          >
            <Monitor className="secure-setup-check-icon" />
            <span>Fullscreen Mode {systemChecks.fullscreen ? "✓" : "..."}</span>
          </div>
        </div>

        {isLoading && (
          <div className="secure-setup-loading">
            <div className="secure-setup-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="secure-verification-overlay">
      <div className="secure-verification-topbar">
        <div className="secure-verification-topbar-left">
          <Shield className="secure-topbar-icon" />
          <span className="secure-topbar-text">SECURE EXAM MODE</span>
        </div>
        <div className="secure-verification-topbar-right">
          <div
            className={`secure-status-indicator ${
              systemChecks.camera ? "status-active" : "status-inactive"
            }`}
          >
            <Camera className="secure-status-icon" />
            <span>CAM</span>
          </div>
          <div
            className={`secure-status-indicator ${
              systemChecks.networkStable ? "status-active" : "status-inactive"
            }`}
          >
            <Wifi className="secure-status-icon" />
            <span>NET</span>
          </div>
          <div className="secure-status-time">
            <Clock className="secure-time-icon" />
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="secure-verification-main">
        <div className="secure-verification-camera-panel">
          <h3 className="secure-camera-panel-title">Identity Verification</h3>
          <div className="secure-camera-container">
            <video
              ref={cameraRef}
              autoPlay
              muted
              className="secure-camera-video"
            />
          </div>
          <div className="secure-camera-status">
            <div className="secure-status-row">
              <span>Camera:</span>
              <span
                className={`secure-status-value ${
                  systemChecks.camera ? "status-ok" : "status-error"
                }`}
              >
                {systemChecks.camera ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="secure-status-row">
              <span>Network:</span>
              <span
                className={`secure-status-value ${
                  systemChecks.networkStable ? "status-ok" : "status-error"
                }`}
              >
                {systemChecks.networkStable ? "Stable" : "Unstable"}
              </span>
            </div>
          </div>
        </div>

        <div className="secure-verification-instructions">
          <div className="secure-instructions-content">
            <Eye className="secure-instructions-icon" />
            <h2 className="secure-instructions-title">Final Verification</h2>
            <div className="secure-instructions-list">
              <p>• Ensure you are alone in the room</p>
              <p>• Keep your face clearly visible to the camera</p>
              <p>• Remove any unauthorized materials from your desk</p>
              <p>• Ensure stable internet connection</p>
            </div>

            {testName && (
              <div className="secure-exam-details">
                <h3 className="secure-exam-details-title">Exam Details:</h3>
                <p className="secure-exam-name">{testName}</p>
                <p className="secure-exam-questions">
                  Questions: {questionQuery?.limit || "N/A"}
                </p>
              </div>
            )}

            <button
              onClick={startExam}
              disabled={
                isLoading || !systemChecks.camera || !systemChecks.networkStable
              }
              className="secure-start-exam-btn"
            >
              {isLoading ? "Starting Exam..." : "Start Exam"}
            </button>
          </div>
        </div>
      </div>

      {violations.length > 0 && (
        <div className="secure-violations-panel">
          <div className="secure-violations-content">
            <AlertTriangle className="secure-violations-icon" />
            <span className="secure-violations-text">
              Violations: {violations.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Render based on current step
  switch (currentStep) {
    case "agreement":
      return renderAgreement();
    case "setup":
      return renderSetup();
    case "verification":
      return renderVerification();
    case "exam":
      return (
        <OngoingExam
          cleanupSecureMode={cleanupSecureMode}
          onExitSecure={onExitSecure}
        />
      );
    default:
      return null;
  }
};

export default SecureExamEnvironment;
