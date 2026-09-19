
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
        user_type: "Admin",
      }
    );
  });

  // Check if the logged-in account is an Admin
  const isAdmin = currentUser?.user_type === "Admin";

  // Create a unique image key for each account
  const profileImageKey = isAdmin
    ? `profileImage_admin_${currentUser?.Admin_id}`
    : `profileImage_staff_${currentUser?.staff_id}`;

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem(profileImageKey) || "/profile.jpg",
  );

  const [showEditModal, setShowEditModal] = useState(false);

  const [editName, setEditName] = useState(currentUser.Admin_name || "");
  const [editEmail, setEditEmail] = useState(currentUser.Admin_email || "");
  const [editRole, setEditRole] = useState(
    currentUser.Admin_role || "System Administrator",
  );

  // Change profile image
  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Make sure the selected file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const imageData = reader.result;

      // Change image immediately
      setProfileImage(imageData);

      // Save image for this specific account only
      localStorage.setItem(profileImageKey, imageData);
    };

    reader.readAsDataURL(file);
  };

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

              {/* PROFILE IMAGE */}
              <div className="profile-image-container">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-image"
                  onClick={() =>
                    document.getElementById("profileImageInput").click()
                  }
                />

                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </div>

              <div className="profile-overview-info">
                <h2>
                  {currentUser.Admin_name || currentUser.staff_name}
                </h2>

                <p>
                  {currentUser.Admin_role ||
                    (isAdmin ? "System Administrator" : "Staff")}
                </p>

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

              {/* NAME */}
              <div className="profile-form-group">
                <label>Full Name</label>

                <input
                  type="text"
                  value={
                    currentUser.Admin_name ||
                    currentUser.staff_name ||
                    ""
                  }
                  readOnly
                />
              </div>

              {/* EMAIL */}
              <div className="profile-form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={
                    currentUser.Admin_email ||
                    currentUser.staff_email ||
                    ""
                  }
                  readOnly
                />
              </div>

              {/* ROLE */}
              <div className="profile-form-group">
                <label>Role</label>

                <input
                  type="text"
                  value={
                    currentUser.Admin_role ||
                    (isAdmin ? "System Administrator" : "Staff")
                  }
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

                {/* NAME */}
                <div className="profile-form-group">
                  <label>Name</label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                {/* EMAIL */}
                <div className="profile-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>

                {/* ROLE — ADMIN ONLY */}
                {isAdmin && (
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
                )}

                {/* BUTTONS */}
                <div className="profile-modal-buttons">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                  >
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
                            data.message ||
                              "Failed to update profile",
                          );
                        }

                        const updatedUser = data.admin;

                        setCurrentUser(updatedUser);

                        localStorage.setItem(
                          "currentUser",
                          JSON.stringify(updatedUser),
                        );

                        setEditName(
                          updatedUser.Admin_name || "",
                        );

                        setEditEmail(
                          updatedUser.Admin_email || "",
                        );

                        setEditRole(
                          updatedUser.Admin_role ||
                            "System Administrator",
                        );

                        setShowEditModal(false);

                        alert(
                          "Profile updated successfully!",
                        );
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
