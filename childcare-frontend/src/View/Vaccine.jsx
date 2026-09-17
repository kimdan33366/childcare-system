import "../css/Vaccine.css";

import { FaCapsules, FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";

import Sidebar from "../View/Sidebar";

import VaccineController from "../Controller/VaccineController";

function Vaccine() {
  const {
    filteredVaccines,

    search,
    setSearch,

    statusFilter,
    setStatusFilter,

    showModal,

    editingId,

    openMenuId,
    setOpenMenuId,

    newVaccine,

    handleInputChange,

    openAddModal,

    openEditModal,

    closeModal,

    saveVaccine,

    deleteVaccine,
  } = VaccineController();

  return (
    <div className="vaccine-admin-container">
      <Sidebar />

      <div className="vaccine-main-content">
        <div className="vaccine-page-header">
          <div>
            <h1>Vaccines</h1>
            <p>Manage vaccine inventory and availability.</p>
          </div>

          <button className="vaccine-add-btn" onClick={openAddModal}>
            <FaPlus />
            Add Vaccine
          </button>
        </div>
        <div className="vaccine-summary">
          <div className="vaccine-summary-card">
            <span>Total Vaccines</span>
            <strong>{filteredVaccines.length}</strong>
          </div>

          <div className="vaccine-summary-card">
            <span>Available Stock</span>
            <strong>
              {filteredVaccines.reduce(
                (total, vaccine) => total + Number(vaccine.quantity || 0),
                0,
              )}
            </strong>
          </div>

          <div className="vaccine-summary-card">
            <span>Low Stock</span>
            <strong>
              {
                filteredVaccines.filter(
                  (vaccine) =>
                    Number(vaccine.quantity || 0) > 0 &&
                    Number(vaccine.quantity || 0) <= 5,
                ).length
              }
            </strong>
          </div>

          <div className="vaccine-summary-card">
            <span>Out of Stock</span>
            <strong>
              {
                filteredVaccines.filter(
                  (vaccine) => Number(vaccine.quantity || 0) === 0,
                ).length
              }
            </strong>
          </div>
        </div>
        <div className="vaccine-toolbar">
          <div className="vaccine-search-box">
            <FaSearch className="vaccine-search-icon" />

            <input
              type="text"
              placeholder="Search vaccine..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="vaccine-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <div className="vaccine-table-container">
          <table className="vaccine-table">
            <thead>
              <tr>
                <th>Vaccine</th>
                <th>Stock</th>
                <th>Expiration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredVaccines.map((vaccine) => (
                <tr key={vaccine.id}>
                  <td>
                    <div className="vaccine-name">
                      <div className="vaccine-icon">
                        <FaCapsules />
                      </div>

                      <span>{vaccine.name}</span>
                    </div>
                  </td>

                  <td>
                    <span className="vaccine-stock">
                      {vaccine.quantity} vials
                    </span>
                  </td>

                  <td>
                    <span className="vaccine-expiration">
                      {vaccine.expiration || "—"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`vaccine-status ${
                        Number(vaccine.quantity || 0) === 0
                          ? "out-stock"
                          : Number(vaccine.quantity || 0) <= 5
                            ? "low-stock"
                            : "in-stock"
                      }`}
                    >
                      {Number(vaccine.quantity || 0) === 0
                        ? "Out of Stock"
                        : Number(vaccine.quantity || 0) <= 5
                          ? "Low Stock"
                          : "In Stock"}
                    </span>
                  </td>

                  <td>
                    <div className="vaccine-actions">
                      <button
                        className="vaccine-edit-btn"
                        onClick={() => openEditModal(vaccine)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="vaccine-delete-btn"
                        onClick={() => deleteVaccine(vaccine.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="vaccine-modal-overlay">
          <div className="vaccine-modal">
            <h2>{editingId !== null ? "Edit Vaccine" : "Add Vaccine"}</h2>
            <p className="vaccine-modal-subtitle">
              {editingId !== null
                ? "Update the vaccine information below."
                : "Enter the vaccine details below."}
            </p>
            <div className="vaccine-modal-input">
              <label>Vaccine Name</label>

              <input
                type="text"
                value={newVaccine.name}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
              />
            </div>

            <div className="vaccine-modal-input">
              <label>Expiration Date</label>

              <input
                type="date"
                value={newVaccine.expiration}
                onChange={(event) =>
                  handleInputChange("expiration", event.target.value)
                }
              />
            </div>

            <div className="vaccine-modal-input">
              <label>Quantity(Vials)</label>

              <input
                type="number"
                min="0"
                value={newVaccine.quantity}
                onChange={(event) =>
                  handleInputChange("quantity", event.target.value)
                }
              />
            </div>

            <div className="vaccine-modal-buttons">
              <button className="vaccine-cancel-btn" onClick={closeModal}>
                Cancel
              </button>

              <button className="vaccine-save-btn" onClick={saveVaccine}>
                {editingId !== null ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vaccine;
