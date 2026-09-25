import "../css/PatientViewRecord.css";

import { useState, useEffect } from "react";
import { FaPaperPlane, FaUserCircle, FaArrowLeft } from "react-icons/fa";

import { NavLink, useParams, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../View/Sidebar";

function PatientViewRecord() {
  const { child_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const backPath = location.state?.from || "/patients";
  const backLabel = location.state?.fromLabel || "Back to Children";

  const [child, setChild] = useState(null);

  const [showAddVaccination, setShowAddVaccination] = useState(false);
  const [showDeleteVaccination, setShowDeleteVaccination] = useState(false);
  const [selectedDeleteVaccination, setSelectedDeleteVaccination] =
    useState(null);

  const [vaccinationForm, setVaccinationForm] = useState({
    vaccine: "",
    dose: "",
    date: "",
    status: "",
    place: "",
    provider: "",
  });

  const [showSMSPopup, setShowSMSPopup] = useState(false);
  const [message, setMessage] = useState("");

  const [vaccines, setVaccines] = useState([]);
  const [vaccineInventory, setVaccineInventory] = useState([]);

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

  // ==========================================
  // FETCH CHILD
  // ==========================================

  const fetchChild = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/children/${child_id}`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Error fetching child:", data);
        return;
      }

      const normalizedChild = {
        ...data,

        growthRecords: data.growth_records || data.growthRecords || [],

        appointments: data.appointments || [],

        patientRecords: data.patient_records || data.patientRecords || [],
      };

      setChild(normalizedChild);
    } catch (error) {
      console.error("Error fetching child:", error);
    }
  };

  // ==========================================
  // FETCH VACCINATION RECORDS
  // ==========================================

  const fetchVaccinationRecords = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${child_id}?_=${Date.now()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        },
      );

      const data = await response.json();

      console.log("Vaccination records from server:", data);

      if (!response.ok) {
        console.error("Failed to fetch vaccination records:", data);
        return;
      }

      setVaccines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vaccine records:", error);
    }
  };

  // ==========================================
  // FETCH VACCINE INVENTORY
  // ==========================================

  const fetchVaccineInventory = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/vaccines?_=${Date.now()}`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        },
      );

      const data = await response.json();

      console.log("Vaccine inventory:", data);

      if (!response.ok) {
        console.error("Failed to fetch vaccine inventory:", data);
        return;
      }

      setVaccineInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vaccine inventory:", error);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchChild();
    fetchVaccinationRecords();
    fetchVaccineInventory();
  }, [child_id]);

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
  // GROWTH DATA
  // ==========================================

  const growthRecords = Array.isArray(child?.growthRecords)
    ? child.growthRecords
    : [];

  const sortedGrowthRecords = [...growthRecords].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    return Number(b.growth_id || 0) - Number(a.growth_id || 0);
  });

  const latestGrowth =
    sortedGrowthRecords.length > 0 ? sortedGrowthRecords[0] : null;

  const latestHeight =
    latestGrowth?.height_cm !== null &&
    latestGrowth?.height_cm !== undefined &&
    latestGrowth?.height_cm !== ""
      ? `${latestGrowth.height_cm} cm`
      : "—";

  const latestWeight =
    latestGrowth?.weight_kg !== null &&
    latestGrowth?.weight_kg !== undefined &&
    latestGrowth?.weight_kg !== ""
      ? `${latestGrowth.weight_kg} kg`
      : "—";

  // ==========================================
  // VACCINE HELPERS
  // ==========================================

  const getVaccineName = (vaccineId) => {
    const vaccine = vaccineInventory.find(
      (item) => String(item.vaccine_ID) === String(vaccineId),
    );

    return vaccine?.vaccine_name || "Unknown Vaccine";
  };

  const getSelectedVaccineStock = () => {
    const selectedVaccine = vaccineInventory.find(
      (vaccine) =>
        String(vaccine.vaccine_ID) === String(vaccinationForm.vaccine),
    );

    return selectedVaccine ? Number(selectedVaccine.stock_quantity) : null;
  };

  const isSelectedVaccineOutOfStock = getSelectedVaccineStock() === 0;

  // ==========================================
  // VACCINATION FORM
  // ==========================================

  const handleVaccinationChange = (field, value) => {
    setVaccinationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==========================================
  // EDIT VACCINATION
  // ==========================================

  const handleEditVaccination = (item) => {
    setSelectedVaccination(item);

    setEditVaccinationForm({
      vaccine: String(item.vaccine_id || ""),
      dose: String(item.dose_number || item.dose || ""),
      date: item.date_taken || item.date || "",
      status: item.status || "",
      place: item.place || "",
      provider: item.provider || "",
    });

    setShowEditVaccination(true);
  };

  // ==========================================
  // SAVE NEW VACCINATION
  // ==========================================

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

    const selectedStock = getSelectedVaccineStock();

    if (vaccinationForm.status === "Completed" && selectedStock === 0) {
      alert("This vaccine is out of stock. Please select another vaccine.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/patient-records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
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

      const data = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", data);

        alert(
          data.message || data.error || "Failed to save vaccination record.",
        );

        return;
      }

      await fetchVaccinationRecords();
      await fetchVaccineInventory();

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

  // ==========================================
  // UPDATE VACCINATION
  // ==========================================

  const handleSaveEditVaccination = async () => {
    if (!selectedVaccination) {
      return;
    }

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

    const selectedVaccine = vaccineInventory.find(
      (vaccine) =>
        String(vaccine.vaccine_ID) === String(editVaccinationForm.vaccine),
    );

    const selectedStock = selectedVaccine
      ? Number(selectedVaccine.stock_quantity)
      : null;

    const oldStatus = selectedVaccination.status;

    const oldVaccineId = selectedVaccination.vaccine_id;

    if (
      String(oldVaccineId) !== String(editVaccinationForm.vaccine) &&
      editVaccinationForm.status === "Completed" &&
      selectedStock === 0
    ) {
      alert(
        "The selected vaccine is out of stock. Please select another vaccine.",
      );
      return;
    }

    if (
      String(oldVaccineId) === String(editVaccinationForm.vaccine) &&
      oldStatus !== "Completed" &&
      editVaccinationForm.status === "Completed" &&
      selectedStock === 0
    ) {
      alert("This vaccine is out of stock. Please select another vaccine.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${selectedVaccination.patient_recordID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
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

      const data = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", data);

        alert(data.message || "Failed to update vaccination record.");

        return;
      }

      await fetchVaccinationRecords();
      await fetchVaccineInventory();

      alert("Vaccination record updated successfully!");

      setShowEditVaccination(false);
      setSelectedVaccination(null);
    } catch (error) {
      console.error("Error updating vaccination:", error);
      alert("Failed to update vaccination record.");
    }
  };

  // ==========================================
  // UPDATE VACCINATION STATUS
  // ==========================================

  const handleVaccineChange = async (index, field, value) => {
    if (field !== "status") {
      return;
    }

    const selectedRecord = vaccines[index];

    if (!selectedRecord) {
      console.error("Could not find vaccination record at index:", index);
      return;
    }

    const patientRecordID = selectedRecord.patient_recordID;

    if (!patientRecordID) {
      console.error("Missing patient_recordID:", selectedRecord);

      alert("This vaccination record does not have a valid record ID.");

      return;
    }

    const oldStatus = selectedRecord.status;

    console.log("Updating vaccination status:", {
      patientRecordID,
      oldStatus,
      newStatus: value,
    });

    // If the status did not actually change
    if (oldStatus === value) {
      return;
    }

    // Optimistically update the UI
    const previousVaccines = [...vaccines];

    setVaccines((prevVaccines) =>
      prevVaccines.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              status: value,
            }
          : item,
      ),
    );

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${patientRecordID}/status?_=${Date.now()}`,
        {
          method: "PUT",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            status: value,
          }),
        },
      );

      const data = await response.json();

      console.log("Status update HTTP status:", response.status);

      console.log("Status update server response:", data);

      if (!response.ok) {
        setVaccines(previousVaccines);

        alert(
          data.message || data.error || "Failed to update vaccination status.",
        );

        return;
      }

      /*
       * Use the status returned by Laravel.
       * This confirms what was actually saved.
       */
      const savedStatus = data?.record?.status || value;

      setVaccines((prevVaccines) =>
        prevVaccines.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                status: savedStatus,
              }
            : item,
        ),
      );

      console.log("Vaccination status successfully saved as:", savedStatus);

      // Refresh records from database
      await fetchVaccinationRecords();

      // Refresh vaccine inventory because Completed
      // changes stock quantity.
      await fetchVaccineInventory();
    } catch (error) {
      console.error("Error updating vaccination status:", error);

      setVaccines(previousVaccines);

      alert(
        "Could not connect to the server while updating the vaccination status.",
      );
    }
  };

  // ==========================================
  // DELETE VACCINATION
  // ==========================================

  const handleDeleteVaccination = async () => {
    if (!selectedDeleteVaccination) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${selectedDeleteVaccination.patient_recordID}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete vaccination record.");

        return;
      }

      await fetchVaccinationRecords();
      await fetchVaccineInventory();

      alert("Vaccination record deleted successfully!");

      setShowDeleteVaccination(false);
      setSelectedDeleteVaccination(null);
    } catch (error) {
      console.error("Error deleting vaccination:", error);

      alert("Failed to delete vaccination record.");
    }
  };

  // ==========================================
  // PARENT INFORMATION
  // ==========================================

  const parentName = child?.user?.user_fullname || child?.parent_name || "—";

  const parentPhone = child?.user?.mobile_number || "—";

  const parentEmail = child?.user?.email || "—";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="viewRecord-dashboard">
      <Sidebar />

      <main className="viewRecord-main">
        {/* HEADER */}

        <div className="viewRecord-header">
          <div>
            <button
              type="button"
              className="viewRecord-back-link"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
              {backLabel}
            </button>

            <h1>Child Record</h1>

            <p>
              Manage the child's vaccination records, growth history, and
              appointment history.
            </p>
          </div>
        </div>

        {/* CHILD INFORMATION */}

        <section className="viewRecord-patient-card">
          <div className="viewRecord-patient-main">
            <div className="viewRecord-avatar">
              <FaUserCircle />
            </div>

            <div className="viewRecord-patient-info">
              <h2>{child?.child_name || "Child's Name"}</h2>

              <span className="viewRecord-patient-label">
                {child?.status || "Continuing"}
              </span>
            </div>
          </div>

          <div className="viewRecord-patient-details">
            <div>
              <span>Birthdate</span>
              <strong>{child?.birthdate || "—"}</strong>
            </div>

            <div>
              <span>Age</span>
              <strong>{calculateAge(child?.birthdate)}</strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>{child?.gender || "—"}</strong>
            </div>

            <div>
              <span>Height</span>
              <strong>{latestHeight}</strong>
            </div>

            <div>
              <span>Weight</span>
              <strong>{latestWeight}</strong>
            </div>

            <div>
              <span>Parent / Guardian</span>
              <strong>{parentName}</strong>
            </div>

            <div>
              <span>Relationship</span>
              <strong>{child?.relationship || "—"}</strong>
            </div>

            <div>
              <span>Parent Contact</span>
              <strong>{parentPhone}</strong>
            </div>

            <div>
              <span>Parent Email</span>
              <strong>{parentEmail}</strong>
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

        {/* VACCINATION MANAGEMENT */}

        <section className="viewRecord-record-section viewRecord-vaccination-section">
          <div className="viewRecord-section-header">
            <div>
              <h2>Vaccination Management</h2>

              <p>Set, update, and manage the child's vaccination records.</p>
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
                  <th>Vaccination Date</th>
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
                        <strong>
                          {item.vaccine || getVaccineName(item.vaccine_id)}
                        </strong>
                      </td>

                      <td>Dose {item.dose || item.dose_number || "—"}</td>

                      <td>{item.date || item.date_taken || "—"}</td>

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
                            onClick={() => handleEditVaccination(item)}
                          >
                            Edit
                          </button>

                          <button
                            className="viewRecord-delete-btn"
                            onClick={() => {
                              setSelectedDeleteVaccination(item);

                              setShowDeleteVaccination(true);
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
                          No vaccination records have been added for this child
                          yet.
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

        {/* GROWTH HISTORY */}

        <section className="viewRecord-record-section">
          <div className="viewRecord-section-header">
            <div>
              <h2>Growth History</h2>

              <p>
                Historical height and weight measurements recorded during clinic
                visits.
              </p>
            </div>
          </div>

          <div className="viewRecord-table-wrapper">
            <table className="viewRecord-schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Height</th>
                  <th>Appointment</th>
                </tr>
              </thead>

              <tbody>
                {sortedGrowthRecords.length > 0 ? (
                  sortedGrowthRecords.map((growth) => (
                    <tr key={growth.growth_id}>
                      <td>{growth.date || "—"}</td>

                      <td>
                        {growth.weight_kg !== null &&
                        growth.weight_kg !== undefined &&
                        growth.weight_kg !== ""
                          ? `${growth.weight_kg} kg`
                          : "—"}
                      </td>

                      <td>
                        {growth.height_cm !== null &&
                        growth.height_cm !== undefined &&
                        growth.height_cm !== ""
                          ? `${growth.height_cm} cm`
                          : "—"}
                      </td>

                      <td>
                        {growth.appointment_id
                          ? `#${growth.appointment_id}`
                          : "Clinic Visit"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="viewRecord-empty">
                      No growth records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* APPOINTMENT HISTORY */}

        <section className="viewRecord-record-section">
          <div className="viewRecord-section-header">
            <div>
              <h2>Appointment History</h2>

              <p>Previous and upcoming clinic appointments for this child.</p>
            </div>
          </div>

          <div className="viewRecord-table-wrapper">
            <table className="viewRecord-schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {child?.appointments?.length > 0 ? (
                  child.appointments.map((appointment) => (
                    <tr key={appointment.appointment_id}>
                      <td>{appointment.appointment_date}</td>

                      <td>{appointment.appointment_time}</td>

                      <td>{appointment.appointment_type || "—"}</td>

                      <td>{appointment.address || "—"}</td>

                      <td>{appointment.status || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="viewRecord-empty">
                      No appointment history available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* SMS POPUP */}

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

                <div>
                  <strong>{child?.child_name || "Child's Name"}</strong>

                  <small>Parent: {parentName}</small>
                </div>
              </div>

              <label>Recipient</label>

              <input
                type="text"
                value={child?.user?.mobile_number || ""}
                placeholder="Enter contact number"
                readOnly
              />

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
              </div>
            </div>
          </div>
        )}

        {/* ADD VACCINATION */}

        {showAddVaccination && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup vaccination-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Add Vaccination</h2>

                  <p>Add a vaccination record for this child.</p>
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

                {vaccineInventory.map((vaccine) => (
                  <option key={vaccine.vaccine_ID} value={vaccine.vaccine_ID}>
                    {vaccine.vaccine_name}
                  </option>
                ))}
              </select>

              {isSelectedVaccineOutOfStock && (
                <p className="vaccine-stock-warning">
                  ⚠ This vaccine is currently out of stock.
                </p>
              )}

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

              <label>Vaccination Date</label>

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
                  disabled={
                    isSelectedVaccineOutOfStock &&
                    vaccinationForm.status === "Completed"
                  }
                >
                  Save Vaccination
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT VACCINATION */}

        {showEditVaccination && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup vaccination-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Edit Vaccination</h2>

                  <p>Update this child's vaccination record.</p>
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

                {vaccineInventory.map((vaccine) => (
                  <option key={vaccine.vaccine_ID} value={vaccine.vaccine_ID}>
                    {vaccine.vaccine_name}
                  </option>
                ))}
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

              <label>Vaccination Date</label>

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

        {/* DELETE VACCINATION */}

        {showDeleteVaccination && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup delete-vaccination-popup">
              <div className="delete-vaccination-icon">🗑</div>

              <div className="delete-vaccination-content">
                <h2>Delete Vaccination Record?</h2>

                <p>
                  Are you sure you want to delete this vaccination record? This
                  action cannot be undone.
                </p>

                {selectedDeleteVaccination && (
                  <div className="delete-vaccination-details">
                    <strong>
                      {selectedDeleteVaccination.vaccine ||
                        getVaccineName(selectedDeleteVaccination.vaccine_id)}
                    </strong>

                    <span>
                      Dose{" "}
                      {selectedDeleteVaccination.dose ||
                        selectedDeleteVaccination.dose_number}
                      {" · "}
                      {selectedDeleteVaccination.date ||
                        selectedDeleteVaccination.date_taken}
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
                  onClick={handleDeleteVaccination}
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
