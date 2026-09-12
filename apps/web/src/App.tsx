import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import Home from './pages/Home.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import UserDashboard from './pages/UserDashboard.js';
import ProblemList from './pages/ProblemList.js';
import ProblemDetail from './pages/ProblemDetail.js';
import AdminDashboard from './pages/AdminDashboard.js';
import UniversityDashboard from './pages/UniversityDashboard.js';
import MentorDashboard from './pages/MentorDashboard.js';
import StudentDashboard from './pages/StudentDashboard.js';
import IndustryPortal from './pages/IndustryPortal.js';
import ProjectDetail from './pages/ProjectDetail.js';
import GovernmentDashboard from './pages/GovernmentDashboard.js';
import AiAnalytics from './pages/AiAnalytics.js';

export default function App() {
  return (
    <Routes>
      {/* Government dashboard has its own full-screen layout (sidebar + three-band header) */}
      <Route element={<ProtectedRoute allow={['government', 'admin']} />}>
        <Route path="/government" element={<GovernmentDashboard />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
        <Route path="/analytics" element={<AiAnalytics />} />
        <Route path="/ai-analytics" element={<AiAnalytics />} />

        <Route element={<ProtectedRoute allow={['citizen', 'admin', 'university']} />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/submit" element={<UserDashboard initialTab="report" />} />
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={['university']} />}>
          <Route path="/university" element={<UniversityDashboard />} />
          <Route path="/university/mentor" element={<MentorDashboard />} />
          <Route path="/mentor" element={<MentorDashboard />} />
          <Route path="/university/student" element={<StudentDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={['industry']} />}>
          <Route path="/industry" element={<IndustryPortal />} />
        </Route>
        <Route element={<ProtectedRoute allow={['industry', 'university', 'admin']} />}>
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}
