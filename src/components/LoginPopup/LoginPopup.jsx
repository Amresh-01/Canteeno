import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const {url, setToken, setUserType: setContextUserType } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState("Login");
  const [userType, setUserType] = useState("user"); // "user" or "admin"
  const [data, setData] = useState({
    username: "",
    email: "",
    userId: "", // For admin login
    password: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;
    let requestData = { ...data };
    
    if (userType === "admin") {
      // Admin login/register - use userId and password
      if (currentState === "Login") {
        newUrl += "/api/admin/login";
        // For admin login, send userId and password
        requestData = {
          userId: data.userId,
          password: data.password
        };
      } else {
        newUrl += "/api/admin/register";
        // For admin registration, send name (from username), userId, and password
        requestData = {
          name: data.username || "",
          userId: data.userId || "",
          password: data.password || ""
        };
      }
    } else {
      // User login/register endpoints - use email and password
      if (currentState === "Login") {
        newUrl += "/api/user/login";
        // For user login, send email and password
        requestData = {
          email: data.email,
          password: data.password
        };
      } else {
        newUrl += "/api/user/register";
        // Map username to name for backend compatibility
        if (requestData.username) {
          requestData.name = requestData.username;
          delete requestData.username;
        }
        // Remove userId for user registration
        delete requestData.userId;
      }
    }
    
    try {
      const response = await axios.post(newUrl, requestData);
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        // Store user type in localStorage and context
        localStorage.setItem("userType", userType);
        setContextUserType(userType);
        toast.success(`${userType === "admin" ? "Admin" : "User"} Login Successfully`);
        setShowLogin(false);
      } else {
        toast.error(response.data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login/Register error:", error);
      console.error("Request URL:", newUrl);
      console.error("Request Data:", requestData);
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || `Error: ${status}`;
        if (status === 404) {
          toast.error("Registration failed. Please try again later.");
        } else {
          toast.error(message);
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(error.message || "An unexpected error occurred.");
      }
    }
  };
  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className={`login-popup-container ${userType === "admin" ? "admin-mode" : ""}`}>
        <div className="login-popup-title">
          <h2>{userType === "admin" ? "Admin " : ""}{currentState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>
        
        {/* User Type Selection */}
        <div className="login-popup-user-type">
          <button
            type="button"
            className={userType === "user" ? "active" : ""}
            onClick={() => {
              setUserType("user");
              setData({ username: "", email: "", userId: "", password: "" });
            }}
          >
            User
          </button>
          <button
            type="button"
            className={userType === "admin" ? "active" : ""}
            onClick={() => {
              setUserType("admin");
              setData({ username: "", email: "", userId: "", password: "" });
            }}
          >
            Admin
          </button>
        </div>

        <div className="login-popup-inputs">
          {userType === "admin" ? (
            // Admin login/register fields
            <>
              {currentState === "Login" ? (
                // Admin login - only userId and password
                <>
                  <input
                    name="userId"
                    onChange={onChangeHandler}
                    value={data.userId}
                    type="text"
                    placeholder="User ID"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Password"
                    required
                  />
                </>
              ) : (
                // Admin registration - username, userId, and password
                <>
                  <input
                    name="username"
                    onChange={onChangeHandler}
                    value={data.username}
                    type="text"
                    placeholder="Username"
                    required
                  />
                  <input
                    name="userId"
                    onChange={onChangeHandler}
                    value={data.userId}
                    type="text"
                    placeholder="User ID"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Password"
                    required
                  />
                </>
              )}
            </>
          ) : (
            // User login/register fields
            <>
              {currentState === "Login" ? (
                // User login - email and password
                <>
                  <input
                    name="email"
                    onChange={onChangeHandler}
                    value={data.email}
                    type="email"
                    placeholder="Your email"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Your password"
                    required
                  />
                </>
              ) : (
                // User registration - username, email, and password
                <>
                  <input
                    name="username"
                    onChange={onChangeHandler}
                    value={data.username}
                    type="text"
                    placeholder="Username"
                    required
                  />
                  <input
                    name="email"
                    onChange={onChangeHandler}
                    value={data.email}
                    type="email"
                    placeholder="Your email"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Your password"
                    required
                  />
                </>
              )}
            </>
          )}
        </div>
        <button type="submit" className={userType === "admin" ? "admin-login-btn" : ""}>
          {currentState === "Sign Up" ? "Create Account" : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, i agree to the terms of use & privacy policy.</p>
        </div>
        {currentState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrentState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrentState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;