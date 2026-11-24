import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { 
  Shield, 
  PlusCircle, 
  LayoutDashboard, 
  LogOut, 
  User, 
  Sparkles, 
  CheckCircle2,
  Layers,
  MapPin
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { text: "Super Admin", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" };
      case "DEPARTMENT_ADMIN":
        return { text: "Dept Admin", bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" };
      case "OFFICER":
        return { text: "Department Officer", bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" };
      default:
        return { text: "Citizen", bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" };
    }
  };

  const badge = user ? getRoleBadge(user.role) : null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.85rem", textDecoration: "none" }}>
          <div className="brand-crest">
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              JanSeva <span className="brand-ai">AI</span>
            </div>
            <div className="brand-subtitle">Unified Civic Grievance Portal</div>
          </div>
        </Link>
      </div>

      {user && (
        <div className="nav-links">
          {/* Live System Operational Indicator */}
          <div className="system-pill" title="Local AI Microservice & Spring Boot Backend Online">
            <span className="pulse-dot"></span>
            <span>All Systems Live</span>
          </div>

          {/* Navigation Links based on role */}
          {user.role === "CITIZEN" && (
            <>
              <Link
                to="/"
                className={`nav-tab ${location.pathname === "/" ? "active" : ""}`}
              >
                <LayoutDashboard size={17} />
                <span>My Grievances</span>
              </Link>

              <Link
                to="/citizen/grievance/new"
                className={`nav-tab ${location.pathname === "/citizen/grievance/new" ? "active" : ""}`}
              >
                <PlusCircle size={17} />
                <span>Report Grievance</span>
              </Link>
            </>
          )}

          {user.role === "OFFICER" && (
            <Link
              to="/"
              className={`nav-tab ${location.pathname === "/" ? "active" : ""}`}
            >
              <LayoutDashboard size={17} />
              <span>Officer Case Board</span>
            </Link>
          )}

          {(user.role === "SUPER_ADMIN" || user.role === "DEPARTMENT_ADMIN") && (
            <Link
              to="/"
              className={`nav-tab ${location.pathname === "/" ? "active" : ""}`}
            >
              <LayoutDashboard size={17} />
              <span>Operations Console</span>
            </Link>
          )}

          {/* User Profile Pill */}
          <div className="user-profile-pill">
            <div className="user-avatar-circle">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
              <span style={{ fontSize: "0.86rem", fontWeight: "700", color: "var(--deep-navy)" }}>
                {user.name}
              </span>
              <span style={{ fontSize: "0.7rem", color: badge?.color, fontWeight: "600" }}>
                {badge?.text}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            className="btn btn-outline btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            title="Sign out of your session"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}
