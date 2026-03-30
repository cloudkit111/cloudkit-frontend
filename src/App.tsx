import { Routes, Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DeployPage from "./pages/DeployPage";
import ProjectsPage from "./pages/ProjectsPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <div>
        <Toaster position="bottom-right" />
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/deploy-project" element={<DeployPage />} />
        <Route path="/my-project" element={<ProjectsPage />} />
      </Routes>
    </>
  );
}

export default App;
