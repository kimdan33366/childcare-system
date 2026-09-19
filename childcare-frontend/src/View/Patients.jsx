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

import { PatientController } from "../Controller/PatientController";

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

  const [showSMSModal, setShowSMSModal] = useState(false);

  const [sendToAll, setSendToAll] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");

  const [message, setMessage] = useState(defaultSMSMessage);

  const [childName, setChildName] = useState("");

  const [age, setAge] = useState("");

  const [birthdate, setBirthdate] = useState("");

  const [sex, setSex] = useState("");

  const [motherName, setMotherName] = useState("");

  const [fatherName, setFatherName] = useState("");

  const [address, setAddress] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);

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

  const handleAddPatient = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_id: 3,
          child_name: childName,
          age_months: age,
          birthdate: birthdate,
          gender: sex,
          mother_name: motherName,
          father_name: fatherName,
          address: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert("Failed to add patient.");
        return;
      }

      setPatients((prevPatients) => [...prevPatients, data]);

      alert("Patient added successfully!");

      setChildName("");
      setAge("");
      setBirthdate("");
      setSex("");
      setMotherName("");
      setFatherName("");
      setAddress("");

      setShowAddPatient(false);
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("Could not connect to the server.");
    }
  };

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
      setSelectedPatient(null);
      setIsEditingPatient(false);

      setChildName("");
      setAge("");
      setBirthdate("");
      setSex("");
      setMotherName("");
      setFatherName("");
      setAddress("");
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Could not connect to the server.");
    }
  };

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
            <button
              className="patients-add-btn"
              onClick={() => {
                setIsEditingPatient(false);
                setSelectedPatient(null);
                setShowAddPatient(true);
              }}
            >
              <FaPlus />
              Add Patient
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
            <h3>Registered Patients</h3>

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

              <p>No patients found</p>

              <span>Try searching for a different name.</span>
            </div>
          )}
        </div>
      </main>

      {showSMSModal && (
        <div className="patients-sms-overlay">
          <div className="patients-sms-modal">
            <h2>Send SMS</h2>

            <p>Child: {selectedPatient?.child_name || "Child's Name"}</p>

            <p>Parent: {selectedPatient?.parent_name || "Parent's Name"}</p>

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

      {showAddPatient && (
        <div className="patients-add-overlay">
          <div className="patients-add-modal">
            <h2>{isEditingPatient ? "Edit Patient" : "Add Patient"}</h2>

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
                  setSelectedPatient(null);
                  setIsEditingPatient(false);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  isEditingPatient ? handleEditPatient : handleAddPatient
                }
              >
                {isEditingPatient ? "Update Patient" : "Save Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
