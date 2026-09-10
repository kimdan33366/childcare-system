import "../css/Notification.css";


import { useEffect, useState } from "react";

import {
  FaPaperPlane,
  FaPhoneAlt,
} from "react-icons/fa";

import Sidebar from "../View/Sidebar";

import {
  
  defaultReminder,
} from "../Model/NotificationModel";

import {
  NotificationController,
} from "../Controller/NotificationController";

function Notification() {

  const [notifications, setNotifications] =useState([]);

  const [showModal, setShowModal] =useState(false);

  const [reminder, setReminder] =useState(defaultReminder);

  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
  });
  const [children, setChildren] = useState([]);

  const [selectedChildren, setSelectedChildren] =useState([]);

  const [showChildList, setShowChildList] =useState(false);

  const [childSearch, setChildSearch] =useState("");

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
  if (selectedChildren.length === 0) {
    alert("Please select at least one child.");
    return;
  }

  try {
    for (const childId of selectedChildren) {

      const selectedChild = children.find(
        (child) => child.child_id === childId
      );

      const response = await fetch(
        "http://127.0.0.1:8000/api/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            child_id: childId,
            parent: reminder.parent,
            phone: reminder.phone,
            message: reminder.message,
            status: "Reminder Sent",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      const updated = await fetch(
        "http://127.0.0.1:8000/api/notifications"
      );

      const updatedData = await updated.json();

      setNotifications(updatedData);
    }

    showToast(
      "SMS Reminder Sent",
      `Reminder sent to ${selectedChildren.length} ${
        selectedChildren.length === 1
          ? "child"
          : "children"
      }.`
    );

    setTimeout(() => {
      setShowModal(false);
      setSelectedChildren([]);
      setChildSearch("");
    }, 2000);

  } catch (error) {
    console.error(
      "Error sending notification:",
      error
    );
  }
};

  const handleSendAll = async () => {
  try {
    const notification =
      await NotificationController.createBroadcast(
        reminder.message
      );

    setNotifications((prev) => [
      notification,
      ...prev,
    ]);

    showToast(
      "Reminder Sent",
      "The reminder was sent to all parents."
    );

    setTimeout(() => {
      setShowModal(false);
    }, 2000);

  } catch (error) {
    console.error("Error sending broadcast:", error);

    showToast(
      "Error",
      "Failed to send the reminder to all parents."
    );
  }
};

  useEffect(() => {

    const handleEsc = (event) => {

      if (event.key === "Escape") {
        setShowModal(false);
      }

    };

    window.addEventListener(
      "keydown",
      handleEsc
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleEsc
      );

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
 
  return (
    <div className="notification-container">

      <Sidebar />

      <div className="notification-main-content">

        <div className="notification-page-title">
          <h1>Notifications</h1>
        </div>

        <div className="notification-compose-section">

          <button
            className="notification-compose-btn"
            onClick={() =>
              setShowModal(true)
            }
          >
            <FaPaperPlane />
            Compose
          </button>

        </div>

        <div className="notification-pending-card">

          <h2>Pending Actions</h2>

          {notifications.map((item) => (

            <div
              className="notification-item"
              key={item.id}
            >

              <div
                className={
                  item.status === "Overdue"
                    ? "status-dot red"
                    : item.status ===
                      "Reminder Sent"
                    ? "status-dot green"
                    : "status-dot yellow"
                }
              />

              <div className="notification-info">

                <h3>
                 {item.child_name || "Unknown Child"}
                </h3>

                <p>
                  {item.status}
                  <span>
                    {" · "}
                    {item.parent}
                  </span>
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

      {showModal && (

        <div
          className="notification-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="notification-compose-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="notification-compose-header">

              <h2>
                Send Reminder
              </h2>

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
          selectedChildren.length > 1 ? "ren" : ""
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
            .includes(childSearch.toLowerCase())
        )
        .map((child) => (

          <label
            key={child.child_id}
            className="notification-child-option"
          >

            <input
              type="checkbox"
              checked={selectedChildren.includes(
                child.child_id
              )}
              onChange={() => {

                setSelectedChildren((previous) =>

                  previous.includes(child.child_id)

                    ? previous.filter(
                        (id) =>
                          id !== child.child_id
                      )

                    : [
                        ...previous,
                        child.child_id,
                      ]

                );

              }}
            />

            {child.child_name}

          </label>

        ))}

    </div>
    

  )}

</div>
            </div>
            <label>
  MESSAGE
</label>

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
            <div className="notification-compose-footer">

              <button
                className="notification-cancel-btn"
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="notification-send-all-btn"
                onClick={
                  handleSendAll
                }
              >
                Send to all
              </button>

              <button
                className="notification-send-btn"
                onClick={
                  handleSendSMS
                }
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

                <h4>
                  {toast.title}
                </h4>

                <p>
                  {toast.message}
                </p>

              </div>

            </div>

          )}

        </div>

      )}

    </div>
  );
}

export default Notification;