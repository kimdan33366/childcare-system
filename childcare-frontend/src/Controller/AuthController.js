export const loginUser = async (username, password, role) => {
  try {
    const endpoint =
      role === "Staff"
        ? "http://127.0.0.1:8000/api/staff/login"
        : "http://127.0.0.1:8000/api/admins/login";

    const body =
      role === "Staff"
        ? {
            staff_email: username,
            staff_password: password,
          }
        : {
            Admin_name: username,
            Admin_password: password,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        user: null,
        message: data.message || "Invalid username or password",
      };
    }

    let loggedInUser;

    if (role === "Staff") {
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
    } else {
      loggedInUser = {
        ...data.admin,
        user_type: "Admin",
        permissions: ["all"],
      };
    }

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