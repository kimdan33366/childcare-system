import "../css/Appointment.css";
import { Link, useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

import { FaCalendarAlt, FaPen, FaTrash } from "react-icons/fa";

import Sidebar from "../View/Sidebar";

function Appointments() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [appointments, setAppointments] = useState([]);
  const [children, setChildren] = useState([]);

  const [search, setSearch] = useState("");

  const [dateFilter, setDateFilter] = useState("All");

  const [showPopup, setShowPopup] = useState(false);

  const [patient, setPatient] = useState("");

  const [date, setDate] = useState("");

  const [time, setTime] = useState("");

  const [subject, setSubject] = useState("");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/appointments")
      .then((response) => response.json())
      .then((data) => {
        setAppointments(data);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
      });

    fetch("http://127.0.0.1:8000/api/children")
      .then((response) => response.json())
      .then((data) => {
        setChildren(data);
      })
      .catch((error) => {
        console.error("Error fetching children:", error);
      });
  }, []);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = String(appointment.child_id).includes(search);

    const matchesDate =
      dateFilter === "All" || appointment.appointment_date === dateFilter;

    return matchesSearch && matchesDate;
  });
  const saveAppointment = async () => {
    const data = {
      child_id: patient,
      appointment_date: date,
      appointment_time: time,
      subject: subject,
      address: "Barangay Health Center",
      status:
        editingId !== null
          ? appointments.find(
              (appointment) => appointment.appointment_id === editingId,
            ).status || "Pending"
          : "Pending",
      admin_id: 1,
      user_id: 3,
    };

    try {
      let response;

      if (editingId !== null) {
        // UPDATE
        response = await fetch(
          `http://127.0.0.1:8000/api/appointments/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(data),
          },
        );
      } else {
        // ADD
        response = await fetch("http://127.0.0.1:8000/api/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      const result = await response.json();
      console.log("Appointment response:", result);

      if (!response.ok) {
        console.error("Laravel error:", result);
        alert(
          result.message || "An error occurred while saving the appointment.",
        );
        return;
      }

      console.log(
        editingId !== null ? "Appointment updated:" : "Appointment created:",
        result,
      );

      const updated = await fetch("http://127.0.0.1:8000/api/appointments");

      const updatedData = await updated.json();

      setAppointments(updatedData);

      clearForm();
    } catch (error) {
      console.error("Error saving appointment:", error);
    }
  };

  // const saveAppointment = () => {

  //   const data = {
  //     patient,
  //     date,
  //     time,
  //     subject,
  //   };

  //   if (editingId !== null) {

  //     setAppointments(
  //       AppointmentController.update(
  //         appointments,
  //         editingId,
  //         data
  //       )
  //     );

  //   } else {

  //     setAppointments(
  //       AppointmentController.add(
  //         appointments,
  //         data
  //       )
  //     );

  //   }

  //   clearForm();
  // };
  const deleteAppointment = async (id) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/appointments/${id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", result);
        return;
      }

      console.log("Appointment deleted:", result);

      // Refresh appointments
      const updated = await fetch("http://127.0.0.1:8000/api/appointments");

      const updatedData = await updated.json();

      setAppointments(updatedData);
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };
  const updateAppointmentStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/appointments/${id}`,
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

      const result = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", result);
        alert(result.message || "Failed to update appointment status.");
        return;
      }

      console.log("Appointment status updated:", result);

      const updated = await fetch("http://127.0.0.1:8000/api/appointments");

      const updatedData = await updated.json();
      setAppointments(updatedData);
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const clearForm = () => {
    setPatient("");
    setDate("");
    setTime("");
    setSubject("");
    setEditingId(null);
    setShowPopup(false);
  };

  return (
    <div className="appointment-dashboard">
      <Sidebar />

      <div className="appointment-main-content">
        <div className="appointment-header">
          <h3>Appointments</h3>
        </div>

        <div className="appointment-toolbar">
          <div className="appointment-search-box">
            <input
              type="text"
              placeholder="Search patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="appointment-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="All">All Dates</option>

            {[
              ...new Set(
                appointments.map((appointment) => appointment.appointment_date),
              ),
            ].map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>

          <button
            className="appointment-button"
            onClick={() => setShowPopup(true)}
          >
            Add Appointment
          </button>
        </div>

        <div className="appointment-content-container">
          {filteredAppointments.length === 0 ? (
            <div className="appointment-empty-state">
              <div className="appointment-empty-icon">
                <FaCalendarAlt />
              </div>

              <h3>No appointments yet</h3>

              <p>There are currently no appointments scheduled.</p>

              <button
                className="appointment-empty-button"
                onClick={() => setShowPopup(true)}
              >
                Add Appointment
              </button>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div
                className="appointment-content"
                key={appointment.appointment_id}
              >
                <div className="appointment-icon-wrapper">
                  <FaCalendarAlt className="appointment-content-icon" />
                </div>

                <div className="appointment-content-text">
                  <div className="appointment-title-row">
                    <h3>
                      {children.find(
                        (child) => child.child_id === appointment.child_id,
                      )?.child_name || "Unknown Child"}
                    </h3>

                    <select
                      className={`appointment-status status-${(
                        appointment.status || "Pending"
                      )
                        .toLowerCase()
                        .replace(" ", "-")}`}
                      value={appointment.status || "Pending"}
                      onChange={(e) =>
                        updateAppointmentStatus(
                          appointment.appointment_id,
                          e.target.value,
                        )
                      }
                    >
                      <option value={appointment.status || "Pending"}>
                        {appointment.status || "Pending"}
                      </option>

                      {appointment.status === "Pending" && (
                        <>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                        </>
                      )}

                      {appointment.status === "Confirmed" && (
                        <>
                          <option value="Completed">Completed</option>
                          <option value="Missed">Missed</option>
                          <option value="Cancelled">Cancelled</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="appointment-details">
                    <div className="appointment-detail">
                      <span className="appointment-detail-label">Date</span>
                      <span>{appointment.appointment_date}</span>
                    </div>

                    <div className="appointment-detail">
                      <span className="appointment-detail-label">Time</span>
                      <span>{appointment.appointment_time}</span>
                    </div>

                    <div className="appointment-detail">
                      <span className="appointment-detail-label">Subject</span>
                      <span>{appointment.subject}</span>
                    </div>

                    <div className="appointment-detail">
                      <span className="appointment-detail-label">Location</span>
                      <span>{appointment.address}</span>
                    </div>
                  </div>
                </div>

                <div className="appointment-action-buttons">
                  <button
                    className="appointment-edit-btn"
                    title="Edit appointment"
                    onClick={() => {
                      setEditingId(appointment.appointment_id);
                      setPatient(appointment.child_id);
                      setDate(appointment.appointment_date);
                      setTime(appointment.appointment_time);
                      setSubject(appointment.subject);
                      setShowPopup(true);
                    }}
                  >
                    <FaPen />
                  </button>

                  <button
                    className="appointment-delete-btn"
                    title="Delete appointment"
                    onClick={() =>
                      deleteAppointment(appointment.appointment_id)
                    }
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showPopup && (
          <div className="appointment-popup-overlay">
            <div className="appointment-popup">
              <h3>
                {editingId !== null ? "Edit Appointment" : "Set Appointment"}
              </h3>

              <h5>To:</h5>
              <select
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
              >
                <option value="">Select Child</option>

                {children.map((child) => (
                  <option key={child.child_id} value={child.child_id}>
                    {child.child_name}
                  </option>
                ))}
              </select>

              <h5>Date:</h5>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <h5>Time:</h5>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />

              <h5>Subject:</h5>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <button className="appointment-cancel" onClick={clearForm}>
                Cancel
              </button>

              <button className="set" onClick={saveAppointment}>
                {editingId !== null ? "Update" : "Set"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointments;
