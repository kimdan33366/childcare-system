import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiEye,
} from "react-icons/fi";
import Sidebar from "./Sidebar";
import "../css/ParentProfile.css";

const ParentProfile = () => {
  const navigate = useNavigate();

  // IMPORTANT:
  // This must match the route:
  // /parent-profile/:userId
  const { userId } = useParams();

  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchParent = async () => {
      try {
        setLoading(true);
        setError("");

        if (!userId) {
          throw new Error("Parent ID is missing.");
        }

        const response = await fetch(
          `http://127.0.0.1:8000/api/users/${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch parent information."
          );
        }

        const userData = data.user || data;

        setParent({
          id: userData.user_id,
          name: userData.user_fullname || "Unknown Parent",
          email: userData.email || "Not provided",
          mobile: userData.mobile_number || "Not provided",
          address: userData.address || "Not provided",
          date_of_birth: userData.date_of_birth || "",
          gender: userData.gender || "",
          status: userData.status || "Active",
          children: Array.isArray(userData.children)
            ? userData.children
            : [],
        });
      } catch (err) {
        console.error("Error fetching parent:", err);
        setError(err.message || "Unable to load parent profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchParent();
  }, [userId]);

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusClass = (status) => {
    if (!status) return "";

    return status.toLowerCase().replace(/\s+/g, "-");
  };

  const handleViewRecord = (childId) => {
    navigate(`/patient_viewrecord/${childId}`,{
        state:{
            from: `/parent-profile/${userId}`,
             fromLabel: "Back to Parent Profile",
        },
    });
  };

  if (loading) {
    return (
      <div className="parent-profile-layout">
        <Sidebar />

        <main className="parent-profile-main">
          <div className="parent-profile-loading">
            <div className="parent-profile-spinner"></div>
            <p>Loading parent profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div className="parent-profile-layout">
        <Sidebar />

        <main className="parent-profile-main">
          <div className="parent-profile-error">
            <div className="error-icon">!</div>

            <h2>Unable to Load Profile</h2>

            <p>{error || "Parent profile could not be found."}</p>

            <button
              className="parent-profile-back-button"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft />
              Back to User Management
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="parent-profile-layout">
      <Sidebar />

      <main className="parent-profile-main">
        {/* Back */}
        <button
          className="parent-profile-back"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft />
          Back to User Management
        </button>

        {/* Header */}
        <section className="parent-profile-header">
          <div className="parent-profile-avatar">
            {getInitials(parent.name)}
          </div>

          <div className="parent-profile-header-info">
            <h1>{parent.name}</h1>

            <p className="parent-profile-role">
              <FiUser />
              Parent / Guardian
            </p>
          </div>

          <span
            className={`parent-profile-status ${getStatusClass(
              parent.status
            )}`}
          >
            {parent.status}
          </span>
        </section>

        {/* Parent Information */}
        <section className="parent-profile-section">
          <div className="parent-profile-section-heading">
            <div>
              <h2>Parent Information</h2>
              <p>
                Basic information associated with this parent account.
              </p>
            </div>
          </div>

          <div className="parent-information-card">
            <div className="parent-information-item">
              <div className="parent-information-icon">
                <FiUser />
              </div>

              <div>
                <span>Full Name</span>
                <strong>{parent.name}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <div className="parent-information-icon">
                <FiMail />
              </div>

              <div>
                <span>Email Address</span>
                <strong>{parent.email}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <div className="parent-information-icon">
                <FiPhone />
              </div>

              <div>
                <span>Mobile Number</span>
                <strong>{parent.mobile}</strong>
              </div>
            </div>

            <div className="parent-information-item">
              <div className="parent-information-icon">
                <FiMapPin />
              </div>

              <div>
                <span>Address</span>
                <strong>{parent.address}</strong>
              </div>
            </div>

            {parent.date_of_birth && (
              <div className="parent-information-item">
                <div className="parent-information-icon">
                  <FiCalendar />
                </div>

                <div>
                  <span>Date of Birth</span>
                  <strong>{formatDate(parent.date_of_birth)}</strong>
                </div>
              </div>
            )}

            {parent.gender && (
              <div className="parent-information-item">
                <div className="parent-information-icon">
                  <FiUser />
                </div>

                <div>
                  <span>Gender</span>
                  <strong>{parent.gender}</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Registered Children */}
        <section className="parent-profile-section">
          <div className="parent-profile-section-heading children-heading">
            <div>
              <h2>Registered Children</h2>
              <p>
                Children registered under this parent account.
              </p>
            </div>

            <span className="children-count">
              {parent.children.length}{" "}
              {parent.children.length === 1 ? "Child" : "Children"}
            </span>
          </div>

          {parent.children.length === 0 ? (
            <div className="no-children-card">
              <FiUser />

              <h3>No Registered Children</h3>

              <p>
                There are currently no children registered under this
                parent account.
              </p>
            </div>
          ) : (
            <div className="registered-children-list">
              {parent.children.map((child) => (
                <div
                  className="parent-child-card"
                  key={child.child_id}
                >
                  <div className="parent-child-avatar">
                    {getInitials(child.child_name)}
                  </div>

                  <div className="parent-child-info">
                    <h3>{child.child_name}</h3>

                    <div className="parent-child-details">
                      {child.gender && (
                        <span>{child.gender}</span>
                      )}

                      {child.birthdate && (
                        <span>
                          Born {formatDate(child.birthdate)}
                        </span>
                      )}

                      {child.age_months !== undefined &&
                        child.age_months !== null && (
                          <span>
                            {child.age_months} months old
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="parent-child-right">
                    <span
                      className={`child-status ${getStatusClass(
                        child.status || "Continuing"
                      )}`}
                    >
                      {child.status || "Continuing"}
                    </span>

                    <button
                      className="view-child-record-button"
                      onClick={() =>
                        handleViewRecord(child.child_id)
                      }
                    >
                      <FiEye />
                      View Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ParentProfile;