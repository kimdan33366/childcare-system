import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../css/About.css";
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

function About() {
  const navigate = useNavigate();
  const handleLogout = () => {
    alert("Logged out!");

    navigate("/login");
  };
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="about-dashboard">
      <Sidebar />

      <main className="about-container">
        <div className="about-page-header">
          <h1>About Us</h1>
          <p>
            Learn more about the Child Immunization Management and Parent
            Notification System.
          </p>
        </div>

        <section className="about-system-card">
          <div className="about-section-header">
            <h2>About the System</h2>
          </div>

          <p>
            Child Immunization Management and Parent Notification System is a
            web and mobile-based platform developed to support barangay health
            centers in managing child immunization programs more efficiently.
          </p>

          <p>
            The system provides parents with timely vaccination reminders and
            secure access to their child's immunization records while enabling
            healthcare personnel to manage schedules, monitor vaccination
            status, and generate reports through a centralized platform.
          </p>
        </section>

        <div className="about-info-grid">
          <section className="about-info-card">
            <h2>Mission</h2>
            <p>
              To improve childhood immunization management by providing a
              reliable, accessible, and efficient digital system that supports
              both parents and healthcare personnel.
            </p>
          </section>

          <section className="about-info-card">
            <h2>Vision</h2>
            <p>
              To promote healthier communities by ensuring every child receives
              timely immunization through innovative and accessible technology.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default About;
