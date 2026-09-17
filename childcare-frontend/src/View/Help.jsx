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

  return (
    <div className="help-dashboard">
      <Sidebar />
      <main className="help-container">
        <div className="help-card">
          <h1>Help & Feedback</h1>

          <section>
            <h2>Help Center</h2>
            <p>Need assistance? We're here to help.</p>
            <h2>Frequently Asked Questions</h2>
            <h4>1. How do I register my child?</h4>
            <p>
              Click the + button on the dashboard to add your child's information. 
              Fill in the required details and submit the form.
            </p>
            <h3>2. I forgot my password. What should I do?</h3>
            <p>
              You can reset your password by clicking the "Forgot Password" link on the login page.
               Follow the instructions to create a new password.
            </p>
            <h3>3. I didn't receive a vaccination reminder.</h3>
            <p>Verify that your registered mobile number or email address is correct.
                 If the problem continues, contact your barangay health center.</p>
            <h3>4. Can I view my child's vaccination history?</h3>
            <p>Yes, you can view your child's vaccination history by navigating to the "Vaccines" section in the dashboard.</p> 
          </section>
        </div>
        </main> 

       </div>
  );
}

export default Help;