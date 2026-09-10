import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Register.css";
import logo1 from "../images/logo1.png";
import { registerUser } from "../Controller/RegisterController";

import {
  FaEye,  
  FaEyeSlash
} from "react-icons/fa";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleRegister = async (e) => {
  e.preventDefault();

  const result = await registerUser(
    username,
    email,
    password,
    role
  );

  if (result.success) {
    alert("Registration successful!");
    navigate("/login");
  } else {
    alert(result.message);
  }
};

  return (
    <div className="login-page">

      <div className="login-container">

        {/* ================= LEFT SIDE - LOGO ================= */}

        <div className="login-left">

          <img
            src={logo1}
            alt="ChildCare Logo"
            className="left-logo"
          />

        </div>


        {/* ================= RIGHT SIDE - LOGIN ================= */}

        <div className="login-right">

          <div className="login-content">

           <div className="brand">
  <h1>childcare</h1>
  <h2>Register</h2>
</div>

            <form onSubmit={handleRegister}>

              {/* USERNAME */}

              <label>Username</label>

              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <label>Email</label>

              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              {/* PASSWORD */}

              <label>Password</label>

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


              {/* ROLE */}

              <label>Role</label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="teacher">Staff</option>
              </select>


             {/* ACCOUNT MESSAGE */}

<div className="account-message"
onClick={() => navigate("/login")}

>
  Already have an account?
</div>


              {/* LOGIN BUTTON */}

              <button
                className="login-btn"
                type="submit"
              >
                LOGIN
              </button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;