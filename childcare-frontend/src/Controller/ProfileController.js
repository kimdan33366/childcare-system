import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminUser } from "../model/UserModel";

export function useProfileController() {

  const navigate = useNavigate();

  const [showSettings, setShowSettings] =
    useState(false);

  const [profile, setProfile] =
    useState(adminUser);

  const updateProfile = (field, value) => {

    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));

  };

  const logout = () => {
    alert("Logged out!");
    navigate("/login");
  };

  return {
    showSettings,
    setShowSettings,

    profile,
    updateProfile,

    logout,
  };
}