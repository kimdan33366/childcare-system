import "../css/Appointment.css";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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
  FaCheck,
  FaCalendarPlus,
} from "react-icons/fa";
import Sidebar from "../View/Sidebar";
import {authFetch} from "../Controller/AuthController";

function Appointments() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [searchParams, setSearchParams] = useSearchParams();
  const childFilterId = searchParams.get("child_id");
  const navigate = useNavigate();
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
  const [expectedAppointments, setExpectedAppointments] = useState([]);
  const [expectedAppointmentsError, setExpectedAppointmentsError] = useState("");
  const [selectedExpectedGroup, setSelectedExpectedGroup] = useState(null);
  const [expectedDialog, setExpectedDialog] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [savingExpectedReschedule, setSavingExpectedReschedule] = useState(false);
  const [expectedActionError, setExpectedActionError] = useState("");
  const [confirmPreview, setConfirmPreview] = useState(null);
  const [confirmSelections, setConfirmSelections] = useState({});
  const [loadingConfirmPreview, setLoadingConfirmPreview] = useState(false);
  const [savingExpectedConfirm, setSavingExpectedConfirm] = useState(false);
  const [expectedActionSuccess, setExpectedActionSuccess] = useState("");

  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [staff, setStaff] = useState([]);

  // ==============================
  // FILTERS
  // ==============================

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState("All");

  // ==============================
  // POPUP
  // ==============================

  const [showPopup, setShowPopup] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [showChildSelection, setShowChildSelection] = useState(false);
  const [selectedHistoryAppointment, setSelectedHistoryAppointment] =
    useState(null);

  // ==============================
  // COMPLETION POPUP
  // ==============================

  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completionAppointment, setCompletionAppointment] = useState(null);
  const [completionProvider, setCompletionProvider] = useState("");
  const [completionMeasurements, setCompletionMeasurements] = useState({});

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
  // Completed doses are fetched from the Laravel patient_records table.
  const [completedDoseMap, setCompletedDoseMap] = useState({});
  const [completedDosesLoading, setCompletedDosesLoading] = useState(false);
  const [completedDosesError, setCompletedDosesError] = useState("");

  useEffect(() => {
    if (!selectedChildren.length) {
      setCompletedDoseMap({});
      setCompletedDosesError("");
      setCompletedDosesLoading(false);
      return;
    }
    let cancelled = false;
    setCompletedDosesLoading(true);
    setCompletedDosesError("");
    Promise.all(selectedChildren.map(async (childId) => {
      const response = await authFetch(
        `http://127.0.0.1:8000/api/children/${childId}/completed-doses`
      );
      if (!response.ok) throw new Error(`Could not load completed doses for child ${childId}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid completed-dose response");
      return [String(childId), data];
    })).then((entries) => {
      if (!cancelled) setCompletedDoseMap(Object.fromEntries(entries));
    }).catch((error) => {
      if (!cancelled) {
        setCompletedDoseMap({});
        setCompletedDosesError(error.message || "Unable to load completed doses");
      }
    }).finally(() => { if (!cancelled) setCompletedDosesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedChildren]);

  const completedDoseUnavailable = (vaccineId, doseNumber) =>
    selectedChildren.some((childId) =>
      (completedDoseMap[String(childId)] || []).some((record) =>
        Number(record.vaccine_id) === Number(vaccineId) &&
        Number(record.dose_number) === Number(doseNumber)
      )
    );

  const doseCheckPending = completedDosesLoading || Boolean(completedDosesError) ||
    selectedChildren.some((childId) => !Object.hasOwn(completedDoseMap, String(childId)));

  const [parentSearch, setParentSearch] = useState("");

  // ==============================
  // FETCH DATA
  // ==============================

  useEffect(() => {
    authFetchAppointments();
    authFetchExpectedAppointments();
    authFetchParents();
    authFetchChildren();
    authFetchVaccines();
    authFetchStaff();
  }, []);

  const saveExpectedReschedule = async () => {
    if (!selectedExpectedGroup || savingExpectedReschedule) return;
    if (!hasPermission("edit_appointments")) {
      setExpectedActionError("Rescheduling requires edit_appointments permission.");
      return;
    }
    if (!rescheduleDate || !rescheduleTime) {
      setExpectedActionError("Please choose both a date and a time.");
      return;
    }
    const ids = selectedExpectedGroup.expected_appointment_ids ||
      (selectedExpectedGroup.children || []).map(c => c.expected_appointment_id);
    if (!ids.length) {
      setExpectedActionError("No expected appointment IDs were found. Refresh the page.");
      return;
    }
    setSavingExpectedReschedule(true);
    setExpectedActionError("");
    try {
      const response = await authFetch("http://127.0.0.1:8000/api/expected-appointments/reschedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          expected_appointment_ids: ids,
          expected_date: rescheduleDate,
          expected_time: rescheduleTime,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = result.errors ? Object.values(result.errors).flat().join(" ") : "";
        throw new Error(detail || result.message || "Unable to reschedule the expected appointment.");
      }
      setExpectedDialog(null);
      setSelectedExpectedGroup(null);
      setExpectedActionSuccess("Expected appointment rescheduled. It will reappear when its date is due or tomorrow.");
      await authFetchExpectedAppointments();
    } catch (error) {
      setExpectedActionError(error.message || "Unable to connect to Laravel.");
    } finally {
      setSavingExpectedReschedule(false);
    }
  };

  const openExpectedConfirm = async (group) => {
    setSelectedExpectedGroup(group);
    setExpectedDialog("confirm");
    setExpectedActionError("");
    setConfirmPreview(null);
    setConfirmSelections({});
    setLoadingConfirmPreview(true);
    try {
      const ids = group.expected_appointment_ids || group.children.map(c => c.expected_appointment_id);
      const response = await authFetch(`http://127.0.0.1:8000/api/expected-appointments/preview?ids=${ids.join(",")}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load vaccination history.");
      setConfirmPreview(data);
    } catch (error) {
      setExpectedActionError(error.message || "Unable to load confirmation details.");
    } finally {
      setLoadingConfirmPreview(false);
    }
  };

  const toggleConfirmVaccine = (childId, vaccineId, doseNumber) => {
    const key = String(childId);
    setConfirmSelections(previous => {
      const existing = previous[key] || [];
      const next = existing.some(item => Number(item.vaccine_id) === Number(vaccineId))
        ? existing.filter(item => Number(item.vaccine_id) !== Number(vaccineId))
        : [...existing, { vaccine_id: Number(vaccineId), dose_number: Number(doseNumber) }];
      return { ...previous, [key]: next };
    });
  };

  const saveExpectedConfirm = async () => {
    if (!selectedExpectedGroup || savingExpectedConfirm) return;
    if (!hasPermission("add_appointments")) {
      setExpectedActionError("You do not have permission to create appointments.");
      return;
    }
    const members = selectedExpectedGroup.children || [];
    if (members.some(({ child_id, child }) => !(confirmSelections[String(child_id || child?.child_id)] || []).length)) {
      setExpectedActionError("Select at least one clinically verified vaccine dose for every child.");
      return;
    }
    setSavingExpectedConfirm(true);
    setExpectedActionError("");
    try {
      const response = await authFetch("http://127.0.0.1:8000/api/expected-appointments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          expected_appointment_ids: selectedExpectedGroup.expected_appointment_ids || members.map(m => m.expected_appointment_id),
          selections: members.map(m => ({
            child_id: m.child_id || m.child?.child_id,
            vaccines: confirmSelections[String(m.child_id || m.child?.child_id)] || [],
          })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = result.errors ? Object.values(result.errors).flat().join(" ") : "";
        throw new Error(detail || result.message || "Unable to confirm the appointment.");
      }
      setExpectedDialog(null);
      setSelectedExpectedGroup(null);
      setExpectedActionSuccess("Confirmed successfully. New appointment(s) are now Pending.");
      await Promise.all([authFetchExpectedAppointments(), authFetchAppointments(), authFetchVaccines()]);
      setStatusFilter("All");
      setDateFilter("All");
    } catch (error) {
      setExpectedActionError(error.message || "Unable to confirm the appointment.");
    } finally {
      setSavingExpectedConfirm(false);
    }
  };

  // Expected appointments are separate from actual Pending appointments.
  const authFetchExpectedAppointments = async () => {
    try {
      const response = await authFetch(
        "http://127.0.0.1:8000/api/expected-appointments",
      );
      if (!response.ok) {
        setExpectedAppointmentsError("Unable to load expected appointments.");
        return;
      }
      const data = await response.json();
      setExpectedAppointments(Array.isArray(data) ? data : []);
      setExpectedAppointmentsError("");
    } catch (error) {
      console.error("Error fetching expected appointments:", error);
      setExpectedAppointmentsError("Unable to load expected appointments.");
    }
  };

  const authFetchAppointments = async () => {
    try {
      const response = await authFetch("http://127.0.0.1:8000/api/appointments");

      const data = await response.json();

      if (response.ok) {
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error authFetching appointments:", error);
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

  const authFetchParents = async () => {
    try {
      const response = await authFetch("http://127.0.0.1:8000/api/users");

      const data = await response.json();

      if (response.ok) {
        setParents(data.filter((parent) => parent.status === "Active"));
      }
    } catch (error) {
      console.error("Error authFetching parents:", error);
    }
  };

  const authFetchChildren = async () => {
    try {
      const response = await authFetch("http://127.0.0.1:8000/api/children");

      const data = await response.json();

      if (response.ok) {
        setChildren(data);
      }
    } catch (error) {
      console.error("Error authFetching children:", error);
    }
  };

  const authFetchVaccines = async () => {
    try {
      const response = await authFetch("http://127.0.0.1:8000/api/vaccines");

      const data = await response.json();

      if (response.ok) {
        setVaccines(data);
      }
    } catch (error) {
      console.error("Error authFetching vaccines:", error);
    }
  };

  const authFetchStaff = async () => {
    try {
      const response = await authFetch("http://127.0.0.1:8000/api/staff");

      const data = await response.json();

      if (response.ok) {
        setStaff(
          Array.isArray(data)
            ? data.filter((person) => person.status === "Active")
            : [],
        );
      }
    } catch (error) {
      console.error("Error authFetching staff:", error);
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

    const status = appointment.status || "Pending";

    const matchesStatus = statusFilter === "All" || status === statusFilter;

    const appointmentType = appointment.appointment_type || "Vaccination";

    const matchesAppointmentType =
      appointmentTypeFilter === "All" ||
      appointmentType === appointmentTypeFilter;

    const matchesChild =
      !childFilterId ||
      appointmentChildren.some(
        (child) => String(child.child_id) === String(childFilterId),
      );

    return (
      matchesSearch &&
      matchesDate &&
      matchesStatus &&
      matchesAppointmentType &&
      matchesChild
    );
  });

  // ==============================
  // SORT APPOINTMENTS
  // ==============================

  const statusOrder = {
    Pending: 1,
    Missed: 2,
    Cancelled: 3,
    Completed: 4,
  };

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const statusA = a.status || "Pending";
    const statusB = b.status || "Pending";

    const statusDifference =
      (statusOrder[statusA] || 99) - (statusOrder[statusB] || 99);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const dateA = new Date(
      `${a.appointment_date || "9999-12-31"}T${
        a.appointment_time || "00:00:00"
      }`,
    );

    const dateB = new Date(
      `${b.appointment_date || "9999-12-31"}T${
        b.appointment_time || "00:00:00"
      }`,
    );

    return dateA - dateB;
  });

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
      selectedParents.map(Number).includes(Number(child.user_id)) &&
      child.status === "Continuing",
  );

  // ==============================
  // PARENT SELECTION
  // ==============================

  const filteredParents = parents.filter((parent) => {
    const searchValue = parentSearch.toLowerCase().trim();

    if (!searchValue) {
      return true;
    }

    return (
      parent.user_fullname?.toLowerCase().includes(searchValue) ||
      parent.email?.toLowerCase().includes(searchValue) ||
      parent.mobile_number?.toLowerCase().includes(searchValue)
    );
  });

  const toggleParent = (parentId) => {
    // General appointments automatically include everyone.
    if (appointmentType === "General") {
      return;
    }

    const normalizedParentId = Number(parentId);

    setSelectedParents((previous) => {
      const normalizedPrevious = previous.map(Number);

      const newSelectedParents = normalizedPrevious.includes(
        normalizedParentId,
      )
        ? normalizedPrevious.filter((id) => id !== normalizedParentId)
        : [...normalizedPrevious, normalizedParentId];

      setSelectedChildren((currentChildren) =>
        currentChildren.filter((childId) => {
          const child = children.find(
            (item) => Number(item.child_id) === Number(childId),
          );

          return (
            child &&
            newSelectedParents.includes(Number(child.user_id))
          );
        }),
      );

      return newSelectedParents;
    });
  };

  // ==============================
  // APPOINTMENT TYPE CHANGE
  // ==============================

  const handleAppointmentTypeChange = (type) => {
    setAppointmentType(type);

    if (type === "General") {
      // Select ALL active parents.
      const allParentIds = parents.map((parent) => Number(parent.user_id));

      // Select ALL continuing children belonging to those active parents.
      const allChildIds = children
        .filter(
          (child) =>
            allParentIds.includes(Number(child.user_id)) &&
            child.status === "Continuing",
        )
        .map((child) => child.child_id);

      setSelectedParents(allParentIds);
      setSelectedChildren(allChildIds);

      // IMPORTANT:
      // Do NOT clear vaccines.
      // General appointments can still use the vaccine section.

      // Clear parent search so the full selected list is visible.
      setParentSearch("");
    } else {
      // Switching back to Vaccination allows manual parent/child selection.
      setSelectedParents([]);
      setSelectedChildren([]);

      // Vaccines can be selected again manually.
      setSelectedVaccines([]);
    }
  };

  // ==============================
  // CHILD SELECTION
  // ==============================

  const toggleChild = (childId) => {
    // General appointments automatically include everyone.
    if (appointmentType === "General") {
      return;
    }

    setSelectedChildren((previous) => {
      const isAlreadySelected = previous.includes(childId);

      if (isAlreadySelected) {
        return previous.filter((id) => id !== childId);
      }

      const newSelectedChildren = [...previous, childId];
      // A newly selected child may have already completed one of the chosen doses.
      // Existing selections remain visible but Save is blocked until corrected.

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
          `Cannot select this child because ${
            vaccine?.vaccine_name || "the selected vaccine"
          } does not have enough stock for ${
            newSelectedChildren.length
          } children.`,
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
    const vaccine = vaccines.find(
      (item) => Number(item.vaccine_ID) === Number(vaccineId),
    );

    if (!vaccine) {
      return;
    }

    const requiredStock = selectedChildren.length;
    const availableStock = Number(vaccine.stock_quantity || 0);

    setSelectedVaccines((previous) => {
      const existing = previous.find(
        (item) => Number(item.vaccine_id) === Number(vaccineId),
      );

      if (existing) {
        return previous.filter(
          (item) => Number(item.vaccine_id) !== Number(vaccineId),
        );
      }

      if (requiredStock === 0) {
        alert("Please select at least one child first.");
        return previous;
      }

      if (availableStock < requiredStock) {
        alert(
          `${vaccine.vaccine_name} does not have enough stock. ` +
            `Required: ${requiredStock}, Available: ${availableStock}.`,
        );

        return previous;
      }

      if (doseCheckPending) {
        alert(completedDosesError || "Please wait for completed-dose records to load.");
        return previous;
      }
      const firstAvailableDose = [1, 2, 3, 4, 5].find(
        (dose) => !completedDoseUnavailable(vaccineId, dose)
      );
      if (!firstAvailableDose) {
        alert("All displayed doses of this vaccine are already completed for at least one selected child.");
        return previous;
      }
      return [
        ...previous,
        {
          vaccine_id: vaccineId,
          dose_number: firstAvailableDose,
        },
      ];
    });
  };

  // ==============================
  // CHANGE DOSE
  // ==============================

  const changeDose = (vaccineId, dose) => {
    if (doseCheckPending || completedDoseUnavailable(vaccineId, dose)) return;
    setSelectedVaccines((previous) =>
      previous.map((item) =>
        Number(item.vaccine_id) === Number(vaccineId)
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

    if (doseCheckPending) {
      alert(completedDosesError || "Please wait until completed-dose records are loaded.");
      return;
    }
    if (selectedVaccines.some((item) => completedDoseUnavailable(item.vaccine_id, item.dose_number))) {
      alert("A selected dose is already Completed for at least one child. Please change the dose or child selection.");
      return;
    }

    // Both Vaccination and General appointments can use vaccines.
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
      status: editingStatus || existingAppointment?.status || "Pending",
      child_ids: selectedChildren,
      vaccines: selectedVaccines,
    };

    try {
      let response;

      if (editingId !== null) {
        response = await authFetch(
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
        response = await authFetch("http://127.0.0.1:8000/api/appointments", {
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

      await authFetchAppointments();

      clearForm();
    } catch (error) {
      console.error("Error saving appointment:", error);

      alert("Unable to connect to the server.");
    }
  };

  // ==============================
  // OPEN COMPLETION POPUP
  // ==============================

  const openCompletionPopup = (appointment) => {
    const appointmentChildren = appointment.children || [];

    const initialMeasurements = {};

    appointmentChildren.forEach((child) => {
      initialMeasurements[child.child_id] = {
        height_cm: "",
        weight_kg: "",
      };
    });

    setCompletionAppointment(appointment);
    setCompletionProvider(
      appointment.staff_id ? String(appointment.staff_id) : "",
    );
    setCompletionMeasurements(initialMeasurements);
    setShowCompletionPopup(true);
  };

  // ==============================
  // CLOSE COMPLETION POPUP
  // ==============================

  const closeCompletionPopup = () => {
    setShowCompletionPopup(false);
    setCompletionAppointment(null);
    setCompletionProvider("");
    setCompletionMeasurements({});
  };

  // ==============================
  // UPDATE COMPLETION MEASUREMENT
  // ==============================

  const updateCompletionMeasurement = (childId, field, value) => {
    setCompletionMeasurements((previous) => ({
      ...previous,
      [childId]: {
        ...(previous[childId] || {}),
        [field]: value,
      },
    }));
  };

  // ==============================
  // COMPLETE APPOINTMENT
  // ==============================

  const completeAppointment = async () => {
    if (!completionAppointment) {
      return;
    }

    if (!completionProvider) {
      alert("Please select the provider or personnel.");
      return;
    }

    const appointmentChildren = completionAppointment.children || [];

    for (const child of appointmentChildren) {
      const measurement = completionMeasurements[child.child_id];

      if (
        !measurement ||
        measurement.height_cm === "" ||
        measurement.weight_kg === ""
      ) {
        alert(
          `Please enter the current height and weight for ${child.child_name}.`,
        );
        return;
      }

      if (
        Number(measurement.height_cm) <= 0 ||
        Number(measurement.weight_kg) <= 0
      ) {
        alert(`Please enter valid height and weight for ${child.child_name}.`);
        return;
      }
    }

    const growthRecords = appointmentChildren.map((child) => {
      const measurement = completionMeasurements[child.child_id];

      return {
        child_id: child.child_id,
        appointment_id: completionAppointment.appointment_id,
        height_cm: Number(measurement.height_cm),
        weight_kg: Number(measurement.weight_kg),
      };
    });

    try {
      const response = await authFetch(
        `http://127.0.0.1:8000/api/appointments/${completionAppointment.appointment_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: "Completed",
            staff_id: Number(completionProvider),
            provider_id: Number(completionProvider),
            growth_records: growthRecords,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Laravel error:", result);

        alert(result.message || "Failed to complete the appointment.");

        return;
      }

      await authFetchAppointments();
      await authFetchExpectedAppointments();

      closeCompletionPopup();
    } catch (error) {
      console.error("Error completing appointment:", error);

      alert("Unable to connect to the server.");
    }
  };

  const handleStatusChange = (appointment, newStatus) => {
    // Selecting Pending should open the appointment editor first.
    if (newStatus === "Pending") {
      openEditAppointment(appointment.appointment_id, "Pending");
      return;
    }

    updateAppointmentStatus(appointment.appointment_id, newStatus);
  };

  // ==============================
  // UPDATE STATUS
  // ==============================

  const updateAppointmentStatus = async (id, newStatus) => {
    if (!hasPermission("edit_appointments")) {
      alert("You do not have permission to edit appointments.");
      return;
    }

    const appointment = appointments.find((item) => item.appointment_id === id);

    if (!appointment) {
      return;
    }

    // Completed requires the completion form first.
    if (newStatus === "Completed") {
      openCompletionPopup(appointment);
      return;
    }

    try {
      const response = await authFetch(
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

      await authFetchAppointments();
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

  const openEditAppointment = (appointmentId, statusOverride = null) => {
    const appointment = appointments.find(
      (item) => item.appointment_id === appointmentId,
    );

    if (!appointment) {
      return;
    }

    if (!hasPermission("edit_appointments")) {
      alert("You do not have permission to edit appointments.");
      return;
    }

    setEditingId(appointment.appointment_id);

    setEditingStatus(statusOverride || appointment.status || "Pending");

    setDate(appointment.appointment_date || "");
    setTime(appointment.appointment_time || "");
    setAddress(appointment.address || "Barangay Health Center");
    setAppointmentType(appointment.appointment_type || "Vaccination");

    const appointmentChildren = appointment.children || [];

    const childIds = appointmentChildren.map((child) => child.child_id);

    const parentIds = [
      ...new Set(
        appointmentChildren
          .map((child) => Number(child.user_id))
          .filter(Boolean),
      ),
    ];

    setSelectedParents(parentIds);
    setSelectedChildren(childIds);

    const appointmentVaccines = appointment.vaccines || [];

    setSelectedVaccines(
      appointmentVaccines.map((item) => ({
        vaccine_id:
          item.vaccine_id ||
          item.vaccine?.vaccine_ID ||
          item.vaccine?.vaccine_id,
        dose_number: item.dose_number || 1,
      })),
    );

    setParentSearch("");
    setShowChildSelection(false);
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

    setParentSearch("");

    setEditingId(null);
    setEditingStatus(null);
    setShowPopup(false);
  };

  // ==============================
  // STATUS CLASS
  // ==============================

  const getStatusClass = (status) => {
    return `status-${(status || "Pending").toLowerCase().replace(" ", "-")}`;
  };

  // ==============================
  // VIEW APPOINTMENT
  // ==============================

  const viewAppointment = (appointment) => {
    if (appointment.children?.length === 1) {
      navigate(`/patient_viewrecord/${appointment.children[0].child_id}`, {
        state: {
          from: "/appointments",
          fromLabel: "Back to Appointments",
        },
      });
    } else if (appointment.children?.length > 1) {
      setSelectedHistoryAppointment(appointment);
      setShowChildSelection(true);
    }
  };

  // ==============================
  // APPOINTMENT ROW
  // ==============================

  const renderAppointmentRow = (appointment) => {
    const appointmentChildren = appointment.children || [];

    const parentTitle = getAppointmentTitle(appointment);

    const status = appointment.status || "Pending";

    const childNames =
      appointmentChildren.length > 0
        ? appointmentChildren.map((child) => child.child_name).join(", ")
        : "No children";

    const vaccineNames =
      appointment.vaccines?.length > 0
        ? appointment.vaccines
            .map(
              (item) =>
                `${item.vaccine?.vaccine_name || "Unknown"} (Dose ${
                  item.dose_number || 1
                })`,
            )
            .join(", ")
        : "No vaccines";

    return (
      <div className="appointment-table-row" key={appointment.appointment_id}>
        {/* DATE & TIME */}
        <div className="appointment-table-cell appointment-table-date">
          <FaCalendarAlt />

          <div>
            <strong>{appointment.appointment_date}</strong>

            <span>{appointment.appointment_time || "—"}</span>
          </div>
        </div>

        {/* PARENT / GUARDIAN */}
        <div className="appointment-table-cell appointment-table-parent">
          <FaUser />

          <span>{parentTitle}</span>
        </div>

        {/* CHILDREN */}
        <div className="appointment-table-cell appointment-table-children">
          <FaChild />

          <span>{childNames}</span>
        </div>

        {/* APPOINTMENT TYPE */}
        <div className="appointment-table-cell appointment-table-type">
          {appointment.appointment_type || "—"}
        </div>

        {/* CLINIC / LOCATION */}
        <div className="appointment-table-cell appointment-table-location">
          <FaMapMarkerAlt />

          <span>{appointment.address || "—"}</span>
        </div>

        {/* VACCINES / DOSES */}
        <div className="appointment-table-cell appointment-table-vaccines">
          <FaSyringe />

          <span>{vaccineNames}</span>
        </div>

        {/* STATUS */}
        <div className="appointment-table-cell appointment-table-status">
          {hasPermission("edit_appointments") && status !== "Completed" ? (
            <select
              className={`appointment-table-status-select ${getStatusClass(
                status,
              )}`}
              value={status}
              onChange={(e) => handleStatusChange(appointment, e.target.value)}
              title="Change appointment status"
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          ) : (
            <span className={`appointment-status ${getStatusClass(status)}`}>
              {status}
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="appointment-table-cell appointment-table-actions">
          {hasPermission("edit_appointments") && status === "Pending" && (
            <button
              className="appointment-table-action edit"
              title="Edit appointment"
              onClick={(e) => {
                e.stopPropagation();
                openEditAppointment(appointment.appointment_id);
              }}
            >
              <FaPen />
            </button>
          )}

          {hasPermission("edit_appointments") && status === "Pending" && (
            <button
              className="appointment-table-action cancel"
              title="Cancel appointment"
              onClick={(e) => {
                e.stopPropagation();
                cancelAppointment(appointment);
              }}
            >
              <FaTrash />
            </button>
          )}

          <button
            className="appointment-table-action view"
            title="View appointment"
            onClick={(e) => {
              e.stopPropagation();
              viewAppointment(appointment);
            }}
          >
            <FaEye />
          </button>
        </div>
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

            <p>Manage all scheduled and past appointments.</p>
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
              placeholder="Search child, parent, or appointment ID"
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

          <select
            className="appointment-filter appointment-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Missed">Missed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="appointment-filter"
            value={appointmentTypeFilter}
            onChange={(e) => setAppointmentTypeFilter(e.target.value)}
          >
            <option value="All">Appointment Types</option>
            <option value="Vaccination">Vaccination </option>
            <option value="General">General</option>
          </select>

          {hasPermission("add_appointments") && (
            <button
              className="appointment-button"
              onClick={() => {
                clearForm();
                setShowPopup(true);
              }}
            >
              + Add Appointment
            </button>
          )}
        </div>

        {expectedActionSuccess && <p role="status" className="expected-action-success">{expectedActionSuccess}</p>}
        {/* EXPECTING APPOINTMENTS — GROUPED CHILDREN */}
        <section className="expected-appointments-section" aria-label="Expecting Appointments">
          <div className="expected-appointments-heading">
            <div>
              <h3>Expecting Appointments</h3>
              <p>Vaccination follow-ups awaiting Admin confirmation.</p>
            </div>
            <span className="expected-appointments-count">
              {expectedAppointments.length} Expected
            </span>
          </div>
          <div className="expected-appointments-table-container">
            <div className="expected-appointments-scroll">
            <table className="expected-appointments-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Parent / Guardian</th>
                  <th>Children</th>
                  <th>Appointment Type</th>
                  <th>Clinic / Location</th>
                  <th>Next Vaccines &amp; Doses</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expectedAppointmentsError ? (
                  <tr><td colSpan={8} className="expected-appointments-empty">{expectedAppointmentsError}</td></tr>
                ) : expectedAppointments.length === 0 ? (
                  <tr><td colSpan={8} className="expected-appointments-empty">No expected appointments awaiting confirmation.</td></tr>
                ) : expectedAppointments.map((expected) => {
                  const members = expected.children || [];
                  const source = expected.source_appointment;
                  const parentNames = [...new Set(members.map(({ child }) =>
                    child?.user?.user_fullname ||
                    parents.find((parent) => Number(parent.user_id) === Number(child?.user_id))?.user_fullname ||
                    "No parent assigned"
                  ))];
                  return (
                    <tr key={`${expected.source_appointment_id}-${expected.expected_date}-${expected.expected_time}`}>
                      <td><strong>{expected.expected_date || "—"}</strong><div>{expected.expected_time || "—"}</div></td>
                      <td>{parentNames.join(", ")}</td>
                      <td>{members.map(({ child }) => child?.child_name || "Unknown child").join(", ") || "No children"}</td>
                      <td>Vaccination</td>
                      <td>{source?.address || "Barangay Health Center"}</td>
                      <td>
                        <span className="expected-muted">Review vaccine history on Confirm</span>
                      </td>
                      <td><span className="expected-appointments-status">{expected.status || "Awaiting Confirmation"}</span></td>
                      <td>
                        {hasPermission("add_appointments") || hasPermission("edit_appointments") ? (
                          <div className="expected-actions">
                            <button type="button" className="appointment-table-action expected-confirm-action"
                              disabled={!hasPermission("add_appointments")}
                              title="Confirm expected appointment" aria-label="Confirm expected appointment"
                              onClick={() => openExpectedConfirm(expected)}>
                              <FaCheck />
                            </button>
                            <button type="button" className="appointment-table-action expected-reschedule-action"
                              disabled={!hasPermission("edit_appointments")}
                              title="Reschedule expected appointment" aria-label="Reschedule expected appointment"
                              
                              onClick={() => {
                                setSelectedExpectedGroup(expected);
                                setRescheduleDate(expected.expected_date || "");
                                setRescheduleTime(expected.expected_time?.slice(0, 5) || "");
                                setExpectedActionError("");
                                setExpectedDialog("reschedule");
                              }}>
                              <FaCalendarPlus />
                            </button>
                          </div>
                        ) : <span>View only</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </section>

        {/* Expected appointment preview; no booking until the backend validates doses and stock. */}
        {expectedDialog && selectedExpectedGroup && (
          <div className="appointment-popup-overlay">
            <div className="appointment-popup">
              <div className="appointment-popup-header">
                <div className="appointment-popup-title">
                  <div className="appointment-popup-title-icon"><FaCalendarAlt /></div>
                  <div>
                    <h3>{expectedDialog === "confirm" ? "Confirm Expected Appointment" : "Reschedule Expected Appointment"}</h3>
                    <p>{expectedDialog === "confirm" ? "Review all children before final confirmation." : "Choose a new date and time for this group."}</p>
                  </div>
                </div>
                <button type="button" className="appointment-popup-close" aria-label="Close"
                  onClick={() => { setExpectedDialog(null); setSelectedExpectedGroup(null); }}><FaTimes /></button>
              </div>
              <div className="appointment-popup-body">
                <div className="appointment-form-section">
                  <h4>Appointment Details</h4>
                  <p>Location: {selectedExpectedGroup.source_appointment?.address || "Barangay Health Center"}</p>
                  {expectedDialog === "confirm" ? (
                    <p>Date: {selectedExpectedGroup.expected_date} | Time: {selectedExpectedGroup.expected_time}</p>
                  ) : (
                    <div className="appointment-details-grid">
                      <div className="appointment-field"><label>Date</label><input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} /></div>
                      <div className="appointment-field"><label>Time</label><input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} /></div>
                    </div>
                  )}
                </div>
                <div className="appointment-form-section">
                  <h4>Children ({selectedExpectedGroup.children?.length || 0})</h4>
                  {expectedDialog === "confirm" && loadingConfirmPreview && <p>Loading vaccination history and stock...</p>}
                  {(selectedExpectedGroup.children || []).map(({ child, expected_appointment_id, child_id }) => {
                    const id = String(child_id || child?.child_id);
                    const detail = confirmPreview?.children?.find(item => String(item.child_id) === id);
                    return (
                      <div key={expected_appointment_id} className="expected-child-preview">
                        <strong>{child?.child_name || "Unknown child"}</strong>
                        <div className="expected-muted">Parent: {child?.user?.user_fullname || parents.find(p => Number(p.user_id) === Number(child?.user_id))?.user_fullname || "Unknown"}</div>
                        {expectedDialog === "confirm" && detail && (
                          <div className="expected-vaccine-options">
                            {detail.vaccines.map(vaccine => {
                              const selected = (confirmSelections[id] || []).some(item => Number(item.vaccine_id) === Number(vaccine.vaccine_id));
                              return (
                                <label key={vaccine.vaccine_id} className="expected-vaccine-option">
                                  <input type="checkbox" checked={selected} disabled={vaccine.stock_quantity < 1 || vaccine.expired || vaccine.already_completed || vaccine.already_pending}
                                    onChange={() => toggleConfirmVaccine(id, vaccine.vaccine_id, vaccine.next_dose)} />
                                  <span>{vaccine.vaccine_name} — Dose {vaccine.next_dose} · Stock {vaccine.stock_quantity}
                                    {vaccine.already_completed ? " · Already completed" : vaccine.already_pending ? " · Already pending" : vaccine.expired ? " · Expired" : ""}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {expectedActionError && <p role="alert" className="expected-action-error">{expectedActionError}</p>}
                <p className="expected-action-note">
                  {expectedDialog === "confirm"
                    ? "Suggested dose numbers are based on recorded history, not clinical eligibility. A qualified provider must verify the schedule and select the appropriate vaccines before booking."
                    : "Rescheduling updates this expected group only. It does not create a Pending appointment or change stock."}
                </p>
              </div>
              <div className="appointment-popup-footer">
                <div className="appointment-popup-actions">
                  <button type="button" className="appointment-cancel" onClick={() => { setExpectedDialog(null); setSelectedExpectedGroup(null); }}>Close</button>
                  {expectedDialog === "confirm" ? (
                    <button type="button" className="set" onClick={saveExpectedConfirm} disabled={savingExpectedConfirm || loadingConfirmPreview || !confirmPreview}>
                      {savingExpectedConfirm ? "Confirming..." : "Final Confirm"}
                    </button>
                  ) : (
                    <button type="button" className="set" onClick={saveExpectedReschedule} disabled={savingExpectedReschedule}>
                      {savingExpectedReschedule ? "Saving..." : "Save Reschedule"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SINGLE APPOINTMENT TABLE */}
        <div className="appointment-table-container">
          <div className="appointment-table">
            {/* TABLE HEADER */}
            <div className="appointment-table-header">
              <div>Date & Time</div>
              <div>Parent / Guardian</div>
              <div>Children</div>
              <div>Appointment Type</div>
              <div>Clinic / Location</div>
              <div>Vaccines & Doses</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* TABLE BODY */}
            <div className="appointment-table-body">
              {sortedAppointments.length === 0 ? (
                <div className="appointment-table-empty">
                  <FaCalendarAlt />

                  <h4>No appointments found</h4>

                  <p>Try changing your search or filter settings.</p>
                </div>
              ) : (
                sortedAppointments.map((appointment) =>
                  renderAppointmentRow(appointment),
                )
              )}
            </div>
          </div>
        </div>

        {/* ==============================
            ADD / EDIT POPUP
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
                          onChange={(e) =>
                            handleAppointmentTypeChange(e.target.value)
                          }
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

                        <span>
                          {appointmentType === "General"
                            ? "All active parents are automatically selected for a General appointment."
                            : "Select one or more parents or guardians."}
                        </span>
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
                        <>
                          {appointmentType === "General" && (
                            <div className="appointment-no-data">
                              All active parents are selected automatically.
                            </div>
                          )}

                          <div className="appointment-parent-search">
                            <input
                              type="text"
                              value={parentSearch}
                              onChange={(e) => setParentSearch(e.target.value)}
                              placeholder="Search parent by name, email, or phone..."
                              disabled={appointmentType === "General"}
                            />
                          </div>

                          {filteredParents.length === 0 ? (
                            <div className="appointment-no-data">
                              No parents found matching "{parentSearch}".
                            </div>
                          ) : (
                            <div className="appointment-parent-grid">
                              {filteredParents.map((parent) => {
                                const selected = selectedParents
                                  .map(Number)
                                  .includes(Number(parent.user_id));

                                return (
                                  <button
                                    type="button"
                                    key={parent.user_id}
                                    className={`appointment-select-card ${
                                      selected ? "selected" : ""
                                    }`}
                                    disabled={appointmentType === "General"}
                                    onClick={() =>
                                      toggleParent(parent.user_id)
                                    }
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
                        </>
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
                          {appointmentType === "General"
                            ? "All continuing children of active parents are automatically selected."
                            : "Select the continuing children for this appointment."}
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
                        <>
                          {appointmentType === "General" && (
                            <div className="appointment-no-data">
                              All continuing children of active parents are
                              selected automatically.
                            </div>
                          )}

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
                                  disabled={appointmentType === "General"}
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
                        </>
                      )}
                    </div>
                  </div>

                  {/* VACCINES */}
                  {/* IMPORTANT: This section is available for BOTH
                      Vaccination and General appointments. */}
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

                    {selectedChildren.length > 0 && (completedDosesLoading || completedDosesError) && (
                      <p role="status" style={{ color: completedDosesError ? "#b91c1c" : "#64748b", fontSize: "13px" }}>
                        {completedDosesError || "Checking completed vaccine doses..."}
                      </p>
                    )}
                    <div className="appointment-vaccine-list">
                      {vaccines.length === 0 ? (
                        <div className="appointment-no-data">
                          No vaccines available.
                        </div>
                      ) : (
                        vaccines.map((vaccine) => {
                          const selected = selectedVaccines.find(
                            (item) =>
                              Number(item.vaccine_id) ===
                              Number(vaccine.vaccine_ID),
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
                                      selectedChildren.length ||
                                    doseCheckPending ||
                                    [1, 2, 3, 4, 5].every((dose) =>
                                      completedDoseUnavailable(vaccine.vaccine_ID, dose)
                                    ))
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
                                  {[1, 2, 3, 4, 5].map((dose) => {
                                    const completed = completedDoseUnavailable(vaccine.vaccine_ID, dose);
                                    return (
                                      <option key={dose} value={dose} disabled={completed || doseCheckPending}
                                        style={completed ? { color: "#94a3b8", backgroundColor: "#f1f5f9" } : {}}>
                                        Dose {dose}{completed ? " — Completed" : ""}
                                      </option>
                                    );
                                  })}
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

        {/* ==============================
            COMPLETE APPOINTMENT POPUP
        ============================== */}

        {showCompletionPopup && completionAppointment && (
          <div className="appointment-popup-overlay">
            <div className="appointment-popup">
              {/* POPUP HEADER */}
              <div className="appointment-popup-header">
                <div className="appointment-popup-title">
                  <div className="appointment-popup-title-icon">
                    <FaSyringe />
                  </div>

                  <div>
                    <h3>Complete Appointment</h3>

                    <p>
                      Record the provider and current child measurements.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="appointment-popup-close"
                  onClick={closeCompletionPopup}
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>

              {/* POPUP BODY */}
              <div className="appointment-popup-body">
                {/* PROVIDER */}
                <div className="appointment-form-section">
                  <div className="appointment-form-section-heading">
                    <div className="appointment-form-section-icon">
                      <FaUser />
                    </div>

                    <div>
                      <h4>Provider / Personnel</h4>

                      <span>
                        Select the personnel who administered the vaccine.
                      </span>
                    </div>
                  </div>

                  <div className="appointment-field appointment-field-full">
                    <label>Provider / Personnel</label>

                    <select
                      value={completionProvider}
                      onChange={(e) => setCompletionProvider(e.target.value)}
                    >
                      <option value="">Select provider / personnel</option>

                      {staff.map((person) => (
                        <option key={person.staff_id} value={person.staff_id}>
                          {person.staff_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CHILD MEASUREMENTS */}
                <div className="appointment-form-section">
                  <div className="appointment-form-section-heading">
                    <div className="appointment-form-section-icon">
                      <FaChild />
                    </div>

                    <div>
                      <h4>Child Measurements</h4>

                      <span>
                        Enter the child's current height and weight.
                      </span>
                    </div>
                  </div>

                  <div className="appointment-selection-box">
                    {completionAppointment.children?.length === 0 ? (
                      <div className="appointment-no-data">
                        No children found for this appointment.
                      </div>
                    ) : (
                      <div className="appointment-child-grid">
                        {completionAppointment.children.map((child) => {
                          const measurement = completionMeasurements[
                            child.child_id
                          ] || {
                            height_cm: "",
                            weight_kg: "",
                          };

                          return (
                            <div
                              key={child.child_id}
                              className="appointment-select-card selected"
                              style={{
                                cursor: "default",
                                display: "block",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  marginBottom: "14px",
                                }}
                              >
                                <span className="appointment-select-card-icon child-icon">
                                  <FaChild />
                                </span>

                                <span className="appointment-select-card-text">
                                  <strong>{child.child_name}</strong>

                                  <small>Current measurements</small>
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "12px",
                                }}
                              >
                                <div className="appointment-field">
                                  <label>Height (cm)</label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={measurement.height_cm}
                                    onChange={(e) =>
                                      updateCompletionMeasurement(
                                        child.child_id,
                                        "height_cm",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. 85"
                                  />
                                </div>

                                <div className="appointment-field">
                                  <label>Weight (kg)</label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={measurement.weight_kg}
                                    onChange={(e) =>
                                      updateCompletionMeasurement(
                                        child.child_id,
                                        "weight_kg",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. 12"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* POPUP FOOTER */}
              <div className="appointment-popup-footer">
                <div className="appointment-popup-summary">
                  <span>
                    {completionAppointment.children?.length || 0} child
                    {(completionAppointment.children?.length || 0) !== 1
                      ? "ren"
                      : ""}
                  </span>

                  <span>Provider required</span>
                </div>

                <div className="appointment-popup-actions">
                  <button
                    type="button"
                    className="appointment-cancel"
                    onClick={closeCompletionPopup}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="set"
                    onClick={completeAppointment}
                  >
                    Complete Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================
            MULTIPLE CHILD SELECTION
        ============================== */}

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
                    APPOINTMENT
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