import "../css/Profile.css";

import Sidebar from "../View/Sidebar";
import { useState } from "react";

function Profile() {
const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  ) || {
    Admin_name: "Carolene Ann Oblianda",
    Admin_email: "",
    Admin_role: "System Administrator",
    };
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(currentUser.Admin_name || "");
    const [editEmail, setEditEmail] = useState(currentUser.Admin_email || "");
  
  return (
    <div className="profile-dashboard">

      <Sidebar />

      <main className="profile-main-content">

        <div className="profile-card">
          <div className="profile-header">

            <img
              src="/profile.jpg"
              alt="Profile"
              className="profile-image"
            />

            <div>

              <h2>
                {currentUser.Admin_name}
              </h2>

              <p>
                {currentUser.Admin_role}
              </p>

            </div>

          </div>
          <div className="profile-form-group">

            <label>
              Username
            </label>

            <input
              type="text"
              value={currentUser.Admin_name || ""}
              readOnly
            />

          </div>


          <div className="profile-form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              value={currentUser.Admin_email || ""}
              readOnly
            />

          </div>
          <button
            className="profile-edit-btn"
            onClick={() => setShowEditModal(true)
              
            }
          >
            Edit Profile
          </button>
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
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

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