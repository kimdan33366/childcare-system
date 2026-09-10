import { useState,useEffect } from "react";
import { emptyVaccine,
} from "../model/VaccineModel";

function VaccineController() {

  const [vaccines, setVaccines] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [newVaccine, setNewVaccine] = useState(emptyVaccine);

  const handleInputChange = (field, value) => {

    setNewVaccine((previous) => ({
      ...previous,
      [field]: value,
    }));

  };
  useEffect(() => {
  fetch("http://127.0.0.1:8000/api/vaccines")
    .then((response) => response.json())
    .then((data) => {
      const formattedVaccines = data.map((vaccine) => ({
        id: vaccine.vaccine_ID,
        name: vaccine.vaccine_name,
        expiration: vaccine.expiration_date,
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

  const openAddModal = () => {

    setEditingId(null);

    setNewVaccine({
      ...emptyVaccine,
    });

    setShowModal(true);
  };

  const openEditModal = (vaccine) => {

    setEditingId(vaccine.id);

    setNewVaccine({
      name: vaccine.name,
      expiration: vaccine.expiration,
      quantity: vaccine.quantity,
    });

    setShowModal(true);
  };

  const closeModal = () => {

    setShowModal(false);

    setEditingId(null);

    setNewVaccine({
      ...emptyVaccine,
    });
  };

  const saveVaccine = async () => {
  const quantity = Number(newVaccine.quantity);

  if (!newVaccine.name || !newVaccine.expiration) {
    alert("Please complete all fields.");
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/vaccines",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          vaccine_name: newVaccine.name,
          date_stored: new Date().toISOString().split("T")[0],
          expiration_date: newVaccine.expiration,
          stock_quantity: quantity,
          status: quantity > 0 ? "Available" : "Out of Stock",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert("Failed to add vaccine.");
      return;
    }

    const vaccineToAdd = {
      id: data.vaccine_ID,
      name: data.vaccine_name,
      expiration: data.expiration_date,
      quantity: data.stock_quantity,
      status:
        data.stock_quantity > 0
          ? "In Stock"
          : "Out of Stock",
    };

    setVaccines((previous) => [
      ...previous,
      vaccineToAdd,
    ]);

    alert("Vaccine added successfully!");

    closeModal();

  } catch (error) {
    console.error("Error adding vaccine:", error);
    alert("Could not connect to the server.");
  }
};
  const deleteVaccine = (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vaccine?"
    );

    if (!confirmDelete) return;

    setVaccines((previous) =>
      previous.filter((vaccine) => vaccine.id !== id)
    );

  };

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

  return {
    filteredVaccines,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showModal,
    editingId,
    newVaccine,
    handleInputChange,
    openAddModal,
    openEditModal,
    closeModal,
    saveVaccine,
    deleteVaccine,
  };

};
export default VaccineController;