import "../css/Patients.css";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaPlus,
  FaPaperPlane,
  FaEye,
  FaUserCircle,
  FaPhoneAlt,
  FaEdit,
  FaTimes,
} from "react-icons/fa";

import Sidebar from "../View/Sidebar";

import { defaultSMSMessage } from "../Model/PatientModel";

function Patients() {
  const navigate = useNavigate();

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
  // PATIENTS
  // ==========================================

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  // Deactivated popup
  const [showInactivePatients, setShowInactivePatients] = useState(false);

  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  // ==========================================
  // ADD CHILD STEPS
  // ==========================================

  const [addPatientStep, setAddPatientStep] = useState(1);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  // ==========================================
  // CHILD FORM
  // ==========================================

  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState("");
  const [relationship, setRelationship] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);

  // ==========================================
  // SMS
  // ==========================================

  const [showSMSModal, setShowSMSModal] = useState(false);
  const [sendToAll, setSendToAll] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState(defaultSMSMessage);

  // ==========================================
  // ACCESS CHECK
  // ==========================================

  if (!isAdmin && !permissions.includes("view_patients")) {
    return <div>Access Denied</div>;
  }

  // ==========================================
  // CALCULATE AGE
  // ==========================================

  const calculateAge = (birthdate) => {
    if (!birthdate) return "—";

    const birth = new Date(birthdate);
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
  // GET LATEST GROWTH RECORD
  // ==========================================

  const getLatestGrowth = (patient) => {
    const records = patient?.growthRecords || [];

    if (!records.length) {
      return null;
    }

    return [...records].sort((a, b) => {
      if (
        a.growth_id != null &&
        b.growth_id != null &&
        b.growth_id !== a.growth_id
      ) {
        return Number(b.growth_id) - Number(a.growth_id);
      }

      const dateDifference =
        new Date(b.date).getTime() - new Date(a.date).getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    })[0];
  };

  // ==========================================
  // CHILD STATUS
  // ==========================================

  // Backend:
  // Continuing = Pending in UI
  // Completed = Completed
  // Inactive = Deactivated in UI

  const getPatientStatus = (patient) => {
    const status = patient?.status || "Continuing";

    if (status === "Continuing") {
      return "Pending";
    }

    if (status === "Inactive") {
      return "Deactivated";
    }

    return status;
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredPatients = patients.filter((patient) => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) {
      return true;
    }

    const parentName =
      patient.user?.user_fullname || patient.parent_name || "";

    return (
      patient.child_name?.toLowerCase().includes(searchValue) ||
      parentName.toLowerCase().includes(searchValue)
    );
  });

  // ==========================================
  // STATUS GROUPS
  // ==========================================

  const pendingPatients = filteredPatients.filter((patient) => {
    return (
      patient.status === "Continuing" ||
      patient.status === "Pending" ||
      !patient.status
    );
  });

  const completedPatients = filteredPatients.filter((patient) => {
    return patient.status === "Completed";
  });

  const inactivePatients = filteredPatients.filter((patient) => {
    return patient.status === "Inactive";
  });

  // ==========================================
  // GET USERS
  // ==========================================

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/users")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched users:", data);

        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers(data.users || []);
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

  // ==========================================
  // GET CHILDREN
  // ==========================================

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/children")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched children:", data);

        if (Array.isArray(data)) {
          const normalizedChildren = data.map((child) => ({
            ...child,
            growthRecords: child.growth_records || [],
          }));

          setPatients(normalizedChildren);
        } else {
          setPatients([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching children:", error);
      });
  }, []);

  // ==========================================
  // USER DISPLAY HELPERS
  // ==========================================

  const getUserId = (user) => {
    return user?.user_id;
  };

  const getUserName = (user) => {
    return user?.user_fullname || "Unnamed User";
  };

  const getUserEmail = (user) => {
    return user?.email || "";
  };

  const getUserPhone = (user) => {
    return user?.mobile_number || user?.phone || "";
  };

  const getUserAddress = (user) => {
    return user?.address || "";
  };

  const filteredUsers = users.filter((user) => {
    const value = userSearch.toLowerCase();

    return (
      getUserName(user).toLowerCase().includes(value) ||
      getUserEmail(user).toLowerCase().includes(value) ||
      getUserPhone(user).toLowerCase().includes(value)
    );
  });

  // ==========================================
  // RESET ADD CHILD FORM
  // ==========================================

  const resetAddPatientForm = () => {
    setAddPatientStep(1);

    setUserSearch("");
    setSelectedUser(null);

    setChildName("");
    setBirthdate("");
    setSex("");
    setRelationship("");
    setHeight("");
    setWeight("");
    setAddress("");

    setSelectedPatient(null);
    setIsEditingPatient(false);
  };

  // ==========================================
  // OPEN ADD CHILD
  // ==========================================

  const openAddPatient = () => {
    resetAddPatientForm();
    setShowAddPatient(true);
  };

  // ==========================================
  // SELECT PARENT
  // ==========================================

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setAddress(getUserAddress(user));
  };

  // ==========================================
  // STEP 1 → STEP 2
  // ==========================================

  const handleNextToChildInformation = () => {
    if (!selectedUser) {
      alert("Please select a registered parent or guardian.");
      return;
    }

    setAddress(getUserAddress(selectedUser));
    setAddPatientStep(2);
  };

  // ==========================================
  // CREATE CHILD
  // ==========================================

  const handleCompleteAddPatient = async () => {
    if (!selectedUser) {
      alert("Please select a parent or guardian.");
      return;
    }

    if (!childName.trim()) {
      alert("Please enter the child's name.");
      return;
    }

    if (!birthdate) {
      alert("Please enter the child's birthdate.");
      return;
    }

    if (!sex) {
      alert("Please select the child's gender.");
      return;
    }

    if (!relationship) {
      alert("Please select the relationship to the child.");
      return;
    }

    if (!height || Number(height) <= 0) {
      alert("Please enter the child's height.");
      return;
    }

    if (!weight || Number(weight) <= 0) {
      alert("Please enter the child's weight.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter the child's address.");
      return;
    }

    try {
      const childResponse = await fetch(
        "http://127.0.0.1:8000/api/children",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_id: getUserId(selectedUser),
            child_name: childName,
            birthdate: birthdate,
            gender: sex,
            address: address,
            relationship: relationship,
            status: "Continuing",
          }),
        },
      );

      const childData = await childResponse.json();

      if (!childResponse.ok) {
        console.error("Create child error:", childData);

        alert(
          childData.message ||
            "Failed to create the child. Please check the server.",
        );

        return;
      }

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
            child_id: childData.child_id,
            date: new Date().toISOString().split("T")[0],
            weight_kg: Number(weight),
            height_cm: Number(height),
          }),
        },
      );

      const growthData = await growthResponse.json();

      if (!growthResponse.ok) {
        console.error("Create growth record error:", growthData);

        alert(
          "The child was created, but the height and weight could not be saved.",
        );

        return;
      }

      const newChild = {
        ...childData,
        user: selectedUser,
        growthRecords: [
          growthData.growth_record || {
            date: new Date().toISOString().split("T")[0],
            weight_kg: Number(weight),
            height_cm: Number(height),
          },
        ],
      };

      setPatients((prevPatients) => [...prevPatients, newChild]);

      alert("Child added successfully!");

      setShowAddPatient(false);
      resetAddPatientForm();
    } catch (error) {
      console.error("Error creating child:", error);
      alert("Could not connect to the server.");
    }
  };

  // ==========================================
  // EDIT CHILD
  // ==========================================

  const handleEditPatient = async () => {
    if (!selectedPatient) return;

    if (!childName.trim()) {
      alert("Please enter the child's name.");
      return;
    }

    if (!birthdate) {
      alert("Please enter the child's birthdate.");
      return;
    }

    if (!sex) {
      alert("Please select the child's gender.");
      return;
    }

    if (!relationship) {
      alert("Please select the relationship to the child.");
      return;
    }

    if (!height || Number(height) <= 0) {
      alert("Please enter the child's height.");
      return;
    }

    if (!weight || Number(weight) <= 0) {
      alert("Please enter the child's weight.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter the child's address.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/children/${selectedPatient.child_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_id: selectedPatient.user_id,
            child_name: childName,
            birthdate: birthdate,
            gender: sex,
            address: address,
            relationship: relationship,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Update child error:", data);

        alert(data.message || "Failed to update the child.");

        return;
      }

      // ==========================================
      // CREATE NEW GROWTH RECORD
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
            child_id: selectedPatient.child_id,
            date: new Date().toISOString().split("T")[0],
            weight_kg: Number(weight),
            height_cm: Number(height),
          }),
        },
      );

      const growthData = await growthResponse.json();

      if (!growthResponse.ok) {
        console.error("Update growth record error:", growthData);

        alert(
          "The child information was updated, but the new height and weight could not be saved.",
        );

        return;
      }

      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient.child_id === data.child_id
            ? {
                ...patient,
                ...data,
                user: patient.user,
                growthRecords: [
                  ...(patient.growthRecords || []),
                  growthData.growth_record,
                ],
              }
            : patient,
        ),
      );

      alert("Child updated successfully!");

      setShowAddPatient(false);
      resetAddPatientForm();
    } catch (error) {
      console.error("Error updating child:", error);
      alert("Could not connect to the server.");
    }
  };

  // ==========================================
  // DEACTIVATE / REACTIVATE CHILD
  // ==========================================

  const handleToggleChildStatus = async (patient) => {
    const isInactive = patient.status === "Inactive";

    const confirmed = window.confirm(
      isInactive
        ? `Are you sure you want to reactivate ${patient.child_name}?`
        : `Are you sure you want to deactivate ${patient.child_name}?`,
    );

    if (!confirmed) return;

    const newStatus = isInactive ? "Continuing" : "Inactive";

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/children/${patient.child_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Status update error:", data);

        alert(data.message || "Failed to update the child's status.");

        return;
      }

      setPatients((prevPatients) =>
        prevPatients.map((item) =>
          item.child_id === patient.child_id
            ? {
                ...item,
                ...data,
              }
            : item,
        ),
      );

      alert(
        isInactive
          ? "Child reactivated successfully!"
          : "Child deactivated successfully!",
      );
    } catch (error) {
      console.error("Error updating child status:", error);
      alert("Could not connect to the server.");
    }
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const openEditPatient = (patient) => {
    setSelectedPatient(patient);
    setIsEditingPatient(true);

    setChildName(patient.child_name || "");
    setBirthdate(patient.birthdate || "");
    setSex(patient.gender || "");
    setRelationship(patient.relationship || "");

    const latestGrowth = getLatestGrowth(patient);

    setHeight(
      latestGrowth?.height_cm != null
        ? String(latestGrowth.height_cm)
        : "",
    );

    setWeight(
      latestGrowth?.weight_kg != null
        ? String(latestGrowth.weight_kg)
        : "",
    );

    setAddress(patient.address || "");

    setShowAddPatient(true);
  };

  // ==========================================
  // CHILD CARD
  // ==========================================

  const renderChildCard = (patient) => {
    const parentName =
      patient.user?.user_fullname || patient.parent_name || "—";

    const parentPhone =
      patient.user?.mobile_number ||
      patient.user?.phone ||
      "—";

    const latestGrowth = getLatestGrowth(patient);

    const displayStatus = getPatientStatus(patient);

    return (
      <div className="patient-child-card" key={patient.child_id}>
        {/* MAIN CHILD INFORMATION */}
        <div className="patient-child-main">
          <div className="patient-child-avatar">
            <FaUserCircle />
          </div>

          <div className="patient-child-basic">
            <strong>{patient.child_name}</strong>

            <span>{parentName}</span>

            <span>{calculateAge(patient.birthdate)}</span>

            <span
              className={`patient-status status-${displayStatus.toLowerCase()}`}
            >
              {displayStatus}
            </span>
          </div>
        </div>

        {/* HOVER DETAILS */}
        <div className="patient-child-hover-details">
          <div className="patient-detail-row">
            <span>Birthdate</span>
            <strong>{patient.birthdate || "—"}</strong>
          </div>

          <div className="patient-detail-row">
            <span>Gender</span>
            <strong>{patient.gender || "—"}</strong>
          </div>

          <div className="patient-detail-row">
            <span>Relationship</span>
            <strong>{patient.relationship || "—"}</strong>
          </div>

          <div className="patient-detail-row">
            <span>Address</span>
            <strong>{patient.address || "—"}</strong>
          </div>

          <div className="patient-detail-row">
            <span>Parent Contact</span>
            <strong>{parentPhone}</strong>
          </div>

          <div className="patient-detail-row">
            <span>Height</span>
            <strong>
              {latestGrowth?.height_cm != null
                ? `${latestGrowth.height_cm} cm`
                : "—"}
            </strong>
          </div>

          <div className="patient-detail-row">
            <span>Weight</span>
            <strong>
              {latestGrowth?.weight_kg != null
                ? `${latestGrowth.weight_kg} kg`
                : "—"}
            </strong>
          </div>

          {/* ACTIONS */}
          <div className="patient-card-actions">
            {hasPermission("view_patients") && (
              <button
                type="button"
                className="patient-card-action view-action"
                title="View Child"
                onClick={() =>
                  navigate(`/patient_viewrecord/${patient.child_id}`)
                }
              >
                <FaEye />
                <span>View</span>
              </button>
            )}

            {hasPermission("edit_patients") && (
              <button
                type="button"
                className="patient-card-action edit-action"
                title="Edit Child"
                onClick={() => openEditPatient(patient)}
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            )}

            {hasPermission("edit_patients") && (
              <button
                type="button"
                className={`patient-card-action ${
                  patient.status === "Inactive"
                    ? "reactivate-action"
                    : "deactivate-action"
                }`}
                title={
                  patient.status === "Inactive"
                    ? "Reactivate Child"
                    : "Deactivate Child"
                }
                onClick={() => handleToggleChildStatus(patient)}
              >
                <span>
                  {patient.status === "Inactive" ? "✓" : "⏸"}
                </span>

                <span>
                  {patient.status === "Inactive"
                    ? "Reactivate"
                    : "Deactivate"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // STATUS PANEL
  // ==========================================

  const renderStatusPanel = (
    title,
    description,
    patientsList,
    statusClass,
    emptyText,
  ) => {
    return (
      <section className={`patient-status-panel ${statusClass}`}>
        <div className="patient-status-panel-header">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>

          <span className="patient-status-count">
            {patientsList.length}
          </span>
        </div>

        <div className="patient-status-panel-list">
          {patientsList.length > 0 ? (
            patientsList.map((patient) => renderChildCard(patient))
          ) : (
            <div className="patient-panel-empty">
              <FaUserCircle />

              <strong>{emptyText}</strong>

              <span>
                {title === "Pending"
                  ? "No children are currently pending."
                  : "No children have completed vaccination yet."}
              </span>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="patients-dashboard">
      <Sidebar />

      <main className="patients-content">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="patients-header">
          <div>
            <h2>Children</h2>

            <p>
              Manage registered children and their vaccination records.
            </p>
          </div>

          {hasPermission("add_patients") && (
            <button
              type="button"
              className="patients-add-btn"
              onClick={openAddPatient}
            >
              <FaPlus />
              Add Child
            </button>
          )}
        </div>

        {/* ==========================================
            SEARCH + DEACTIVATED
        ========================================== */}

        <div className="patients-search-section">
          <div className="patients-search-bar">
            <FaSearch />

            <input
              type="text"
              placeholder="Search child or parent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="patients-deactivated-btn"
            onClick={() => setShowInactivePatients(true)}
          >
            <span>Deactivated</span>

            <span className="patients-deactivated-count">
              {inactivePatients.length}
            </span>
          </button>
        </div>

        {/* ==========================================
            MAIN STATUS BOARD
            PENDING + COMPLETED SHARE THE SPACE
        ========================================== */}

        <div className="patients-status-board">
          {renderStatusPanel(
            "Pending",
            "Children currently undergoing vaccination.",
            pendingPatients,
            "pending-panel",
            "No pending children",
          )}

          {renderStatusPanel(
            "Completed",
            "Children who completed vaccination.",
            completedPatients,
            "completed-panel",
            "No completed children",
          )}
        </div>
      </main>

      {/* ==========================================
          DEACTIVATED POPUP
      ========================================== */}

      {showInactivePatients && (
        <div
          className="patients-deactivated-overlay"
          onClick={() => setShowInactivePatients(false)}
        >
          <div
            className="patients-deactivated-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="patients-deactivated-header">
              <div>
                <h2>Deactivated Children</h2>

                <p>
                  Children are kept here for historical records.
                </p>
              </div>

              <button
                type="button"
                className="patients-deactivated-close"
                onClick={() => setShowInactivePatients(false)}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="patients-deactivated-search">
              <FaSearch />

              <input
                type="text"
                value={search}
                readOnly
                placeholder="Search child or parent..."
              />
            </div>

            <div className="patients-deactivated-list">
              {inactivePatients.length > 0 ? (
                inactivePatients.map((patient) =>
                  renderChildCard(patient),
                )
              ) : (
                <div className="patient-panel-empty">
                  <FaUserCircle />

                  <strong>No deactivated children</strong>

                  <span>
                    Deactivated children will appear here.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SMS MODAL
      ========================================== */}

      {showSMSModal && (
        <div className="patients-sms-overlay">
          <div className="patients-sms-modal">
            <h2>Send SMS</h2>

            <p>
              Child: {selectedPatient?.child_name || "Child's Name"}
            </p>

            <p>
              Parent:{" "}
              {selectedPatient?.user?.user_fullname ||
                "Parent's Name"}
            </p>

            <div className="patients-send-all-container">
              <input
                type="checkbox"
                checked={sendToAll}
                onChange={() => setSendToAll(!sendToAll)}
              />

              <label>Send SMS to All Parents</label>
            </div>

            {sendToAll && (
              <div className="patients-broadcast-message">
                The SMS reminder will be sent to all registered
                parents.
              </div>
            )}

            {!sendToAll && (
              <>
                <label>To:</label>

                <div className="patients-phone-container">
                  <FaPhoneAlt />

                  <input
                    type="text"
                    placeholder="+63 XXX XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value)
                    }
                  />
                </div>
              </>
            )}

            <label>Message:</label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="patients-sms-buttons">
              <button
                className="patients-cancel-btn"
                onClick={() => setShowSMSModal(false)}
              >
                Cancel
              </button>

              <button
                className="patients-send-btn"
                onClick={() => {
                  console.log(
                    sendToAll
                      ? "Sending SMS to all parents..."
                      : "Sending SMS to one parent...",
                  );

                  setShowSMSModal(false);

                  alert("Message sent!");
                }}
              >
                <FaPaperPlane />
                Send SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD / EDIT CHILD
      ========================================== */}

      {showAddPatient && (
        <div className="patients-add-overlay">
          <div
            className={`patients-add-modal ${
              isEditingPatient
                ? "patient-edit-modal"
                : addPatientStep === 1
                  ? "patient-step-one-modal"
                  : "patient-step-two-modal"
            }`}
          >
            {/* ==========================================
                EDIT CHILD
            ========================================== */}

            {isEditingPatient ? (
              <>
                <div className="patient-step-header">
                  <span className="patient-step-number">✎</span>

                  <div>
                    <h2>Edit Child</h2>

                    <p>Update the child's information.</p>
                  </div>
                </div>

                <div className="patient-connected-user">
                  <FaUserCircle />

                  <div>
                    <small>Parent / Guardian</small>

                    <strong>
                      {selectedPatient?.user?.user_fullname ||
                        selectedPatient?.parent_name ||
                        "—"}
                    </strong>
                  </div>
                </div>

                <label className="patient-form-label">
                  Child's Name
                </label>

                <input
                  type="text"
                  placeholder="Child's Name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />

                <label className="patient-form-label">
                  Birthdate
                </label>

                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />

                {birthdate && (
                  <div className="patient-selected-user">
                    <span>Calculated Age</span>

                    <strong>{calculateAge(birthdate)}</strong>
                  </div>
                )}

                <label className="patient-form-label">
                  Gender
                </label>

                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

                <label className="patient-form-label">
                  Relationship to Child
                </label>

                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                >
                  <option value="">Select Relationship</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                </select>

                <label className="patient-form-label">
                  Height (cm)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 85.5"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />

                <label className="patient-form-label">
                  Weight (kg)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 12.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />

                <label className="patient-form-label">
                  Address
                </label>

                <input
                  type="text"
                  placeholder="Child's Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <div className="patients-add-buttons">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPatient(false);
                      resetAddPatientForm();
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleEditPatient}
                  >
                    Update Child
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ==========================================
                    STEP 1 — SELECT PARENT
                ========================================== */}

                {addPatientStep === 1 && (
                  <>
                    <div className="patient-step-header">
                      <span className="patient-step-number">1</span>

                      <div>
                        <h2>Select Parent / Guardian</h2>

                        <p>
                          Select the registered parent or guardian
                          for this child.
                        </p>
                      </div>
                    </div>

                    <label className="patient-form-label">
                      Registered Parent / Guardian
                    </label>

                    <div className="patient-user-search">
                      <FaSearch />

                      <input
                        type="text"
                        placeholder="Search registered user..."
                        value={userSearch}
                        onChange={(e) =>
                          setUserSearch(e.target.value)
                        }
                      />
                    </div>

                    <div className="patient-user-list">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.slice(0, 5).map((user) => {
                          const isSelected =
                            selectedUser &&
                            getUserId(selectedUser) ===
                              getUserId(user);

                          return (
                            <button
                              type="button"
                              key={getUserId(user)}
                              className={`patient-user-option ${
                                isSelected ? "selected" : ""
                              }`}
                              onClick={() =>
                                handleSelectUser(user)
                              }
                            >
                              <FaUserCircle />

                              <div>
                                <strong>
                                  {getUserName(user)}
                                </strong>

                                {getUserEmail(user) && (
                                  <small>
                                    {getUserEmail(user)}
                                  </small>
                                )}

                                {getUserPhone(user) && (
                                  <small>
                                    {getUserPhone(user)}
                                  </small>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="patient-no-users">
                          No registered users found.
                        </div>
                      )}
                    </div>

                    {selectedUser && (
                      <div className="patient-selected-user">
                        <span>Selected Parent / Guardian</span>

                        <strong>
                          {getUserName(selectedUser)}
                        </strong>
                      </div>
                    )}

                    <div className="patients-add-buttons">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPatient(false);
                          resetAddPatientForm();
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="patient-next-btn"
                        onClick={handleNextToChildInformation}
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}

                {/* ==========================================
                    STEP 2 — CHILD INFORMATION
                ========================================== */}

                {addPatientStep === 2 && (
                  <>
                    <div className="patient-step-header">
                      <span className="patient-step-number">2</span>

                      <div>
                        <h2>Child Information</h2>

                        <p>
                          Complete the information for the child.
                        </p>
                      </div>
                    </div>

                    <div className="patient-connected-user">
                      <FaUserCircle />

                      <div>
                        <small>Parent / Guardian</small>

                        <strong>
                          {getUserName(selectedUser)}
                        </strong>
                      </div>
                    </div>

                    <label className="patient-form-label">
                      Child's Name
                    </label>

                    <input
                      type="text"
                      placeholder="Child's Name"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />

                    <label className="patient-form-label">
                      Birthdate
                    </label>

                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                    />

                    {birthdate && (
                      <div className="patient-selected-user">
                        <span>Calculated Age</span>

                        <strong>
                          {calculateAge(birthdate)}
                        </strong>
                      </div>
                    )}

                    <label className="patient-form-label">
                      Gender
                    </label>

                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>

                    <label className="patient-form-label">
                      Relationship to Child
                    </label>

                    <select
                      value={relationship}
                      onChange={(e) =>
                        setRelationship(e.target.value)
                      }
                    >
                      <option value="">Select Relationship</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                    </select>

                    <label className="patient-form-label">
                      Height (cm)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 85.5"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />

                    <label className="patient-form-label">
                      Weight (kg)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 12.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />

                    <label className="patient-form-label">
                      Address
                    </label>

                    <input
                      type="text"
                      placeholder="Child's Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />

                    <div className="patients-add-buttons">
                      <button
                        type="button"
                        onClick={() => {
                          setAddPatientStep(1);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={handleCompleteAddPatient}
                      >
                        Save Child
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;