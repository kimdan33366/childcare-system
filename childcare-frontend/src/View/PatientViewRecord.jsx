import "../css/PatientViewRecord.css";

import { useState } from "react";

import {
  FaPaperPlane,
  FaUserCircle,
  FaArrowLeft,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

import Sidebar from "../View/Sidebar";

import {
  initialVaccines,
} from "../Model/PatientViewRecordModel";

import {
  PatientRecordController,
} from "../Controller/PatientViewRecordController";

function PatientViewRecord() {

  const [showSMSPopup, setShowSMSPopup] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [vaccines, setVaccines] =
    useState(initialVaccines);

  const handleVaccineChange = (
    index,
    field,
    value
  ) => {

    setVaccines(
      PatientRecordController.updateVaccine(
        vaccines,
        index,
        field,
        value
      )
    );

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

            <h2>Janice Alojado</h2>

            <div className="viewRecord-patient-details">

              <p>
                Birthday: Jan. 1, 2020
              </p>

              <p>
                Weight: 10 kg
              </p>

              <p>
                Height: 75 cm
              </p>

            </div>

            <div className="viewRecord-patient-detail">

              <p>
                <FaUserCircle />
                Ariel Amit
              </p>

              <p>
                097853253
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
                Janice Alojado
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