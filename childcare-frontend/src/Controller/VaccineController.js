import { useState, useEffect } from "react";
import { emptyVaccine } from "../model/VaccineModel";

function VaccineController() {
  const [vaccines, setVaccines] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [newVaccine, setNewVaccine] = useState(emptyVaccine);

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleInputChange = (field, value) => {
    setNewVaccine((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // FETCH VACCINES
  // =========================================================

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/vaccines")
      .then((response) => response.json())
      .then((data) => {
        const formattedVaccines = data.map((vaccine) => ({
          id: vaccine.vaccine_ID,

          name: vaccine.vaccine_name,

          dateStored: vaccine.date_stored || "",

          production: vaccine.production_date || "",

          expiration: vaccine.expiration_date || "",

          quantity: vaccine.stock_quantity,

          status:
            vaccine.stock_quantity > 0
              ? "In Stock"
              : "Out of Stock",
        }));

        setVaccines(formattedVaccines);
      })
      .catch((error) => {
        console.error("Error fetching vaccines:", error);
      });
  }, []);

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {
    setEditingId(null);

    setNewVaccine({
      ...emptyVaccine,
    });

    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (vaccine) => {
    setEditingId(vaccine.id);

    setNewVaccine({
      name: vaccine.name,

      dateStored: vaccine.dateStored || "",

      production: vaccine.production || "",

      expiration: vaccine.expiration || "",

      quantity: vaccine.quantity,
    });

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    setShowModal(false);

    setEditingId(null);

    setNewVaccine({
      ...emptyVaccine,
    });
  };

  // =========================================================
  // SAVE VACCINE
  // =========================================================

  const saveVaccine = async () => {
    const quantity = Number(newVaccine.quantity);

    if (!newVaccine.name || !newVaccine.expiration) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      const isEditing = editingId !== null;

      const url = isEditing
        ? `http://127.0.0.1:8000/api/vaccines/${editingId}`
        : "http://127.0.0.1:8000/api/vaccines";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          vaccine_name: newVaccine.name,

          date_stored:
            newVaccine.dateStored ||
            new Date().toISOString().split("T")[0],

          production_date:
            newVaccine.production || null,

          expiration_date: newVaccine.expiration,

          stock_quantity: quantity,

          status:
            quantity > 0
              ? "Available"
              : "Out of Stock",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);

        alert(
          isEditing
            ? "Failed to update vaccine."
            : "Failed to add vaccine."
        );

        return;
      }

      // Laravel returns the vaccine inside data.vaccine
      const savedVaccine = data.vaccine;

      const vaccineData = {
        id: savedVaccine.vaccine_ID,

        name: savedVaccine.vaccine_name,

        dateStored:
          savedVaccine.date_stored || "",

        production:
          savedVaccine.production_date || "",

        expiration:
          savedVaccine.expiration_date || "",

        quantity:
          savedVaccine.stock_quantity,

        status:
          savedVaccine.stock_quantity > 0
            ? "In Stock"
            : "Out of Stock",
      };

      if (isEditing) {
        setVaccines((previous) =>
          previous.map((vaccine) =>
            vaccine.id === editingId
              ? vaccineData
              : vaccine
          )
        );

        alert("Vaccine updated successfully!");
      } else {
        setVaccines((previous) => [
          ...previous,
          vaccineData,
        ]);

        alert("Vaccine added successfully!");
      }

      closeModal();
    } catch (error) {
      console.error("Error saving vaccine:", error);

      alert("Could not connect to the server.");
    }
  };

  // =========================================================
  // DELETE VACCINE
  // =========================================================

  const deleteVaccine = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vaccine?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/vaccines/${id}`,
        {
          method: "DELETE",

          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete vaccine");
      }

      setVaccines((previous) =>
        previous.filter(
          (vaccine) => vaccine.id !== id
        )
      );

      alert("Vaccine deleted successfully.");
    } catch (error) {
      console.error(
        "Delete vaccine error:",
        error
      );

      alert(
        "Failed to delete vaccine. Please try again."
      );
    }
  };

  // =========================================================
  // FILTER VACCINES
  // =========================================================

  const filteredVaccines = vaccines
    .filter((vaccine) =>
      vaccine.name
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((vaccine) =>
      statusFilter === "All"
        ? true
        : vaccine.status === statusFilter
    );

  // =========================================================
  // RETURN
  // =========================================================

  return {
    filteredVaccines,

    search,
    setSearch,

    statusFilter,
    setStatusFilter,

    showModal,

    editingId,

    openMenuId,
    setOpenMenuId,

    vaccines,
    setVaccines,

    newVaccine,

    handleInputChange,

    openAddModal,
    openEditModal,
    closeModal,

    saveVaccine,
    deleteVaccine,
  };
}

export default VaccineController;