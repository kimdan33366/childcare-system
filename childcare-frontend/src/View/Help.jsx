import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../css/Help.css";
import logo1 from "../images/logo1.png";
import Sidebar from "./Sidebar";

import {
  FaThLarge,
  FaUserFriends,
  FaCalendarAlt,
  FaSyringe,
  FaChartBar,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaLock,
  FaQuestionCircle,
  FaUser,
} from "react-icons/fa";

function Help() {
  const navigate = useNavigate();
  const handleLogout = () => {
    alert("Logged out!");

    navigate("/login");
  };
  const [showSettings, setShowSettings] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <div className="help-dashboard">
      <Sidebar />
      <main className="help-container">
        <div className="help-page-header">
          <h1>Help & Feedback</h1>
          <p>
            Find answers to common questions or get assistance with the system.
          </p>
        </div>

        {/* HELP CENTER */}
        <section className="help-center-card">
          <div className="help-section-header">
            <div>
              <h2>Help Center</h2>
              <p>Need assistance? We're here to help.</p>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="help-faq-section">
          <div className="help-section-title">
            <h2>Frequently Asked Questions</h2>
            <p>Find quick answers to common questions.</p>
          </div>

          <div className="help-faq-list">
            {/* FAQ 1 */}
            <div className="help-faq-item">
              <button
                type="button"
                className="help-faq-question"
                onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              >
                <span>
                  <small>01</small>
                  How do I register my child?
                </span>

                <span className="help-faq-arrow">
                  {openFaq === 1 ? "⌃" : "⌄"}
                </span>
              </button>

              {openFaq === 1 && (
                <div className="help-faq-answer">
                  <p>
                    Click the + button on the dashboard to add your child's
                    information. Fill in the required details and submit the
                    form.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="help-faq-item">
              <button
                type="button"
                className="help-faq-question"
                onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
              >
                <span>
                  <small>02</small>I forgot my password. What should I do?
                </span>

                <span className="help-faq-arrow">
                  {openFaq === 2 ? "⌃" : "⌄"}
                </span>
              </button>

              {openFaq === 2 && (
                <div className="help-faq-answer">
                  <p>
                    You can reset your password by clicking the "Forgot
                    Password" link on the login page. Follow the instructions to
                    create a new password.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="help-faq-item">
              <button
                type="button"
                className="help-faq-question"
                onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              >
                <span>
                  <small>03</small>I didn't receive a vaccination reminder.
                </span>

                <span className="help-faq-arrow">
                  {openFaq === 3 ? "⌃" : "⌄"}
                </span>
              </button>

              {openFaq === 3 && (
                <div className="help-faq-answer">
                  <p>
                    Verify that your registered mobile number or email address
                    is correct. If the problem continues, contact your barangay
                    health center.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="help-faq-item">
              <button
                type="button"
                className="help-faq-question"
                onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
              >
                <span>
                  <small>04</small>
                  Can I view my child's vaccination history?
                </span>

                <span className="help-faq-arrow">
                  {openFaq === 4 ? "⌃" : "⌄"}
                </span>
              </button>

              {openFaq === 4 && (
                <div className="help-faq-answer">
                  <p>
                    Yes. You can view your child's vaccination history by
                    navigating to the "Vaccines" section in the dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* STILL NEED HELP */}
        
        
      </main>
    </div>
  );
}

export default Help;
