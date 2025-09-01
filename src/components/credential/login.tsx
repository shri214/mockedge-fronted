import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./login.scss";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../redux/User.slice";
import type { IUser } from "../../Interface";
import { Navbar } from "../navbar";

export const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<IUser>({
    userName: "",
    password: "",
  });

  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dispatch(loginUser(credentials) as any).then((res: any) => {
        if (res.type === "user/login/fulfilled") {
          localStorage.setItem("accessToken", res.payload.user.accessToken);
          toast.success("Login successful");
          window.location.href = `/dashboard/${res.payload.user.id}`;
        } else if (res.type === "user/login/rejected") {
          toast.error(res.payload || "Login failed");
        }
      });
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    }
  };

  useEffect(() => {
    if (user !== null && user.accessToken !== null) {
      window.location.href = `/dashboard/${user?.id}`;
    }
  }, [user?.accessToken, user]);

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome Back 👋</h1>
            <p>Log in to continue</p>
          </div>

          <form className="login-form" onSubmit={submitHandler}>
            <div className="form-group">
              <label htmlFor="userName">Email Address</label>
              <input
                type="userName"
                id="userName"
                name="userName"
                required
                value={credentials.userName}
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
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="btn-primary">
              Log In
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don’t have an account?{" "}
              <Link to="/signup" className="signup-link">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
