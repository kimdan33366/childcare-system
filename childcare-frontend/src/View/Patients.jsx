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
      isAdmin || permissions.includes("all") || permissions.includes(permission)
    );
  };

  // ==========================================
  // PATIENTS
  // ==========================================

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
  // CHECK NEWLY REGISTERED
  // ==========================================

  const isNewlyRegistered = (patient) => {
    const registrationDate =
      patient?.created_at ||
      patient?.registered_at ||
      patient?.registration_date;

    if (!registrationDate) {
      return false;
    }

    const registeredDate = new Date(registrationDate);

    if (Number.isNaN(registeredDate.getTime())) {
      return false;
    }

    const today = new Date();

    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    return registeredDate >= twoMonthsAgo && registeredDate <= today;
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const searchedPatients = patients.filter((patient) => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) {
      return true;
    }

    const parentName = patient.user?.user_fullname || patient.parent_name || "";

    return (
      patient.child_name?.toLowerCase().includes(searchValue) ||
      parentName.toLowerCase().includes(searchValue)
    );
  });

  // ==========================================
  // FILTER
  // ==========================================

  const filteredPatients = searchedPatients.filter((patient) => {
    if (statusFilter === "All") {
      return true;
    }

    return getPatientStatus(patient) === statusFilter;
  });

  // ==========================================
  // DEFAULT STATUS SORTING
  // Pending → Completed → Deactivated
  // ==========================================

  const statusOrder = {
    Pending: 1,
    Completed: 2,
    Deactivated: 3,
  };

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const statusA = getPatientStatus(a);
    const statusB = getPatientStatus(b);

    const orderDifference =
      (statusOrder[statusA] || 99) - (statusOrder[statusB] || 99);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    // Within the same status, newest children first.
    const dateA = new Date(
      a.created_at || a.registered_at || a.registration_date || 0,
    ).getTime();

    const dateB = new Date(
      b.created_at || b.registered_at || b.registration_date || 0,
    ).getTime();

    return dateB - dateA;
  });

  // ==========================================
  // SUMMARY CARD COUNTS
  // ==========================================

  const totalChildren = patients.length;

  const completedChildren = patients.filter(
    (patient) => getPatientStatus(patient) === "Completed",
  ).length;

  const pendingChildren = patients.filter(
    (patient) => getPatientStatus(patient) === "Pending",
  ).length;

  const newlyRegisteredChildren = patients.filter((patient) =>
    isNewlyRegistered(patient),
  ).length;

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
      const childResponse = await fetch("http://127.0.0.1:8000/api/children", {
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
      });

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
        created_at: childData.created_at || new Date().toISOString(),
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
      latestGrowth?.height_cm != null ? String(latestGrowth.height_cm) : "",
    );

    setWeight(
      latestGrowth?.weight_kg != null ? String(latestGrowth.weight_kg) : "",
    );

    setAddress(patient.address || "");

    setShowAddPatient(true);
  };

  // ==========================================
  // CHILD TABLE ROW
  // ==========================================

  const renderChildRow = (patient) => {
    const parentName =
      patient.user?.user_fullname || patient.parent_name || "—";

    const latestGrowth = getLatestGrowth(patient);

    const displayStatus = getPatientStatus(patient);

    return (
      <tr key={patient.child_id}>
        {/* CHILD */}
        <td>
          <div className="patient-table-child">
            <FaUserCircle />

            <strong>{patient.child_name || "—"}</strong>
          </div>
        </td>

        {/* PARENT / GUARDIAN */}
        <td>{parentName}</td>

        {/* AGE */}
        <td>{calculateAge(patient.birthdate)}</td>

        {/* BIRTHDATE */}
        <td>{patient.birthdate || "—"}</td>

        {/* GENDER */}
        <td>{patient.gender || "—"}</td>

        {/* ADDRESS */}
        <td className="patient-table-address">{patient.address || "—"}</td>

        {/* HEIGHT */}
        <td>
          {latestGrowth?.height_cm != null
            ? `${latestGrowth.height_cm} cm`
            : "—"}
        </td>

        {/* WEIGHT */}
        <td>
          {latestGrowth?.weight_kg != null
            ? `${latestGrowth.weight_kg} kg`
            : "—"}
        </td>

        {/* STATUS */}
        <td>
          <span
            className={`patient-status status-${displayStatus.toLowerCase()}`}
          >
            {displayStatus}
          </span>
        </td>

        {/* ACTIONS */}
        <td>
          <div className="patient-table-actions">
            {hasPermission("view_patients") && (
              <button
                type="button"
                className="patient-table-action view-action"
                title="View Child"
                onClick={() =>
                  navigate(`/patient_viewrecord/${patient.child_id}`)
                }
              >
                <FaEye />
              </button>
            )}

            {hasPermission("edit_patients") && (
              <button
                type="button"
                className="patient-table-action edit-action"
                title="Edit Child"
                onClick={() => openEditPatient(patient)}
              >
                <FaEdit />
              </button>
            )}

            {hasPermission("edit_patients") && (
              <button
                type="button"
                className={`patient-table-action ${
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
                <span>{patient.status === "Inactive" ? "✓" : "⏸"}</span>
              </button>
            )}
          </div>
        </td>
      </tr>
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

            <p>Manage registered children and their vaccination records.</p>
          </div>
        </div>

        {/* ==========================================
            SUMMARY CARDS
        ========================================== */}

        <div className="patients-summary-cards">
          <div className="patient-summary-card total-card">
            <div className="patient-summary-card-info">
              <span>Total Children</span>
              <strong>{totalChildren}</strong>
            </div>

            <div className="patient-summary-card-icon">
              <FaUserCircle />
            </div>
          </div>

          <div className="patient-summary-card completed-card">
            <div className="patient-summary-card-info">
              <span>Completed</span>
              <strong>{completedChildren}</strong>
            </div>

            <div className="patient-summary-card-icon">✓</div>
          </div>

          <div className="patient-summary-card pending-card">
            <div className="patient-summary-card-info">
              <span>Ongoing / Pending</span>
              <strong>{pendingChildren}</strong>
            </div>

            <div className="patient-summary-card-icon">⏳</div>
          </div>

          <div className="patient-summary-card new-card">
            <div className="patient-summary-card-info">
              <span>Newly Registered</span>
              <strong>{newlyRegisteredChildren}</strong>
            </div>

            <div className="patient-summary-card-icon">
              <FaPlus />
            </div>
          </div>
        </div>

        {/* ==========================================
            SEARCH + FILTER + ADD CHILD
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

          <div className="patients-filter">
            <label htmlFor="patient-status-filter">Filter</label>

            <select
              id="patient-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Deactivated">Deactivated</option>
            </select>
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
            CHILDREN TABLE
        ========================================== */}

        <div className="patients-table-section">
          <div className="patients-table-header">
            <div>
              <h3>Children</h3>

              <p>
                Children are automatically sorted by Pending, Completed, then
                Deactivated.
              </p>
            </div>

            <span className="patients-table-count">
              {sortedPatients.length}
            </span>
          </div>

          <div className="patients-table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Parent / Guardian</th>
                  <th>Age</th>
                  <th>Birthdate</th>
                  <th>Gender</th>
                  <th>Address</th>
                  <th>Height</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedPatients.length > 0 ? (
                  sortedPatients.map((patient) => renderChildRow(patient))
                ) : (
                  <tr>
                    <td colSpan="10" className="patients-table-empty">
                      <FaUserCircle />

                      <strong>No children found</strong>

                      <span>
                        {search
                          ? "No children match your search."
                          : statusFilter !== "All"
                            ? `No ${statusFilter.toLowerCase()} children found.`
                            : "No registered children found."}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ==========================================
          SMS MODAL
      ========================================== */}

      {showSMSModal && (
        <div className="patients-sms-overlay">
          <div className="patients-sms-modal">
            <h2>Send SMS</h2>

            <p>Child: {selectedPatient?.child_name || "Child's Name"}</p>

            <p>
              Parent: {selectedPatient?.user?.user_fullname || "Parent's Name"}
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
                The SMS reminder will be sent to all registered parents.
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
                    onChange={(e) => setPhoneNumber(e.target.value)}
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
            className={
              isEditingPatient
                ? "patients-edit-child-modal"
                : addPatientStep === 1
                  ? "patients-add-child-modal patients-add-child-step-one"
                  : "patients-add-child-modal patients-add-child-step-two"
            }
          >
            {/* ==========================================
                EDIT CHILD
            ========================================== */}

            {isEditingPatient ? (
              <>
                <div className="edit-child-header">
                  <span className="edit-child-step-number">✎</span>

                  <div>
                    <h2>Edit Child</h2>
                    <p>Update the child's information.</p>
                  </div>
                </div>

                <div className="edit-child-connected-user">
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

                <div className="edit-child-form">
                  {/* CHILD NAME */}
                  <div className="edit-child-field edit-child-field-full">
                    <label>Child's Name</label>

                    <input
                      className="edit-child-input"
                      type="text"
                      placeholder="Child's Name"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />
                  </div>

                  {/* BIRTHDATE */}
                  <div className="edit-child-field">
                    <label>Birthdate</label>

                    <input
                      className="edit-child-input"
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                    />
                  </div>

                  {/* GENDER */}
                  <div className="edit-child-field">
                    <label>Gender</label>

                    <select
                      className="edit-child-input edit-child-select"
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* CALCULATED AGE */}
                  {birthdate && (
                    <div className="edit-child-age">
                      <span>Calculated Age</span>

                      <strong>{calculateAge(birthdate)}</strong>
                    </div>
                  )}

                  {/* RELATIONSHIP */}
                  <div className="edit-child-field">
                    <label>Relationship to Child</label>

                    <select
                      className="edit-child-input edit-child-select"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    >
                      <option value="">Select Relationship</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>

                  {/* HEIGHT */}
                  <div className="edit-child-field">
                    <label>Height (cm)</label>

                    <input
                      className="edit-child-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 85.5"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>

                  {/* WEIGHT */}
                  <div className="edit-child-field">
                    <label>Weight (kg)</label>

                    <input
                      className="edit-child-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 12.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>

                  {/* ADDRESS */}
                  <div className="edit-child-field edit-child-field-full">
                    <label>Address</label>

                    <input
                      className="edit-child-input"
                      type="text"
                      placeholder="Child's Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="edit-child-buttons">
                  <button
                    type="button"
                    className="edit-child-cancel"
                    onClick={() => {
                      setShowAddPatient(false);
                      resetAddPatientForm();
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="edit-child-update"
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
                    <div className="patients-add-child-header">
                      <span className="patients-add-child-step-number">1</span>

                      <div>
                        <h2>Select Parent / Guardian</h2>

                        <p>
                          Select the registered parent or guardian for this
                          child.
                        </p>
                      </div>
                    </div>

                    <label className="patients-add-child-label">
                      Registered Parent / Guardian
                    </label>

                    <div className="patients-add-child-search">
                      <FaSearch />

                      <input
                        className="patient-form-input"
                        type="text"
                        placeholder="Search registered user..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>

                    <div className="patients-add-child-user-list">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.slice(0, 5).map((user) => {
                          const isSelected =
                            selectedUser &&
                            getUserId(selectedUser) === getUserId(user);

                          return (
                            <button
                              type="button"
                              key={getUserId(user)}
                              className={`patients-add-child-user-option ${
                                isSelected ? "selected" : ""
                              }`}
                              onClick={() => handleSelectUser(user)}
                            >
                              <FaUserCircle />

                              <div>
                                <strong>{getUserName(user)}</strong>

                                {getUserEmail(user) && (
                                  <small>{getUserEmail(user)}</small>
                                )}

                                {getUserPhone(user) && (
                                  <small>{getUserPhone(user)}</small>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="patients-add-child-no-users">
                          No registered users found.
                        </div>
                      )}
                    </div>

                    {selectedUser && (
                      <div className="patients-add-child-selected-user">
                        <span>Selected Parent / Guardian</span>

                        <strong>{getUserName(selectedUser)}</strong>
                      </div>
                    )}

                    <div className="patients-add-child-buttons">
                      <button
                        type="button"
                        className="patients-add-child-cancel"
                        onClick={() => {
                          setShowAddPatient(false);
                          resetAddPatientForm();
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="patients-add-child-next"
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
                    <div className="patients-add-child-header">
                      <span className="patients-add-child-step-number">2</span>

                      <div>
                        <h2>Child Information</h2>

                        <p>Complete the information for the child.</p>
                      </div>
                    </div>

                    <div className="patients-add-child-connected-user">
                      <FaUserCircle />

                      <div>
                        <small>Parent / Guardian</small>

                        <strong>{getUserName(selectedUser)}</strong>
                      </div>
                    </div>

                    <div className="patients-add-child-form">
                      <div className="patients-add-child-field full-width">
                        <label>Child's Name</label>

                        <input
                          type="text"
                          placeholder="Enter child's full name"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                        />
                      </div>

                      <div className="patients-add-child-field">
                        <label>Birthdate</label>

                        <input
                          type="date"
                          value={birthdate}
                          onChange={(e) => setBirthdate(e.target.value)}
                        />
                      </div>

                      <div className="patients-add-child-field">
                        <label>Gender</label>

                        <select
                          value={sex}
                          onChange={(e) => setSex(e.target.value)}
                        >
                          <option value="">Select Gender</option>

                          <option value="Male">Male</option>

                          <option value="Female">Female</option>
                        </select>
                      </div>

                      {birthdate && (
                        <div className="patients-add-child-age">
                          <span>Calculated Age</span>

                          <strong>{calculateAge(birthdate)}</strong>
                        </div>
                      )}

                      <div className="patients-add-child-field">
                        <label>Relationship to Child</label>

                        <select
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                        >
                          <option value="">Select Relationship</option>

                          <option value="Mother">Mother</option>

                          <option value="Father">Father</option>

                          <option value="Guardian">Guardian</option>
                        </select>
                      </div>

                      <div className="patients-add-child-field">
                        <label>Height (cm)</label>

                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 85.5"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                        />
                      </div>

                      <div className="patients-add-child-field">
                        <label>Weight (kg)</label>

                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 12.5"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                        />
                      </div>

                      <div className="patients-add-child-field full-width">
                        <label>Address</label>

                        <input
                          type="text"
                          placeholder="Enter child's address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="patients-add-child-buttons">
                      <button
                        type="button"
                        className="patients-add-child-back"
                        onClick={() => {
                          setAddPatientStep(1);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        className="patients-add-child-save"
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
