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
  FaTrash,
  FaChevronDown,
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

  if (!isAdmin && !permissions.includes("view_patients")) {
    return <div>Access Denied</div>;
  }

  const [patients, setPatients] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  // ==========================================
  // ADD PATIENT STEP
  // ==========================================

  const [addPatientStep, setAddPatientStep] = useState(1);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState("");

  const [createdChildId, setCreatedChildId] = useState(null);

  // ==========================================
  // PATIENT FORM
  // ==========================================

  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherName, setFatherName] = useState("");
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
  // PATIENT STATUS
  // ==========================================

  const getPatientStatus = (patient) => {
    const records = patient.patient_records || [];

    if (records.length === 0) {
      return "Not Started";
    }

    if (records.some((record) => record.status === "Missed")) {
      return "Missed";
    }

    if (records.some((record) => record.status === "Continuing")) {
      return "Continuing";
    }

    if (records.every((record) => record.status === "Completed")) {
      return "Completed";
    }

    return "Continuing";
  };

  // ==========================================
  // FILTER PATIENTS
  // ==========================================

  const filteredPatients = patients.filter((patient) => {
    const searchValue = search.toLowerCase();

    const parentNames = [patient.mother_name, patient.father_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      patient.child_name?.toLowerCase().includes(searchValue) ||
      parentNames.includes(searchValue);

    const patientStatus = getPatientStatus(patient);

    const matchesStatus =
      statusFilter === "All" || patientStatus === statusFilter;

    return matchesSearch && matchesStatus;
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
  // GET PATIENTS
  // ==========================================

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/children")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched patients:", data);
        setPatients(data);
      })
      .catch((error) => {
        console.error("Error fetching patients:", error);
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
    return user?.phone || "";
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
  // RESET ADD PATIENT FORM
  // ==========================================

  const resetAddPatientForm = () => {
    setAddPatientStep(1);

    setUserSearch("");
    setSelectedUser(null);
    setSelectedRelationship("");

    setCreatedChildId(null);

    setChildName("");
    setAge("");
    setBirthdate("");
    setSex("");
    setMotherName("");
    setFatherName("");
    setAddress("");

    setSelectedPatient(null);
    setIsEditingPatient(false);
  };

  // ==========================================
  // OPEN ADD PATIENT
  // ==========================================

  const openAddPatient = () => {
    resetAddPatientForm();
    setShowAddPatient(true);
  };

  // ==========================================
  // STEP 1 → CREATE CHILD
  // ==========================================

  const handleNextToChildInformation = async () => {
    if (!selectedUser) {
      alert("Please select a registered user first.");
      return;
    }

    if (!selectedRelationship) {
      alert("Please select whether this user is the Mother or Father.");
      return;
    }

    const userId = getUserId(selectedUser);
    const userName = getUserName(selectedUser);

    if (!userId) {
      alert("The selected user does not have a valid user ID.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_id: userId,

          child_name: null,
          age_months: null,
          birthdate: null,
          gender: null,

          mother_name: selectedRelationship === "Mother" ? userName : null,

          father_name: selectedRelationship === "Father" ? userName : null,

          address: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Create child error:", data);
        alert(
          data.message ||
            "Failed to create the child record. Please check the server.",
        );
        return;
      }

      console.log("Child created:", data);

      setCreatedChildId(data.child_id);

      if (selectedRelationship === "Mother") {
        setMotherName(userName);
        setFatherName("");
      } else {
        setMotherName("");
        setFatherName(userName);
      }

      setChildName("");
      setAge("");
      setBirthdate("");
      setSex("");
      setAddress("");

      setAddPatientStep(2);
    } catch (error) {
      console.error("Error creating child:", error);
      alert("Could not connect to the server.");
    }
  };

  // ==========================================
  // STEP 2 → COMPLETE PATIENT
  // ==========================================

  const handleCompleteAddPatient = async () => {
    if (!createdChildId) {
      alert("No child record was created.");
      return;
    }

    if (!childName.trim()) {
      alert("Please enter the child's name.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/children/${createdChildId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_id: getUserId(selectedUser),
            child_name: childName,
            age_months: age,
            birthdate: birthdate,
            gender: sex,
            mother_name: motherName,
            father_name: fatherName,
            address: address,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Complete patient error:", data);
        alert(data.message || "Failed to complete patient.");
        return;
      }

      setPatients((prevPatients) => [...prevPatients, data]);

      alert("Patient added successfully!");

      setShowAddPatient(false);
      resetAddPatientForm();
    } catch (error) {
      console.error("Error completing patient:", error);
      alert("Could not connect to the server.");
    }
  };

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  const handleEditPatient = async () => {
    if (!selectedPatient) return;

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
            age_months: age,
            birthdate: birthdate,
            gender: sex,
            mother_name: motherName,
            father_name: fatherName,
            address: address,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert("Failed to update patient.");
        return;
      }

      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient.child_id === data.child_id ? data : patient,
        ),
      );

      alert("Patient updated successfully!");

      setShowAddPatient(false);
      resetAddPatientForm();
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="patients-dashboard">
      <Sidebar />

      <main className="patients-content">
        <div className="patients-header">
          <div>
            <h2>Children</h2>
            <p>Manage registered children and vaccination records.</p>
          </div>

          {hasPermission("add_patients") && (
            <button className="patients-add-btn" onClick={openAddPatient}>
              <FaPlus />
              Add Child
            </button>
          )}
        </div>

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

          <div className="patients-status-filter">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Not Started">Not Started</option>
              <option value="Continuing">Continuing</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
            </select>

            <FaChevronDown />
          </div>
        </div>

        <div className="patient-list">
          <div className="patient-list-header">
            <h3>Registered Child</h3>

            <span>
              {filteredPatients.length}
              {filteredPatients.length === 1 ? " Patient" : " Patients"}
            </span>
          </div>

          {filteredPatients.length > 0 ? (
            <div className="patients-table-wrapper">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Child</th>
                    <th>Parent / Guardian</th>
                    <th>Age</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.child_id}>
                      <td>
                        <div className="patient-child-info">
                          <FaUserCircle />
                          <span>{patient.child_name}</span>
                        </div>
                      </td>

                      <td>
                        <span className="patient-parent">
                          {patient.mother_name && patient.father_name
                            ? `${patient.mother_name} / ${patient.father_name}`
                            : patient.mother_name || patient.father_name || "—"}
                        </span>
                      </td>

                      <td>
                        {patient.age_months
                          ? `${patient.age_months} months`
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`patient-status status-${getPatientStatus(
                            patient,
                          )
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {getPatientStatus(patient)}
                        </span>
                      </td>

                      <td>
                        <div className="patient-actions">
                          {hasPermission("view_patients") && (
                            <FaEye
                              className="view-action"
                              title="View Record"
                              onClick={() =>
                                navigate(
                                  `/patient_viewrecord/${patient.child_id}`,
                                )
                              }
                            />
                          )}

                          {hasPermission("edit_patients") && (
                            <FaEdit
                              className="edit-action"
                              title="Edit Patient"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsEditingPatient(true);

                                setChildName(patient.child_name || "");
                                setAge(patient.age_months || "");
                                setBirthdate(patient.birthdate || "");
                                setSex(patient.gender || "");
                                setMotherName(patient.mother_name || "");
                                setFatherName(patient.father_name || "");
                                setAddress(patient.address || "");

                                setShowAddPatient(true);
                              }}
                            />
                          )}

                          {hasPermission("delete_patients") && (
                            <FaTrash
                              className="delete-action"
                              title="Delete Patient"
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Are you sure you want to delete ${patient.child_name}?`,
                                );

                                if (!confirmed) return;

                                try {
                                  const response = await fetch(
                                    `http://127.0.0.1:8000/api/children/${patient.child_id}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Accept: "application/json",
                                      },
                                    },
                                  );

                                  if (!response.ok) {
                                    const data = await response.json();
                                    console.error(data);
                                    alert("Failed to delete patient.");
                                    return;
                                  }

                                  setPatients((prevPatients) =>
                                    prevPatients.filter(
                                      (item) =>
                                        item.child_id !== patient.child_id,
                                    ),
                                  );

                                  alert("Patient deleted successfully!");
                                } catch (error) {
                                  console.error(
                                    "Error deleting patient:",
                                    error,
                                  );
                                  alert("Could not connect to the server.");
                                }
                              }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="patients-empty-state">
              <FaUserCircle />

              <p>No Child found</p>

              <span>Try searching for a different name.</span>
            </div>
          )}
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
              Parent:
              {selectedPatient?.parent_name || "Parent's Name"}
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
          ADD / EDIT PATIENT
      ========================================== */}

      {showAddPatient && (
        <div className="patients-add-overlay">
          <div
            className={`patients-add-modal ${
              !isEditingPatient && addPatientStep === 1
                ? "patient-step-one-modal"
                : "patient-step-two-modal"
            }`}
          >
            {/* ==========================================
                EDIT PATIENT
            ========================================== */}

            {isEditingPatient ? (
              <>
                <h2>Edit Child</h2>

                <input
                  type="text"
                  placeholder="Child's Name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Age (months)"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />

                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Sex"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Mother's Name"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Father's Name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Address"
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

                  <button type="button" onClick={handleEditPatient}>
                    Update Child
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ==========================================
                    STEP 1
                ========================================== */}

                {addPatientStep === 1 && (
                  <>
                    <div className="patient-step-header">
                      <span className="patient-step-number">1</span>

                      <div>
                        <h2>Identify Parent</h2>
                        <p>
                          Select the registered user who is adding this child.
                        </p>
                      </div>
                    </div>

                    <label className="patient-form-label">
                      Registered User
                    </label>

                    <div className="patient-user-search">
                      <FaSearch />

                      <input
                        type="text"
                        placeholder="Search registered user..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>

                    <div className="patient-user-list">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.slice(0, 5).map((user) => {
                          const isSelected =
                            selectedUser &&
                            getUserId(selectedUser) === getUserId(user);

                          return (
                            <button
                              type="button"
                              key={getUserId(user)}
                              className={`patient-user-option ${
                                isSelected ? "selected" : ""
                              }`}
                              onClick={() => setSelectedUser(user)}
                            >
                              <FaUserCircle />

                              <div>
                                <strong>{getUserName(user)}</strong>

                                {getUserEmail(user) && (
                                  <small>{getUserEmail(user)}</small>
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
                        <span>Selected User</span>

                        <strong>{getUserName(selectedUser)}</strong>
                      </div>
                    )}

                    <label className="patient-form-label">
                      Relationship to Child
                    </label>

                    <div className="patient-relationship-options">
                      <label
                        className={
                          selectedRelationship === "Mother" ? "active" : ""
                        }
                      >
                        <input
                          type="radio"
                          name="relationship"
                          value="Mother"
                          checked={selectedRelationship === "Mother"}
                          onChange={(e) =>
                            setSelectedRelationship(e.target.value)
                          }
                        />

                        <span>Mother</span>
                      </label>

                      <label
                        className={
                          selectedRelationship === "Father" ? "active" : ""
                        }
                      >
                        <input
                          type="radio"
                          name="relationship"
                          value="Father"
                          checked={selectedRelationship === "Father"}
                          onChange={(e) =>
                            setSelectedRelationship(e.target.value)
                          }
                        />

                        <span>Father</span>
                      </label>
                    </div>

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
                    STEP 2
                ========================================== */}

                {addPatientStep === 2 && (
                  <>
                    <div className="patient-step-header">
                      <span className="patient-step-number">2</span>

                      <div>
                        <h2>Child Information</h2>
                        <p>Complete the information for the child.</p>
                      </div>
                    </div>

                    <div className="patient-connected-user">
                      <FaUserCircle />

                      <div>
                        <small>{selectedRelationship} Account</small>

                        <strong>{getUserName(selectedUser)}</strong>
                      </div>
                    </div>

                    {/* MOTHER */}

                    {selectedRelationship === "Mother" ? (
                      <div className="patient-parent-field">
                        <label>Mother's Name</label>

                        <input type="text" value={motherName} readOnly />
                      </div>
                    ) : (
                      <div className="patient-parent-field">
                        <label>Mother's Name</label>

                        <input
                          type="text"
                          placeholder="Mother's Name"
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                        />
                      </div>
                    )}

                    {/* FATHER */}

                    {selectedRelationship === "Father" ? (
                      <div className="patient-parent-field">
                        <label>Father's Name</label>

                        <input type="text" value={fatherName} readOnly />
                      </div>
                    ) : (
                      <div className="patient-parent-field">
                        <label>Father's Name</label>

                        <input
                          type="text"
                          placeholder="Father's Name"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Child's Name"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />

                    <input
                      type="text"
                      placeholder="Age (months)"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />

                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                    />

                    <input
                      type="text"
                      placeholder="Sex"
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                    />

                    <input
                      type="text"
                      placeholder="Address"
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

                      <button type="button" onClick={handleCompleteAddPatient}>
                        Save Patient
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
