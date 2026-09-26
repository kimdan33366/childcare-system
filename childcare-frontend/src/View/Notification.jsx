
import "../css/Notification.css";

import { useEffect, useMemo, useState } from "react";

import {
  FaCalendarAlt,
  FaEnvelope,
  FaEye,
  FaPaperPlane,
  FaTrash,
} from "react-icons/fa";

import Sidebar from "../View/Sidebar";

import { defaultReminder } from "../Model/NotificationModel";

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [children, setChildren] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [appointmentSearch, setAppointmentSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] =
    useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [reminder, setReminder] = useState(defaultReminder);

  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
  });

  const [selectedChildren, setSelectedChildren] = useState([]);

  const [showChildList, setShowChildList] = useState(false);
  const [childSearch, setChildSearch] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser"),
  );

  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  // Permission helper
  const hasPermission = (permission) => {
    return (
      isAdmin ||
      permissions.includes("all") ||
      permissions.includes(permission)
    );
  };

  const showToast = (title, message) => {
    setToast({
      show: true,
      title,
      message,
    });

    setTimeout(() => {
      setToast({
        show: false,
        title: "",
        message: "",
      });
    }, 2500);
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/notifications",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications.");
      }

      const data = await response.json();

      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/appointments",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch appointments.");
      }

      const data = await response.json();

      const appointmentData = Array.isArray(data)
        ? data
        : Array.isArray(data.appointments)
          ? data.appointments
          : [];

      setAppointments(appointmentData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/children",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch children.");
      }

      const data = await response.json();

      setChildren(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching children:", error);
    }
  };

  const getChildById = (childId) => {
    return children.find(
      (child) => Number(child.child_id) === Number(childId),
    );
  };

  const getAppointmentChildren = (appointment) => {
    if (!appointment) {
      return [];
    }

    if (Array.isArray(appointment.children)) {
      return appointment.children;
    }

    if (Array.isArray(appointment.child)) {
      return appointment.child;
    }

    if (appointment.child) {
      return [appointment.child];
    }

    if (appointment.child_ids) {
      return appointment.child_ids
        .map((id) => getChildById(id))
        .filter(Boolean);
    }

    return [];
  };

  const getAppointmentParentNames = (appointment) => {
    const appointmentChildren =
      getAppointmentChildren(appointment);

    const parentNames = appointmentChildren
      .map((child) => {
        if (child?.user) {
          return child.user.user_fullname;
        }

        if (child?.parent) {
          return child.parent.user_fullname || child.parent;
        }

        const parentId =
          child?.user_id ||
          child?.parent_id;

        if (parentId) {
          const parent = children
            .map((item) => item.user)
            .find(
              (user) =>
                user &&
                Number(user.user_id) === Number(parentId),
            );

          return parent?.user_fullname;
        }

        return null;
      })
      .filter(Boolean);

    return [...new Set(parentNames)];
  };

  const getAppointmentDate = (appointment) => {
    if (!appointment?.appointment_date) {
      return "—";
    }

    const date = new Date(
      `${appointment.appointment_date}T00:00:00`,
    );

    if (Number.isNaN(date.getTime())) {
      return appointment.appointment_date;
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAppointmentTime = (appointment) => {
    if (!appointment?.appointment_time) {
      return "—";
    }

    const [hours, minutes] =
      appointment.appointment_time.split(":");

    if (hours === undefined || minutes === undefined) {
      return appointment.appointment_time;
    }

    const date = new Date();

    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));
    date.setSeconds(0);

    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getAppointmentChildNames = (appointment) => {
    const appointmentChildren =
      getAppointmentChildren(appointment);

    if (appointmentChildren.length === 0) {
      return "No children";
    }

    return appointmentChildren
      .map((child) => child.child_name)
      .filter(Boolean)
      .join(", ");
  };

  const isUpcomingAppointment = (appointment) => {
    if (!appointment?.appointment_date) {
      return false;
    }

    if (appointment.status !== "Pending") {
      return false;
    }

    const appointmentDateTime = new Date(
      `${appointment.appointment_date}T${
        appointment.appointment_time || "00:00:00"
      }`,
    );

    if (Number.isNaN(appointmentDateTime.getTime())) {
      return false;
    }

    return appointmentDateTime >= new Date();
  };

  const appointmentHasNotification = (appointment) => {
    if (!appointment?.appointment_id) {
      return false;
    }

    return notifications.some(
      (notification) =>
        Number(notification.appointment_id) ===
          Number(appointment.appointment_id) &&
        notification.type === "Appointment Reminder" &&
        notification.status === "Sent",
    );
  };

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(isUpcomingAppointment)
      .filter((appointment) => {
        const searchText =
          appointmentSearch.toLowerCase().trim();

        if (!searchText) {
          return true;
        }

        const appointmentId = String(
          appointment.appointment_id || "",
        ).toLowerCase();

        const childNames =
          getAppointmentChildNames(appointment).toLowerCase();

        const parentNames =
          getAppointmentParentNames(appointment)
            .join(" ")
            .toLowerCase();

        return (
          appointmentId.includes(searchText) ||
          childNames.includes(searchText) ||
          parentNames.includes(searchText)
        );
      })
      .sort((a, b) => {
        const first = new Date(
          `${a.appointment_date}T${
            a.appointment_time || "00:00:00"
          }`,
        );

        const second = new Date(
          `${b.appointment_date}T${
            b.appointment_time || "00:00:00"
          }`,
        );

        return first - second;
      });
  }, [appointments, appointmentSearch, children, notifications]);

  const filteredNotifications = notifications.filter((item) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      (item.parent || "")
        .toLowerCase()
        .includes(searchText) ||
      (item.child_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (item.message || "")
        .toLowerCase()
        .includes(searchText);

    const normalizedStatus = item.status || "Pending";

    const matchesStatus =
      statusFilter === "All" ||
      normalizedStatus === statusFilter;

    const matchesType =
      typeFilter === "All" ||
      (item.type || "General Announcement") === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const resetComposeForm = () => {
    setSelectedChildren([]);
    setChildSearch("");
    setShowChildList(false);

    setReminder({
      ...defaultReminder,
      type: "General Announcement",
    });
  };

  const closeComposeModal = () => {
    setShowModal(false);
    resetComposeForm();
  };

  const openAppointmentEmail = (appointment) => {
    const appointmentChildren =
      getAppointmentChildren(appointment);

    if (appointmentChildren.length === 0) {
      alert(
        "This appointment does not have any registered children.",
      );
      return;
    }

    setSelectedAppointment(appointment);

    const childNames = appointmentChildren
      .map((child) => child.child_name)
      .filter(Boolean);

    const date = getAppointmentDate(appointment);
    const time = getAppointmentTime(appointment);
    const address =
      appointment.address || "Barangay Health Center";

    const childText =
      childNames.length === 1
        ? childNames[0]
        : childNames.slice(0, -1).join(", ") +
          " and " +
          childNames[childNames.length - 1];

    const generatedMessage =
      `Hello,\n\n` +
      `This is a reminder that ${childText} ` +
      `has an upcoming appointment on ${date} at ${time} ` +
      `at ${address}.\n\n` +
      `Please make sure to attend the scheduled appointment.\n\n` +
      `Thank you,\n` +
      `Child Care Immunization Clinic`;

    setReminder({
      ...defaultReminder,
      type: "Appointment Reminder",
      message: generatedMessage,
    });

    setShowAppointmentModal(true);
  };

  const handleSendAppointmentEmail = async () => {
    if (!hasPermission("send_notifications")) {
      alert("You do not have permission to send notifications.");
      return;
    }

    if (!selectedAppointment) {
      return;
    }

    if (!reminder.message.trim()) {
      alert("Please enter a message.");
      return;
    }

    const appointmentChildren =
      getAppointmentChildren(selectedAppointment);

    if (appointmentChildren.length === 0) {
      alert(
        "This appointment does not have any registered children.",
      );
      return;
    }

    setIsSending(true);

    try {
      let successful = 0;
      let failed = 0;

      for (const child of appointmentChildren) {
        const response = await fetch(
          "http://127.0.0.1:8000/api/notifications",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              child_id: child.child_id,
              appointment_id:
                selectedAppointment.appointment_id,
              message: reminder.message,
              type: "Appointment Reminder",
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Appointment notification error:",
            data,
          );

          failed++;
          continue;
        }

        successful++;
      }

      await fetchNotifications();

      if (failed === 0) {
        showToast(
          "Email Sent",
          `Appointment reminder sent to ${successful} ${
            successful === 1 ? "parent" : "parents"
          }.`,
        );

        setTimeout(() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
          resetComposeForm();
        }, 2000);
      } else if (successful > 0) {
        showToast(
          "Partially Sent",
          `${successful} sent successfully and ${failed} failed.`,
        );
      } else {
        showToast(
          "Email Failed",
          "The appointment reminder could not be sent.",
        );
      }
    } catch (error) {
      console.error(
        "Error sending appointment email:",
        error,
      );

      showToast(
        "Error",
        "An error occurred while sending the appointment reminder.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!hasPermission("send_notifications")) {
      alert("You do not have permission to send notifications.");
      return;
    }

    if (selectedChildren.length === 0) {
      alert("Please select at least one child.");
      return;
    }

    if (!reminder.message.trim()) {
      alert("Please enter a message.");
      return;
    }

    setIsSending(true);

    try {
      let successful = 0;
      let failed = 0;

      for (const childId of selectedChildren) {
        const response = await fetch(
          "http://127.0.0.1:8000/api/notifications",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              child_id: childId,
              message: reminder.message,
              type:
                reminder.type ||
                "General Announcement",
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Notification error:", data);
          failed++;
          continue;
        }

        successful++;
      }

      await fetchNotifications();

      if (failed === 0) {
        showToast(
          "Email Sent",
          `Email sent to ${successful} ${
            successful === 1 ? "parent" : "parents"
          }.`,
        );
      } else if (successful > 0) {
        showToast(
          "Partially Sent",
          `${successful} sent successfully and ${failed} failed.`,
        );
      } else {
        showToast(
          "Email Failed",
          "The email could not be sent.",
        );
      }

      if (successful > 0) {
        setTimeout(() => {
          closeComposeModal();
        }, 2000);
      }
    } catch (error) {
      console.error("Error sending email:", error);

      showToast(
        "Error",
        "An error occurred while sending the email.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAll = async () => {
    if (!hasPermission("send_notifications")) {
      alert("You do not have permission to send notifications.");
      return;
    }

    if (!reminder.message.trim()) {
      alert("Please enter a message.");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/notifications/broadcast",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: reminder.message,
            type:
              reminder.type ||
              "General Announcement",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Broadcast error:", data);

        showToast(
          "Error",
          data.message || "Failed to send the email.",
        );

        return;
      }

      await fetchNotifications();

      const sentCount = (
        data.notifications || []
      ).filter(
        (item) => item.status === "Sent",
      ).length;

      const failedCount = (
        data.notifications || []
      ).filter(
        (item) => item.status === "Failed",
      ).length;

      if (failedCount === 0) {
        showToast(
          "Email Sent",
          `Email sent to ${sentCount} ${
            sentCount === 1 ? "parent" : "parents"
          }.`,
        );
      } else {
        showToast(
          "Partially Sent",
          `${sentCount} sent successfully and ${failedCount} failed.`,
        );
      }

      setTimeout(() => {
        closeComposeModal();
      }, 2000);
    } catch (error) {
      console.error("Error sending broadcast:", error);

      showToast(
        "Error",
        "Failed to send the email to all parents.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotification = async () => {
    if (!hasPermission("delete_notifications")) {
      alert("You do not have permission to delete notifications.");
      return;
    }

    if (!selectedNotification) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/notifications/${selectedNotification.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete notification.",
        );
      }

      setNotifications((previous) =>
        previous.filter(
          (item) =>
            item.id !== selectedNotification.id,
        ),
      );

      setShowDeleteModal(false);
      setSelectedNotification(null);

      showToast(
        "Notification Deleted",
        "The notification was removed from history.",
      );
    } catch (error) {
      console.error(
        "Error deleting notification:",
        error,
      );

      showToast(
        "Error",
        error.message ||
          "Failed to delete the notification.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowModal(false);
        setShowAppointmentModal(false);
        setShowViewModal(false);
        setShowDeleteModal(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () =>
      window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchAppointments();
    fetchChildren();
  }, []);

  // Page access
  if (!isAdmin && !permissions.includes("view_notifications")) {
    return (
      <div className="notification-container">
        <Sidebar />

        <div className="notification-main-content">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2>Access Denied</h2>
            <p>
              You do not have permission to access Notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalSent = notifications.filter(
    (item) => item.status === "Sent",
  ).length;

  const totalPending = notifications.filter(
    (item) => item.status === "Pending",
  ).length;

  const totalFailed = notifications.filter(
    (item) => item.status === "Failed",
  ).length;

  return (
    <div className="notification-container">
      <Sidebar />

      <div className="notification-main-content">
        {/* PAGE HEADER */}
        <div className="notification-page-title">
          <div>
            <h1>Notifications</h1>
            <p>
              Send appointment reminders and manage parent
              notifications.
            </p>
          </div>

          {hasPermission("send_notifications") && (
            <button
              className="notification-compose-btn"
              onClick={() => {
                resetComposeForm();
                setShowModal(true);
              }}
            >
              <FaPaperPlane />
              Compose Notification
            </button>
          )}
        </div>

        {/* SUMMARY CARDS */}
        <div className="notification-summary">
          <div className="notification-summary-card">
            <span>Total Sent</span>
            <strong>{totalSent}</strong>
          </div>

          <div className="notification-summary-card">
            <span>Pending</span>
            <strong>{totalPending}</strong>
          </div>

          <div className="notification-summary-card">
            <span>Failed</span>
            <strong>{totalFailed}</strong>
          </div>
        </div>

        {/* UPCOMING APPOINTMENTS */}
        <div className="notification-appointments">
          <div className="notification-appointments-header">
            <div>
              <div className="notification-section-title">
                <FaCalendarAlt />
                <h2>Upcoming Appointments</h2>
              </div>

              <p>
                Send email reminders to parents with upcoming
                appointments.
              </p>
            </div>

            <span className="notification-appointment-count">
              {upcomingAppointments.length} upcoming
            </span>
          </div>

          <div className="notification-appointment-toolbar">
            <input
              type="text"
              placeholder="Search appointments..."
              value={appointmentSearch}
              onChange={(e) =>
                setAppointmentSearch(e.target.value)
              }
            />
          </div>

          <div className="notification-appointment-table-wrapper">
            <table className="notification-table notification-appointment-table">
              <thead>
                <tr>
                  <th>Appointment</th>
                  <th>Children</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {upcomingAppointments.map((appointment) => {
                  const alreadySent =
                    appointmentHasNotification(
                      appointment,
                    );

                  return (
                    <tr
                      key={appointment.appointment_id}
                    >
                      <td>
                        <strong>
                          #
                          {
                            appointment.appointment_id
                          }
                        </strong>
                      </td>

                      <td>
                        <div className="notification-appointment-children">
                          {getAppointmentChildNames(
                            appointment,
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="notification-appointment-date">
                          <strong>
                            {getAppointmentDate(
                              appointment,
                            )}
                          </strong>

                          <span>
                            {getAppointmentTime(
                              appointment,
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="notification-status">
                          Pending
                        </span>
                      </td>

                      <td>
                        {hasPermission(
                          "send_notifications",
                        ) && (
                          <button
                            type="button"
                            className={
                              alreadySent
                                ? "notification-appointment-send-btn sent"
                                : "notification-appointment-send-btn"
                            }
                            onClick={() =>
                              openAppointmentEmail(
                                appointment,
                              )
                            }
                          >
                            <FaEnvelope />

                            {alreadySent
                              ? "Send Again"
                              : "Send Email"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {upcomingAppointments.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="notification-empty"
                    >
                      No upcoming appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NOTIFICATION HISTORY */}
        <div className="notification-history">
          <div className="notification-history-header">
            <div>
              <h2>Notification History</h2>

              <p>
                View and manage previously sent notifications.
              </p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="notification-filters">
            <input
              type="text"
              placeholder="Search parent, child, or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
            >
              <option value="All">All Types</option>
              <option value="Appointment Reminder">
                Appointment Reminder
              </option>
              <option value="Vaccination Reminder">
                Vaccination Reminder
              </option>
              <option value="Missed Vaccination">
                Missed Vaccination
              </option>
              <option value="General Announcement">
                General Announcement
              </option>
            </select>
          </div>

          {/* TABLE */}
          <div className="notification-table-wrapper">
            <table className="notification-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Child</th>
                  <th>Type</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredNotifications.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="notification-recipient">
                        <strong>
                          {item.parent || "Unknown"}
                        </strong>

                        {item.email && (
                          <small>{item.email}</small>
                        )}
                      </div>
                    </td>

                    <td>
                      {item.child_name || "All Parents"}
                    </td>

                    <td>
                      <span className="notification-type">
                        {item.type ||
                          "General Announcement"}
                      </span>
                    </td>

                    <td>
                      {item.created_at
                        ? new Date(
                            item.created_at,
                          ).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`notification-status notification-status-${(
                          item.status || "Pending"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {item.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      <div className="notification-action-buttons">
                        {hasPermission(
                          "view_notifications",
                        ) && (
                          <button
                            type="button"
                            className="notification-icon-btn notification-view-icon-btn"
                            title="View notification"
                            aria-label="View notification"
                            onClick={() => {
                              setSelectedNotification(
                                item,
                              );
                              setShowViewModal(true);
                            }}
                          >
                            <FaEye />
                          </button>
                        )}

                        {hasPermission(
                          "delete_notifications",
                        ) && (
                          <button
                            type="button"
                            className="notification-icon-btn notification-delete-icon-btn"
                            title="Delete notification"
                            aria-label="Delete notification"
                            onClick={() => {
                              setSelectedNotification(
                                item,
                              );
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredNotifications.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="notification-empty"
                    >
                      No notifications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GENERAL COMPOSE NOTIFICATION MODAL */}
      {showModal &&
        hasPermission("send_notifications") && (
          <div
            className="notification-modal-overlay"
            onClick={closeComposeModal}
          >
            <div
              className="notification-compose-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="notification-compose-header">
                <h2>Send Notification</h2>

                <p>
                  Send an email notification to selected
                  parents.
                </p>
              </div>

              <div className="notification-compose-body">
                <label>RECIPIENTS</label>

                <div className="notification-child-select">
                  <button
                    type="button"
                    className="notification-child-dropdown"
                    onClick={() =>
                      setShowChildList(
                        !showChildList,
                      )
                    }
                  >
                    {selectedChildren.length ===
                    0
                      ? "Select children"
                      : `${selectedChildren.length} child${
                          selectedChildren.length >
                          1
                            ? "ren"
                            : ""
                        } selected`}

                    <span>▼</span>
                  </button>

                  {showChildList && (
                    <div className="notification-child-list">
                      <input
                        type="text"
                        placeholder="Search child..."
                        value={childSearch}
                        onChange={(e) =>
                          setChildSearch(
                            e.target.value,
                          )
                        }
                      />

                      {children
                        .filter((child) =>
                          (
                            child.child_name ||
                            ""
                          )
                            .toLowerCase()
                            .includes(
                              childSearch.toLowerCase(),
                            ),
                        )
                        .map((child) => (
                          <label
                            key={child.child_id}
                            className="notification-child-option"
                          >
                            <input
                              type="checkbox"
                              checked={selectedChildren.includes(
                                child.child_id,
                              )}
                              onChange={() => {
                                setSelectedChildren(
                                  (previous) =>
                                    previous.includes(
                                      child.child_id,
                                    )
                                      ? previous.filter(
                                          (
                                            id,
                                          ) =>
                                            id !==
                                            child.child_id,
                                        )
                                      : [
                                          ...previous,
                                          child.child_id,
                                        ],
                                );
                              }}
                            />

                            {child.child_name}
                          </label>
                        ))}
                    </div>
                  )}
                </div>

                <label>TYPE</label>

                <select
                  className="notification-compose-type"
                  value={
                    reminder.type ||
                    "General Announcement"
                  }
                  onChange={(e) =>
                    setReminder({
                      ...reminder,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="General Announcement">
                    General Announcement
                  </option>

                  <option value="Vaccination Reminder">
                    Vaccination Reminder
                  </option>

                  <option value="Missed Vaccination">
                    Missed Vaccination
                  </option>
                </select>

                <label>MESSAGE</label>

                <textarea
                  rows="7"
                  value={reminder.message}
                  onChange={(e) =>
                    setReminder({
                      ...reminder,
                      message: e.target.value,
                    })
                  }
                />
              </div>

              <div className="notification-compose-footer">
                <button
                  className="notification-cancel-btn"
                  onClick={closeComposeModal}
                  disabled={isSending}
                >
                  Cancel
                </button>

                <button
                  className="notification-send-all-btn"
                  onClick={handleSendAll}
                  disabled={isSending}
                >
                  Send to all
                </button>

                <button
                  className="notification-send-btn"
                  onClick={handleSendEmail}
                  disabled={isSending}
                >
                  <FaPaperPlane />

                  {isSending
                    ? "Sending..."
                    : "Send Email"}
                </button>
              </div>
            </div>

            {toast.show && (
              <div className="notification-toast">
                <div className="notification-toast-icon">
                  ✓
                </div>

                <div>
                  <h4>{toast.title}</h4>
                  <p>{toast.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* APPOINTMENT EMAIL MODAL */}
      {showAppointmentModal &&
        selectedAppointment && (
          <div
            className="notification-modal-overlay"
            onClick={() => {
              if (!isSending) {
                setShowAppointmentModal(false);
                setSelectedAppointment(null);
              }
            }}
          >
            <div
              className="notification-appointment-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="notification-compose-header">
                <h2>Appointment Reminder</h2>

                <p>
                  Review the appointment information
                  before sending the email.
                </p>
              </div>

              <div className="notification-appointment-modal-body">
                <div className="notification-appointment-info">
                  <div className="notification-appointment-info-item">
                    <span>Appointment</span>

                    <strong>
                      #
                      {
                        selectedAppointment.appointment_id
                      }
                    </strong>
                  </div>

                  <div className="notification-appointment-info-item">
                    <span>Children</span>

                    <strong>
                      {getAppointmentChildNames(
                        selectedAppointment,
                      )}
                    </strong>
                  </div>

                  <div className="notification-appointment-info-item">
                    <span>Date</span>

                    <strong>
                      {getAppointmentDate(
                        selectedAppointment,
                      )}
                    </strong>
                  </div>

                  <div className="notification-appointment-info-item">
                    <span>Time</span>

                    <strong>
                      {getAppointmentTime(
                        selectedAppointment,
                      )}
                    </strong>
                  </div>

                  <div className="notification-appointment-info-item">
                    <span>Location</span>

                    <strong>
                      {selectedAppointment.address ||
                        "Barangay Health Center"}
                    </strong>
                  </div>

                  <div className="notification-appointment-info-item">
                    <span>Type</span>

                    <strong>
                      Appointment Reminder
                    </strong>
                  </div>
                </div>

                <label>MESSAGE</label>

                <textarea
                  className="notification-appointment-message"
                  rows="9"
                  value={reminder.message}
                  onChange={(e) =>
                    setReminder({
                      ...reminder,
                      message: e.target.value,
                    })
                  }
                />
              </div>

              <div className="notification-compose-footer">
                <button
                  className="notification-cancel-btn"
                  disabled={isSending}
                  onClick={() => {
                    setShowAppointmentModal(false);
                    setSelectedAppointment(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="notification-send-btn"
                  disabled={isSending}
                  onClick={
                    handleSendAppointmentEmail
                  }
                >
                  <FaPaperPlane />

                  {isSending
                    ? "Sending..."
                    : "Send Email"}
                </button>
              </div>
            </div>

            {toast.show && (
              <div className="notification-toast">
                <div className="notification-toast-icon">
                  ✓
                </div>

                <div>
                  <h4>{toast.title}</h4>
                  <p>{toast.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* VIEW NOTIFICATION MODAL */}
      {showViewModal &&
        selectedNotification && (
          <div
            className="notification-modal-overlay"
            onClick={() =>
              setShowViewModal(false)
            }
          >
            <div
              className="notification-view-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="notification-view-header">
                <div>
                  <h2>
                    Notification Details
                  </h2>

                  <p>
                    View notification information.
                  </p>
                </div>

                <button
                  type="button"
                  className="notification-view-close"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="notification-view-body">
                <div className="notification-detail-row">
                  <span>Recipient</span>

                  <strong>
                    {selectedNotification.parent ||
                      "Unknown"}
                  </strong>
                </div>

                <div className="notification-detail-row">
                  <span>Email</span>

                  <strong>
                    {selectedNotification.email ||
                      "—"}
                  </strong>
                </div>

                <div className="notification-detail-row">
                  <span>Child</span>

                  <strong>
                    {selectedNotification.child_name ||
                      "All Parents"}
                  </strong>
                </div>

                {selectedNotification.appointment_id && (
                  <div className="notification-detail-row">
                    <span>Appointment</span>

                    <strong>
                      #
                      {
                        selectedNotification.appointment_id
                      }
                    </strong>
                  </div>
                )}

                <div className="notification-detail-row">
                  <span>Type</span>

                  <strong>
                    {selectedNotification.type ||
                      "General Announcement"}
                  </strong>
                </div>

                <div className="notification-detail-row">
                  <span>Date & Time</span>

                  <strong>
                    {selectedNotification.created_at
                      ? new Date(
                          selectedNotification.created_at,
                        ).toLocaleString()
                      : "—"}
                  </strong>
                </div>

                <div className="notification-detail-row">
                  <span>Status</span>

                  <strong>
                    {selectedNotification.status ||
                      "Pending"}
                  </strong>
                </div>

                <div className="notification-detail-message">
                  <span>Message</span>

                  <p>
                    {selectedNotification.message ||
                      "No message available."}
                  </p>
                </div>
              </div>

              <div className="notification-view-footer">
                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal &&
        selectedNotification && (
          <div
            className="notification-modal-overlay"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setSelectedNotification(null);
              }
            }}
          >
            <div
              className="notification-delete-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="notification-delete-icon">
                <FaTrash />
              </div>

              <h2>Delete Notification</h2>

              <p>
                Are you sure you want to delete this
                notification?
              </p>

              <small>
                This will only remove the notification
                from history. The appointment and
                other records will not be affected.
              </small>

              <div className="notification-delete-footer">
                <button
                  type="button"
                  className="notification-cancel-btn"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedNotification(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="notification-delete-confirm-btn"
                  disabled={isDeleting}
                  onClick={
                    handleDeleteNotification
                  }
                >
                  <FaTrash />

                  {isDeleting
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* GLOBAL TOAST FOR NON-MODAL ACTIONS */}
      {!showModal &&
        !showAppointmentModal &&
        toast.show && (
          <div className="notification-toast notification-toast-global">
            <div className="notification-toast-icon">
              ✓
            </div>

            <div>
              <h4>{toast.title}</h4>
              <p>{toast.message}</p>
            </div>
          </div>
        )}
    </div>
  );
}

export default Notification;

