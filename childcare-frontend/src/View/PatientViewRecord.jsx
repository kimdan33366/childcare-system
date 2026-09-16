import "../css/PatientViewRecord.css";

import { useState, useEffect } from "react";

import { FaPaperPlane, FaUserCircle, FaArrowLeft } from "react-icons/fa";

import { NavLink, useParams } from "react-router-dom";

import Sidebar from "../View/Sidebar";

import { initialVaccines } from "../Model/PatientViewRecordModel";

import { PatientRecordController } from "../Controller/PatientViewRecordController";


function PatientViewRecord() {
  const { child_id } = useParams();
  const [child, setChild] = useState(null);

  const [showAddVaccination, setShowAddVaccination] = useState(false);
  const [showDeleteVaccination, setShowDeleteVaccination] = useState(false);
const [selectedDeleteVaccination, setSelectedDeleteVaccination] = useState(null);
  const [vaccinationForm, setVaccinationForm] = useState({
    vaccine: "",
    dose: "",
    date: "",
    status: "",
    place: "",
    provider: "",
  });
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/children/${child_id}`)
      .then((response) => response.json())
      .then((data) => {
        setChild(data);
      })
      .catch((error) => {
        console.error("Error fetching child:", error);
      });

    fetch(`http://127.0.0.1:8000/api/patient-records/${child_id}`)
      .then((response) => response.json())
      .then((data) => {
        setVaccines(data);
      })
      .catch((error) => {
        console.error("Error fetching vaccine records:", error);
      });
  }, [child_id]);

  const [showSMSPopup, setShowSMSPopup] = useState(false);

  const [message, setMessage] = useState("");

  const [vaccines, setVaccines] = useState([]);
  const handleVaccinationChange = (field, value) => {
    setVaccinationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleEditVaccination = (item) => {
    setSelectedVaccination(item);

    setEditVaccinationForm({
      vaccine: String(item.vaccine_id || ""),
      dose: String(item.dose || ""),
      date: item.date || "",
      status: item.status || "",
      place: item.place || "",
      provider: item.provider || "",
    });

    setShowEditVaccination(true);
  };
  const handleSaveEditVaccination = async () => {
    if (
      !editVaccinationForm.vaccine ||
      !editVaccinationForm.dose ||
      !editVaccinationForm.date ||
      !editVaccinationForm.status ||
      !editVaccinationForm.place ||
      !editVaccinationForm.provider
    ) {
      alert("Please complete all vaccination fields.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${selectedVaccination.patient_recordID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vaccine_id: editVaccinationForm.vaccine,
            dose_number: editVaccinationForm.dose,
            date_taken: editVaccinationForm.date,
            status: editVaccinationForm.status,
            place: editVaccinationForm.place,
            provider: editVaccinationForm.provider,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Laravel error:", errorData);
        alert(errorData.message || "Failed to update vaccination record.");
        return;
      }

      const data = await response.json();

      setVaccines((prev) =>
        prev.map((item) =>
          item.patient_recordID === selectedVaccination.patient_recordID
            ? {
                ...item,
                vaccine_id: data.record.vaccine_id,
                vaccine: getVaccineName(data.record.vaccine_id),
                dose: data.record.dose_number,
                date: data.record.date_taken,
                status: data.record.status,
                place: data.record.place,
                provider: data.record.provider,
              }
            : item,
        ),
      );

      alert("Vaccination record updated successfully!");

      setShowEditVaccination(false);
      setSelectedVaccination(null);
    } catch (error) {
      console.error("Error updating vaccination:", error);
      alert("Failed to update vaccination record.");
    }
  };
  const getVaccineName = (vaccineId) => {
    const vaccines = {
      1: "BCG",
      2: "Hepatitis B",
      3: "Pentavalent",
      4: "OPV",
      5: "MMR",
    };

    return vaccines[vaccineId] || "Unknown Vaccine";
  };

  const handleSaveVaccination = async () => {
    if (
      !vaccinationForm.vaccine ||
      !vaccinationForm.dose ||
      !vaccinationForm.date ||
      !vaccinationForm.status ||
      !vaccinationForm.place ||
      !vaccinationForm.provider
    ) {
      alert("Please complete all vaccination fields.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/patient-records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            child_id: child_id,
            vaccine_id: vaccinationForm.vaccine,
            dose_number: vaccinationForm.dose,
            date_taken: vaccinationForm.date,
            place: vaccinationForm.place,
            status: vaccinationForm.status,
            provider: vaccinationForm.provider,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        console.error("Laravel error:", errorData);

        alert(
          errorData.message ||
            errorData.error ||
            "Failed to save vaccination record.",
        );

        return;
      }

      const data = await response.json();

      console.log("Vaccination saved:", data);

      setVaccines((prev) => [
        ...prev,
        {
          patient_recordID: data.record.patient_recordID,
          child_id: data.record.child_id,
          vaccine_id: data.record.vaccine_id,
          vaccine: getVaccineName(data.record.vaccine_id),
          dose: data.record.dose_number,
          date: data.record.date_taken,
          status: data.record.status,
          place: data.record.place,
          provider: data.record.provider,
        },
      ]);

      alert("Vaccination record added successfully!");
      setVaccinationForm({
        vaccine: "",
        dose: "",
        date: "",
        status: "",
        place: "",
        provider: "",
      });
      setShowAddVaccination(false);
    } catch (error) {
      console.error("Error saving vaccination:", error);
      alert("Failed to save vaccination record.");
    }
  };
  const [showEditVaccination, setShowEditVaccination] = useState(false);

  const [editVaccinationForm, setEditVaccinationForm] = useState({
    vaccine: "",
    dose: "",
    date: "",
    status: "",
    place: "",
    provider: "",
  });

  const [selectedVaccination, setSelectedVaccination] = useState(null);

  const handleVaccineChange = async (index, field, value) => {
    const updatedVaccines = [...vaccines];

    updatedVaccines[index] = {
      ...updatedVaccines[index],
      [field]: value,
    };

    setVaccines(updatedVaccines);

    if (field === "status") {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/patient-records/${updatedVaccines[index].patient_recordID}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: value,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to update status");
        }

        console.log("Status updated successfully");
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  return (
    <div className="viewRecord-dashboard">
      <Sidebar />

      <main className="viewRecord-main">
        {/* Header */}
        <div className="viewRecord-header">
          <div>
            <NavLink to="/patients" className="viewRecord-back-link">
              <FaArrowLeft />
              Back to Patients
            </NavLink>

            <h1>Patient Record</h1>

            <p>View and manage the child's vaccination records.</p>
          </div>
        </div>

        {/* Patient Information */}
        <section className="viewRecord-patient-card">
          <div className="viewRecord-patient-main">
            <div className="viewRecord-avatar">
              <FaUserCircle />
            </div>

            <div className="viewRecord-patient-info">
              <h2>{child?.child_name || "Child's Name"}</h2>

              <span className="viewRecord-patient-label">Patient</span>
            </div>
          </div>

          <div className="viewRecord-patient-details">
            <div>
              <span>Birthdate</span>
              <strong>{child?.birthdate || "—"}</strong>
            </div>

            <div>
              <span>Age</span>
              <strong>
                {child?.age_months ? `${child.age_months} months` : "—"}
              </strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>{child?.gender || "—"}</strong>
            </div>

            <div>
              <span>Mother</span>
              <strong>{child?.mother_name || "—"}</strong>
            </div>

            <div>
              <span>Father</span>
              <strong>{child?.father_name || "—"}</strong>
            </div>

            <div>
              <span>Address</span>
              <strong>{child?.address || "—"}</strong>
            </div>
          </div>

          <button
            className="viewRecord-sms-btn"
            onClick={() => setShowSMSPopup(true)}
          >
            <FaPaperPlane />
            Send SMS
          </button>
        </section>

        {/* Vaccination Records */}
        <section className="viewRecord-record-section">
          <div className="viewRecord-section-header">
            <div>
              <h2>Vaccination Records</h2>

              <p>Vaccination history for this patient.</p>
            </div>

            <button
              className="viewRecord-add-btn"
              onClick={() => setShowAddVaccination(true)}
            >
              + Add Vaccination
            </button>
          </div>

          <div className="viewRecord-table-wrapper">
            <table className="viewRecord-schedule-table">
              <thead>
                <tr>
                  <th>Vaccine</th>
                  <th>Dose</th>
                  <th>Date Taken</th>
                  <th>Status</th>
                  <th>Place</th>
                  <th>Provider</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {vaccines.length > 0 ? (
                  vaccines.map((item, index) => (
                    <tr key={item.patient_recordID || index}>
                      <td>
                        <strong>{item.vaccine || "—"}</strong>
                      </td>

                      <td>Dose {item.dose || "—"}</td>

                      <td>{item.date || "—"}</td>

                      <td>
                        <select
                          value={item.status || ""}
                          onChange={(e) =>
                            handleVaccineChange(index, "status", e.target.value)
                          }
                          className={`viewRecord-status-select ${
                            item.status?.toLowerCase().replace(/\s+/g, "-") ||
                            ""
                          }`}
                        >
                          <option value="Completed">Completed</option>

                          <option value="Continuing">Continuing</option>

                          <option value="Missed">Missed</option>
                        </select>
                      </td>

                      <td>{item.place || "—"}</td>

                      <td>{item.provider || "—"}</td>

                      <td>
                        <div className="viewRecord-action-buttons">
                          <button
                            className="viewRecord-edit-btn"
                            onClick={() => {
                              setSelectedVaccination(item);
                              SetshowEditVaccination(true);
                              }}
                          >
                            Edit
                          </button>

                          <button
                            className="viewRecord-delete-btn"
                            onClick={() => {
                              const confirmDelete = window.confirm(
                                "Are you sure you want to delete this vaccination record?",
                              );

                              if (confirmDelete) {
                                alert("Delete functionality coming next.");
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="viewRecord-empty">
                      <div>
                        <FaUserCircle />

                        <h3>No vaccination records</h3>

                        <p>
                          No vaccination records have been added for this
                          patient yet.
                        </p>

                        <button
                          className="viewRecord-empty-add"
                          onClick={() => setShowAddVaccination(true)}
                        >
                          + Add Vaccination
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* SMS Popup */}
        {showSMSPopup && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Send Reminder</h2>

                  <p>Send a vaccination reminder to the parent.</p>
                </div>

                <button
                  onClick={() => setShowSMSPopup(false)}
                  className="viewRecord-popup-close"
                >
                  ×
                </button>
              </div>

              <div className="viewRecord-popup-child">
                <FaUserCircle />

                <strong>{child?.child_name || "Child's Name"}</strong>
              </div>

              <label>Recipient</label>

              <input type="text" placeholder="Enter contact number" />

              <label>Message</label>

              <textarea
                rows="5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter reminder message..."
              />

              <div className="viewRecord-popup-buttons">
                <button
                  className="viewRecord-cancel-btn"
                  onClick={() => {
                    setMessage("");
                    setShowSMSPopup(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="viewRecord-send-btn"
                  onClick={() => {
                    alert("SMS Sent!");

                    setMessage("");

                    setShowSMSPopup(false);
                  }}
                >
                  Send SMS
                </button>

                <button
                  className="viewRecord-send-all-btn"
                  onClick={() => {
                    alert("SMS Sent to all!");

                    setMessage("");

                    setShowSMSPopup(false);
                  }}
                >
                  Send to All
                </button>
              </div>
            </div>
          </div>
        )}
        {showAddVaccination && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup vaccination-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Add Vaccination</h2>
                  <p>Add a vaccination record for this patient.</p>
                </div>

                <button
                  onClick={() => setShowAddVaccination(false)}
                  className="viewRecord-popup-close"
                >
                  ×
                </button>
              </div>

              <div className="viewRecord-popup-child">
                <FaUserCircle />
                <strong>{child?.child_name || "Child's Name"}</strong>
              </div>

              <label>Vaccine</label>
              <select
                className="vaccination-form-input"
                value={vaccinationForm.vaccine}
                onChange={(e) =>
                  handleVaccinationChange("vaccine", e.target.value)
                }
              >
                <option value="">Select vaccine</option>
                <option value="1">BCG</option>
                <option value="2">Hepatitis B</option>
                <option value="3">Pentavalent</option>
                <option value="4">OPV</option>
                <option value="5">MMR</option>
              </select>

              <label>Dose</label>
              <select
                className="vaccination-form-input"
                value={vaccinationForm.dose}
                onChange={(e) =>
                  handleVaccinationChange("dose", e.target.value)
                }
              >
                <option value="">Select dose</option>
                <option value="1">Dose 1</option>
                <option value="2">Dose 2</option>
                <option value="3">Dose 3</option>
              </select>

              <label>Date Taken</label>
              <input
                type="date"
                className="vaccination-form-input"
                value={vaccinationForm.date}
                onChange={(e) =>
                  handleVaccinationChange("date", e.target.value)
                }
              />

              <label>Status</label>
              <select
                className="vaccination-form-input"
                value={vaccinationForm.status}
                onChange={(e) =>
                  handleVaccinationChange("status", e.target.value)
                }
              >
                <option value="">Select status</option>
                <option value="Completed">Completed</option>
                <option value="Continuing">Continuing</option>
                <option value="Missed">Missed</option>
              </select>

              <label>Place</label>
              <input
                type="text"
                className="vaccination-form-input"
                placeholder="e.g. Health Center"
                value={vaccinationForm.place}
                onChange={(e) =>
                  handleVaccinationChange("place", e.target.value)
                }
              />

              <label>Provider</label>
              <input
                type="text"
                className="vaccination-form-input"
                placeholder="e.g. Dr. Maria"
                value={vaccinationForm.provider}
                onChange={(e) =>
                  handleVaccinationChange("provider", e.target.value)
                }
              />

              <div className="viewRecord-popup-buttons">
                <button
                  className="viewRecord-cancel-btn"
                  onClick={() => {
                    setVaccinationForm({
                      vaccine: "",
                      dose: "",
                      date: "",
                      status: "",
                      place: "",
                      provider: "",
                    });

                    setShowAddVaccination(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="viewRecord-send-btn"
                  onClick={handleSaveVaccination}
                >
                  Save Vaccination
                </button>
              </div>
            </div>
          </div>
        )}
        {showEditVaccination && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup vaccination-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Edit Vaccination</h2>
                  <p>Update this patient's vaccination record.</p>
                </div>

                <button
                  onClick={() => setShowEditVaccination(false)}
                  className="viewRecord-popup-close"
                >
                  ×
                </button>
              </div>

              <div className="viewRecord-popup-child">
                <FaUserCircle />
                <strong>{child?.child_name || "Child's Name"}</strong>
              </div>

              <label>Vaccine</label>
              <select
                className="vaccination-form-input"
                value={editVaccinationForm.vaccine}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    vaccine: e.target.value,
                  }))
                }
              >
                <option value="">Select vaccine</option>
                <option value="1">BCG</option>
                <option value="2">Hepatitis B</option>
                <option value="3">Pentavalent</option>
                <option value="4">OPV</option>
                <option value="5">MMR</option>
              </select>

              <label>Dose</label>
              <select
                className="vaccination-form-input"
                value={editVaccinationForm.dose}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    dose: e.target.value,
                  }))
                }
              >
                <option value="">Select dose</option>
                <option value="1">Dose 1</option>
                <option value="2">Dose 2</option>
                <option value="3">Dose 3</option>
              </select>

              <label>Date Taken</label>
              <input
                type="date"
                className="vaccination-form-input"
                value={editVaccinationForm.date}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />

              <label>Status</label>
              <select
                className="vaccination-form-input"
                value={editVaccinationForm.status}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="">Select status</option>
                <option value="Completed">Completed</option>
                <option value="Continuing">Continuing</option>
                <option value="Missed">Missed</option>
              </select>

              <label>Place</label>
              <input
                type="text"
                className="vaccination-form-input"
                placeholder="e.g. Health Center"
                value={editVaccinationForm.place}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    place: e.target.value,
                  }))
                }
              />

              <label>Provider</label>
              <input
                type="text"
                className="vaccination-form-input"
                placeholder="e.g. Dr. Maria"
                value={editVaccinationForm.provider}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    provider: e.target.value,
                  }))
                }
              />

              <div className="viewRecord-popup-buttons">
                <button
                  className="viewRecord-cancel-btn"
                  onClick={() => setShowEditVaccination(false)}
                >
                  Cancel
                </button>

                <button
                  className="viewRecord-send-btn"
                  onClick={handleSaveEditVaccination}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteVaccination && (
  <div className="viewRecord-popup-overlay">
    <div className="viewRecord-popup delete-vaccination-popup">

      <div className="delete-vaccination-icon">
        🗑
      </div>

      <div className="delete-vaccination-content">
        <h2>Delete Vaccination Record?</h2>

        <p>
          Are you sure you want to delete this vaccination record?
          This action cannot be undone.
        </p>

        {selectedDeleteVaccination && (
          <div className="delete-vaccination-details">
            <strong>{selectedDeleteVaccination.vaccine}</strong>
            <span>
              Dose {selectedDeleteVaccination.dose} ·{" "}
              {selectedDeleteVaccination.date}
            </span>
          </div>
        )}
      </div>

      <div className="viewRecord-popup-buttons">
        <button
          className="viewRecord-cancel-btn"
          onClick={() => {
            setShowDeleteVaccination(false);
            setSelectedDeleteVaccination(null);
          }}
        >
          Cancel
        </button>

        <button
          className="viewRecord-delete-confirm-btn"
          onClick={() => {
            alert("Delete functionality coming next.");
          }}
        >
          Delete Record
        </button>
      </div>

    </div>
  </div>
)}
      </main>
    </div>
  );
}

export default PatientViewRecord;
