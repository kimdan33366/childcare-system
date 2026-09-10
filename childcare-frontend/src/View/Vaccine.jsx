import "../css/Vaccine.css";

import {
  FaCapsules,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
} from "react-icons/fa";

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

        <div className="vaccine-page-title">

          <h1>Vaccines</h1>

        </div>

        <div className="vaccine-toolbar">

          <div className="vaccine-toolbar-left">


            <div className="vaccine-search-box">

              <FaSearch
                className="vaccine-search-icon"
              />

              <input
                type="text"
                placeholder="Search vaccine..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            <select
              className="vaccine-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >

              <option value="All">
                All
              </option>

              <option value="In Stock">
                In Stock
              </option>

              <option value="Out of Stock">
                Out of Stock
              </option>

            </select>


            <button
              className="vaccine-add-btn"
              onClick={openAddModal}
            >

              <FaPlus />

              Add Vaccine

            </button>

          </div>

        </div>

     
        <div className="vaccine-vaccine-list">

          {filteredVaccines.map((vaccine) => (

            <div
              className="vaccine-card"
              key={vaccine.id}
            >

              <div className="vaccine-card-left">

                <div className="vaccine-icon">

                  <FaCapsules />

                </div>

                <div className="vaccine-card-info">

                  <h3>
                    {vaccine.name}
                  </h3>

                  <p>
                    Exp: {vaccine.expiration}
                    {" · "}
                    {vaccine.quantity} vials
                  </p>

                </div>

              </div>

              <div className="vaccine-card-right">

                <div
                  className={
                    vaccine.status === "In Stock"
                      ? "status in-stock"
                      : "status out-stock"
                  }
                >
                  {vaccine.status}
                </div>

                <div className="vaccine-card-actions">


                  <button
                    className="vaccine-edit-btn"
                    onClick={() =>
                      openEditModal(vaccine)
                    }
                  >

                    <FaEdit />

                  </button>


                  <button
                    className="vaccine-delete-btn"
                    onClick={() =>
                      deleteVaccine(vaccine.id)
                    }
                  >

                    <FaTrash />

                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>


      {showModal && (

        <div className="vaccine-modal-overlay">

          <div className="vaccine-modal">

            <h2>
              {editingId !== null
                ? "Edit Vaccine"
                : "Add Vaccine"}
            </h2>


            <div className="vaccine-modal-input">

              <label>
                Vaccine Name
              </label>

              <input
                type="text"
                value={newVaccine.name}
                onChange={(event) =>
                  handleInputChange(
                    "name",
                    event.target.value
                  )
                }
              />

            </div>


            <div className="vaccine-modal-input">

              <label>
                Expiration Date
              </label>

              <input
                type="date"
                value={newVaccine.expiration}
                onChange={(event) =>
                  handleInputChange(
                    "expiration",
                    event.target.value
                  )
                }
              />

            </div>


            <div className="vaccine-modal-input">

              <label>
                Quantity
              </label>

              <input
                type="number"
                min="0"
                value={newVaccine.quantity}
                onChange={(event) =>
                  handleInputChange(
                    "quantity",
                    event.target.value
                  )
                }
              />

            </div>


            <div className="vaccine-modal-buttons">

              <button
                className="vaccine-cancel-btn"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="vaccine-save-btn"
                onClick={saveVaccine}
              >
                {editingId !== null
                  ? "Update"
                  : "Save"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Vaccine;