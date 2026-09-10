import { useNavigate } from "react-router-dom";

export function useDashboardController() {

  const navigate = useNavigate();

  const handleLogout = () => {
    alert("Logged out!");
    navigate("/login");
  };

  return {
    handleLogout,
  };
}