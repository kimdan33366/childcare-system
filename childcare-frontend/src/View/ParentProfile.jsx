
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiEye,
  FiPlus,
  FiX,
  FiSave,
} from "react-icons/fi";

import Sidebar from "../View/Sidebar";
import "../css/ParentProfile.css";

function ParentProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();

  // ==========================================
  // CURRENT USER / PERMISSIONS
  // ==========================================

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  const hasPermission = (permission) => {
    return (
      isAdmin ||
      permissions.includes("all") ||
      permissions.includes(permission)
    );
  };

  // ==========================================
  // STATE
  // ==========================================

  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // ADD CHILD
  // ==========================================

  const [showAddChild, setShowAddChild] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [addChildError, setAddChildError] = useState("");

  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState("");
  const [relationship, setRelationship] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("");

  // ==========================================
  // CALCULATE AGE
  // ==========================================

  const calculateAge = (birthdateValue) => {
    if (!birthdateValue) return "—";

    const birth = new Date(birthdateValue);
    const today = new Date();

    if (Number.isNaN(birth.getTime())) {
      return "—";
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (today.getDate() < birth.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) {
      return "—";
    }

    if (years === 0) {
      return `${months} month${months !== 1 ? "s" : ""}`;
    }

    if (months === 0) {
      return `${years} year${years !== 1 ? "s" : ""}`;
    }

    return `${years}y ${months}m`;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // ==========================================
  // INITIALS
  // ==========================================

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  // ==========================================
  // CHILD STATUS
  // ==========================================

  const getStatusClass = (status) => {
    return (status || "Continuing").toLowerCase();
  };

  // ==========================================
  // FETCH PARENT
  // ==========================================

  const fetchParent = async () => {
    if (!userId) {
      setError("Parent ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${userId}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load parent information.");
      }

      setParent(data);
    } catch (err) {
      console.error("Error fetching parent:", err);
      setError(err.message || "Could not load parent information.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD PARENT
  // ==========================================

  useEffect(() => {
    fetchParent();
  }, [userId]);

  // ==========================================
  // RESET ADD CHILD FORM
  // ==========================================

  const resetAddChildForm = () => {
    setChildName("");
    setBirthdate("");
    setSex("");
    setRelationship("");
    setHeight("");
    setWeight("");
    setAddress("");
    setAddChildError("");
  };

  // ==========================================
  // OPEN ADD CHILD
  // ==========================================

  const openAddChild = () => {
    if (!hasPermission("add_patients")) {
      return;
    }

    resetAddChildForm();

    setAddress(parent?.address || "");

    setShowAddChild(true);
  };

  // ==========================================
  // CLOSE ADD CHILD
  // ==========================================

  const closeAddChild = () => {
    if (addingChild) return;

    setShowAddChild(false);
    resetAddChildForm();
  };

  // ==========================================
  // ADD CHILD
  // ==========================================

  const handleAddChild = async () => {
    setAddChildError("");

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!childName.trim()) {
      setAddChildError("Please enter the child's name.");
      return;
    }

    if (!birthdate) {
      setAddChildError("Please enter the child's birthdate.");
      return;
    }

    if (!sex) {
      setAddChildError("Please select the child's gender.");
      return;
    }

    if (!relationship) {
      setAddChildError("Please select the relationship to the child.");
      return;
    }

    if (!height || Number(height) <= 0) {
      setAddChildError("Please enter a valid height.");
      return;
    }

    if (!weight || Number(weight) <= 0) {
      setAddChildError("Please enter a valid weight.");
      return;
    }

    if (!address.trim()) {
      setAddChildError("Please enter the child's address.");
      return;
    }

    if (!userId) {
      setAddChildError("Parent ID is missing.");
      return;
    }

    try {
      setAddingChild(true);

      // ==========================================
      // CREATE CHILD
      // ==========================================

      const childResponse = await fetch(
        "http://127.0.0.1:8000/api/children",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_id: Number(userId),
            child_name: childName.trim(),
            birthdate,
            gender: sex,
            address: address.trim(),
            relationship,
            status: "Continuing",
          }),
        },
      );

      const childData = await childResponse.json();

      if (!childResponse.ok) {
        console.error("Create child error:", childData);

        setAddChildError(
          childData.message ||
            "Failed to create the child. Please check the server.",
        );

        return;
      }

      const createdChild = childData.child || childData;

      // ==========================================
      // CREATE FIRST GROWTH RECORD
      // ==========================================

      const growthResponse = await fetch(
        "http://127.0.0.1:8000/api/growth-records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            child_id: createdChild.child_id,
            date: new Date().toISOString().split("T")[0],
            weight_kg: Number(weight),
            height_cm: Number(height),
          }),
        },
      );

      const growthData = await growthResponse.json();

      if (!growthResponse.ok) {
        console.error("Create growth record error:", growthData);

        setAddChildError(
          "The child was created, but the height and weight could not be saved.",
        );

        await fetchParent();

        return;
      }

      console.log("First growth record created:", growthData);

      // ==========================================
      // REFRESH PARENT DATA
      // ==========================================

      await fetchParent();

      // ==========================================
      // CLOSE MODAL
      // ==========================================

      setShowAddChild(false);
      resetAddChildForm();

      alert("Child added successfully.");
    } catch (err) {
      console.error("Error creating child:", err);

      setAddChildError(
        "Could not connect to the server. Please try again.",
      );
    } finally {
      setAddingChild(false);
    }
  };

  // ==========================================
  // VIEW CHILD RECORD
  // ==========================================

  const handleViewRecord = (childId) => {
    navigate(`/patient_viewrecord/${childId}`, {
      state: {
        from: `/parent-profile/${userId}`,
        fromLabel: "Back to Parent Profile",
      },
    });
  };

  // ==========================================
  // ACCESS CONTROL
  // ==========================================

  if (!isAdmin && !permissions.includes("view_patients")) {
    return <div>Access Denied</div>;
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="parent-profile-dashboard">
        <Sidebar />

        <main className="parent-profile-main">
          <div className="parent-profile-loading">
            Loading parent information...
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !parent) {
    return (
      <div className="parent-profile-dashboard">
        <Sidebar />

        <main className="parent-profile-main">
          <button
            type="button"
            className="parent-profile-back"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft />
            Back
          </button>

          <div className="parent-profile-error">
            {error || "Parent not found."}
          </div>
        </main>
      </div>
    );
  }

  const children = Array.isArray(parent.children)
    ? parent.children
    : [];

  return (
    <div className="parent-profile-dashboard">
      <Sidebar />

      <main className="parent-profile-main">
        {/* ==========================================
            BACK BUTTON
        ========================================== */}

        <button
          type="button"
          className="parent-profile-back"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft />
          Back
        </button>

        {/* ==========================================
            PAGE HEADER
        ========================================== */}

        <div className="parent-profile-header">
          <div>
            <h1>Parent Profile</h1>
            <p>View parent information and registered children.</p>
          </div>
        </div>

        {/* ==========================================
            PARENT PROFILE CARD
        ========================================== */}

        <section className="parent-profile-card">
          <div className="parent-profile-summary">
            <div className="parent-profile-avatar">
              {getInitials(parent.user_fullname)}
            </div>

            <div className="parent-profile-name-section">
              <h2>{parent.user_fullname || "Unnamed Parent"}</h2>

              <span
                className={`parent-profile-status ${getStatusClass(
                  parent.status,
                )}`}
              >
                {parent.status || "Active"}
              </span>
            </div>
          </div>

          <div className="parent-information-grid">
            <div className="parent-information-item">
              <FiUser />

              <div>
                <span>Full Name</span>
                <strong>{parent.user_fullname || "—"}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <FiMail />

              <div>
                <span>Email</span>
                <strong>{parent.email || "—"}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <FiPhone />

              <div>
                <span>Mobile Number</span>
                <strong>{parent.mobile_number || "—"}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <FiCalendar />

              <div>
                <span>Date of Birth</span>
                <strong>{formatDate(parent.date_of_birth)}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <FiUser />

              <div>
                <span>Gender</span>
                <strong>{parent.gender || "—"}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <FiMapPin />

              <div>
                <span>Address</span>
                <strong>{parent.address || "—"}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            REGISTERED CHILDREN
        ========================================== */}

        <section className="parent-children-section">
          <div className="children-heading">
            <div>
              <h2>Registered Children</h2>

              <p>
                Children registered under this parent or guardian.
              </p>
            </div>

            {/* ADD CHILD
                Uses the existing add_patients permission.
            */}

            {hasPermission("add_patients") && (
              <button
                type="button"
                className="add-child-profile-button"
                onClick={openAddChild}
              >
                <FiPlus />
                Add Child
              </button>
            )}
          </div>

          {children.length > 0 ? (
            <div className="parent-children-list">
              {children.map((child) => (
                <div
                  className="parent-child-card"
                  key={child.child_id}
                >
                  <div className="parent-child-main">
                    <div className="parent-child-avatar">
                      {getInitials(child.child_name)}
                    </div>

                    <div className="parent-child-info">
                      <h3>{child.child_name || "Unnamed Child"}</h3>

                      <div className="parent-child-details">
                        <span>
                          {calculateAge(child.birthdate)}
                        </span>

                        <span>
                          {child.gender || "—"}
                        </span>

                        <span>
                          {child.relationship || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="parent-child-right">
                    <span
                      className={`parent-child-status ${getStatusClass(
                        child.status,
                      )}`}
                    >
                      {child.status || "Continuing"}
                    </span>

                    {hasPermission("view_patients") && (
                      <button
                        type="button"
                        className="view-child-record-button"
                        onClick={() =>
                          handleViewRecord(child.child_id)
                        }
                      >
                        <FiEye />
                        View Record
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="parent-children-empty">
              <FiUser />

              <h3>No registered children</h3>

              <p>
                No children have been registered under this parent yet.
              </p>

              {hasPermission("add_patients") && (
                <button
                  type="button"
                  className="add-child-empty-button"
                  onClick={openAddChild}
                >
                  <FiPlus />
                  Add Child
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ==========================================
          ADD CHILD MODAL
      ========================================== */}

      {showAddChild && hasPermission("add_patients") && (
        <div className="add-child-modal-overlay">
          <div className="add-child-modal">
            {/* HEADER */}

            <div className="add-child-modal-header">
              <div>
                <h2>Add Child</h2>

                <p>
                  Register a new child under this parent.
                </p>
              </div>

              <button
                type="button"
                className="add-child-modal-close"
                onClick={closeAddChild}
                disabled={addingChild}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {/* PARENT */}

            <div className="add-child-parent-info">
              <FiUser />

              <div>
                <small>Parent / Guardian</small>

                <strong>
                  {parent.user_fullname || "Unnamed Parent"}
                </strong>
              </div>
            </div>

            {/* ERROR */}

            {addChildError && (
              <div className="add-child-error">
                {addChildError}
              </div>
            )}

            {/* FORM */}

            <div className="add-child-form-grid">
              {/* CHILD NAME */}

              <div className="add-child-form-group full-width">
                <label>Child's Name</label>

                <input
                  type="text"
                  placeholder="Enter child's full name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  disabled={addingChild}
                />
              </div>

              {/* BIRTHDATE */}

              <div className="add-child-form-group">
                <label>Birthdate</label>

                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  disabled={addingChild}
                />
              </div>

              {/* CALCULATED AGE */}

              <div className="add-child-form-group">
                <label>Age</label>

                <div className="calculated-age-field">
                  {birthdate
                    ? calculateAge(birthdate)
                    : "Calculated automatically"}
                </div>

                <small className="form-help-text">
                  Age is calculated from the birthdate.
                </small>
              </div>

              {/* GENDER */}

              <div className="add-child-form-group">
                <label>Gender</label>

                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  disabled={addingChild}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* RELATIONSHIP */}

              <div className="add-child-form-group">
                <label>Relationship to Child</label>

                <select
                  value={relationship}
                  onChange={(e) =>
                    setRelationship(e.target.value)
                  }
                  disabled={addingChild}
                >
                  <option value="">
                    Select Relationship
                  </option>

                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              {/* HEIGHT */}

              <div className="add-child-form-group">
                <label>Height (cm)</label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 85.5"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  disabled={addingChild}
                />
              </div>

              {/* WEIGHT */}

              <div className="add-child-form-group">
                <label>Weight (kg)</label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 12.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={addingChild}
                />
              </div>

              {/* ADDRESS */}

              <div className="add-child-form-group full-width">
                <label>Address</label>

                <input
                  type="text"
                  placeholder="Child's address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={addingChild}
                />

                <small className="form-help-text">
                  The parent's address is copied automatically,
                  but you can edit it if needed.
                </small>
              </div>
            </div>

            {/* FOOTER */}

            <div className="add-child-modal-footer">
              <button
                type="button"
                className="add-child-cancel-button"
                onClick={closeAddChild}
                disabled={addingChild}
              >
                Cancel
              </button>

              <button
                type="button"
                className="add-child-save-button"
                onClick={handleAddChild}
                disabled={addingChild}
              >
                <FiSave />

                {addingChild ? "Saving..." : "Save Child"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentProfile;

