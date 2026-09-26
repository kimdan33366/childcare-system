import "../css/Appointment.css";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaPen,
  FaTimes,
  FaEye,
  FaTrash,
  FaUser,
  FaChild,
  FaSyringe,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import Sidebar from "../View/Sidebar";

function Appointments() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [searchParams, setSearchParams] = useSearchParams();
  const childFilterId = searchParams.get("child_id");

  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  const hasPermission = (permission) => {
    return (
      isAdmin || permissions.includes("all") || permissions.includes(permission)
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

  const [hoveredAppointment, setHoveredAppointment] = useState(null);

  // ==============================
  // POPUP
  // ==============================

  const [showPopup, setShowPopup] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showChildSelection, setShowChildSelection] = useState(false);
  const [selectedHistoryAppointment, setSelectedHistoryAppointment] =
    useState(null);

  // ==============================
  // FORM
  // ==============================

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("Barangay Health Center");
  const [appointmentType, setAppointmentType] = useState("Vaccination");

  const [selectedParents, setSelectedParents] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState([]);

  const [selectedVaccines, setSelectedVaccines] = useState([]);

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
      const response = await fetch("http://127.0.0.1:8000/api/appointments");

      const data = await response.json();

      if (response.ok) {
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };
  useEffect(() => {
    if (!childFilterId || children.length === 0) {
      return;
    }

    const filteredChild = children.find(
      (child) => String(child.child_id) === String(childFilterId),
    );

    if (filteredChild) {
      setSearch(filteredChild.child_name || "");
    }
  }, [childFilterId, children]);

  const fetchParents = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/users");

      const data = await response.json();

      if (response.ok) {
        setParents(data.filter((parent) => parent.status === "Active"));
      }
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/children");

      const data = await response.json();

      if (response.ok) {
        setChildren(data);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    }
  };

  const fetchVaccines = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/vaccines");

      const data = await response.json();

      if (response.ok) {
        setVaccines(data);
      }
    } catch (error) {
      console.error("Error fetching vaccines:", error);
    }
  };

  // ==============================
  // GET PARENT NAMES
  // ==============================

  const getAppointmentParentNames = (appointment) => {
    const appointmentChildren = appointment.children || [];

    return [
      ...new Set(
        appointmentChildren
          .map((child) => {
            const parent = parents.find(
              (item) => Number(item.user_id) === Number(child.user_id),
            );

            return parent?.user_fullname || "";
          })
          .filter(Boolean),
      ),
    ];
  };

  const getAppointmentTitle = (appointment) => {
    const parentNames = getAppointmentParentNames(appointment);

    if (parentNames.length === 0) {
      return "No parent assigned";
    }

    if (parentNames.length === 1) {
      return parentNames[0];
    }

    return `${parentNames[0]} + ${parentNames.length - 1} ${
      parentNames.length - 1 === 1 ? "other" : "others"
    }`;
  };

  // ==============================
  // FILTER APPOINTMENTS
  // ==============================

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentChildren = appointment.children || [];

    const childNames = appointmentChildren
      .map((child) => child.child_name || "")
      .join(" ")
      .toLowerCase();

    const parentNames = getAppointmentParentNames(appointment)
      .join(" ")
      .toLowerCase();

    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      searchValue === "" ||
      childNames.includes(searchValue) ||
      parentNames.includes(searchValue) ||
      String(appointment.appointment_id).includes(searchValue);

    const matchesDate =
      dateFilter === "All" || appointment.appointment_date === dateFilter;

    const matchesChild =
      !childFilterId ||
      appointmentChildren.some(
        (child) => String(child.child_id) === String(childFilterId),
      );

    return matchesSearch && matchesDate && matchesChild;
  });

  // ==============================
  // SEPARATE APPOINTMENTS
  // ==============================

  const upcomingAppointments = filteredAppointments.filter(
    (appointment) => (appointment.status || "Pending") === "Pending",
  );

  const historyAppointments = filteredAppointments.filter((appointment) =>
    ["Completed", "Missed", "Cancelled"].includes(appointment.status),
  );

  // ==============================
  // OVERVIEW COUNTS
  // ==============================

  const upcomingCount = appointments.filter(
    (appointment) => (appointment.status || "Pending") === "Pending",
  ).length;

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "Completed",
  ).length;

  const missedCount = appointments.filter(
    (appointment) => appointment.status === "Missed",
  ).length;

  // ==============================
  // AVAILABLE CHILDREN
  // ==============================

  const availableChildren = children.filter(
    (child) =>
      selectedParents.includes(child.user_id) && child.status === "Continuing",
  );

  // ==============================
  // PARENT SELECTION
  // ==============================

  const toggleParent = (parentId) => {
    setSelectedParents((previous) => {
      const newSelectedParents = previous.includes(parentId)
        ? previous.filter((id) => id !== parentId)
        : [...previous, parentId];

      setSelectedChildren((currentChildren) =>
        currentChildren.filter((childId) => {
          const child = children.find((item) => item.child_id === childId);

          return child && newSelectedParents.includes(child.user_id);
        }),
      );

      return newSelectedParents;
    });
  };

  // ==============================
  // CHILD SELECTION
  // ==============================

  const toggleChild = (childId) => {
    setSelectedChildren((previous) => {
      const isAlreadySelected = previous.includes(childId);

      // Removing a child is always allowed
      if (isAlreadySelected) {
        return previous.filter((id) => id !== childId);
      }

      const newSelectedChildren = [...previous, childId];

      // Check every currently selected vaccine
      const insufficientVaccine = selectedVaccines.find((selected) => {
        const vaccine = vaccines.find(
          (item) => item.vaccine_ID === selected.vaccine_id,
        );

        if (!vaccine) {
          return false;
        }

        const availableStock = Number(vaccine.stock_quantity || 0);

        return availableStock < newSelectedChildren.length;
      });

      if (insufficientVaccine) {
        const vaccine = vaccines.find(
          (item) => item.vaccine_ID === insufficientVaccine.vaccine_id,
        );

        alert(
          `Cannot select this child because ${vaccine?.vaccine_name || "the selected vaccine"} ` +
            `does not have enough stock for ${newSelectedChildren.length} children.`,
        );

        return previous;
      }

      return newSelectedChildren;
    });
  };

  // ==============================
  // VACCINE SELECTION
  // ==============================

  const toggleVaccine = (vaccineId) => {
    const vaccine = vaccines.find((item) => item.vaccine_ID === vaccineId);

    if (!vaccine) {
      return;
    }

    const requiredStock = selectedChildren.length;
    const availableStock = Number(vaccine.stock_quantity || 0);

    setSelectedVaccines((previous) => {
      const existing = previous.find((item) => item.vaccine_id === vaccineId);

      // Remove vaccine if already selected
      if (existing) {
        return previous.filter((item) => item.vaccine_id !== vaccineId);
      }

      // No children selected yet
      if (requiredStock === 0) {
        alert("Please select at least one child first.");
        return previous;
      }

      // Not enough stock
      if (availableStock < requiredStock) {
        alert(
          `${vaccine.vaccine_name} does not have enough stock. ` +
            `Required: ${requiredStock}, Available: ${availableStock}.`,
        );
        return previous;
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
          : item,
      ),
    );
  };

  // ==============================
  // SAVE APPOINTMENT
  // ==============================

  const saveAppointment = async () => {
    if (editingId !== null && !hasPermission("edit_appointments")) {
      alert("You do not have permission to edit appointments.");
      return;
    }

    if (editingId === null && !hasPermission("add_appointments")) {
      alert("You do not have permission to add appointments.");
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
      alert("Please select at least one parent or guardian.");
      return;
    }

    if (selectedChildren.length === 0) {
      alert("Please select at least one continuing child.");
      return;
    }

    if (selectedVaccines.length === 0) {
      alert("Please select at least one vaccine and dose.");
      return;
    }

    const existingAppointment =
      editingId !== null
        ? appointments.find(
            (appointment) => appointment.appointment_id === editingId,
          )
        : null;

    const data = {
      admin_id: currentUser?.Admin_id || currentUser?.admin_id || 1,

      staff_id: currentUser?.staff_id || null,

      appointment_date: date,
      appointment_time: time,
      address: address,
      appointment_type: appointmentType,

      status: existingAppointment?.status || "Pending",

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
          },
        );
      } else {
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

      if (!response.ok) {
        console.error("Laravel error:", result);

        alert(
          result.message || "An error occurred while saving the appointment.",
        );

        return;
      }

      await fetchAppointments();

      clearForm();
    } catch (error) {
      console.error("Error saving appointment:", error);

      alert("Unable to connect to the server.");
    }
  };

  // ==============================
  // UPDATE STATUS
  // ==============================

  const updateAppointmentStatus = async (id, newStatus) => {
    if (!hasPermission("edit_appointments")) {
      alert("You do not have permission to edit appointments.");
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
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", result);

        alert(result.message || "Failed to update appointment status.");

        return;
      }

      setHoveredAppointment(null);

      await fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  // ==============================
  // CANCEL APPOINTMENT
  // ==============================

  const cancelAppointment = async (appointment) => {
    if (!hasPermission("edit_appointments")) {
      alert("You do not have permission to cancel appointments.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?",
    );

    if (!confirmed) {
      return;
    }

    await updateAppointmentStatus(appointment.appointment_id, "Cancelled");
  };

  // ==============================
  // EDIT APPOINTMENT
  // ==============================

  const openEditAppointment = (appointment) => {
    if (!hasPermission("edit_appointments")) {
      alert("You do not have permission to edit appointments.");
      return;
    }

    setEditingId(appointment.appointment_id);

    setDate(appointment.appointment_date || "");

    setTime(appointment.appointment_time || "");

    setAddress(appointment.address || "Barangay Health Center");

    setAppointmentType(appointment.appointment_type || "Vaccination");

    const appointmentChildren = appointment.children || [];

    const childIds = appointmentChildren.map((child) => child.child_id);

    const parentIds = [
      ...new Set(
        appointmentChildren.map((child) => child.user_id).filter(Boolean),
      ),
    ];

    setSelectedChildren(childIds);
    setSelectedParents(parentIds);

    const appointmentVaccines = appointment.vaccines || [];

    setSelectedVaccines(
      appointmentVaccines.map((item) => ({
        vaccine_id: item.vaccine_id,
        dose_number: item.dose_number || 1,
      })),
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

    setAddress("Barangay Health Center");

    setAppointmentType("Vaccination");

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
    return `status-${(status || "Pending").toLowerCase().replace(" ", "-")}`;
  };

  // ==============================
  // APPOINTMENT ITEM
  // ==============================

  const renderAppointmentItem = (appointment, isHistory = false) => {
    const appointmentChildren = appointment.children || [];

    const parentTitle = getAppointmentTitle(appointment);

    const isHovered = hoveredAppointment === appointment.appointment_id;

    const status = appointment.status || "Pending";

    return (
      <div
        className={`appointment-item ${
          isHovered ? "appointment-item-hovered" : ""
        }`}
        key={appointment.appointment_id}
        onMouseEnter={() => setHoveredAppointment(appointment.appointment_id)}
        onMouseLeave={() => setHoveredAppointment(null)}
      >
        <div className="appointment-item-main">
          <div className="appointment-item-date">
            <FaCalendarAlt />

            <span>{appointment.appointment_date}</span>
          </div>

          <div className="appointment-item-parent">{parentTitle}</div>

          <div className={`appointment-item-status ${getStatusClass(status)}`}>
            {status}
          </div>
        </div>

        {isHovered && (
          <div
            className={`appointment-hover-card ${
              isHistory
                ? "appointment-hover-history"
                : "appointment-hover-upcoming"
            }`}
            onMouseEnter={() =>
              setHoveredAppointment(appointment.appointment_id)
            }
          >
            <div className="appointment-hover-header">
              <div>
                <h4>{parentTitle}</h4>

                <span>
                  {appointment.appointment_date} •{" "}
                  {appointment.appointment_time}
                </span>
              </div>

              <span className={`appointment-status ${getStatusClass(status)}`}>
                {status}
              </span>
            </div>

            <div className="appointment-hover-details">
              <div className="appointment-hover-detail">
                <span>Children</span>

                <strong>
                  {appointmentChildren.length > 0
                    ? appointmentChildren
                        .map((child) => child.child_name)
                        .join(", ")
                    : "No children"}
                </strong>
              </div>

              <div className="appointment-hover-detail">
                <span>Appointment Type</span>

                <strong>{appointment.appointment_type || "—"}</strong>
              </div>

              <div className="appointment-hover-detail">
                <span>Clinic / Location</span>

                <strong>{appointment.address || "—"}</strong>
              </div>

              <div className="appointment-hover-detail">
                <span>Time</span>

                <strong>{appointment.appointment_time || "—"}</strong>
              </div>

              <div className="appointment-hover-detail appointment-hover-vaccines">
                <span>Vaccines / Doses</span>

                <strong>
                  {appointment.vaccines?.length > 0
                    ? appointment.vaccines
                        .map(
                          (item) =>
                            `${item.vaccine?.vaccine_name || "Unknown"} (Dose ${
                              item.dose_number
                            })`,
                        )
                        .join(", ")
                    : "No vaccines"}
                </strong>
              </div>
            </div>

            {!isHistory && (
              <div className="appointment-hover-actions">
                {hasPermission("edit_appointments") && (
                  <button
                    className="appointment-edit-btn"
                    title="Edit appointment"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditAppointment(appointment);
                    }}
                  >
                    <FaPen />
                    <span>Edit</span>
                  </button>
                )}

                {hasPermission("edit_appointments") && (
                  <button
                    className="appointment-delete-btn"
                    title="Cancel appointment"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelAppointment(appointment);
                    }}
                  >
                    <FaTrash />
                    <span>Cancel</span>
                  </button>
                )}
                <button
                  className="appointment-view-btn"
                  title="View appointment"
                  onClick={(e) => {
                    e.stopPropagation();

                    if (appointment.children?.length === 1) {
                      window.location.href = `/patient_viewrecord/${appointment.children[0].child_id}`;
                    } else if (appointment.children?.length > 1) {
                      setSelectedHistoryAppointment(appointment);
                      setShowChildSelection(true);
                    }
                  }}
                >
                  <FaEye />
                  <span>View</span>
                </button>

                {hasPermission("edit_appointments") && (
                  <select
                    className={`appointment-hover-status ${getStatusClass(
                      status,
                    )}`}
                    value={status}
                    onChange={(e) =>
                      updateAppointmentStatus(
                        appointment.appointment_id,
                        e.target.value,
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="Pending">Pending</option>

                    <option value="Completed">Completed</option>

                    <option value="Missed">Missed</option>

                    <option value="Cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            )}

            {isHistory && (
              <div className="appointment-hover-actions">
                <button
                  className="appointment-view-btn"
                  title="View appointment"
                  onClick={(e) => {
                    e.stopPropagation();

                    if (appointment.children?.length === 1) {
                      window.location.href = `/patient_viewrecord/${appointment.children[0].child_id}`;
                    } else if (appointment.children?.length > 1) {
                      setSelectedHistoryAppointment(appointment);
                      setShowChildSelection(true);
                    }
                  }}
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

  if (!isAdmin && !permissions.includes("view_appointments")) {
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

            <p>You do not have permission to access Appointments.</p>
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

            <p>Manage upcoming appointments and appointment history.</p>
          </div>
        </div>

        {/* OVERVIEW */}
        <div className="appointment-overview">
          <div className="appointment-overview-card">
            <div>
              <span>Upcoming</span>
              <strong>{upcomingCount}</strong>
            </div>

            <FaCalendarAlt />
          </div>

          <div className="appointment-overview-card">
            <div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>

            <FaEye />
          </div>

          <div className="appointment-overview-card">
            <div>
              <span>Missed</span>
              <strong>{missedCount}</strong>
            </div>

            <FaTimes />
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="appointment-toolbar">
          <div className="appointment-search-box">
            <input
              type="text"
              value={search}
              placeholder="Enter child name or Parent"
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);

                if (childFilterId && value.trim() === "") {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete("child_id");
                  setSearchParams(newParams);
                }
              }}
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
            ].map((appointmentDate) => (
              <option key={appointmentDate} value={appointmentDate}>
                {appointmentDate}
              </option>
            ))}
          </select>

          {hasPermission("add_appointments") && (
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
          {/* UPCOMING */}
          <section className="appointment-section">
            <div className="appointment-section-header">
              <div>
                <h3>Upcoming Appointments</h3>

                <p>Pending and scheduled appointments</p>
              </div>

              <span className="appointment-section-count">
                {upcomingAppointments.length}
              </span>
            </div>

            <div className="appointment-section-list">
              {upcomingAppointments.length === 0 ? (
                <div className="appointment-empty-section">
                  <FaCalendarAlt />

                  <h4>No upcoming appointments</h4>

                  <p>There are no pending appointments.</p>
                </div>
              ) : (
                upcomingAppointments.map((appointment) =>
                  renderAppointmentItem(appointment, false),
                )
              )}
            </div>

            {hasPermission("add_appointments") && (
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

          {/* HISTORY */}
          <section className="appointment-section appointment-history-section">
            <div className="appointment-section-header">
              <div>
                <h3>Appointment History</h3>

                <p>Completed, missed, and cancelled</p>
              </div>

              <span className="appointment-section-count">
                {historyAppointments.length}
              </span>
            </div>

            <div className="appointment-section-list">
              {historyAppointments.length === 0 ? (
                <div className="appointment-empty-section">
                  <FaEye />

                  <h4>No appointment history</h4>

                  <p>Completed and missed appointments will appear here.</p>
                </div>
              ) : (
                historyAppointments.map((appointment) =>
                  renderAppointmentItem(appointment, true),
                )
              )}
            </div>
          </section>
        </div>

        {/* ==============================
            REDESIGNED ADD / EDIT POPUP
        ============================== */}

        {showPopup &&
          (editingId === null
            ? hasPermission("add_appointments")
            : hasPermission("edit_appointments")) && (
            <div className="appointment-popup-overlay">
              <div className="appointment-popup">
                {/* POPUP HEADER */}
                <div className="appointment-popup-header">
                  <div className="appointment-popup-title">
                    <div className="appointment-popup-title-icon">
                      <FaCalendarAlt />
                    </div>

                    <div>
                      <h3>
                        {editingId !== null
                          ? "Edit Appointment"
                          : "Set Appointment"}
                      </h3>

                      <p>
                        {editingId !== null
                          ? "Update the appointment details below."
                          : "Create a new clinic appointment."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="appointment-popup-close"
                    onClick={clearForm}
                    aria-label="Close"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* POPUP BODY */}
                <div className="appointment-popup-body">
                  {/* APPOINTMENT DETAILS */}
                  <div className="appointment-form-section">
                    <div className="appointment-form-section-heading">
                      <div className="appointment-form-section-icon">
                        <FaCalendarAlt />
                      </div>

                      <div>
                        <h4>Appointment Details</h4>

                        <span>
                          When and where will the appointment take place?
                        </span>
                      </div>
                    </div>

                    <div className="appointment-details-grid">
                      <div className="appointment-field">
                        <label>Date</label>

                        <div className="appointment-input-icon">
                          <FaCalendarAlt />

                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="appointment-field">
                        <label>Time</label>

                        <div className="appointment-input-icon">
                          <FaClock />

                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="appointment-field appointment-field-full">
                        <label>Clinic / Location</label>

                        <div className="appointment-input-icon">
                          <FaMapMarkerAlt />

                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Clinic or location"
                          />
                        </div>
                      </div>

                      <div className="appointment-field appointment-field-full">
                        <label>Appointment Type</label>

                        <select
                          value={appointmentType}
                          onChange={(e) => setAppointmentType(e.target.value)}
                        >
                          <option value="Vaccination">Vaccination</option>

                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PARENT / GUARDIAN */}
                  <div className="appointment-form-section">
                    <div className="appointment-form-section-heading">
                      <div className="appointment-form-section-icon">
                        <FaUser />
                      </div>

                      <div>
                        <h4>Parent / Guardian</h4>

                        <span>Select one or more parents or guardians.</span>
                      </div>

                      <span className="appointment-selection-count">
                        {selectedParents.length} selected
                      </span>
                    </div>

                    <div className="appointment-selection-box">
                      {parents.length === 0 ? (
                        <div className="appointment-no-data">
                          No active parents available.
                        </div>
                      ) : (
                        <div className="appointment-parent-grid">
                          {parents.map((parent) => {
                            const selected = selectedParents.includes(
                              parent.user_id,
                            );

                            return (
                              <button
                                type="button"
                                key={parent.user_id}
                                className={`appointment-select-card ${
                                  selected ? "selected" : ""
                                }`}
                                onClick={() => toggleParent(parent.user_id)}
                              >
                                <span className="appointment-card-checkbox">
                                  {selected ? "✓" : ""}
                                </span>

                                <span className="appointment-select-card-icon">
                                  <FaUser />
                                </span>

                                <span className="appointment-select-card-text">
                                  <strong>{parent.user_fullname}</strong>

                                  <small>Parent / Guardian</small>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CHILDREN */}
                  <div className="appointment-form-section">
                    <div className="appointment-form-section-heading">
                      <div className="appointment-form-section-icon">
                        <FaChild />
                      </div>

                      <div>
                        <h4>Children</h4>

                        <span>
                          Select the continuing children for this appointment.
                        </span>
                      </div>

                      <span className="appointment-selection-count">
                        {selectedChildren.length} selected
                      </span>
                    </div>

                    <div className="appointment-selection-box">
                      {selectedParents.length === 0 ? (
                        <div className="appointment-no-data">
                          Select a parent or guardian first.
                        </div>
                      ) : availableChildren.length === 0 ? (
                        <div className="appointment-no-data">
                          No continuing children found for the selected
                          parent(s).
                        </div>
                      ) : (
                        <div className="appointment-child-grid">
                          {availableChildren.map((child) => {
                            const selected = selectedChildren.includes(
                              child.child_id,
                            );

                            return (
                              <button
                                type="button"
                                key={child.child_id}
                                className={`appointment-select-card ${
                                  selected ? "selected" : ""
                                }`}
                                onClick={() => toggleChild(child.child_id)}
                              >
                                <span className="appointment-card-checkbox">
                                  {selected ? "✓" : ""}
                                </span>

                                <span className="appointment-select-card-icon child-icon">
                                  <FaChild />
                                </span>

                                <span className="appointment-select-card-text">
                                  <strong>{child.child_name}</strong>

                                  <small>
                                    {child.user?.user_fullname ||
                                      "Parent / Guardian"}
                                  </small>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VACCINES */}
                  <div className="appointment-form-section">
                    <div className="appointment-form-section-heading">
                      <div className="appointment-form-section-icon">
                        <FaSyringe />
                      </div>

                      <div>
                        <h4>Vaccines & Doses</h4>

                        <span>
                          Select the vaccines and assign the required dose.
                        </span>
                      </div>

                      <span className="appointment-selection-count">
                        {selectedVaccines.length} selected
                      </span>
                    </div>

                    <div className="appointment-vaccine-list">
                      {vaccines.length === 0 ? (
                        <div className="appointment-no-data">
                          No vaccines available.
                        </div>
                      ) : (
                        vaccines.map((vaccine) => {
                          const selected = selectedVaccines.find(
                            (item) => item.vaccine_id === vaccine.vaccine_ID,
                          );

                          return (
                            <div
                              key={vaccine.vaccine_ID}
                              className={`appointment-vaccine-row ${
                                selected ? "selected" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="appointment-vaccine-select"
                                disabled={
                                  !selected &&
                                  (selectedChildren.length === 0 ||
                                    Number(vaccine.stock_quantity || 0) <
                                      selectedChildren.length)
                                }
                                onClick={() =>
                                  toggleVaccine(vaccine.vaccine_ID)
                                }
                              >
                                <span className="appointment-card-checkbox">
                                  {selected ? "✓" : ""}
                                </span>

                                <span className="appointment-vaccine-icon">
                                  <FaSyringe />
                                </span>

                                <span className="appointment-vaccine-name">
                                  <strong>{vaccine.vaccine_name}</strong>

                                  <small>
                                    Available: {vaccine.stock_quantity ?? 0}
                                  </small>
                                </span>
                              </button>

                              {selected && (
                                <select
                                  value={selected.dose_number}
                                  onChange={(e) =>
                                    changeDose(
                                      vaccine.vaccine_ID,
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="1">Dose 1</option>

                                  <option value="2">Dose 2</option>

                                  <option value="3">Dose 3</option>

                                  <option value="4">Dose 4</option>

                                  <option value="5">Dose 5</option>
                                </select>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* POPUP FOOTER */}
                <div className="appointment-popup-footer">
                  <div className="appointment-popup-summary">
                    <span>
                      {selectedParents.length} parent
                      {selectedParents.length !== 1 ? "s" : ""}
                    </span>

                    <span>
                      {selectedChildren.length} child
                      {selectedChildren.length !== 1 ? "ren" : ""}
                    </span>

                    <span>
                      {selectedVaccines.length} vaccine
                      {selectedVaccines.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="appointment-popup-actions">
                    <button
                      type="button"
                      className="appointment-cancel"
                      onClick={clearForm}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="set"
                      onClick={saveAppointment}
                    >
                      {editingId !== null
                        ? "Update Appointment"
                        : "Set Appointment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        {showChildSelection && selectedHistoryAppointment && (
          <div
            className="history-child-popup-overlay"
            onClick={() => {
              setShowChildSelection(false);
              setSelectedHistoryAppointment(null);
            }}
          >
            <div
              className="history-child-popup"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="history-child-popup-header">
                <div>
                  <span className="history-child-popup-label">
                    APPOINTMENT HISTORY
                  </span>

                  <h3>Select Child</h3>

                  <p>
                    This appointment contains multiple children. Select a child
                    to view their vaccination record.
                  </p>
                </div>

                <button
                  className="history-child-popup-close"
                  onClick={() => {
                    setShowChildSelection(false);
                    setSelectedHistoryAppointment(null);
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="history-child-list">
                {selectedHistoryAppointment.children.map((child) => (
                  <button
                    key={child.child_id}
                    className="history-child-item"
                    onClick={() => {
                      window.location.href = `/patient_viewrecord/${child.child_id}`;
                    }}
                  >
                    <div className="history-child-icon">
                      <FaEye />
                    </div>

                    <div className="history-child-info">
                      <strong>{child.child_name}</strong>
                      <span>
                        {child.gender || "Child"} · ID #{child.child_id}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="history-child-popup-footer">
                <button
                  className="history-child-cancel"
                  onClick={() => {
                    setShowChildSelection(false);
                    setSelectedHistoryAppointment(null);
                  }}
                >
                  Cancel
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
