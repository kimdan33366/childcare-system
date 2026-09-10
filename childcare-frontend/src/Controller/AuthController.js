export const loginUser = async (username, password) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/admins/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        Admin_name: username,
        Admin_password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        user: null,
        message: data.message || "Invalid username or password",
      };
    }

    localStorage.setItem(
      "currentUser",
      JSON.stringify(data.admin)
    );

    return {
      success: true,
      user: data.admin,
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