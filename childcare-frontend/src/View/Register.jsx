import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Register.css";
import logo1 from "../images/logo1.png";
import { registerUser } from "../Controller/RegisterController";

import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const result = await registerUser(
      username,
      email,
      password
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


        {/* ================= RIGHT SIDE - REGISTER ================= */}

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
                required
              />


              {/* EMAIL */}

              <label>Email</label>

              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />


              {/* PASSWORD */}

              <label>Password</label>

              <div className="password-wrapper">

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>

              </div>


              {/* LOGIN LINK */}

              <div
                className="account-message"
                onClick={() => navigate("/login")}
              >
                Already have an account?
              </div>


              {/* REGISTER BUTTON */}

              <button
                className="login-btn"
                type="submit"
              >
                REGISTER
              </button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;