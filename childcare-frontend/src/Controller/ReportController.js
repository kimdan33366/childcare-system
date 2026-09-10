import { useNavigate } from "react-router-dom";

export function useReportController() {

  const navigate = useNavigate();

  const logout = () => {
    alert("Logged out!");
    navigate("/login");
  };

  return {
    logout,
  };
}