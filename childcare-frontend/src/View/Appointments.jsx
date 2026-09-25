import "../css/Appointment.css";
import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaPen,
  FaTimes,
  FaEye,
  FaTrash,
} from "react-icons/fa";
import Sidebar from "../View/Sidebar";

function Appointments() {
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );

  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  const hasPermission = (permission) => {
    return (
      isAdmin ||
      permissions.includes("all") ||
      permissions.includes(permission)
    );
  };

  // ==============================
  // DATA
  // ==============================

  const [appointments, setAppointments] = useState([]);
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [vaccines, setVaccines] = useState([]);

  // ==============================
  // FILTERS
  // ==============================

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");

  // ==============================
  // HOVER
  // ==============================

  const [hoveredAppointment, setHoveredAppointment] =
    useState(null);

  // ==============================
  // POPUP
  // ==============================

  const [showPopup, setShowPopup] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ==============================
  // FORM
  // ==============================

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState(
    "Barangay Health Center"
  );
  const [appointmentType, setAppointmentType] =
    useState("Vaccination");

  const [selectedParents, setSelectedParents] = useState([]);
  const [selectedChildren, setSelectedChildren] =
    useState([]);

  const [selectedVaccines, setSelectedVaccines] =
    useState([]);

  // ==============================
  // FETCH DATA
  // ==============================

  useEffect(() => {
    fetchAppointments();
    fetchParents();
    fetchChildren();
    fetchVaccines();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/appointments"
      );

      const data = await response.json();

      if (response.ok) {
        setAppointments(data);
      }
    } catch (error) {
      console.error(
        "Error fetching appointments:",
        error
      );
    }
  };

  const fetchParents = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/users"
      );

      const data = await response.json();

      if (response.ok) {
        setParents(
          data.filter(
            (parent) => parent.status === "Active"
          )
        );
      }
    } catch (error) {
      console.error(
        "Error fetching parents:",
        error
      );
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/children"
      );

      const data = await response.json();

      if (response.ok) {
        setChildren(data);
      }
    } catch (error) {
      console.error(
        "Error fetching children:",
        error
      );
    }
  };

  const fetchVaccines = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/vaccines"
      );

      const data = await response.json();

      if (response.ok) {
        setVaccines(data);
      }
    } catch (error) {
      console.error(
        "Error fetching vaccines:",
        error
      );
    }
  };

  // ==============================
  // GET PARENT NAMES
  // ==============================

  const getAppointmentParentNames = (appointment) => {
    const appointmentChildren =
      appointment.children || [];

    return [
      ...new Set(
        appointmentChildren
          .map((child) => {
            const parent = parents.find(
              (item) =>
                Number(item.user_id) ===
                Number(child.user_id)
            );

            return parent?.user_fullname || "";
          })
          .filter(Boolean)
      ),
    ];
  };

  const getAppointmentTitle = (appointment) => {
    const parentNames =
      getAppointmentParentNames(appointment);

    if (parentNames.length === 0) {
      return "No parent assigned";
    }

    if (parentNames.length === 1) {
      return parentNames[0];
    }

    return `${parentNames[0]} + ${
      parentNames.length - 1
    } ${
      parentNames.length - 1 === 1
        ? "other"
        : "others"
    }`;
  };

  // ==============================
  // FILTER APPOINTMENTS
  // ==============================

  const filteredAppointments = appointments.filter(
    (appointment) => {
      const appointmentChildren =
        appointment.children || [];

      const childNames = appointmentChildren
        .map((child) => child.child_name || "")
        .join(" ")
        .toLowerCase();

      const parentNames =
        getAppointmentParentNames(appointment)
          .join(" ")
          .toLowerCase();

      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        searchValue === "" ||
        childNames.includes(searchValue) ||
        parentNames.includes(searchValue) ||
        String(
          appointment.appointment_id
        ).includes(searchValue);

      const matchesDate =
        dateFilter === "All" ||
        appointment.appointment_date === dateFilter;

      return matchesSearch && matchesDate;
    }
  );

  // ==============================
  // SEPARATE APPOINTMENTS
  // ==============================

  const upcomingAppointments =
    filteredAppointments.filter(
      (appointment) =>
        (appointment.status || "Pending") ===
        "Pending"
    );

  const historyAppointments =
    filteredAppointments.filter((appointment) =>
      ["Completed", "Missed", "Cancelled"].includes(
        appointment.status
      )
    );

  // ==============================
  // OVERVIEW COUNTS
  // ==============================

  const upcomingCount = appointments.filter(
    (appointment) =>
      (appointment.status || "Pending") ===
      "Pending"
  ).length;

  const completedCount = appointments.filter(
    (appointment) =>
      appointment.status === "Completed"
  ).length;

  const missedCount = appointments.filter(
    (appointment) =>
      appointment.status === "Missed"
  ).length;

  // ==============================
  // AVAILABLE CHILDREN
  // ==============================

  const availableChildren = children.filter(
    (child) =>
      selectedParents.includes(child.user_id) &&
      child.status === "Continuing"
  );

  // ==============================
  // PARENT SELECTION
  // ==============================

  const toggleParent = (parentId) => {
    setSelectedParents((previous) => {
      const newSelectedParents =
        previous.includes(parentId)
          ? previous.filter(
              (id) => id !== parentId
            )
          : [...previous, parentId];

      setSelectedChildren((currentChildren) =>
        currentChildren.filter((childId) => {
          const child = children.find(
            (item) =>
              item.child_id === childId
          );

          return (
            child &&
            newSelectedParents.includes(
              child.user_id
            )
          );
        })
      );

      return newSelectedParents;
    });
  };

  // ==============================
  // CHILD SELECTION
  // ==============================

  const toggleChild = (childId) => {
    setSelectedChildren((previous) => {
      if (previous.includes(childId)) {
        return previous.filter(
          (id) => id !== childId
        );
      }

      return [...previous, childId];
    });
  };

  // ==============================
  // VACCINE SELECTION
  // ==============================

  const toggleVaccine = (vaccineId) => {
    setSelectedVaccines((previous) => {
      const existing = previous.find(
        (item) =>
          item.vaccine_id === vaccineId
      );

      if (existing) {
        return previous.filter(
          (item) =>
            item.vaccine_id !== vaccineId
        );
      }

      return [
        ...previous,
        {
          vaccine_id: vaccineId,
          dose_number: 1,
        },
      ];
    });
  };

  // ==============================
  // CHANGE DOSE
  // ==============================

  const changeDose = (vaccineId, dose) => {
    setSelectedVaccines((previous) =>
      previous.map((item) =>
        item.vaccine_id === vaccineId
          ? {
              ...item,
              dose_number: Number(dose),
            }
          : item
      )
    );
  };

  // ==============================
  // SAVE APPOINTMENT
  // ==============================

  const saveAppointment = async () => {
    if (
      editingId !== null &&
      !hasPermission("edit_appointments")
    ) {
      alert(
        "You do not have permission to edit appointments."
      );
      return;
    }

    if (
      editingId === null &&
      !hasPermission("add_appointments")
    ) {
      alert(
        "You do not have permission to add appointments."
      );
      return;
    }

    if (!date) {
      alert("Please select an appointment date.");
      return;
    }

    if (!time) {
      alert("Please select an appointment time.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter the clinic/location.");
      return;
    }

    if (selectedParents.length === 0) {
      alert(
        "Please select at least one parent or guardian."
      );
      return;
    }

    if (selectedChildren.length === 0) {
      alert(
        "Please select at least one continuing child."
      );
      return;
    }

    if (selectedVaccines.length === 0) {
      alert(
        "Please select at least one vaccine and dose."
      );
      return;
    }

    const existingAppointment =
      editingId !== null
        ? appointments.find(
            (appointment) =>
              appointment.appointment_id ===
              editingId
          )
        : null;

    const data = {
      admin_id:
        currentUser?.Admin_id ||
        currentUser?.admin_id ||
        1,

      staff_id:
        currentUser?.staff_id || null,

      appointment_date: date,
      appointment_time: time,
      address: address,
      appointment_type: appointmentType,

      status:
        existingAppointment?.status ||
        "Pending",

      child_ids: selectedChildren,
      vaccines: selectedVaccines,
    };

    try {
      let response;

      if (editingId !== null) {
        response = await fetch(
          `http://127.0.0.1:8000/api/appointments/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(data),
          }
        );
      } else {
        response = await fetch(
          "http://127.0.0.1:8000/api/appointments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(data),
          }
        );
      }

      const result = await response.json();

      if (!response.ok) {
        console.error(
          "Laravel error:",
          result
        );

        alert(
          result.message ||
            "An error occurred while saving the appointment."
        );

        return;
      }

      await fetchAppointments();

      clearForm();
    } catch (error) {
      console.error(
        "Error saving appointment:",
        error
      );

      alert(
        "Unable to connect to the server."
      );
    }
  };

  // ==============================
  // UPDATE STATUS
  // ==============================

  const updateAppointmentStatus = async (
    id,
    newStatus
  ) => {
    if (
      !hasPermission("edit_appointments")
    ) {
      alert(
        "You do not have permission to edit appointments."
      );
      return;
    }

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
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(
          "Laravel error:",
          result
        );

        alert(
          result.message ||
            "Failed to update appointment status."
        );

        return;
      }

      setHoveredAppointment(null);

      await fetchAppointments();
    } catch (error) {
      console.error(
        "Error updating appointment status:",
        error
      );
    }
  };

  // ==============================
  // CANCEL APPOINTMENT
  // ==============================

  const cancelAppointment = async (
    appointment
  ) => {
    if (
      !hasPermission("edit_appointments")
    ) {
      alert(
        "You do not have permission to cancel appointments."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) {
      return;
    }

    await updateAppointmentStatus(
      appointment.appointment_id,
      "Cancelled"
    );
  };

  // ==============================
  // EDIT APPOINTMENT
  // ==============================

  const openEditAppointment = (
    appointment
  ) => {
    if (
      !hasPermission("edit_appointments")
    ) {
      alert(
        "You do not have permission to edit appointments."
      );
      return;
    }

    setEditingId(
      appointment.appointment_id
    );

    setDate(
      appointment.appointment_date || ""
    );

    setTime(
      appointment.appointment_time || ""
    );

    setAddress(
      appointment.address ||
        "Barangay Health Center"
    );

    setAppointmentType(
      appointment.appointment_type ||
        "Vaccination"
    );

    const appointmentChildren =
      appointment.children || [];

    const childIds =
      appointmentChildren.map(
        (child) => child.child_id
      );

    const parentIds = [
      ...new Set(
        appointmentChildren
          .map((child) => child.user_id)
          .filter(Boolean)
      ),
    ];

    setSelectedChildren(childIds);
    setSelectedParents(parentIds);

    const appointmentVaccines =
      appointment.vaccines || [];

    setSelectedVaccines(
      appointmentVaccines.map(
        (item) => ({
          vaccine_id: item.vaccine_id,
          dose_number:
            item.dose_number || 1,
        })
      )
    );

    setHoveredAppointment(null);
    setShowPopup(true);
  };

  // ==============================
  // CLEAR FORM
  // ==============================

  const clearForm = () => {
    setDate("");
    setTime("");

    setAddress(
      "Barangay Health Center"
    );

    setAppointmentType(
      "Vaccination"
    );

    setSelectedParents([]);
    setSelectedChildren([]);
    setSelectedVaccines([]);

    setEditingId(null);
    setShowPopup(false);
  };

  // ==============================
  // STATUS CLASS
  // ==============================

  const getStatusClass = (status) => {
    return `status-${(
      status || "Pending"
    )
      .toLowerCase()
      .replace(" ", "-")}`;
  };

  // ==============================
  // APPOINTMENT ITEM
  // ==============================

  const renderAppointmentItem = (
    appointment,
    isHistory = false
  ) => {
    const appointmentChildren =
      appointment.children || [];

    const parentTitle =
      getAppointmentTitle(appointment);

    const isHovered =
      hoveredAppointment ===
      appointment.appointment_id;

    const status =
      appointment.status || "Pending";

    return (
      <div
        className={`appointment-item ${
          isHovered
            ? "appointment-item-hovered"
            : ""
        }`}
        key={appointment.appointment_id}
        onMouseEnter={() =>
          setHoveredAppointment(
            appointment.appointment_id
          )
        }
        onMouseLeave={() =>
          setHoveredAppointment(null)
        }
      >
        {/* COMPACT ROW */}
        <div className="appointment-item-main">
          <div className="appointment-item-date">
            <FaCalendarAlt />

            <span>
              {appointment.appointment_date}
            </span>
          </div>

          <div className="appointment-item-parent">
            {parentTitle}
          </div>

          <div
            className={`appointment-item-status ${getStatusClass(
              status
            )}`}
          >
            {status}
          </div>
        </div>

        {/* HOVER DETAILS */}
        {isHovered && (
          <div
            className={`appointment-hover-card ${
              isHistory
                ? "appointment-hover-history"
                : "appointment-hover-upcoming"
            }`}
            onMouseEnter={() =>
              setHoveredAppointment(
                appointment.appointment_id
              )
            }
          >
            <div className="appointment-hover-header">
              <div>
                <h4>
                  {parentTitle}
                </h4>

                <span>
                  {appointment.appointment_date}{" "}
                  •{" "}
                  {appointment.appointment_time}
                </span>
              </div>

              <span
                className={`appointment-status ${getStatusClass(
                  status
                )}`}
              >
                {status}
              </span>
            </div>

            <div className="appointment-hover-details">
              <div className="appointment-hover-detail">
                <span>Children</span>

                <strong>
                  {appointmentChildren.length >
                  0
                    ? appointmentChildren
                        .map(
                          (child) =>
                            child.child_name
                        )
                        .join(", ")
                    : "No children"}
                </strong>
              </div>

              <div className="appointment-hover-detail">
                <span>Appointment Type</span>

                <strong>
                  {appointment.appointment_type ||
                    "—"}
                </strong>
              </div>

              <div className="appointment-hover-detail">
                <span>Clinic / Location</span>

                <strong>
                  {appointment.address ||
                    "—"}
                </strong>
              </div>

              <div className="appointment-hover-detail">
                <span>Time</span>

                <strong>
                  {appointment.appointment_time ||
                    "—"}
                </strong>
              </div>

              <div className="appointment-hover-detail appointment-hover-vaccines">
                <span>Vaccines / Doses</span>

                <strong>
                  {appointment.vaccines?.length >
                  0
                    ? appointment.vaccines
                        .map(
                          (item) =>
                            `${
                              item.vaccine
                                ?.vaccine_name ||
                              "Unknown"
                            } (Dose ${
                              item.dose_number
                            })`
                        )
                        .join(", ")
                    : "No vaccines"}
                </strong>
              </div>
            </div>

            {/* UPCOMING ACTIONS */}
            {!isHistory && (
              <div className="appointment-hover-actions">
                {hasPermission(
                  "edit_appointments"
                ) && (
                  <button
                    className="appointment-edit-btn"
                    title="Edit appointment"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditAppointment(
                        appointment
                      );
                    }}
                  >
                    <FaPen />
                    <span>Edit</span>
                  </button>
                )}

                {hasPermission(
                  "edit_appointments"
                ) && (
                  <button
                    className="appointment-delete-btn"
                    title="Cancel appointment"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelAppointment(
                        appointment
                      );
                    }}
                  >
                    <FaTrash />
                    <span>Cancel</span>
                  </button>
                )}

                {hasPermission(
                  "edit_appointments"
                ) && (
                  <select
                    className={`appointment-hover-status ${getStatusClass(
                      status
                    )}`}
                    value={status}
                    onChange={(e) =>
                      updateAppointmentStatus(
                        appointment.appointment_id,
                        e.target.value
                      )
                    }
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Missed">
                      Missed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>
                  </select>
                )}
              </div>
            )}

            {/* HISTORY ACTION */}
            {isHistory && (
              <div className="appointment-hover-actions">
                <button
                  className="appointment-view-btn"
                  title="View appointment"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <FaEye />
                  <span>View</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==============================
  // ACCESS CONTROL
  // ==============================

  if (
    !isAdmin &&
    !permissions.includes(
      "view_appointments"
    )
  ) {
    return (
      <div className="appointment-dashboard">
        <Sidebar />

        <div className="appointment-main-content">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2>Access Denied</h2>

            <p>
              You do not have permission to
              access Appointments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className="appointment-dashboard">
      <Sidebar />

      <div className="appointment-main-content">

        {/* HEADER */}
        <div className="appointment-header">
          <div>
            <h3>Appointments</h3>

            <p>
              Manage upcoming appointments and
              appointment history.
            </p>
          </div>
        </div>

        {/* OVERVIEW */}
        <div className="appointment-overview">
          <div className="appointment-overview-card">
            <div>
              <span>Upcoming</span>
              <strong>
                {upcomingCount}
              </strong>
            </div>

            <FaCalendarAlt />
          </div>

          <div className="appointment-overview-card">
            <div>
              <span>Completed</span>
              <strong>
                {completedCount}
              </strong>
            </div>

            <FaEye />
          </div>

          <div className="appointment-overview-card">
            <div>
              <span>Missed</span>
              <strong>
                {missedCount}
              </strong>
            </div>

            <FaTimes />
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="appointment-toolbar">

          <div className="appointment-search-box">
            <input
              type="text"
              placeholder="Search child or parent..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <select
            className="appointment-filter"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(e.target.value)
            }
          >
            <option value="All">
              All Dates
            </option>

            {[
              ...new Set(
                appointments.map(
                  (appointment) =>
                    appointment.appointment_date
                )
              ),
            ].map((appointmentDate) => (
              <option
                key={appointmentDate}
                value={appointmentDate}
              >
                {appointmentDate}
              </option>
            ))}
          </select>

          {hasPermission(
            "add_appointments"
          ) && (
            <button
              className="appointment-button"
              onClick={() => {
                clearForm();
                setShowPopup(true);
              }}
            >
              Add Appointment
            </button>
          )}
        </div>

        {/* TWO COLUMN APPOINTMENT AREA */}
        <div className="appointment-columns">

          {/* ==========================
              UPCOMING
          ========================== */}

          <section className="appointment-section">
            <div className="appointment-section-header">
              <div>
                <h3>
                  Upcoming Appointments
                </h3>

                <p>
                  Pending and scheduled
                  appointments
                </p>
              </div>

              <span className="appointment-section-count">
                {upcomingAppointments.length}
              </span>
            </div>

            <div className="appointment-section-list">

              {upcomingAppointments.length ===
              0 ? (
                <div className="appointment-empty-section">
                  <FaCalendarAlt />

                  <h4>
                    No upcoming appointments
                  </h4>

                  <p>
                    There are no pending
                    appointments.
                  </p>
                </div>
              ) : (
                upcomingAppointments.map(
                  (appointment) =>
                    renderAppointmentItem(
                      appointment,
                      false
                    )
                )
              )}

            </div>

            {hasPermission(
              "add_appointments"
            ) && (
              <button
                className="appointment-add-bottom"
                onClick={() => {
                  clearForm();
                  setShowPopup(true);
                }}
              >
                + New Appointment
              </button>
            )}
          </section>

          {/* ==========================
              HISTORY
          ========================== */}

          <section className="appointment-section appointment-history-section">
            <div className="appointment-section-header">
              <div>
                <h3>
                  Appointment History
                </h3>

                <p>
                  Completed, missed, and
                  cancelled
                </p>
              </div>

              <span className="appointment-section-count">
                {historyAppointments.length}
              </span>
            </div>

            <div className="appointment-section-list">

              {historyAppointments.length ===
              0 ? (
                <div className="appointment-empty-section">
                  <FaEye />

                  <h4>
                    No appointment history
                  </h4>

                  <p>
                    Completed and missed
                    appointments will appear
                    here.
                  </p>
                </div>
              ) : (
                historyAppointments.map(
                  (appointment) =>
                    renderAppointmentItem(
                      appointment,
                      true
                    )
                )
              )}

            </div>
          </section>

        </div>

        {/* ==============================
            ADD / EDIT POPUP
        ============================== */}

        {showPopup &&
          (
            editingId === null
              ? hasPermission(
                  "add_appointments"
                )
              : hasPermission(
                  "edit_appointments"
                )
          ) && (
            <div className="appointment-popup-overlay">

              <div className="appointment-popup">

                {/* HEADER */}
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>
                    {editingId !== null
                      ? "Edit Appointment"
                      : "Set Appointment"}
                  </h3>

                  <button
                    type="button"
                    onClick={clearForm}
                    style={{
                      border: "none",
                      background:
                        "transparent",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* DATE */}
                <h5>Date:</h5>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                />

                {/* TIME */}
                <h5>Time:</h5>

                <input
                  type="time"
                  value={time}
                  onChange={(e) =>
                    setTime(e.target.value)
                  }
                />

                {/* LOCATION */}
                <h5>
                  Clinic / Location:
                </h5>

                <input
                  type="text"
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  placeholder="Clinic or location"
                />

                {/* TYPE */}
                <h5>
                  Appointment Type:
                </h5>

                <select
                  value={appointmentType}
                  onChange={(e) =>
                    setAppointmentType(
                      e.target.value
                    )
                  }
                >
                  <option value="Vaccination">
                    Vaccination
                  </option>

                  <option value="General">
                    General
                  </option>
                </select>

                {/* PARENTS */}
                <h5>
                  Parent / Guardian:
                </h5>

                <div
                  style={{
                    maxHeight: "130px",
                    overflowY: "auto",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  {parents.length === 0 ? (
                    <p>
                      No active parents
                      available.
                    </p>
                  ) : (
                    parents.map(
                      (parent) => (
                        <label
                          key={
                            parent.user_id
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            padding:
                              "6px 4px",
                            cursor:
                              "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedParents.includes(
                              parent.user_id
                            )}
                            onChange={() =>
                              toggleParent(
                                parent.user_id
                              )
                            }
                          />

                          <span>
                            {
                              parent.user_fullname
                            }
                          </span>
                        </label>
                      )
                    )
                  )}
                </div>

                {/* CHILDREN */}
                <h5>
                  Continuing Children:
                </h5>

                <div
                  style={{
                    maxHeight: "130px",
                    overflowY: "auto",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  {selectedParents.length ===
                  0 ? (
                    <p>
                      Select a parent or
                      guardian first.
                    </p>
                  ) : availableChildren.length ===
                    0 ? (
                    <p>
                      No continuing children
                      found for the selected
                      parent(s).
                    </p>
                  ) : (
                    availableChildren.map(
                      (child) => (
                        <label
                          key={
                            child.child_id
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            padding:
                              "6px 4px",
                            cursor:
                              "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedChildren.includes(
                              child.child_id
                            )}
                            onChange={() =>
                              toggleChild(
                                child.child_id
                              )
                            }
                          />

                          <span>
                            {
                              child.child_name
                            }
                          </span>

                          <small
                            style={{
                              color:
                                "#9ca3af",
                            }}
                          >
                            (
                            {
                              child
                                .user
                                ?.user_fullname
                            }
                            )
                          </small>
                        </label>
                      )
                    )
                  )}
                </div>

                {/* VACCINES */}
                <h5>
                  Vaccines / Doses:
                </h5>

                <div
                  style={{
                    maxHeight: "160px",
                    overflowY: "auto",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  {vaccines.length === 0 ? (
                    <p>
                      No vaccines available.
                    </p>
                  ) : (
                    vaccines.map(
                      (vaccine) => {
                        const selected =
                          selectedVaccines.find(
                            (item) =>
                              item.vaccine_id ===
                              vaccine.vaccine_ID
                          );

                        return (
                          <div
                            key={
                              vaccine.vaccine_ID
                            }
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                              padding:
                                "6px 4px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                !!selected
                              }
                              onChange={() =>
                                toggleVaccine(
                                  vaccine.vaccine_ID
                                )
                              }
                            />

                            <span
                              style={{
                                flex: 1,
                              }}
                            >
                              {
                                vaccine.vaccine_name
                              }
                            </span>

                            {selected && (
                              <select
                                value={
                                  selected.dose_number
                                }
                                onChange={(
                                  e
                                ) =>
                                  changeDose(
                                    vaccine.vaccine_ID,
                                    e.target
                                      .value
                                  )
                                }
                                style={{
                                  width:
                                    "90px",
                                }}
                              >
                                <option value="1">
                                  Dose 1
                                </option>

                                <option value="2">
                                  Dose 2
                                </option>

                                <option value="3">
                                  Dose 3
                                </option>

                                <option value="4">
                                  Dose 4
                                </option>

                                <option value="5">
                                  Dose 5
                                </option>
                              </select>
                            )}
                          </div>
                        );
                      }
                    )
                  )}
                </div>

                {/* BUTTONS */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "10px",
                  }}
                >
                  <button
                    className="appointment-cancel"
                    onClick={clearForm}
                  >
                    Cancel
                  </button>

                  <button
                    className="set"
                    onClick={saveAppointment}
                  >
                    {editingId !== null
                      ? "Update"
                      : "Set Appointment"}
                  </button>
                </div>

              </div>

            </div>
          )}

      </div>
    </div>
  );
}

export default Appointments;