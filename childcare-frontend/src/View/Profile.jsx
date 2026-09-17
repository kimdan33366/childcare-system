import "../css/Profile.css";

import Sidebar from "../View/Sidebar";
import { useState } from "react";

function Profile() {
  const [currentUser, setCurrentUser] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("currentUser")) || {
        Admin_name: "Carolene Ann Oblianda",
        Admin_email: "",
        Admin_role: "System Administrator",
      }
    );
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser.Admin_name || "");
  const [editEmail, setEditEmail] = useState(currentUser.Admin_email || "");
  const [editRole, setEditRole] = useState(
    currentUser.Admin_role || "System Administrator",
  );
  return (
    <div className="profile-dashboard">
      <Sidebar />

      <main className="profile-main-content">
        <div className="profile-page">
          {/* PAGE HEADER */}
          <div className="profile-page-header">
            <div>
              <h1>Profile</h1>
              <p>Manage your personal account information.</p>
            </div>
          </div>

          {/* PROFILE OVERVIEW */}
          <div className="profile-overview">
            <div className="profile-overview-left">
              <img src="/profile.jpg" alt="Profile" className="profile-image" />

              <div className="profile-overview-info">
                <h2>{currentUser.Admin_name}</h2>

                <p>{currentUser.Admin_role}</p>

                <span className="profile-status">
                  <span className="profile-status-dot"></span>
                  Active
                </span>
              </div>
            </div>

            <button
              className="profile-edit-btn"
              onClick={() => setShowEditModal(true)}
            >
              Edit Profile
            </button>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="profile-section">
            <div className="profile-section-header">
              <h2>Personal Information</h2>

              <p>Your basic account information.</p>
            </div>

            <div className="profile-information-grid">
              <div className="profile-form-group">
                <label>Full Name</label>

                <input
                  type="text"
                  value={currentUser.Admin_name || ""}
                  readOnly
                />
              </div>

              <div className="profile-form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={currentUser.Admin_email || ""}
                  readOnly
                />
              </div>

              <div className="profile-form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={currentUser.Admin_role || ""}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* EDIT PROFILE MODAL */}
          {showEditModal && (
            <div className="profile-modal-overlay">
              <div className="profile-modal">
                <h2>Edit Profile</h2>

                <div className="profile-form-group">
                  <label>Name</label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="profile-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="profile-form-group">
                  <label>Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="System Administrator">
                      System Administrator
                    </option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div className="profile-modal-buttons">
                  <button type="button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `http://127.0.0.1:8000/api/profile/${currentUser.Admin_id}`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              Admin_name: editName,
                              Admin_email: editEmail,
                              Admin_role: editRole,
                            }),
                          },
                        );

                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(
                            data.message || "Failed to update profile",
                          );
                        }

                        const updatedUser = data.admin;

                        setCurrentUser(updatedUser);

                        localStorage.setItem(
                          "currentUser",
                          JSON.stringify(updatedUser),
                        );

                        setEditName(updatedUser.Admin_name || "");
                        setEditEmail(updatedUser.Admin_email || "");
                        setEditRole(
                          updatedUser.Admin_role || "System Administrator",
                        );

                        setShowEditModal(false);

                        alert("Profile updated successfully!");
                      } catch (error) {
                        console.error(error);

                        alert("Failed to update profile.");
                      }
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Profile;
