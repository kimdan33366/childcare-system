import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

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
  FiEdit2,
} from "react-icons/fi";

import Sidebar from "../View/Sidebar";
import "../css/ParentProfile.css";

function ParentProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();

  // ==========================================
  // CURRENT USER / PERMISSIONS
  // ==========================================

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  const hasPermission = (permission) => {
    return (
      isAdmin || permissions.includes("all") || permissions.includes(permission)
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
  // EDIT CHILD
  // ==========================================

  const [showEditChild, setShowEditChild] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [editingChildSaving, setEditingChildSaving] = useState(false);
  const [editChildError, setEditChildError] = useState("");

  const [editChildName, setEditChildName] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editSex, setEditSex] = useState("");
  const [editRelationship, setEditRelationship] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState("Continuing");

  // ==========================================
  // EDIT PARENT
  // ==========================================

  const [showEditParent, setShowEditParent] = useState(false);
  const [editingParentSaving, setEditingParentSaving] = useState(false);
  const [editParentError, setEditParentError] = useState("");

  const [editParentName, setEditParentName] = useState("");
  const [editParentEmail, setEditParentEmail] = useState("");
  const [editParentMobile, setEditParentMobile] = useState("");
  const [editParentBirthdate, setEditParentBirthdate] = useState("");
  const [editParentGender, setEditParentGender] = useState("");
  const [editParentAddress, setEditParentAddress] = useState("");
  const [editParentStatus, setEditParentStatus] = useState("Active");
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

      const childResponse = await fetch("http://127.0.0.1:8000/api/children", {
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
      });

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

      setAddChildError("Could not connect to the server. Please try again.");
    } finally {
      setAddingChild(false);
    }
  };

  // ==========================================
  // OPEN EDIT CHILD
  // ==========================================

  const openEditChild = (child) => {
    if (!hasPermission("edit_patients")) {
      return;
    }

    setEditingChild(child);

    setEditChildName(child.child_name || "");

    // Convert the date into YYYY-MM-DD for the date input.
    setEditBirthdate(
      child.birthdate ? String(child.birthdate).split("T")[0] : "",
    );

    setEditSex(child.gender || "");
    setEditRelationship(child.relationship || "");
    setEditAddress(child.address || "");
    setEditStatus(child.status || "Continuing");

    setEditChildError("");
    setShowEditChild(true);
  };
  // ==========================================
  // OPEN EDIT PARENT
  // ==========================================

  const openEditParent = () => {
    if (!hasPermission("edit_users")) {
      return;
    }

    setEditParentName(parent?.user_fullname || "");
    setEditParentEmail(parent?.email || "");
    setEditParentMobile(parent?.mobile_number || "");

    setEditParentBirthdate(
      parent?.date_of_birth ? String(parent.date_of_birth).split("T")[0] : "",
    );

    setEditParentGender(parent?.gender || "");
    setEditParentAddress(parent?.address || "");

    setEditParentStatus(parent?.status || "Active");

    setEditParentError("");
    setShowEditParent(true);
  };
  // ==========================================
  // CLOSE EDIT PARENT
  // ==========================================

  const closeEditParent = () => {
    if (editingParentSaving) return;

    setShowEditParent(false);
    setEditParentError("");

    setEditParentName("");
    setEditParentEmail("");
    setEditParentMobile("");
    setEditParentBirthdate("");
    setEditParentGender("");
    setEditParentAddress("");
    setEditParentStatus("Active");
  };

  // ==========================================
  // SAVE EDITED PARENT
  // ==========================================

  const handleEditParent = async () => {
    setEditParentError("");

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!userId) {
      setEditParentError("Parent ID is missing.");
      return;
    }

    if (!editParentName.trim()) {
      setEditParentError("Please enter the parent's full name.");
      return;
    }

    if (!/^[^\s@]+@gmail\.com$/i.test(editParentEmail.trim())) {
      setEditParentError(
        "Please enter a valid Gmail address ending with @gmail.com.",
      );
      return;
    }

    if (!/^\d{11}$/.test(editParentMobile)) {
      setEditParentError("Mobile number must contain exactly 11 digits.");
      return;
    }

    if (!editParentBirthdate) {
      setEditParentError("Please enter the parent's date of birth.");
      return;
    }

    if (!editParentGender) {
      setEditParentError("Please select the parent's gender.");
      return;
    }

    if (!editParentAddress.trim()) {
      setEditParentError("Please enter the parent's address.");
      return;
    }

    try {
      setEditingParentSaving(true);

      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_fullname: editParentName.trim(),
            email: editParentEmail.trim(),
            mobile_number: editParentMobile.trim(),
            date_of_birth: editParentBirthdate,
            gender: editParentGender,
            address: editParentAddress.trim(),
            status: editParentStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Update parent error:", data);

        setEditParentError(
          data.message || "Failed to update the parent's information.",
        );

        return;
      }

      // ==========================================
      // REFRESH PARENT DATA
      // ==========================================

      await fetchParent();

      // ==========================================
      // CLOSE MODAL
      // ==========================================

      closeEditParent();

      alert("Parent information updated successfully.");
    } catch (err) {
      console.error("Error updating parent:", err);

      setEditParentError("Could not connect to the server. Please try again.");
    } finally {
      setEditingParentSaving(false);
    }
  };

  // ==========================================
  // CLOSE EDIT CHILD
  // ==========================================

  const closeEditChild = () => {
    if (editingChildSaving) return;

    setShowEditChild(false);
    setEditingChild(null);
    setEditChildError("");

    setEditChildName("");
    setEditBirthdate("");
    setEditSex("");
    setEditRelationship("");
    setEditAddress("");
    setEditStatus("Continuing");
  };

  // ==========================================
  // SAVE EDITED CHILD
  // ==========================================

  const handleEditChild = async () => {
    setEditChildError("");

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!editingChild?.child_id) {
      setEditChildError("Child ID is missing.");
      return;
    }

    if (!editChildName.trim()) {
      setEditChildError("Please enter the child's name.");
      return;
    }

    if (!editBirthdate) {
      setEditChildError("Please enter the child's birthdate.");
      return;
    }

    if (!editSex) {
      setEditChildError("Please select the child's gender.");
      return;
    }

    if (!editRelationship) {
      setEditChildError("Please select the relationship to the child.");
      return;
    }

    if (!editAddress.trim()) {
      setEditChildError("Please enter the child's address.");
      return;
    }

    if (!editStatus) {
      setEditChildError("Please select the child's status.");
      return;
    }

    try {
      setEditingChildSaving(true);

      const response = await fetch(
        `http://127.0.0.1:8000/api/children/${editingChild.child_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            child_name: editChildName.trim(),
            birthdate: editBirthdate,
            gender: editSex,
            address: editAddress.trim(),
            relationship: editRelationship,
            status: editStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Update child error:", data);

        setEditChildError(
          data.message || "Failed to update the child's information.",
        );

        return;
      }

      // ==========================================
      // REFRESH PARENT DATA
      // ==========================================

      await fetchParent();

      // ==========================================
      // CLOSE MODAL
      // ==========================================

      setShowEditChild(false);
      setEditingChild(null);

      setEditChildName("");
      setEditBirthdate("");
      setEditSex("");
      setEditRelationship("");
      setEditAddress("");
      setEditStatus("Continuing");
      setEditChildError("");

      alert("Child information updated successfully.");
    } catch (err) {
      console.error("Error updating child:", err);

      setEditChildError("Could not connect to the server. Please try again.");
    } finally {
      setEditingChildSaving(false);
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
            onClick={() => navigate(location.state?.from || "/user-management")}
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

  const children = Array.isArray(parent.children) ? parent.children : [];

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
          onClick={() => navigate(location.state?.from || "/user-management")}
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
          <div className="parent-profile-card-header">
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

            {hasPermission("edit_users") && (
              <button
                type="button"
                className="edit-parent-button"
                onClick={openEditParent}
              >
                <FiEdit2 />
                Edit
              </button>
            )}
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

              <p>Children registered under this parent or guardian.</p>
            </div>

            {/* ADD CHILD */}

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
                <div className="parent-child-card" key={child.child_id}>
                  <div className="parent-child-main">
                    <div className="parent-child-avatar">
                      {getInitials(child.child_name)}
                    </div>

                    <div className="parent-child-info">
                      <h3>{child.child_name || "Unnamed Child"}</h3>

                      <div className="parent-child-details">
                        <span>{calculateAge(child.birthdate)}</span>

                        <span>{child.gender || "—"}</span>

                        <span>{child.relationship || "—"}</span>
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

                    {/* EDIT + VIEW RECORD */}

                    <div className="parent-child-actions">
                      {hasPermission("edit_patients") && (
                        <button
                          type="button"
                          className="edit-child-button"
                          onClick={() => openEditChild(child)}
                        >
                          <FiEdit2 />
                          Edit
                        </button>
                      )}

                      {hasPermission("view_patients") && (
                        <button
                          type="button"
                          className="view-child-record-button"
                          onClick={() => handleViewRecord(child.child_id)}
                        >
                          <FiEye />
                          View Record
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="parent-children-empty">
              <FiUser />

              <h3>No registered children</h3>

              <p>No children have been registered under this parent yet.</p>

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

                <p>Register a new child under this parent.</p>
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

                <strong>{parent.user_fullname || "Unnamed Parent"}</strong>
              </div>
            </div>

            {/* ERROR */}

            {addChildError && (
              <div className="add-child-error">{addChildError}</div>
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
                  onChange={(e) => setRelationship(e.target.value)}
                  disabled={addingChild}
                >
                  <option value="">Select Relationship</option>

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
                  The parent's address is copied automatically, but you can edit
                  it if needed.
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

      {/* ==========================================
          EDIT CHILD MODAL
      ========================================== */}

      {showEditChild && hasPermission("edit_patients") && (
        <div className="add-child-modal-overlay">
          <div className="add-child-modal">
            {/* HEADER */}

            <div className="add-child-modal-header">
              <div>
                <h2>Edit Child</h2>

                <p>Update the child's information.</p>
              </div>

              <button
                type="button"
                className="add-child-modal-close"
                onClick={closeEditChild}
                disabled={editingChildSaving}
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

                <strong>{parent.user_fullname || "Unnamed Parent"}</strong>
              </div>
            </div>

            {/* EDIT ERROR */}

            {editChildError && (
              <div className="add-child-error">{editChildError}</div>
            )}

            {/* FORM */}

            <div className="add-child-form-grid">
              {/* CHILD NAME */}

              <div className="add-child-form-group full-width">
                <label>Child's Name</label>

                <input
                  type="text"
                  placeholder="Enter child's full name"
                  value={editChildName}
                  onChange={(e) => setEditChildName(e.target.value)}
                  disabled={editingChildSaving}
                />
              </div>

              {/* BIRTHDATE */}

              <div className="add-child-form-group">
                <label>Birthdate</label>

                <input
                  type="date"
                  value={editBirthdate}
                  onChange={(e) => setEditBirthdate(e.target.value)}
                  disabled={editingChildSaving}
                />
              </div>

              {/* CALCULATED AGE */}

              <div className="add-child-form-group">
                <label>Age</label>

                <div className="calculated-age-field">
                  {editBirthdate
                    ? calculateAge(editBirthdate)
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
                  value={editSex}
                  onChange={(e) => setEditSex(e.target.value)}
                  disabled={editingChildSaving}
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
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  disabled={editingChildSaving}
                >
                  <option value="">Select Relationship</option>

                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              {/* STATUS */}

              <div className="add-child-form-group">
                <label>Status</label>

                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  disabled={editingChildSaving}
                >
                  <option value="Continuing">Continuing</option>
                  <option value="Completed">Completed</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* ADDRESS */}

              <div className="add-child-form-group full-width">
                <label>Address</label>

                <input
                  type="text"
                  placeholder="Child's address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  disabled={editingChildSaving}
                />
              </div>
            </div>

            {/* FOOTER */}

            <div className="add-child-modal-footer">
              <button
                type="button"
                className="add-child-cancel-button"
                onClick={closeEditChild}
                disabled={editingChildSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="add-child-save-button"
                onClick={handleEditChild}
                disabled={editingChildSaving}
              >
                <FiSave />

                {editingChildSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==========================================
    EDIT PARENT MODAL
========================================== */}

      {showEditParent && hasPermission("edit_users") && (
        <div className="add-child-modal-overlay">
          <div className="add-child-modal">
            {/* HEADER */}

            <div className="add-child-modal-header">
              <div>
                <h2>Edit Parent</h2>

                <p>Update the parent's account information.</p>
              </div>

              <button
                type="button"
                className="add-child-modal-close"
                onClick={closeEditParent}
                disabled={editingParentSaving}
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

                <strong>{parent.user_fullname || "Unnamed Parent"}</strong>
              </div>
            </div>

            {/* ERROR */}

            {editParentError && (
              <div className="add-child-error">{editParentError}</div>
            )}

            {/* FORM */}

            <div className="add-child-form-grid">
              {/* FULL NAME */}

              <div className="add-child-form-group full-width">
                <label>Full Name</label>

                <input
                  type="text"
                  placeholder="Enter parent's full name"
                  value={editParentName}
                  onChange={(e) => setEditParentName(e.target.value)}
                  disabled={editingParentSaving}
                />
              </div>

              {/* EMAIL */}

              <div className="add-child-form-group">
                <label>Email</label>

                <input
                  type="email"
                  placeholder="Enter parent's email"
                  value={editParentEmail}
                  onChange={(e) => setEditParentEmail(e.target.value)}
                  disabled={editingParentSaving}
                />
                <small className="form-help-text">
                  Please enter a valid Gmail address.
                </small>
              </div>

              {/* MOBILE */}

              <div className="add-child-form-group">
                <label>Mobile Number</label>

                <input
                  type="text"
                  placeholder="Enter mobile number"
                  maxLength={11}
                  value={editParentMobile}
                  onChange={(e) => setEditParentMobile(e.target.value)}
                  disabled={editingParentSaving}
                />
              </div>

              {/* DATE OF BIRTH */}

              <div className="add-child-form-group">
                <label>Date of Birth</label>

                <input
                  type="date"
                  value={editParentBirthdate}
                  onChange={(e) => setEditParentBirthdate(e.target.value)}
                  disabled={editingParentSaving}
                />
              </div>

              {/* GENDER */}

              <div className="add-child-form-group">
                <label>Gender</label>

                <select
                  value={editParentGender}
                  onChange={(e) => setEditParentGender(e.target.value)}
                  disabled={editingParentSaving}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* STATUS */}

              <div className="add-child-form-group">
                <label>Status</label>
                <select
                  value={editParentStatus}
                  onChange={(e) => setEditParentStatus(e.target.value)}
                  disabled={editingParentSaving}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* ADDRESS */}

              <div className="add-child-form-group full-width">
                <label>Address</label>

                <input
                  type="text"
                  placeholder="Enter parent's address"
                  value={editParentAddress}
                  onChange={(e) => setEditParentAddress(e.target.value)}
                  disabled={editingParentSaving}
                />
              </div>
            </div>

            {/* FOOTER */}

            <div className="add-child-modal-footer">
              <button
                type="button"
                className="add-child-cancel-button"
                onClick={closeEditParent}
                disabled={editingParentSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="add-child-save-button"
                onClick={handleEditParent}
                disabled={editingParentSaving}
              >
                <FiSave />

                {editingParentSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentProfile;
