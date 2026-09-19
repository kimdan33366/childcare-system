import "../css/Notification.css";

import { useEffect, useState } from "react";

import { FaPaperPlane } from "react-icons/fa";

import Sidebar from "../View/Sidebar";

import { defaultReminder } from "../Model/NotificationModel";

import { NotificationController } from "../Controller/NotificationController";

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [reminder, setReminder] = useState(defaultReminder);

  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
  });

  const [children, setChildren] = useState([]);

  const [selectedChildren, setSelectedChildren] = useState([]);

  const [showChildList, setShowChildList] = useState(false);

  const [childSearch, setChildSearch] = useState("");

  // Logged-in user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

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
    }, 2000);
  };

  const handleSendSMS = async () => {
    if (!hasPermission("send_notifications")) {
      alert("You do not have permission to send notifications.");
      return;
    }

    if (selectedChildren.length === 0) {
      alert("Please select at least one child.");
      return;
    }

    try {
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
              parent: reminder.parent,
              phone: reminder.phone,
              message: reminder.message,
              status: "Reminder Sent",
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          return;
        }

        const updated = await fetch(
          "http://127.0.0.1:8000/api/notifications",
        );

        const updatedData = await updated.json();

        setNotifications(updatedData);
      }

      showToast(
        "SMS Reminder Sent",
        `Reminder sent to ${selectedChildren.length} ${
          selectedChildren.length === 1 ? "child" : "children"
        }.`,
      );

      setTimeout(() => {
        setShowModal(false);
        setSelectedChildren([]);
        setChildSearch("");
      }, 2000);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handleSendAll = async () => {
    if (!hasPermission("send_notifications")) {
      alert("You do not have permission to send notifications.");
      return;
    }

    try {
      const notification = await NotificationController.createBroadcast(
        reminder.message,
      );

      setNotifications((prev) => [notification, ...prev]);

      showToast("Reminder Sent", "The reminder was sent to all parents.");

      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    } catch (error) {
      console.error("Error sending broadcast:", error);

      showToast("Error", "Failed to send the reminder to all parents.");
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowModal(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/notifications")
      .then((response) => response.json())
      .then((data) => {
        setNotifications(data);
      })
      .catch((error) => {
        console.error("Error fetching notifications:", error);
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

  // Page access
  if (!isAdmin && !permissions.includes("view_notifications")) {
    return (
      <div className="notification-container">
        <Sidebar />

        <div className="notification-main-content">
          <div style={{ padding: "40px", textAlign: "center" }}>
            <h2>Access Denied</h2>
            <p>
              You do not have permission to access Notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-container">
      <Sidebar />

      <div className="notification-main-content">
        {/* PAGE HEADER */}
        <div className="notification-page-title">
          <div>
            <h1>Notifications</h1>
            <p>Send reminders and monitor parent notifications.</p>
          </div>

          {hasPermission("send_notifications") && (
            <button
              className="notification-compose-btn"
              onClick={() => setShowModal(true)}
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

            <strong>
              {
                notifications.filter(
                  (item) =>
                    item.status === "Sent" ||
                    item.status === "Reminder Sent",
                ).length
              }
            </strong>
          </div>

          <div className="notification-summary-card">
            <span>Pending</span>

            <strong>
              {
                notifications.filter(
                  (item) => item.status === "Pending",
                ).length
              }
            </strong>
          </div>

          <div className="notification-summary-card">
            <span>Failed</span>

            <strong>
              {
                notifications.filter(
                  (item) => item.status === "Failed",
                ).length
              }
            </strong>
          </div>
        </div>

        {/* NOTIFICATION HISTORY */}
        <div className="notification-history">
          <div className="notification-history-header">
            <div>
              <h2>Notification History</h2>

              <p>View and manage sent notifications.</p>
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
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Vaccination Reminder">
                Vaccination Reminder
              </option>
              <option value="Appointment Reminder">
                Appointment Reminder
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
                {notifications
                  .filter((item) => {
                    const searchText = search.toLowerCase();

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

                    const normalizedStatus =
                      item.status === "Reminder Sent"
                        ? "Sent"
                        : item.status || "Pending";

                    const matchesStatus =
                      statusFilter === "All" ||
                      normalizedStatus === statusFilter;

                    const matchesType =
                      typeFilter === "All" ||
                      (item.type || "General Announcement") ===
                        typeFilter;

                    return matchesSearch && matchesStatus && matchesType;
                  })
                  .map((item) => (
                    <tr key={item.id}>
                      <td>{item.parent || "Unknown"}</td>

                      <td>{item.child_name || "Unknown Child"}</td>

                      <td>
                        {item.type || "General Announcement"}
                      </td>

                      <td>
                        {item.created_at
                          ? new Date(
                              item.created_at,
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <span className="notification-status">
                          {item.status === "Reminder Sent"
                            ? "Sent"
                            : item.status || "Pending"}
                        </span>
                      </td>

                      <td>
                        {hasPermission("view_notifications") && (
                          <button
                            type="button"
                            className="notification-view-btn"
                            onClick={() => {
                              setSelectedNotification(item);
                              setShowViewModal(true);
                            }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                {notifications.filter((item) => {
                  const searchText = search.toLowerCase();

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

                  const normalizedStatus =
                    item.status === "Reminder Sent"
                      ? "Sent"
                      : item.status || "Pending";

                  const matchesStatus =
                    statusFilter === "All" ||
                    normalizedStatus === statusFilter;

                  const matchesType =
                    typeFilter === "All" ||
                    (item.type || "General Announcement") ===
                      typeFilter;

                  return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesType
                  );
                }).length === 0 && (
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

      {/* COMPOSE NOTIFICATION MODAL */}
      {showModal && hasPermission("send_notifications") && (
        <div
          className="notification-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="notification-compose-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-compose-header">
              <h2>Send Reminder</h2>

              <p>
                {reminder.child}
                {" · "}
                {reminder.parent}
              </p>
            </div>

            <div className="notification-compose-body">
              <label>TO</label>

              <div className="notification-child-select">
                <button
                  type="button"
                  className="notification-child-dropdown"
                  onClick={() =>
                    setShowChildList(!showChildList)
                  }
                >
                  {selectedChildren.length === 0
                    ? "Select children"
                    : `${selectedChildren.length} child${
                        selectedChildren.length > 1
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
                        setChildSearch(e.target.value)
                      }
                    />

                    {children
                      .filter((child) =>
                        (child.child_name || "")
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
                                        (id) =>
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
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="notification-send-all-btn"
                onClick={handleSendAll}
              >
                Send to all
              </button>

              <button
                className="notification-send-btn"
                onClick={handleSendSMS}
              >
                <FaPaperPlane />
                Send SMS
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
      {showViewModal && selectedNotification && (
        <div
          className="notification-modal-overlay"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="notification-view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-view-header">
              <div>
                <h2>Notification Details</h2>
                <p>View notification information.</p>
              </div>

              <button
                type="button"
                className="notification-view-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="notification-view-body">
              <div className="notification-detail-row">
                <span>Recipient</span>
                <strong>
                  {selectedNotification.parent || "Unknown"}
                </strong>
              </div>

              <div className="notification-detail-row">
                <span>Child</span>
                <strong>
                  {selectedNotification.child_name ||
                    "Unknown Child"}
                </strong>
              </div>

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
                  {selectedNotification.status ===
                  "Reminder Sent"
                    ? "Sent"
                    : selectedNotification.status ||
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
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notification;