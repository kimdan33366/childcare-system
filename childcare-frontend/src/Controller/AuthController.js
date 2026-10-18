
const API_URL = "http://127.0.0.1:8000/api";

export const loginUser = async (username, password) => {
  try {
    // Log in through Laravel
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        user: null,
        message: data.message || "Invalid username or password.",
      };
    }

    // Sanctum must return a token
    if (!data.token) {
      return {
        success: false,
        user: null,
        message: "Login succeeded, but the server did not return an authentication token.",
      };
    }

    const token = data.token;
    let loggedInUser;

    // =========================
    // STAFF LOGIN
    // =========================
    if (data.user_type === "Staff") {
      if (!data.staff?.staff_id) {
        return {
          success: false,
          user: null,
          message: "Staff information was not returned by the server.",
        };
      }

      // Request staff permissions using the Sanctum token
      const permissionResponse = await fetch(
        `${API_URL}/staff/${data.staff.staff_id}/permissions`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
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

    // Save the token separately from the user information
    localStorage.setItem("authToken", token);

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
      message: "Cannot connect to server.",
    };
  }
};

// Get the currently logged-in user
export const getCurrentUser = () => {
  const user = localStorage.getItem("currentUser");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Error reading current user:", error);
    return null;
  }
};

// Get the saved Sanctum token for authenticated API requests
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Clear local login information
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("authToken");
};


export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
