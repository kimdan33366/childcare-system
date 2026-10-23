import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/Login.css";
import logo1 from "../images/logo1.png";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaArrowRight, FaShieldAlt, FaHeart } from "react-icons/fa";
import { loginUser } from "../Controller/AuthController";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      // Keep your existing authentication/token handling unchanged.
      const result = await loginUser(username, password);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <section className="login-brand-panel" aria-label="Childcare Immunization System">
          <div className="login-brand-heading">
            <h1>childcare</h1>
            <p className="login-brand-subtitle">IMMUNIZATION SYSTEM</p>
          </div>
          <div className="login-brand-tagline">
            <p>Healthy Children,<br />Brighter Tomorrows</p>
            <span className="login-tagline-rule" />
          </div>
          <div className="login-artwork-wrap">
            <span className="login-decor-heart login-decor-heart-one"><FaHeart /></span>
            <span className="login-decor-heart login-decor-heart-two"><FaHeart /></span>
            <div className="login-artwork-halo" />
            <img src={logo1} alt="Childcare immunization illustration" className="login-brand-image" />
          </div>
          <div className="login-wave login-wave-back" />
          <div className="login-wave login-wave-front" />
        </section>

        <section className="login-form-panel">
          <div className="login-card">
            <div className="login-card-heading">
              <h2>Welcome Back!</h2>
              <p>Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <label className="login-field" htmlFor="login-email">
                <FaEnvelope className="login-field-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  placeholder="Email or username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>

              <label className="login-field" htmlFor="login-password">
                <FaLock className="login-field-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </label>

              <div className="login-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              {error && <p className="login-error" role="alert">{error}</p>}

              <button type="submit" className="login-submit" disabled={isSubmitting}>
                <span>{isSubmitting ? "Signing in..." : "Login"}</span>
                <span className="login-submit-arrow"><FaArrowRight aria-hidden="true" /></span>
              </button>
            </form>

            <div className="login-divider"><span>or</span></div>
            <div className="login-security-note">
              <span className="login-security-icon"><FaShieldAlt aria-hidden="true" /></span>
              <div>
                <strong>Secure Access</strong>
                <p>Your data is safe with us.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
