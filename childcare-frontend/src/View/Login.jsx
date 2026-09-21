import React, { useState } from "react";
import { Routes, useNavigate, Link } from "react-router-dom";
import "../css/Login.css";
import Register from "./Register";
import logo1 from "../images/logo1.png";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import { loginUser } from "../Controller/AuthController";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Administrator");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await loginUser(username, password, role);

    if (result.success) {
      navigate("/dashboard");
    } else {
      alert("Invalid username or password");
    }
  };
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="brand">
            <h1>childcare</h1>
          </div>

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="text"
              placeholder="Enter Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>password</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                Remember me
              </label>

              <Link to="/forgot-password">Forgot Password?</Link>
              {/* <a href="#forgotpassword">Forgot Password?</a> */}
            </div>
            <div className="login-role">
              <span>Login as</span>

              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Administrator">Administrator</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <button type="submit" className="login-btn">
              Login
            </button>

            {/* <button
              type="button"
              className="login-btn"
              onClick={() => navigate("/register")}
            >
              Register
            </button> */}
          </form>
        </div>
        <div className="login-right">
          <img src={logo1} alt="ChildCare Logo" className="right-logo" />
        </div>
      </div>
    </div>
  );
}

export default Login;
