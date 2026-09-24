import "../css/Appointment.css";
import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaPen,
  FaTimes,
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

      // Find parent names using child.user_id
      // and the already fetched parents list.
      const parentNames = appointmentChildren
        .map((child) => {
          const parent = parents.find(
            (item) =>
              Number(item.user_id) ===
              Number(child.user_id)
          );

          return parent?.user_fullname || "";
        })
        .join(" ")
        .toLowerCase();

      const searchValue = search.toLowerCase();

      const matchesSearch =
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
      if (previous.includes(parentId)) {
        return previous.filter(
          (id) => id !== parentId
        );
      }

      return [...previous, parentId];
    });

    setSelectedChildren((previous) =>
      previous.filter((childId) => {
        const child = children.find(
          (item) => item.child_id === childId
        );

        return (
          child &&
          selectedParents.includes(child.user_id) &&
          child.user_id !== parentId
        );
      })
    );
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
        (item) => item.vaccine_id === vaccineId
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

    console.log(
      "Appointment data being sent:",
      data
    );

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

      console.log(
        "Appointment response:",
        result
      );

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

      await fetchAppointments();
    } catch (error) {
      console.error(
        "Error updating appointment status:",
        error
      );
    }
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
          <h3>Appointments</h3>
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

        {/* APPOINTMENT LIST */}
        <div className="appointment-content-container">

          {filteredAppointments.length ===
          0 ? (
            <div className="appointment-empty-state">

              <div className="appointment-empty-icon">
                <FaCalendarAlt />
              </div>

              <h3>
                No appointments yet
              </h3>

              <p>
                There are currently no
                appointments scheduled.
              </p>

              {hasPermission(
                "add_appointments"
              ) && (
                <button
                  className="appointment-empty-button"
                  onClick={() => {
                    clearForm();
                    setShowPopup(true);
                  }}
                >
                  Add Appointment
                </button>
              )}

            </div>
          ) : (
            filteredAppointments.map(
              (appointment) => {

                const appointmentChildren =
                  appointment.children || [];

                // ==============================
                // GET PARENT NAMES
                // ==============================

                /*
                 * The appointment's children contain
                 * user_id, while the parent names come
                 * from the /api/users request.
                 *
                 * So we match:
                 *
                 * child.user_id
                 *       ↓
                 * parent.user_id
                 *
                 * instead of relying on child.user.
                 */

                const appointmentParentNames = [
                  ...new Set(
                    appointmentChildren
                      .map((child) => {
                        const parent =
                          parents.find(
                            (item) =>
                              Number(
                                item.user_id
                              ) ===
                              Number(
                                child.user_id
                              )
                          );

                        return (
                          parent?.user_fullname ||
                          ""
                        );
                      })
                      .filter(Boolean)
                  ),
                ];

                let appointmentTitle =
                  "No parent assigned";

                if (
                  appointmentParentNames.length ===
                  1
                ) {
                  appointmentTitle =
                    appointmentParentNames[0];
                } else if (
                  appointmentParentNames.length > 1
                ) {
                  appointmentTitle = `${appointmentParentNames[0]} + ${
                    appointmentParentNames.length - 1
                  } ${
                    appointmentParentNames.length - 1 ===
                    1
                      ? "other"
                      : "others"
                  }`;
                }

                return (
                  <div
                    className="appointment-content"
                    key={
                      appointment.appointment_id
                    }
                  >

                    {/* ICON */}
                    <div className="appointment-icon-wrapper">
                      <FaCalendarAlt className="appointment-content-icon" />
                    </div>

                    {/* CONTENT */}
                    <div className="appointment-content-text">

                      <div className="appointment-title-row">

                        {/* PARENT NAME */}
                        <h3>
                          {appointmentTitle}
                        </h3>

                        {hasPermission(
                          "edit_appointments"
                        ) ? (
                          <select
                            className={`appointment-status status-${(
                              appointment.status ||
                              "Pending"
                            )
                              .toLowerCase()
                              .replace(
                                " ",
                                "-"
                              )}`}
                            value={
                              appointment.status ||
                              "Pending"
                            }
                            onChange={(e) =>
                              updateAppointmentStatus(
                                appointment.appointment_id,
                                e.target.value
                              )
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
                        ) : (
                          <span
                            className={`appointment-status status-${(
                              appointment.status ||
                              "Pending"
                            )
                              .toLowerCase()
                              .replace(
                                " ",
                                "-"
                              )}`}
                          >
                            {appointment.status ||
                              "Pending"}
                          </span>
                        )}

                      </div>

                      {/* CHILDREN */}
                      <div className="appointment-details">

                        <div className="appointment-detail">
                          <span className="appointment-detail-label">
                            Children
                          </span>

                          <span>
                            {appointmentChildren.length >
                            0
                              ? appointmentChildren
                                  .map(
                                    (
                                      child
                                    ) =>
                                      child.child_name
                                  )
                                  .join(
                                    ", "
                                  )
                              : "No children"}
                          </span>
                        </div>

                        <div className="appointment-detail">
                          <span className="appointment-detail-label">
                            Date
                          </span>

                          <span>
                            {
                              appointment.appointment_date
                            }
                          </span>
                        </div>

                        <div className="appointment-detail">
                          <span className="appointment-detail-label">
                            Time
                          </span>

                          <span>
                            {
                              appointment.appointment_time
                            }
                          </span>
                        </div>

                        <div className="appointment-detail">
                          <span className="appointment-detail-label">
                            Type
                          </span>

                          <span>
                            {
                              appointment.appointment_type ||
                              "—"
                            }
                          </span>
                        </div>

                        <div className="appointment-detail">
                          <span className="appointment-detail-label">
                            Location
                          </span>

                          <span>
                            {
                              appointment.address ||
                              "—"
                            }
                          </span>
                        </div>

                        <div className="appointment-detail">
                          <span className="appointment-detail-label">
                            Vaccines
                          </span>

                          <span>
                            {appointment.vaccines?.length >
                            0
                              ? appointment.vaccines
                                  .map(
                                    (
                                      item
                                    ) =>
                                      `${
                                        item
                                          .vaccine
                                          ?.vaccine_name ||
                                        "Unknown"
                                      } (Dose ${
                                        item.dose_number
                                      })`
                                  )
                                  .join(
                                    ", "
                                  )
                              : "No vaccines"}
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="appointment-action-buttons">

                      {hasPermission(
                        "edit_appointments"
                      ) && (
                        <button
                          className="appointment-edit-btn"
                          title="Edit appointment"
                          onClick={() =>
                            openEditAppointment(
                              appointment
                            )
                          }
                        >
                          <FaPen />
                        </button>
                      )}

                    </div>

                  </div>
                );
              }
            )
          )}

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
                <h5>Clinic / Location:</h5>

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