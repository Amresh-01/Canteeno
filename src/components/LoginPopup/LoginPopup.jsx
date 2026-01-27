import React, { useContext, useState } from "react";
import axios from "axios";
import "./LoginPopup.css";
import { API_BASE_URL } from "../../config.js";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, setUserType, loadCartData, setUserId } =
    useContext(StoreContext);

  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [loginRole, setLoginRole] = useState("user");

  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    userId: "",
  });

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let endpoint = "";
    let body = {};

    if (loginRole === "admin") {
      if (!data.userId || !data.password) {
        return toast.error("Admin ID and password required");
      }

      endpoint = `${API_BASE_URL}/admin/login`;
      body = {
        userId: data.userId.trim(),
        password: data.password,
      };
    } else {
      if (mode === "login") {
        if (!data.email || !data.password) {
          return toast.error("Email and password required");
        }

        endpoint = `${API_BASE_URL}/user/login`;
        body = {
          email: data.email.trim(),
          password: data.password,
        };
      } else {
        if (!data.username || !data.email || !data.password) {
          return toast.error("All fields are required");
        }

        endpoint = `${API_BASE_URL}/user/register`;
        body = {
          username: data.username.trim(),
          email: data.email.trim(),
          password: data.password,
          role: "user",
        };
      }
    }

    try {
      const res = await axios.post(endpoint, body, { withCredentials: true });

      if (!res.data?.success) {
        return toast.error(res.data?.message || "Authentication failed");
      }

      const payload = res.data.data || {};

      if (loginRole === "user" && mode === "signup") {
        toast.success("Registration successful. Please login.");
        setMode("login");
        return;
      }

      const token = payload.accessToken || payload.token;
      if (!token) return toast.error("Authentication token missing");

      const role = payload.role || loginRole;

      setToken(token);
      setUserType(role);
      localStorage.setItem("token", token);
      localStorage.setItem("userType", role);

      if (payload._id) {
        setUserId(payload._id);
        localStorage.setItem("userId", payload._id);
      }

      if (role === "user") {
        await loadCartData(token);
      }

      toast.success("Login successful");
      setShowLogin(false);

      navigate(role === "admin" ? "/admin/dashboard" : "/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-popup">
      <div className="login-popup-container">
        <button className="close-btn" onClick={() => setShowLogin(false)}>
          ×
        </button>

        <h2>
          {mode === "login" ? "Login" : "Create Account"} ({loginRole})
        </h2>

        <form onSubmit={handleSubmit} className="login-form">
          {loginRole === "admin" ? (
            <>
              <input
                type="text"
                name="userId"
                value={data.userId}
                onChange={handleChange}
                placeholder="Admin User ID"
                required
              />
              <input
                type="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
            </>
          ) : (
            <>
              
              {mode === "signup" && (
                <input
                  type="text"
                  name="username"
                  value={data.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                />
              )}

              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />

              <input
                type="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
            </>
          )}

          <button type="submit" className="btn-submit">
            {mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* USER MODE TOGGLE */}
        {loginRole === "user" && (
          <p className="toggle-text">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <span onClick={() => setMode("signup")}>Sign up</span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span onClick={() => setMode("login")}>Login</span>
              </>
            )}
          </p>
        )}

        {/* ROLE SWITCH */}
        <p className="toggle-text">
          {loginRole === "user" ? (
            <>
              Are you an Admin?{" "}
              <span onClick={() => setLoginRole("admin")}>Login here</span>
            </>
          ) : (
            <>
              Are you a User?{" "}
              <span onClick={() => setLoginRole("user")}>Login here</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginPopup;
