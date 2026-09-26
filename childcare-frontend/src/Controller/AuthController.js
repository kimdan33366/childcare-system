export const loginUser = async (username, password) => {
  try {
    // One login endpoint for both Administrator and Staff
    const response = await fetch(
      "http://127.0.0.1:8000/api/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        user: null,
        message: data.message || "Invalid username or password",
      };
    }

    let loggedInUser;

    // =========================
    // STAFF LOGIN
    // =========================
    if (data.user_type === "Staff") {
      const permissionResponse = await fetch(
        `http://127.0.0.1:8000/api/staff/${data.staff.staff_id}/permissions`
      );

      if (!permissionResponse.ok) {
        return {
          success: false,
          user: null,
          message: "Unable to load staff permissions.",
        };
      }

      const permissionData = await permissionResponse.json();

      loggedInUser = {
        ...data.staff,
        user_type: "Staff",
        permissions: permissionData.permissions || [],
      };
    }

    // =========================
    // ADMINISTRATOR LOGIN
    // =========================
    else if (data.user_type === "Admin") {
      loggedInUser = {
        ...data.admin,
        user_type: "Admin",
        permissions: ["all"],
      };
    }

    // =========================
    // UNKNOWN USER TYPE
    // =========================
    else {
      return {
        success: false,
        user: null,
        message: "Unknown account type.",
      };
    }

    // Save logged-in user
    localStorage.setItem(
      "currentUser",
      JSON.stringify(loggedInUser)
    );

    return {
      success: true,
      user: loggedInUser,
    };

  } catch (error) {
    console.error("Login error:", error);

    return {
      success: false,
      user: null,
      message: "Cannot connect to server",
    };
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("currentUser");

  return user ? JSON.parse(user) : null;
};

export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};