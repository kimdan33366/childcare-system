import "../css/Patients.css";

import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaPlus,
  FaPaperPlane,
  FaEye,
  FaUserCircle,
  FaPhoneAlt,
} from "react-icons/fa";

import Sidebar from "../View/Sidebar";

import {
 
  defaultSMSMessage,
} from "../Model/PatientModel";

import {
  PatientController,
} from "../Controller/PatientController";

function Patients() {

  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );

  const [patients, setPatients] =
    useState([]);

  const [search, setSearch] = useState("");

  const [showAddPatient, setShowAddPatient] =
    useState(false);

  const [showSMSModal, setShowSMSModal] =
    useState(false);

  const [sendToAll, setSendToAll] =
    useState(false);

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [message, setMessage] =
    useState(defaultSMSMessage);

  const [childName, setChildName] =
    useState("");

  const [age, setAge] =
    useState("");

  const [birthdate, setBirthdate] =
    useState("");

  const [sex, setSex] =
    useState("");

  const [motherName, setMotherName] =
    useState("");

  const [fatherName, setFatherName] =
    useState("");

  const [address, setAddress] =
    useState("");

  const filteredPatients = patients.filter((patient) =>
  patient.child_name
    ?.toLowerCase()
    .includes(search.toLowerCase())
);

 const handleAddPatient = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/children",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          user_id: 1,
          child_name: childName,
          age_months: age,
          birthdate: birthdate,
          gender: sex,
          address: address,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert("Failed to add patient.");
      return;
    }

    setPatients((prevPatients) => [
      ...prevPatients,
      data,
    ]);

    alert("Patient added successfully!");

    setChildName("");
    setAge("");
    setBirthdate("");
    setSex("");
    setMotherName("");
    setFatherName("");
    setAddress("");

    setShowAddPatient(false);

  } catch (error) {
    console.error("Error adding patient:", error);
    alert("Could not connect to the server.");
  }
};
  useEffect(() => {
  fetch("http://127.0.0.1:8000/api/children")
    .then((response) => response.json())
    .then((data) => {
      setPatients(data);
    })
    .catch((error) => {
      console.error("Error fetching patients:", error);
    });
}, []);

  return (
    <div className="patients-dashboard">

      <Sidebar />

      <main className="patients-content">

        <div className="patients-header">
          <h2>Patients</h2>
        </div>

        <div className="patients-search-section">

          <div className="patients-search-bar">

            <FaSearch />

            <input
              type="text"
              placeholder="Search names of children........"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <button
            className="patients-add-btn"
            onClick={() =>
              setShowAddPatient(true)
            }
          >
            <FaPlus />
            Add
          </button>

        </div>

        <div className="patient-list">

          {filteredPatients.map((patient) => (

            <div
              className="patient-card"
              key={patient.child_id}
            >

              <div
                className="progress-circle"
                style={{
                  "--progress":
                    patient.coverage,
                }}
              >
                <span>
                  {patient.coverage}
                </span>
              </div>

              <FaUserCircle className="patient-icon" />

              <div className="patient-info">

                <h3>{patient.child_name}</h3>

                <div className="patient-details">

                  <p>- {patient.age_months} months old</p>

                  <p>
                    - {patient.gender}
                    {" & "}
                    {patient.address}
                  </p>

                  <p>
                    - {patient.coverage} covered
                  </p>

                </div>

              </div>

              <div className="patient-actions">

                <FaPaperPlane
                  onClick={() =>
                    setShowSMSModal(true)
                  }
                />

                <FaEye
                  onClick={() =>
                    navigate(
                      `/patient_viewrecord/${patient.child_id}`
                    )
                  }
                />

              </div>

            </div>

          ))}

        </div>

      </main>

      {showSMSModal && (

        <div className="patients-sms-overlay">

          <div className="patients-sms-modal">

            <h2>Send SMS</h2>

            <p>
              Child: {child?.child_name || "Child's Name"}
            </p>

            <p>
              Parent: {child?.parent_name || "Parent's Name"}
            </p>

            <div className="patients-send-all-container">

              <input
                type="checkbox"
                checked={sendToAll}
                onChange={() =>
                  setSendToAll(!sendToAll)
                }
              />

              <label>
                Send SMS to All Parents
              </label>

            </div>

            {sendToAll && (

              <div className="patients-broadcast-message">
                The SMS reminder will be sent to
                all registered parents.
              </div>

            )}

            {!sendToAll && (

              <>
                <label>To:</label>

                <div className="patients-phone-container">

                  <FaPhoneAlt />

                  <input
                    type="text"
                    placeholder="+63 XXX XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(
                        e.target.value
                      )
                    }
                  />

                </div>
              </>

            )}

            <label>Message:</label>

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
            />

            <div className="patients-sms-buttons">

              <button
                className="patients-cancel-btn"
                onClick={() =>
                  setShowSMSModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="patients-send-btn"
                onClick={() => {

                  console.log(
                    sendToAll
                      ? "Sending SMS to all parents..."
                      : "Sending SMS to one parent..."
                  );

                  setShowSMSModal(false);

                  alert("Message sent!");

                }}
              >
                <FaPaperPlane />
                Send SMS
              </button>

            </div>

          </div>

        </div>

      )}

      {showAddPatient && (

        <div className="patients-add-overlay">

          <div className="patients-add-modal">

            <h2>
              Add New Patient
            </h2>

            <input
              type="text"
              placeholder="Child's Name"
              value={childName}
              onChange={(e) =>
                setChildName(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Age (months)"
              value={age}
              onChange={(e) =>
                setAge(e.target.value)
              }
            />

            <input
              type="date"
              value={birthdate}
              onChange={(e) =>
                setBirthdate(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Sex"
              value={sex}
              onChange={(e) =>
                setSex(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Mother's Name"
              value={motherName}
              onChange={(e) =>
                setMotherName(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Father's Name"
              value={fatherName}
              onChange={(e) =>
                setFatherName(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
            />

            <div className="patients-add-buttons">

              <button
                onClick={() =>
                  setShowAddPatient(false)
                }
              >
                Cancel
              </button>

              <button
                onClick={handleAddPatient}
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Patients;