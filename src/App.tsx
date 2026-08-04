import { Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DeployPage from './pages/DeployPage';
import ProjectsPage from './pages/ProjectsPage';
import { Toaster } from '@/components/ui/sonner';
import ClickSpark from './components/ClickSpark';
import SignupPage from './pages/SignupPage';
import DeploymentsPage from './pages/DeploymentsPage';
import AuthCallback from '@/components/AuthCallback';
import { useEffect } from 'react';
import api from '@/config/api-client';
import useAuthStore from '@/store/auth-store';

function App() {

  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  /**
   * Fetch User Details
   */
  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const response = await api.get('/auth/get-access-token');
        setAccessToken(response.data.token);
      } catch (error) {
        console.error('Error fetching access token\n', error)
      }
    }
    fetchAccessToken();
  }, []);

  return (
    <>
      <ClickSpark
        sparkColor="#0071e3"
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
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/deploy-new-project" element={<DashboardPage />} />
          <Route path="/deploy-project" element={<DeployPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/deployments" element={<DeploymentsPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </ClickSpark>
    </>
  );
}

export default App;
