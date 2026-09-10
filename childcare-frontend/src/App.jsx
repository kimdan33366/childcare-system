import { Routes, Route } from "react-router-dom";

import Login from "./View/Login";
import Dashboard from "./View/Dashboard";
import Patients from "./View/Patients";
import PatientViewRecord from "./View/PatientViewRecord";
import Appointments from "./View/Appointments";
import Vaccine from "./View/Vaccine";
import Notification from "./View/Notification";
import Report from "./View/Report";
import Profile from "./View/Profile";
import Privacy from "./View/Privacy";
import Help from "./View/Help";
import About from "./View/About";
import Register from "./View/Register";
import ForgotPassword from "./View/forgotpassword";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/patient_viewrecord" element={<PatientViewRecord />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/vaccines"element={<Vaccine />}/>
      <Route path="/notification" element={<Notification />} />
      <Route path="/report" element={<Report />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/help" element={<Help />} />
      <Route path="/about" element={<About />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

export default App;