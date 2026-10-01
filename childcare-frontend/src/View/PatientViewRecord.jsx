import "../css/PatientViewRecord.css";

import { useState, useEffect } from "react";
import { bmi as calculateWHO_BMI, bmiForAge } from "who-growth-standards";
import { FaUserCircle, FaArrowLeft, FaEdit } from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useParams, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../View/Sidebar";

function PatientViewRecord() {
  const { child_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const backPath = location.state?.from || "/patients";
  const backLabel = location.state?.fromLabel || "Back to Children";

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  const hasPermission = (permission) => {
    return (
      isAdmin || permissions.includes("all") || permissions.includes(permission)
    );
  };

  const [child, setChild] = useState(null);

  const [showDeleteVaccination, setShowDeleteVaccination] = useState(false);
  const [selectedDeleteVaccination, setSelectedDeleteVaccination] =
    useState(null);

  const [vaccines, setVaccines] = useState([]);
  const [vaccineInventory, setVaccineInventory] = useState([]);

  const [showEditVaccination, setShowEditVaccination] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState(null);

  const [editVaccinationForm, setEditVaccinationForm] = useState({
    vaccine: "",
    dose: "",
    date: "",
    status: "",
    place: "",
    provider: "",
  });

  // ==========================================
  // GROWTH RECORD
  // ==========================================

  const [growthRecords, setGrowthRecords] = useState([]);

  const [showAddGrowth, setShowAddGrowth] = useState(false);

  const [growthForm, setGrowthForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weight_kg: "",
    height_cm: "",
  });

  // ==========================================
  // EDIT CHILD
  // ==========================================

  const [showEditChild, setShowEditChild] = useState(false);

  const [editChildForm, setEditChildForm] = useState({
    child_name: "",
    birthdate: "",
    gender: "",
    relationship: "",
    address: "",
    status: "Continuing",
  });

  // ==========================================
  // FETCH CHILD
  // ==========================================

  const fetchChild = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/children/${child_id}`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Error fetching child:", data);
        return;
      }

      const normalizedChild = {
        ...data,
        appointments: data.appointments || [],
        patientRecords: data.patient_records || data.patientRecords || [],
      };

      setChild(normalizedChild);
    } catch (error) {
      console.error("Error fetching child:", error);
    }
  };

  // ==========================================
  // FETCH GROWTH RECORDS
  // ==========================================

  const fetchGrowthRecords = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/growth-records/${child_id}?_=${Date.now()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Error fetching growth records:", data);
        return;
      }

      setGrowthRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching growth records:", error);
    }
  };

  // ==========================================
  // FETCH VACCINATION RECORDS
  // ==========================================

  const fetchVaccinationRecords = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${child_id}?_=${Date.now()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        },
      );

      const data = await response.json();
      console.log("PatientViewRecord vaccination data:", data);

      console.log("Vaccination records from server:", data);

      if (!response.ok) {
        console.error("Failed to fetch vaccination records:", data);
        return;
      }

      setVaccines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vaccine records:", error);
    }
  };

  // ==========================================
  // FETCH VACCINE INVENTORY
  // ==========================================

  const fetchVaccineInventory = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/vaccines?_=${Date.now()}`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        },
      );

      const data = await response.json();

      console.log("Vaccine inventory:", data);

      if (!response.ok) {
        console.error("Failed to fetch vaccine inventory:", data);
        return;
      }

      setVaccineInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vaccine inventory:", error);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchChild();
    fetchGrowthRecords();
    fetchVaccinationRecords();
    fetchVaccineInventory();
  }, [child_id]);

  // ==========================================
  // CALCULATE AGE
  // ==========================================

  const calculateAge = (birthdate) => {
    if (!birthdate) return "—";

    const birth = new Date(birthdate);
    const today = new Date();

    if (Number.isNaN(birth.getTime())) {
      return "—";
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (today.getDate() < birth.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) {
      return "—";
    }

    if (years === 0) {
      return `${months} month${months !== 1 ? "s" : ""}`;
    }

    if (months === 0) {
      return `${years} year${years !== 1 ? "s" : ""}`;
    }

    return `${years}y ${months}m`;
  };

  // ==========================================
  // CALCULATE BMI
  // ==========================================

  const calculateBMI = (weightKg, heightCm) => {
    const weight = Number(weightKg);
    const height = Number(heightCm);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      return "—";
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    return bmi.toFixed(2);
  };

  // ==========================================
  // GROWTH ASSESSMENT
  // ==========================================

  const getGrowthAssessment = (growth) => {
    const weight = Number(growth?.weight_kg);
    const height = Number(growth?.height_cm);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(height) ||
      weight <= 0 ||
      height <= 0
    ) {
      return "—";
    }

    if (!child?.birthdate || !child?.gender || !growth?.date) {
      return "Needs assessment";
    }

    const birthDate = new Date(child.birthdate);
    const measurementDate = new Date(growth.date);

    if (
      Number.isNaN(birthDate.getTime()) ||
      Number.isNaN(measurementDate.getTime())
    ) {
      return "Needs assessment";
    }

    const ageInDays = Math.floor(
      (measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (ageInDays < 0) {
      return "Invalid age";
    }

    if (ageInDays > 1856) {
      return "Age outside WHO 0–5 reference";
    }

    const sex =
      String(child.gender).toLowerCase() === "female"
        ? "female"
        : String(child.gender).toLowerCase() === "male"
          ? "male"
          : null;

    if (!sex) {
      return "Needs assessment";
    }

    const bmi = calculateWHO_BMI(weight, height);

    if (!Number.isFinite(bmi) || bmi <= 0) {
      return "—";
    }

    try {
      const result = bmiForAge(bmi, {
        sex,
        ageDays: ageInDays,
      });

      const zScore = Number(result?.zScore);

      if (!Number.isFinite(zScore)) {
        return "Needs assessment";
      }

      if (zScore < -3) {
        return "Severely underweight";
      }

      if (zScore < -2) {
        return "Underweight";
      }

      if (zScore <= 1) {
        return "Normal";
      }

      if (zScore <= 2) {
        return "At risk of overweight";
      }

      if (zScore <= 3) {
        return "Overweight";
      }

      return "Obese";
    } catch (error) {
      console.error("WHO growth assessment error:", error);
      return "Needs assessment";
    }
  };

  // ==========================================
  // GROWTH DATA
  // ==========================================

  const sortedGrowthRecords = [...growthRecords].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    return Number(b.growth_id || 0) - Number(a.growth_id || 0);
  });

  const latestGrowth =
    sortedGrowthRecords.length > 0 ? sortedGrowthRecords[0] : null;

  const latestHeight =
    latestGrowth?.height_cm !== null &&
    latestGrowth?.height_cm !== undefined &&
    latestGrowth?.height_cm !== ""
      ? `${latestGrowth.height_cm} cm`
      : "—";

  const latestWeight =
    latestGrowth?.weight_kg !== null &&
    latestGrowth?.weight_kg !== undefined &&
    latestGrowth?.weight_kg !== ""
      ? `${latestGrowth.weight_kg} kg`
      : "—";

  // ==========================================
  // CALCULATE GROWTH CHANGE
  // ==========================================

  const getGrowthChange = (index) => {
    const current = sortedGrowthRecords[index];

    if (!current) {
      return "—";
    }

    const previous = sortedGrowthRecords[index + 1];

    if (!previous) {
      return "Baseline";
    }

    const currentWeight = Number(current.weight_kg);
    const previousWeight = Number(previous.weight_kg);

    const currentHeight = Number(current.height_cm);
    const previousHeight = Number(previous.height_cm);

    const changes = [];

    if (Number.isFinite(currentWeight) && Number.isFinite(previousWeight)) {
      const weightChange = currentWeight - previousWeight;

      if (weightChange > 0) {
        changes.push(`+${weightChange.toFixed(2)} kg`);
      } else if (weightChange < 0) {
        changes.push(`${weightChange.toFixed(2)} kg`);
      } else {
        changes.push("0.00 kg");
      }
    }

    if (Number.isFinite(currentHeight) && Number.isFinite(previousHeight)) {
      const heightChange = currentHeight - previousHeight;

      if (heightChange > 0) {
        changes.push(`+${heightChange.toFixed(2)} cm`);
      } else if (heightChange < 0) {
        changes.push(`${heightChange.toFixed(2)} cm`);
      } else {
        changes.push("0.00 cm");
      }
    }

    return changes.length > 0 ? changes.join(" · ") : "—";
  };

  // ==========================================
  // VACCINE HELPERS
  // ==========================================

  const getVaccineName = (vaccineId) => {
    const vaccine = vaccineInventory.find(
      (item) => String(item.vaccine_ID) === String(vaccineId),
    );

    return vaccine?.vaccine_name || "Unknown Vaccine";
  };

  // ==========================================
  // OPEN ADD GROWTH RECORD
  // ==========================================

  const handleOpenAddGrowth = () => {
    setGrowthForm({
      date: new Date().toISOString().split("T")[0],
      weight_kg: "",
      height_cm: "",
    });

    setShowAddGrowth(true);
  };

  // ==========================================
  // SAVE GROWTH RECORD
  // ==========================================

  const handleSaveGrowth = async () => {
    if (!growthForm.date || !growthForm.weight_kg || !growthForm.height_cm) {
      alert("Please complete the date, weight, and height.");
      return;
    }

    const weight = Number(growthForm.weight_kg);
    const height = Number(growthForm.height_cm);

    if (!Number.isFinite(weight) || weight <= 0) {
      alert("Please enter a valid weight.");
      return;
    }

    if (!Number.isFinite(height) || height <= 0) {
      alert("Please enter a valid height.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/growth-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          child_id: child_id,
          date: growthForm.date,
          weight_kg: weight,
          height_cm: height,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Laravel growth record error:", data);

        alert(
          data.message || data.error || "Failed to save the growth record.",
        );

        return;
      }

      // Refresh growth records directly from the growth-records endpoint.
      await fetchGrowthRecords();

      alert("Growth record added successfully!");

      setShowAddGrowth(false);

      setGrowthForm({
        date: new Date().toISOString().split("T")[0],
        weight_kg: "",
        height_cm: "",
      });
    } catch (error) {
      console.error("Error saving growth record:", error);

      alert("Failed to save the growth record.");
    }
  };

  // ==========================================
  // OPEN EDIT CHILD
  // ==========================================

  const handleOpenEditChild = () => {
    if (!child) {
      return;
    }

    setEditChildForm({
      child_name: child.child_name || "",
      birthdate: child.birthdate
        ? String(child.birthdate).substring(0, 10)
        : "",
      gender: child.gender || "",
      relationship: child.relationship || "",
      address: child.address || "",
      status: child.status || "Continuing",
    });

    setShowEditChild(true);
  };

  // ==========================================
  // EDIT CHILD FORM CHANGE
  // ==========================================

  const handleEditChildChange = (field, value) => {
    setEditChildForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==========================================
  // SAVE CHILD
  // ==========================================

  const handleSaveChild = async () => {
    if (
      !editChildForm.child_name ||
      !editChildForm.birthdate ||
      !editChildForm.gender ||
      !editChildForm.relationship ||
      !editChildForm.address
    ) {
      alert("Please complete all child information fields.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/children/${child_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            child_name: editChildForm.child_name,
            birthdate: editChildForm.birthdate,
            gender: editChildForm.gender,
            relationship: editChildForm.relationship,
            address: editChildForm.address,
            status: editChildForm.status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", data);

        alert(
          data.message || data.error || "Failed to update child information.",
        );

        return;
      }

      await fetchChild();

      alert("Child information updated successfully!");

      setShowEditChild(false);
    } catch (error) {
      console.error("Error updating child:", error);

      alert("Failed to update child information.");
    }
  };

  // ==========================================
  // EDIT VACCINATION
  // ==========================================

  const handleEditVaccination = (item) => {
    setSelectedVaccination(item);

    setEditVaccinationForm({
      vaccine: String(item.vaccine_id || ""),
      dose: String(item.dose_number || item.dose || ""),
      date: item.date_taken || item.date || "",
      status: item.status || "",
      place: item.place || "",
      provider: item.provider || "",
    });

    setShowEditVaccination(true);
  };

  // ==========================================
  // UPDATE VACCINATION
  // ==========================================

  const handleSaveEditVaccination = async () => {
    if (!selectedVaccination) {
      return;
    }

    if (
      !editVaccinationForm.vaccine ||
      !editVaccinationForm.dose ||
      !editVaccinationForm.date ||
      !editVaccinationForm.status ||
      !editVaccinationForm.place ||
      !editVaccinationForm.provider
    ) {
      alert("Please complete all vaccination fields.");
      return;
    }

    const selectedVaccine = vaccineInventory.find(
      (vaccine) =>
        String(vaccine.vaccine_ID) === String(editVaccinationForm.vaccine),
    );

    const selectedStock = selectedVaccine
      ? Number(selectedVaccine.stock_quantity)
      : null;

    const oldStatus = selectedVaccination.status;
    const oldVaccineId = selectedVaccination.vaccine_id;

    if (
      String(oldVaccineId) !== String(editVaccinationForm.vaccine) &&
      editVaccinationForm.status === "Completed" &&
      selectedStock === 0
    ) {
      alert(
        "The selected vaccine is out of stock. Please select another vaccine.",
      );
      return;
    }

    if (
      String(oldVaccineId) === String(editVaccinationForm.vaccine) &&
      oldStatus !== "Completed" &&
      editVaccinationForm.status === "Completed" &&
      selectedStock === 0
    ) {
      alert("This vaccine is out of stock. Please select another vaccine.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${selectedVaccination.patient_recordID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            vaccine_id: editVaccinationForm.vaccine,
            dose_number: editVaccinationForm.dose,
            date_taken: editVaccinationForm.date,
            status: editVaccinationForm.status,
            place: editVaccinationForm.place,
            provider: editVaccinationForm.provider,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", data);

        alert(data.message || "Failed to update vaccination record.");

        return;
      }

      await fetchVaccinationRecords();
      await fetchVaccineInventory();

      alert("Vaccination record updated successfully!");

      setShowEditVaccination(false);
      setSelectedVaccination(null);
    } catch (error) {
      console.error("Error updating vaccination:", error);

      alert("Failed to update vaccination record.");
    }
  };

  // ==========================================
  // UPDATE VACCINATION STATUS
  // ==========================================

  const handleVaccineChange = async (index, field, value) => {
    if (field !== "status") {
      return;
    }

    const selectedRecord = vaccines[index];

    if (!selectedRecord) {
      console.error("Could not find vaccination record at index:", index);
      return;
    }

    const patientRecordID = selectedRecord.patient_recordID;

    if (!patientRecordID) {
      console.error("Missing patient_recordID:", selectedRecord);

      alert("This vaccination record does not have a valid record ID.");

      return;
    }

    const oldStatus = selectedRecord.status;

    if (oldStatus === value) {
      return;
    }

    const previousVaccines = [...vaccines];

    setVaccines((prevVaccines) =>
      prevVaccines.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              status: value,
            }
          : item,
      ),
    );

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${patientRecordID}/status?_=${Date.now()}`,
        {
          method: "PUT",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            status: value,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setVaccines(previousVaccines);

        alert(
          data.message || data.error || "Failed to update vaccination status.",
        );

        return;
      }

      const savedStatus = data?.record?.status || value;

      setVaccines((prevVaccines) =>
        prevVaccines.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                status: savedStatus,
              }
            : item,
        ),
      );

      await fetchVaccinationRecords();
      await fetchVaccineInventory();
    } catch (error) {
      console.error("Error updating vaccination status:", error);

      setVaccines(previousVaccines);

      alert(
        "Could not connect to the server while updating the vaccination status.",
      );
    }
  };

  // ==========================================
  // DELETE VACCINATION
  // ==========================================

  const handleDeleteVaccination = async () => {
    if (!selectedDeleteVaccination) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/patient-records/${selectedDeleteVaccination.patient_recordID}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete vaccination record.");

        return;
      }

      await fetchVaccinationRecords();
      await fetchVaccineInventory();

      alert("Vaccination record deleted successfully!");

      setShowDeleteVaccination(false);
      setSelectedDeleteVaccination(null);
    } catch (error) {
      console.error("Error deleting vaccination:", error);

      alert("Failed to delete vaccination record.");
    }
  };

  // ==========================================
  // PARENT INFORMATION
  // ==========================================

  const parentName = child?.user?.user_fullname || child?.parent_name || "—";

  const parentPhone = child?.user?.mobile_number || "—";

  const parentEmail = child?.user?.email || "—";
  // Earliest growth record is treated as the birth measurement
  const sortedGrowthForBirth = [...growthRecords].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return Number(a.growth_id || 0) - Number(b.growth_id || 0);
  });

  const birthGrowthRecord =
    sortedGrowthForBirth.length > 0 ? sortedGrowthForBirth[0] : null;

  const birthHeight =
    birthGrowthRecord?.height_cm !== null &&
    birthGrowthRecord?.height_cm !== undefined &&
    birthGrowthRecord?.height_cm !== ""
      ? `${birthGrowthRecord.height_cm} cm`
      : "—";

  const birthWeight =
    birthGrowthRecord?.weight_kg !== null &&
    birthGrowthRecord?.weight_kg !== undefined &&
    birthGrowthRecord?.weight_kg !== ""
      ? `${birthGrowthRecord.weight_kg} kg`
      : "—";

  // Use the earliest vaccination record with a recorded place
  const sortedVaccinationsForHealthCenter = [...vaccines]
    .filter((record) => record.place)
    .sort((a, b) => {
      const dateA = new Date(a.date_taken || 0).getTime();
      const dateB = new Date(b.date_taken || 0).getTime();

      return dateA - dateB;
    });

  const healthCenter = sortedVaccinationsForHealthCenter[0]?.place || "—";

  // ==========================================
  // RENDER
  // ==========================================

  const downloadVaccineCard = () => {
    if (!child) {
      alert("Child information is not available yet.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");

    // -----------------------------
    // TITLE
    // -----------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CHILD IMMUNIZATION RECORD", 105, 20, {
      align: "center",
    });

    // -----------------------------
    // CHILD INFORMATION
    // -----------------------------
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const leftX = 20;
    const rightX = 110;

    let leftY = 35;
    let rightY = 35;

    const addInfo = (label, value, x, y) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, x, y);

      doc.setFont("helvetica", "normal");
      doc.text(String(value || "—"), x + 35, y);
    };

    // LEFT COLUMN
    addInfo("Child Name", child.child_name || "—", leftX, leftY);

    leftY += 10;

    addInfo("Date of Birth", child.birthdate || "—", leftX, leftY);

    leftY += 10;

    addInfo("Address", child.address || "—", leftX, leftY);

    leftY += 10;

    addInfo("Gender", child.gender || "—", leftX, leftY);

    // RIGHT COLUMN
    addInfo("Parent/Guardian", parentName, rightX, rightY);

    rightY += 10;

    addInfo("Birth Height", birthHeight, rightX, rightY);

    rightY += 10;

    addInfo("Birth Weight", birthWeight, rightX, rightY);

    rightY += 10;

    addInfo("Health Center", healthCenter, rightX, rightY);

    // -----------------------------
    // VACCINATION TABLE
    // -----------------------------
    const vaccinationRows = [...vaccines]
      .sort((a, b) => {
        const dateA = new Date(a.date_taken || a.date || 0).getTime();

        const dateB = new Date(b.date_taken || b.date || 0).getTime();

        return dateA - dateB;
      })
      .map((record) => [
        record.vaccine || getVaccineName(record.vaccine_id) || "—",

        record.dose_number || record.dose || "—",

        record.date_taken || record.date || "—",
      ]);

    autoTable(doc, {
      startY: 80,

      head: [["Vaccine", "Dose", "Date of Vaccination"]],

      body: vaccinationRows,

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 4,
        valign: "middle",
      },

      headStyles: {
        fontStyle: "bold",
        halign: "center",
      },

      columnStyles: {
        0: {
          cellWidth: 65,
        },
        1: {
          cellWidth: 35,
          halign: "center",
        },
        2: {
          cellWidth: 65,
          halign: "center",
        },
      },

      margin: {
        left: 20,
        right: 20,
      },
    });

    // -----------------------------
    // DOWNLOAD
    // -----------------------------
    const safeChildName = (child.child_name || "Child").replace(
      /[^a-z0-9]/gi,
      "_",
    );

    doc.save(`Child_Immunization_Record_${safeChildName}.pdf`);
  };

  return (
    <div className="viewRecord-dashboard">
      <Sidebar />

      <main className="viewRecord-main">
        {/* HEADER */}

        <div className="viewRecord-header">
          <div>
            <button
              type="button"
              className="viewRecord-back-link"
              onClick={() => navigate(backPath)}
            >
              <FaArrowLeft />
              {backLabel}
            </button>

            <h1>Child Record</h1>

            <p>
              Manage the child's vaccination records, growth history, and
              appointment history.
            </p>
          </div>
        </div>

        {/* CHILD INFORMATION */}

        <section className="viewRecord-patient-card">
          <div className="viewRecord-patient-main">
            <div className="viewRecord-avatar">
              <FaUserCircle />
            </div>

            <div className="viewRecord-patient-info">
              <h2>{child?.child_name || "Child's Name"}</h2>

              <span className="viewRecord-patient-label">
                {child?.status || "Continuing"}
              </span>
            </div>
          </div>

          <div className="viewRecord-patient-details">
            <div>
              <span>Birthdate</span>
              <strong>{child?.birthdate || "—"}</strong>
            </div>

            <div>
              <span>Age</span>
              <strong>{calculateAge(child?.birthdate)}</strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>{child?.gender || "—"}</strong>
            </div>

            <div>
              <span>Height</span>
              <strong>{latestHeight}</strong>
            </div>

            <div>
              <span>Weight</span>
              <strong>{latestWeight}</strong>
            </div>

            <div>
              <span>Parent / Guardian</span>
              <strong>{parentName}</strong>
            </div>

            <div>
              <span>Relationship</span>
              <strong>{child?.relationship || "—"}</strong>
            </div>

            <div>
              <span>Parent Contact</span>
              <strong>{parentPhone}</strong>
            </div>

            <div>
              <span>Parent Email</span>
              <strong>{parentEmail}</strong>
            </div>

            <div>
              <span>Address</span>
              <strong>{child?.address || "—"}</strong>
            </div>
          </div>

          <button
            type="button"
            className="download-vaccine-card-btn"
            onClick={downloadVaccineCard}
          >
            Download Vaccine Card
          </button>

          {hasPermission("edit_patients") && (
            <button
              className="viewRecord-sms-btn"
              onClick={handleOpenEditChild}
            >
              <FaEdit />
              Edit Child
            </button>
          )}
        </section>

        {/* VACCINATION MANAGEMENT */}

        <section className="viewRecord-record-section viewRecord-vaccination-section">
          <div className="viewRecord-section-header">
            <div>
              <h2>Vaccination Management</h2>

              <p>Set, update, and manage the child's vaccination records.</p>
            </div>

            {hasPermission("view_appointments") && child && (
              <button
                className="viewRecord-add-btn"
                onClick={() =>
                  navigate(`/appointments?child_id=${child.child_id}`)
                }
              >
                View Appointments
              </button>
            )}
          </div>

          <div className="viewRecord-table-wrapper">
            <table className="viewRecord-schedule-table">
              <thead>
                <tr>
                  <th>Vaccine</th>
                  <th>Dose</th>
                  <th>Vaccination Date</th>
                  <th>Status</th>
                  <th>Place</th>
                  <th>Provider</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {vaccines.length > 0 ? (
                  vaccines.map((item, index) => (
                    <tr key={item.patient_recordID || index}>
                      <td>
                        <strong>
                          {item.vaccine || getVaccineName(item.vaccine_id)}
                        </strong>
                      </td>

                      <td>Dose {item.dose || item.dose_number || "—"}</td>

                      <td>{item.date || item.date_taken || "—"}</td>

                      <td>{item.status || "—"}</td>

                      <td>{item.place || "—"}</td>

                      <td>{item.provider || "—"}</td>

                      <td>
                        <div className="viewRecord-action-buttons">
                          <button
                            className="viewRecord-delete-btn"
                            onClick={() => {
                              setSelectedDeleteVaccination(item);
                              setShowDeleteVaccination(true);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="viewRecord-empty">
                      <div>
                        <FaUserCircle />

                        <h3>No vaccination records</h3>

                        <p>
                          No vaccination records have been added for this child
                          yet.
                        </p>

                        {hasPermission("view_appointments") && (
                          <button
                            className="viewRecord-empty-add"
                            onClick={() => navigate("/appointments")}
                          >
                            View Appointments
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* GROWTH HISTORY */}

        <section className="viewRecord-record-section">
          <div className="viewRecord-section-header">
            <div>
              <h2>Growth History</h2>

              <p>
                Historical height and weight measurements recorded during clinic
                visits.
              </p>
            </div>

            {hasPermission("edit_patients") && (
              <button
                className="viewRecord-add-btn"
                onClick={handleOpenAddGrowth}
              >
                Add Growth Record
              </button>
            )}
          </div>

          <div className="viewRecord-table-wrapper">
            <table className="viewRecord-schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Height</th>
                  <th>Growth Change</th>
                  <th>BMI</th>
                  <th>Assessment</th>
                </tr>
              </thead>

              <tbody>
                {sortedGrowthRecords.length > 0 ? (
                  sortedGrowthRecords.map((growth, index) => (
                    <tr key={growth.growth_id}>
                      <td>{growth.date || "—"}</td>

                      <td>
                        {growth.weight_kg !== null &&
                        growth.weight_kg !== undefined &&
                        growth.weight_kg !== ""
                          ? `${growth.weight_kg} kg`
                          : "—"}
                      </td>

                      <td>
                        {growth.height_cm !== null &&
                        growth.height_cm !== undefined &&
                        growth.height_cm !== ""
                          ? `${growth.height_cm} cm`
                          : "—"}
                      </td>

                      <td>{getGrowthChange(index)}</td>

                      <td>
                        {calculateBMI(growth.weight_kg, growth.height_cm)}
                      </td>

                      <td>{getGrowthAssessment(growth)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="viewRecord-empty">
                      No growth records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* APPOINTMENT HISTORY */}

        <section className="viewRecord-record-section">
          <div className="viewRecord-section-header">
            <div>
              <h2>Appointment History</h2>

              <p>Previous and upcoming clinic appointments for this child.</p>
            </div>
          </div>

          <div className="viewRecord-table-wrapper">
            <table className="viewRecord-schedule-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {child?.appointments?.length > 0 ? (
                  child.appointments.map((appointment) => (
                    <tr key={appointment.appointment_id}>
                      <td>{appointment.appointment_date}</td>

                      <td>{appointment.appointment_time}</td>

                      <td>{appointment.appointment_type || "—"}</td>

                      <td>{appointment.address || "—"}</td>

                      <td>{appointment.status || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="viewRecord-empty">
                      No appointment history available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ADD GROWTH RECORD */}

        {showAddGrowth && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Add Growth Record</h2>

                  <p>
                    Record a new height and weight measurement for this child.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddGrowth(false)}
                  className="viewRecord-popup-close"
                >
                  ×
                </button>
              </div>

              <div className="viewRecord-popup-child">
                <FaUserCircle />

                <div>
                  <strong>{child?.child_name || "Child's Name"}</strong>

                  <small>Parent: {parentName}</small>
                </div>
              </div>

              <label>Date</label>

              <input
                type="date"
                className="vaccination-form-input"
                value={growthForm.date}
                onChange={(e) =>
                  setGrowthForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />

              <label>Weight (kg)</label>

              <input
                type="number"
                step="0.01"
                min="0"
                className="vaccination-form-input"
                value={growthForm.weight_kg}
                onChange={(e) =>
                  setGrowthForm((prev) => ({
                    ...prev,
                    weight_kg: e.target.value,
                  }))
                }
                placeholder="Enter weight in kilograms"
              />

              <label>Height (cm)</label>

              <input
                type="number"
                step="0.01"
                min="0"
                className="vaccination-form-input"
                value={growthForm.height_cm}
                onChange={(e) =>
                  setGrowthForm((prev) => ({
                    ...prev,
                    height_cm: e.target.value,
                  }))
                }
                placeholder="Enter height in centimeters"
              />

              <label>BMI</label>

              <div
                className="vaccination-form-input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f5f6f8",
                }}
              >
                {calculateBMI(growthForm.weight_kg, growthForm.height_cm)}
              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "-4px",
                  marginBottom: "12px",
                  color: "#666",
                }}
              >
                BMI is calculated automatically and is not stored in the
                database.
              </small>

              <div className="viewRecord-popup-buttons">
                <button
                  className="viewRecord-cancel-btn"
                  onClick={() => setShowAddGrowth(false)}
                >
                  Cancel
                </button>

                <button
                  className="viewRecord-send-btn"
                  onClick={handleSaveGrowth}
                >
                  Save Growth Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT CHILD */}

        {showEditChild && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Edit Child</h2>

                  <p>Update the child's information.</p>
                </div>

                <button
                  onClick={() => setShowEditChild(false)}
                  className="viewRecord-popup-close"
                >
                  ×
                </button>
              </div>

              <div className="viewRecord-popup-child">
                <FaUserCircle />

                <div>
                  <strong>{child?.child_name || "Child's Name"}</strong>

                  <small>Parent: {parentName}</small>
                </div>
              </div>

              <label>Child Name</label>

              <input
                type="text"
                className="vaccination-form-input"
                value={editChildForm.child_name}
                onChange={(e) =>
                  handleEditChildChange("child_name", e.target.value)
                }
                placeholder="Enter child's name"
              />

              <label>Birthdate</label>

              <input
                type="date"
                className="vaccination-form-input"
                value={editChildForm.birthdate}
                onChange={(e) =>
                  handleEditChildChange("birthdate", e.target.value)
                }
              />

              <label>Gender</label>

              <select
                className="vaccination-form-input"
                value={editChildForm.gender}
                onChange={(e) =>
                  handleEditChildChange("gender", e.target.value)
                }
              >
                <option value="">Select gender</option>

                <option value="Male">Male</option>

                <option value="Female">Female</option>
              </select>

              <label>Relationship</label>

              <select
                className="vaccination-form-input"
                value={editChildForm.relationship}
                onChange={(e) =>
                  handleEditChildChange("relationship", e.target.value)
                }
              >
                <option value="">Select relationship</option>

                <option value="Mother">Mother</option>

                <option value="Father">Father</option>

                <option value="Guardian">Guardian</option>
              </select>

              <label>Address</label>

              <input
                className="vaccination-form-input"
                value={editChildForm.address}
                onChange={(e) =>
                  handleEditChildChange("address", e.target.value)
                }
                placeholder="Enter child's address"
              />

              <label>Status</label>

              <select
                className="vaccination-form-input"
                value={editChildForm.status}
                onChange={(e) =>
                  handleEditChildChange("status", e.target.value)
                }
              >
                <option value="Continuing">Continuing</option>

                <option value="Completed">Completed</option>

                <option value="Inactive">Inactive</option>
              </select>

              <div className="viewRecord-popup-buttons">
                <button
                  className="viewRecord-cancel-btn"
                  onClick={() => setShowEditChild(false)}
                >
                  Cancel
                </button>

                <button
                  className="viewRecord-send-btn"
                  onClick={handleSaveChild}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT VACCINATION */}

        {showEditVaccination && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup vaccination-popup">
              <div className="viewRecord-popup-header">
                <div>
                  <h2>Edit Vaccination</h2>

                  <p>Update this child's vaccination record.</p>
                </div>

                <button
                  onClick={() => setShowEditVaccination(false)}
                  className="viewRecord-popup-close"
                >
                  ×
                </button>
              </div>

              <div className="viewRecord-popup-child">
                <FaUserCircle />

                <strong>{child?.child_name || "Child's Name"}</strong>
              </div>

              <label>Vaccine</label>

              <select
                className="vaccination-form-input"
                value={editVaccinationForm.vaccine}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    vaccine: e.target.value,
                  }))
                }
              >
                <option value="">Select vaccine</option>

                {vaccineInventory.map((vaccine) => (
                  <option key={vaccine.vaccine_ID} value={vaccine.vaccine_ID}>
                    {vaccine.vaccine_name}
                  </option>
                ))}
              </select>

              <label>Dose</label>

              <select
                className="vaccination-form-input"
                value={editVaccinationForm.dose}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    dose: e.target.value,
                  }))
                }
              >
                <option value="">Select dose</option>

                <option value="1">Dose 1</option>

                <option value="2">Dose 2</option>

                <option value="3">Dose 3</option>
              </select>

              <label>Vaccination Date</label>

              <input
                type="date"
                className="vaccination-form-input"
                value={editVaccinationForm.date}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />

              <label>Status</label>

              <select
                className="vaccination-form-input"
                value={editVaccinationForm.status}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="">Select status</option>

                <option value="Completed">Completed</option>

                <option value="Continuing">Continuing</option>

                <option value="Missed">Missed</option>
              </select>

              <label>Place</label>

              <input
                type="text"
                className="vaccination-form-input"
                placeholder="e.g. Health Center"
                value={editVaccinationForm.place}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    place: e.target.value,
                  }))
                }
              />

              <label>Provider</label>

              <input
                type="text"
                className="vaccination-form-input"
                placeholder="e.g. Dr. Maria"
                value={editVaccinationForm.provider}
                onChange={(e) =>
                  setEditVaccinationForm((prev) => ({
                    ...prev,
                    provider: e.target.value,
                  }))
                }
              />

              <div className="viewRecord-popup-buttons">
                <button
                  className="viewRecord-cancel-btn"
                  onClick={() => setShowEditVaccination(false)}
                >
                  Cancel
                </button>

                <button
                  className="viewRecord-send-btn"
                  onClick={handleSaveEditVaccination}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE VACCINATION */}

        {showDeleteVaccination && (
          <div className="viewRecord-popup-overlay">
            <div className="viewRecord-popup delete-vaccination-popup">
              <div className="delete-vaccination-icon">🗑</div>

              <div className="delete-vaccination-content">
                <h2>Delete Vaccination Record?</h2>

                <p>
                  Are you sure you want to delete this vaccination record? This
                  action cannot be undone.
                </p>

                {selectedDeleteVaccination && (
                  <div className="delete-vaccination-details">
                    <strong>
                      {selectedDeleteVaccination.vaccine ||
                        getVaccineName(selectedDeleteVaccination.vaccine_id)}
                    </strong>

                    <span>
                      Dose{" "}
                      {selectedDeleteVaccination.dose ||
                        selectedDeleteVaccination.dose_number}
                      {" · "}
                      {selectedDeleteVaccination.date ||
                        selectedDeleteVaccination.date_taken}
                    </span>
                  </div>
                )}
              </div>

              <div className="viewRecord-popup-buttons">
                <button
                  className="viewRecord-cancel-btn"
                  onClick={() => {
                    setShowDeleteVaccination(false);
                    setSelectedDeleteVaccination(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="viewRecord-delete-confirm-btn"
                  onClick={handleDeleteVaccination}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PatientViewRecord;
// ```

// Now test **only this**:

// 1. Make sure Laravel is running:

//    ```bash
//    php artisan serve
//    ```
// 2. Refresh the child record page.
// 3. Check **Growth History**.

// You should now see the existing records from `/api/growth-records/30`, including the records created through **Add Growth Record**.

// The key change is that growth history now has its own state:

// ```js
// const [growthRecords, setGrowthRecords] = useState([]);
// ```

// and the Add button refreshes that exact state with:

// ```js
// await fetchGrowthRecords();
// ```

// instead of doing:

// ```js
// await fetchChild();
// ```

// That separates **child information retrieval** from **growth history retrieval**, which is much more reliable for this page.
