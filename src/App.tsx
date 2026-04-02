import { Routes, Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DeployPage from "./pages/DeployPage";
import ProjectsPage from "./pages/ProjectsPage";
import { Toaster } from "@/components/ui/sonner";
import ClickSpark from "./components/ClickSpark";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <>
      <ClickSpark
        sparkColor="#fff"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <div>
          <Toaster position="bottom-right" />
        </div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/deploy-project" element={<DeployPage />} />
          <Route path="/my-project" element={<ProjectsPage />} />
        </Routes>
      </ClickSpark>
    </>
  );
}

export default App;
