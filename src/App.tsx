import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useDispatch } from "react-redux";

import { Home } from "./components/home";
import { ProtectedRoute } from "./utils/Protected";
import { PublicRoute } from "./utils/PublicRoute";
import { RoleBasedRoute } from "./utils/RoleBaseRoute";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Profile } from "./components/profile/Profile";
import { Analytics } from "./components/analytics/Analytics";
import { UserRole } from "./utils/auth.types";
import { useAuth } from "./utils/useAuth";

import Spinner from "./components/spinner/Spinner";
import ScrollToTop from "./utils/ScrollToTop";
import { CreateMock } from "./components/mock/CreateMock";
import { CreateAttempts } from "./components/mock/CreateAttempts";
import { ExamEnv } from "./components/testEnvironment/ExamEnv";
import { OngoingExam } from "./components/testEnvironment/OngoingExam";

// Lazy load components
const Signup = lazy(() =>
  import("./components/credential/signup").then((module) => ({
    default: module.Signup,
  }))
);

const Login = lazy(() =>
  import("./components/credential/login").then((module) => ({
    default: module.Login,
  }))
);

// const AdminPanel = lazy(() =>
//   import("./components/admin/AdminPanel").then((module) => ({
//     default: module.AdminPanel,
//   }))
// );

const Unauthorized = lazy(() =>
  import("./common/UnAuthorized").then((module) => ({
    default: module.Unauthorized,
  }))
);

const NotFound = lazy(() =>
  import("./common/Notfound").then((module) => ({
    default: module.NotFound,
  }))
);

const LoadingFallback: React.FC<{ message?: string }> = ({
  message = "Loading, please wait...",
}) => (
  <Spinner
    variant="ring"
    size="lg"
    modal
    label={message}
    color="#f43f5e"
    accent="#22d3ee"
  />
);

export const App: React.FC = () => {
  const dispatch = useDispatch();
  const { loading } = useAuth();

  // Initialize auth state on app load
  useEffect(() => {
    // Dispatch action to check stored token and validate user
    // dispatch(validateStoredAuth());
  }, [dispatch]);

  if (loading) {
    return <LoadingFallback message="Initializing application..." />;
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <ScrollToTop>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />

          {/* Authentication Routes - Restricted for authenticated users */}
          <Route
            path="/signup"
            element={
              <PublicRoute restricted redirectTo="/dashboard/:userId">
                <Suspense fallback={<LoadingFallback />}>
                  <Signup />
                </Suspense>
              </PublicRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute restricted redirectTo="/dashboard/:userId">
                <Suspense fallback={<LoadingFallback />}>
                  <Login />
                </Suspense>
              </PublicRoute>
            }
          />
          <Route
            path="exam-env/:userId/:testId/:testName"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="ongoing exam" />}
                ></Suspense>
                <ExamEnv />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/exam/:testId/questions"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="exam started" />}
                ></Suspense>
                <OngoingExam />
              </ProtectedRoute>
            }
          /> */}
          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard/:userId"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="Loading Dashboard..." />}
                >
                  <DashboardLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="create-mock" element={<CreateMock />} />
            <Route
              path="create-question/:testId"
              element={<CreateAttempts />}
            />
            <Route path="profile" element={<Profile />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Admin Only Routes */}
          {/* <Route
            path="/admin/*"
            element={
              <RoleBasedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                <Suspense fallback={<LoadingFallback message="Loading Admin Panel..." />}>
                  <AdminPanel />
                </Suspense>
              </RoleBasedRoute>
            }
          /> */}

          {/* Super Admin Only Routes */}
          <Route
            path="/super-admin/*"
            element={
              <RoleBasedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <div>Super Admin Panel</div>
              </RoleBasedRoute>
            }
          />

          {/* Error Routes */}
          <Route
            path="/unauthorized"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Unauthorized />
              </Suspense>
            }
          />

          <Route
            path="/404"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFound />
              </Suspense>
            }
          />

          {/* Catch all route - redirect to 404 */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </ScrollToTop>
    </>
  );
};
