import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SidebarController() {
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);

  const toggleSettings = () => {
    setShowSettings((previous) => !previous);
  };

  const handleLogout = () => {
    alert("Logged out!");
    navigate("/login");
  };

  return {
    showSettings,
    toggleSettings,
    handleLogout,
  };
}

export default SidebarController;