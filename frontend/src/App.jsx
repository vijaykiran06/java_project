import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import OfficerDashboard from "./components/OfficerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import NewGrievancePage from "./pages/NewGrievancePage";
import HomePage from "./pages/HomePage";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem", background: "var(--bg-soft)" }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--green-light)", borderTopColor: "var(--green-primary)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <div style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Loading JanSeva AI...</div>
    </div>
  );
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  if (!user) return null;
  if (user.role === "OFFICER") return <OfficerDashboard />;
  if (user.role === "SUPER_ADMIN" || user.role === "DEPARTMENT_ADMIN") return <AdminDashboard />;
  return <CitizenDashboard />;
};

/* Root redirect: authenticated → dashboard, else → homepage */
const RootRedirect = () => {
  const { token, loading } = useContext(AuthContext);
  if (loading) return null;
  if (token) return (
    <ProtectedRoute>
      <DashboardRouter />
    </ProtectedRoute>
  );
  return <Navigate to="/home" replace />;
};

function AppContent() {
  const { token } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public routes — no Navbar */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated routes — with Navbar */}
      <Route path="/" element={
        token ? (
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <ProtectedRoute><DashboardRouter /></ProtectedRoute>
            </main>
          </div>
        ) : <Navigate to="/home" replace />
      } />
      <Route path="/citizen/grievance/new" element={
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <ProtectedRoute><NewGrievancePage /></ProtectedRoute>
          </main>
        </div>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("ErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 560, margin: "4rem auto", padding: "2rem", background: "#fff", borderRadius: "16px", border: "1px solid var(--border)", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ width: 48, height: 48, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "#DC2626", fontSize: "1.5rem" }}>!</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Something went wrong</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.92rem", lineHeight: 1.6 }}>
            An unexpected error occurred. You can safely return to your dashboard.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }}>
              Return to Dashboard
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}
