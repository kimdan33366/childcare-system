import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../css/Privacy.css";
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

function Privacy() {
  const navigate = useNavigate();
   const handleLogout = () => {
    alert("Logged out!");
    navigate("/login");
};
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="privacy-dashboard">
      <Sidebar />
      <main className="privacy-container">
        <div className="privacy-card">
          <h1>Privacy & Security</h1>

          <section>
            <h2>Privacy Statement</h2>
            <p>
              Your privacy is our priority. This system is designed to protect
              the personal information of parents, children, and healthcare
              personnel.
            </p>

            <p>
              Personal information is handled responsibly and will not be
              disclosed to unauthorized individuals except when required by law
              or with the consent of the parent or legal guardian.
            </p>
          </section>

          <section>
            <h2>Privacy Policy</h2>

            <ul>
              <li>
                Child and parent information is collected only for immunization
                management purposes.
              </li>

              <li>
                Personal data is kept confidential and is accessible only to
                authorized healthcare personnel.
              </li>

              <li>
                The system complies with applicable data privacy regulations and
                follows secure data handling practices.
              </li>
            </ul>
          </section>

          <section>
            <h2>Security Features</h2>

            <ul>
              <li>
                Secure login authentication for parents and healthcare
                personnel.
              </li>

              <li>
                Role-based access to prevent unauthorized viewing or editing of
                records.
              </li>

              <li>Encrypted storage of sensitive information.</li>

              <li>
                Regular database backup to prevent data loss.
              </li>
            </ul>
          </section>

          <section>
            <h2>Data Protection</h2>

            <p>
              We use appropriate technical and organizational measures to
              protect your information against unauthorized access,
              alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2>Your Rights</h2>

            <ul>
              <li>Access your child's information.</li>
              <li>Request corrections to inaccurate records.</li>
              <li>Request deletion where legally applicable.</li>
              <li>Receive updates regarding privacy policy changes.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Privacy;