import axios from "axios";
import { persistor, store } from "./store";
import { logout } from "./slices/authSlice";
import { toast } from "react-toastify";

// Base configuration for Axios
const axiosConfig = {
  baseURL: process.env.REACT_APP_API_URL + "/api",
  timeout: 180000,
};

// Create an Axios instance
const HTTP = axios.create(axiosConfig);

HTTP.defaults.headers.post["Content-Type"] = "application/json";
HTTP.defaults.headers.post["Access-Control-Allow-Origin"] = "*";
HTTP.defaults.headers.get["Access-Control-Allow-Origin"] = "*";

// Request interceptor to add headers
HTTP.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state.auth?.userData?.accessToken;

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    if (config.useClientCode) {
      const clientCode = state.auth.userData?.user?.clientCode;
      config.headers["x-client-code"] = clientCode;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
//error handling objects
const statusActions = {
  400: () => {
    console.error("Bad request");
    toast.error("Bad request. Please check your input.");
  },
  // 401: (err) => {
  //   console.error("Unauthorized");
  //   if (err.response.data.message !== "Credentials are not matching") {
  //     persistor.purge();
  //     store.dispatch(logout());
  //     window.location.href = "/login";
  //     toast.error("Session expired. Please log in again.");
  //   }
  // },

  401: (err) => {
    console.error("Unauthorized");
    if (err.response.data.message !== "Credentials are not matching") {
      persistor.purge();
      store.dispatch(logout());

      localStorage.setItem("showSessionExpiredToast", "true");

      window.location.href = "/login";
    }
  },

  403: () => {
    console.error("Forbidden");
    toast.error("You do not have permission to perform this action.");
  },
  404: () => {
    console.error("Resource not found");
    toast.error("The requested resource was not found.");
  },
  500: () => {
    console.error("Internal server error");
    toast.error("An unexpected error occurred. Please try again later.");
  },
  default: () => {
    console.error("An error occurred");
    toast.error("An error occurred. Please try again.");
  },
};

// Response interceptor to handle responses
HTTP.interceptors.response.use(
  (response) => {
    console.log(response.status);
    return response;
  },
  (error) => {
    if (!error.response) {
      console.error("Network error");
    } else {
      const action =
        statusActions[error.response.status] || statusActions.default;
      action(error);
    }
    return Promise.reject(error);
  }
);

export default HTTP;
