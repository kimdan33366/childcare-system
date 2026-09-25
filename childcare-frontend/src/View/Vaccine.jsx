import "../css/Vaccine.css";

import {
  FaCapsules,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaBoxes,
  FaExclamationTriangle,
  FaBan,
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

  // =========================================================
  // LOGGED-IN USER
  // =========================================================

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );

  const isAdmin =
    currentUser?.user_type === "Admin";

  const permissions =
    currentUser?.permissions || [];

  // =========================================================
  // PERMISSION HELPER
  // =========================================================

  const hasPermission = (permission) => {
    return (
      isAdmin ||
      permissions.includes("all") ||
      permissions.includes(permission)
    );
  };

  // =========================================================
  // PAGE ACCESS
  // =========================================================

  if (
    !isAdmin &&
    !permissions.includes("view_vaccines")
  ) {
    return (
      <div className="vaccine-admin-container">
        <Sidebar />

        <div className="vaccine-main-content">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2>Access Denied</h2>

            <p>
              You do not have permission to access
              Vaccines.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // NORMALIZE VACCINE DATA
  // =========================================================

  const normalizedVaccines = filteredVaccines.map(
    (vaccine) => {
      const stock = Number(
        vaccine.stock ??
          vaccine.quantity ??
          vaccine.stock_quantity ??
          0
      );

      return {
        ...vaccine,

        id:
          vaccine.vaccine_ID ??
          vaccine.id,

        name:
          vaccine.name ??
          vaccine.vaccine_name ??
          "Unknown Vaccine",

        stock,

        expiration:
          vaccine.expiration_date ??
          vaccine.expiration ??
          "",
      };
    }
  );

  // =========================================================
  // SUMMARY VALUES
  // =========================================================

  const totalVaccineTypes =
    normalizedVaccines.length;

  const totalStock =
    normalizedVaccines.reduce(
      (total, vaccine) =>
        total + vaccine.stock,
      0
    );

  const lowStockCount =
    normalizedVaccines.filter(
      (vaccine) =>
        vaccine.stock > 0 &&
        vaccine.stock <= 5
    ).length;

  const outOfStockCount =
    normalizedVaccines.filter(
      (vaccine) =>
        vaccine.stock === 0
    ).length;

  // =========================================================
  // VACCINE STATUS
  // =========================================================

  const getVaccineStatus = (stock) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        className: "out-stock",
      };
    }

    if (stock <= 5) {
      return {
        label: "Low Stock",
        className: "low-stock",
      };
    }

    return {
      label: "In Stock",
      className: "in-stock",
    };
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="vaccine-admin-container">

      <Sidebar />

      <div className="vaccine-main-content">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="vaccine-page-header">

          <div>
            <h1>Vaccine Inventory</h1>

            <p>
              Manage vaccine stock, availability, and
              expiration dates.
            </p>
          </div>

          {hasPermission("add_vaccines") && (
            <button
              className="vaccine-add-btn"
              onClick={openAddModal}
            >
              <FaPlus />
              Add Vaccine
            </button>
          )}

        </div>


        {/* ===================================================
            SUMMARY CARDS
        =================================================== */}

        <div className="vaccine-summary">

          <div className="vaccine-summary-card">

            <div className="vaccine-summary-icon">
              <FaCapsules />
            </div>

            <div>
              <span>Vaccine Types</span>

              <strong>
                {totalVaccineTypes}
              </strong>
            </div>

          </div>


          <div className="vaccine-summary-card">

            <div className="vaccine-summary-icon">
              <FaBoxes />
            </div>

            <div>
              <span>Total Stock</span>

              <strong>
                {totalStock}
              </strong>
            </div>

          </div>


          <div className="vaccine-summary-card">

            <div className="vaccine-summary-icon warning">
              <FaExclamationTriangle />
            </div>

            <div>
              <span>Low Stock</span>

              <strong>
                {lowStockCount}
              </strong>
            </div>

          </div>


          <div className="vaccine-summary-card">

            <div className="vaccine-summary-icon danger">
              <FaBan />
            </div>

            <div>
              <span>Out of Stock</span>

              <strong>
                {outOfStockCount}
              </strong>
            </div>

          </div>

        </div>


        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className="vaccine-toolbar">

          <div className="vaccine-search-box">

            <FaSearch className="vaccine-search-icon" />

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
              All Status
            </option>

            <option value="In Stock">
              In Stock
            </option>

            <option value="Low Stock">
              Low Stock
            </option>

            <option value="Out of Stock">
              Out of Stock
            </option>
          </select>

        </div>


        {/* ===================================================
            TABLE
        =================================================== */}

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

              {normalizedVaccines.length > 0 ? (

                normalizedVaccines.map(
                  (vaccine) => {

                    const status =
                      getVaccineStatus(
                        vaccine.stock
                      );

                    return (
                      <tr
                        key={vaccine.id}
                      >

                        {/* VACCINE */}

                        <td>

                          <div className="vaccine-name">

                            <div className="vaccine-icon">
                              <FaCapsules />
                            </div>

                            <div>
                              <strong>
                                {vaccine.name}
                              </strong>
                            </div>

                          </div>

                        </td>


                        {/* STOCK */}

                        <td>

                          <span className="vaccine-stock">
                            {vaccine.stock} vials
                          </span>

                        </td>


                        {/* EXPIRATION */}

                        <td>

                          <span className="vaccine-expiration">

                            {vaccine.expiration
                              ? vaccine.expiration
                              : "—"}

                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`vaccine-status ${status.className}`}
                          >
                            {status.label}
                          </span>

                          </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="vaccine-actions">

                            {hasPermission(
                              "edit_vaccines"
                            ) && (
                              <button
                                type="button"
                                className="vaccine-edit-btn"
                                title="Edit Vaccine"
                                onClick={() =>
                                  openEditModal(
                                    vaccine
                                  )
                                }
                              >
                                <FaEdit />
                              </button>
                            )}


                            {hasPermission(
                              "delete_vaccines"
                            ) && (
                              <button
                                type="button"
                                className="vaccine-delete-btn"
                                title="Delete Vaccine"
                                onClick={() =>
                                  deleteVaccine(
                                    vaccine.id
                                  )
                                }
                              >
                                <FaTrash />
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="vaccine-empty-state"
                  >
                    <FaCapsules />

                    <span>
                      No vaccines found.
                    </span>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal &&
        (editingId === null
          ? hasPermission("add_vaccines")
          : hasPermission("edit_vaccines")) && (

          <div className="vaccine-modal-overlay">

            <div className="vaccine-modal">

              <div className="vaccine-modal-header">

                <div>

                  <h2>
                    {editingId !== null
                      ? "Edit Vaccine"
                      : "Add Vaccine"}
                  </h2>

                  <p className="vaccine-modal-subtitle">
                    {editingId !== null
                      ? "Update the vaccine information below."
                      : "Enter the vaccine details below."}
                  </p>

                </div>

              </div>


              {/* VACCINE NAME */}

              <div className="vaccine-modal-input">

                <label>
                  Vaccine Name
                </label>

                <input
                  type="text"
                  placeholder="Enter vaccine name"
                  value={
                    newVaccine.name || ""
                  }
                  onChange={(event) =>
                    handleInputChange(
                      "name",
                      event.target.value
                    )
                  }
                />

              </div>


              {/* EXPIRATION */}

              <div className="vaccine-modal-input">

                <label>
                  Expiration Date
                </label>

                <input
                  type="date"
                  value={
                    newVaccine.expiration || ""
                  }
                  onChange={(event) =>
                    handleInputChange(
                      "expiration",
                      event.target.value
                    )
                  }
                />

              </div>


              {/* STOCK */}

              <div className="vaccine-modal-input">

                <label>
                  Quantity (Vials)
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="Enter quantity"
                  value={
                    newVaccine.quantity ?? ""
                  }
                  onChange={(event) =>
                    handleInputChange(
                      "quantity",
                      event.target.value
                    )
                  }
                />

              </div>


              {/* BUTTONS */}

              <div className="vaccine-modal-buttons">

                <button
                  type="button"
                  className="vaccine-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="vaccine-save-btn"
                  onClick={saveVaccine}
                >
                  {editingId !== null
                    ? "Update Vaccine"
                    : "Save Vaccine"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Vaccine;