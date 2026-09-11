import "../css/PatientViewRecord.css";

import { useState, useEffect } from "react";

import {
  FaPaperPlane,
  FaUserCircle,
  FaArrowLeft,
} from "react-icons/fa";

import { NavLink, useParams } from "react-router-dom";

import Sidebar from "../View/Sidebar";

import {
  initialVaccines,
} from "../Model/PatientViewRecordModel";

import {
  PatientRecordController,
} from "../Controller/PatientViewRecordController";

function PatientViewRecord() {
  const { child_id } = useParams();
    const [child, setChild] = useState(null);
    
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

  const [showSMSPopup, setShowSMSPopup] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [vaccines, setVaccines] =
    useState([]);

  const handleVaccineChange = async (
  index,
  field,
  value
) => {
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
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      console.log("Status updated successfully");
    } catch (error) {
      console.error(
        "Error updating status:",
        error
      );
    }
  }
};

  return (
    <div className="viewRecord-dashboard">

      <Sidebar />

      <div className="viewRecord-patient-box">

        <NavLink
          to="/patients"
          className="viewRecord-back-btn"
        >
          <FaArrowLeft />
          Back
        </NavLink>

        <div className="viewRecord-patient-card">

          <div className="viewRecord-patient-info">

            <h2>{child?.child_name || "Child's Name"}</h2>

            <div className="viewRecord-patient-details">

              <p>
                Birthday: {child?.birthdate || "Date of Birth"}
              </p>

              <p>
                Weight: {child?.weight || "Weight"} kg
              </p>

              <p>
                Height: {child?.height || "Height"} cm
              </p>

            </div>

            <div className="viewRecord-patient-detail">

              <p>
                <FaUserCircle />
                {child?.parent_name || "Parent's Name"}
              </p>

              <p>
                {child?.phone_number || "Phone Number"}
              </p>

            </div>

          </div>

          <button
            className="viewRecord-sms-btn"
            onClick={() =>
              setShowSMSPopup(true)
            }
          >
            <FaPaperPlane />
            Send SMS
          </button>

        </div>

        {showSMSPopup && (

          <div className="viewRecord-popup-overlay">

            <div className="viewRecord-popup">

              <h2>
                Send Reminder
              </h2>

              <h4>
                {child?.child_name || "Child's Name"}
              </h4>

              <label>
                Recipient
              </label>

              <input
                type="text"
                placeholder="Enter contact number"
              />

              <label>
                Message
              </label>

              <textarea
                rows="5"
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
              />

              <div className="viewRecord-popup-buttons">

                <button
                  className="viewRecord-cancel-btn"
                  onClick={() =>
                    setShowSMSPopup(false)
                  }
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
                  Send
                </button>

                <button
                  className="viewRecord-send-all-btn"
                  onClick={() => {

                    alert(
                      "SMS Sent to all!"
                    );

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

        <div className="viewRecord-table-box">

          <table className="viewRecord-schedule-table">

            <thead>

              <tr>
                <th colSpan="6">
                  <h2>
                    Vaccine Schedule
                  </h2>
                </th>
              </tr>

              <tr>
  <th>Vaccine</th>
  <th>Dose</th>
  <th>Date</th>
  <th>Status</th>
  <th>Place</th>
  <th>Provider</th>
</tr>

            </thead>

            <tbody>

              {vaccines.map(
                (item, index) => (

                  <tr key={item.id}>

                    <td>
                      <input
                        type="text"
                        value={
                          item.vaccine
                        }
                        onChange={(e) =>
                          handleVaccineChange(
                            index,
                            "vaccine",
                            e.target.value
                          )
                        }
                        className="viewRecord-table-input"
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={
                          item.dose
                        }
                        onChange={(e) =>
                          handleVaccineChange(
                            index,
                            "dose",
                            e.target.value
                          )
                        }
                        className="viewRecord-table-input"
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        value={
                          item.date
                        }
                        onChange={(e) =>
                          handleVaccineChange(
                            index,
                            "date",
                            e.target.value
                          )
                        }
                        className="viewRecord-table-input"
                      />
                    </td>

                    <td>

                      <select
                        value={
                          item.status
                        }
                        onChange={(e) =>
                          handleVaccineChange(
                            index,
                            "status",
                            e.target.value
                          )
                        }
                        className="viewRecord-status"
                      >

                        <option>
                          Done
                        </option>

                        <option>
                          Pending
                        </option>

                        <option>
                          Completed
                        </option>

                        <option>
                          Upcoming
                        </option>

                        <option>
                          Not Given
                        </option>

                      </select>

                    </td>
<td>
  <input
    type="text"
    value={item.place}
    placeholder="Vaccination address"
    onChange={(e) =>
      handleVaccineChange(
        index,
        "place",
        e.target.value
      )
    }
    className="viewRecord-table-input"
  />
</td>

<td>
  <input
    type="text"
    value={item.provider}
    placeholder="Provider"
    onChange={(e) =>
      handleVaccineChange(
        index,
        "provider",
        e.target.value
      )
    }
    className="viewRecord-table-input"
  />
</td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default PatientViewRecord;