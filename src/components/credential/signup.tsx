import React, { useState } from "react";
import { Link } from "react-router-dom"; // for navigation
import HTTP from "../../BackendApis";
import "./Signup.scss";
import { Navbar } from "../navbar";
import { toast } from "react-toastify";

export const Signup: React.FC = () => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    HTTP.post("/user/signUp", user)
      .then((response) => {
        console.log(response.data);
        toast.success("Signup successful!");
      })
      .catch((error) => {
        console.error("There was an error!", error);
        toast.error("Signup failed!");
      });
  };

  return (
    <>
      <Navbar />
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <h1>Create Account</h1>
            <p>Join us today and start your journey 🚀</p>
          </div>

          <form className="signup-form" onSubmit={submitHandler}>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={user.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={user.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={user.email}
                onChange={handleChange}
                placeholder="example@domain.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={user.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
              />
            </div>

            <button type="submit" className="btn-primary">
              Sign Up
            </button>
          </form>

          <div className="signup-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="login-link">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
