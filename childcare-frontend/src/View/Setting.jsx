import "../css/Setting.css";

import Sidebar from "./View/Sidebar";

import { adminUser } from "../Model/UserModel";

function Setting() {

  return (

    <div className="setting-dashboard">

      <Sidebar />

      <main className="setting-main-content">

        <div className="setting-profile-card">

          <div className="setting-profile-header">

            <img
              src={adminUser.profileImage}
              alt="Profile"
              className="profile-image"
            />

            <div>

              <h2>
                {adminUser.name}
              </h2>

              <p>
                {adminUser.role}
              </p>

            </div>

          </div>

          <div className="setting-form-group">

            <label>
              Username
            </label>

            <input type="text" />

          </div>

          <div className="setting-form-group">

            <label>
              Email
            </label>

            <input type="email" />

          </div>

          <button className="setting-edit-btn">
            Edit Profile
          </button>

        </div>

      </main>

    </div>
  );
}

export default Setting;