export const registerUser = async (username,email, password, role) => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/admins/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          Admin_name: username,
          Admin_email: email,
          Admin_password: password,
          Admin_role: role,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        user: null,
        message: data.message || "Registration failed",
      };
    }

    return {
      success: true,
      user: data.admin,
      message: data.message || "Registration successful",
    };

  } catch (error) {
    console.error("Registration error:", error);

    return {
      success: false,
      user: null,
      message: "Cannot connect to server",
    };
  }
};