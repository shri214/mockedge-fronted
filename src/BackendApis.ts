import axios from 'axios';
import {ENV} from "./config/env";
import { toast } from 'react-toastify';
//Base configuration for Axios
const axiosConfig = {
    baseURL:ENV.API_URL,
    timeout:180000,
}

// Create an Axios instance
const HTTP = axios.create(axiosConfig);

HTTP.defaults.headers.post['Content-Type'] = 'application/json';
HTTP.defaults.headers.post['Access-Control-Allow-Origin'] = '*';    
HTTP.defaults.headers.get['Access-Control-Allow-Origin'] = '*';

// Request interceptor to add headers
HTTP.interceptors.request.use(
    (config) => {
         const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

        return config;  
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Error handling objects
const statusActions: Record<number, () => void> = {
  400: () => {
    console.error("Bad request");
    toast.error("Bad request. Please check your input.");
  },
  401: () => {
    console.error("Unauthorized");
    toast.error("Unauthorized access. Please log in again.");
  },
  403: () => {
    console.error("Forbidden");
    toast.error("You do not have permission to perform this action.");
  },
  404: () => {
    console.error("Not Found");
    toast.error("The requested resource was not found.");
  },
  500: () => {
    console.error("Internal Server Error");
    toast.error("An error occurred on the server. Please try again later.");
  },
  503: () => {
    console.error("Service Unavailable");
    toast.error("The service is currently unavailable. Please try again later.");
  },
};


// Response interceptor to handle responses and errors
HTTP.interceptors.response.use(
    (response) => {
        // Any status code within the range of 2xx causes this function to trigger
        return response;
    },
    (error) => {
        // Any status codes that falls outside the range of 2xx causes this function to trigger
        if (error.response) {
            const action = statusActions[error.response.status];
            if (action) {
                action();
            } else {
                console.error("An unexpected error occurred");
                toast.error("An unexpected error occurred. Please try again.");
            }
        } else if (error.request) {
            console.error("No response received from server");
            toast.error("No response received from server. Please check your network connection.");
        } else {
            console.error("Error setting up request:", error.message);
            toast.error("Error setting up request. Please try again.");
        }
        return Promise.reject(error);
    }
);
export default HTTP;
  

