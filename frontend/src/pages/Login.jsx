import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, UserCheck, Shield, Sparkles, MapPin, CheckCircle2, Lock, Mail, ArrowRight } from "lucide-react";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("citizen@sih.gov.in");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
    setLoading(true);
    setError("");
    try {
      await login(demoEmail, "password123");
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      {/* Left Side: Hero Administrative & Civic Governance Artwork */}
      <div 
        style={{ 
          flex: 1.1, 
          position: "relative",
          background: "linear-gradient(135deg, rgba(15, 29, 47, 0.95) 0%, rgba(5, 150, 105, 0.88) 100%), url('https://images.unsplash.com/photo-1596422846543-74c6fc1e004a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3.5rem",
          color: "#FFFFFF",
        }}
        className="hide-mobile"
      >
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ background: "#FFFFFF", padding: "0.6rem", borderRadius: "12px", color: "var(--primary-emerald)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              JanSeva <span style={{ color: "#A7F3D0" }}>AI</span>
            </h1>
            <div style={{ fontSize: "0.75rem", color: "#E2E8F0", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }}>
              Unified Civic Grievance Portal
            </div>
          </div>
        </div>

        {/* Hero Mission Statement */}
        <div style={{ maxWidth: "620px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.85rem", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "700", color: "#A7F3D0", marginBottom: "1.25rem" }}>
            <Sparkles size={13} />
            <span>Smart India Hackathon 2026 Initiative</span>
          </div>

          <h2 style={{ fontSize: "2.8rem", fontWeight: "800", lineHeight: "1.15", marginBottom: "1.25rem", color: "#FFFFFF", letterSpacing: "-0.03em" }}>
            Empowering Citizens.<br />
            Transforming Civic Care.
          </h2>

          <p style={{ fontSize: "1.1rem", color: "#E2E8F0", lineHeight: "1.65", marginBottom: "2.25rem" }}>
            Report municipal concerns in natural English or Hindi. On-device local AI parses complaints, identifies priority, and directly assigns field work orders to the responsible municipal department within seconds.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.18)" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#A7F3D0" }}>100%</div>
              <div style={{ fontSize: "0.82rem", color: "#E2E8F0", marginTop: "0.2rem" }}>Local ML Privacy & Zero Cloud Dependency</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.18)" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#A7F3D0" }}>&lt; 30s</div>
              <div style={{ fontSize: "0.82rem", color: "#E2E8F0", marginTop: "0.2rem" }}>Automated SLA Escalation Engine</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.18)" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#A7F3D0" }}>10</div>
              <div style={{ fontSize: "0.82rem", color: "#E2E8F0", marginTop: "0.2rem" }}>Integrated Municipal Departments</div>
            </div>
          </div>
        </div>

        {/* Footer Emblem */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>
          <MapPin size={15} color="#A7F3D0" />
          <span>Government Technology Platform • Secured by Spring Security & JWT</span>
        </div>
      </div>

      {/* Right Side: Clean Login Gateway */}
      <div 
        style={{ 
          flex: 0.9, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          padding: "3rem 4rem",
          maxWidth: "540px",
          margin: "0 auto"
        }}
      >
        <div className="card" style={{ padding: "2.5rem 2.25rem", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ marginBottom: "1.75rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.75rem", color: "var(--deep-navy)", fontWeight: "800", letterSpacing: "-0.02em" }}>
              Sign In to JanSeva
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.35rem" }}>
              Enter your credentials to access your civic portal
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: "0.85rem 1rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Mail size={13} color="var(--primary-emerald)" />
                <span>Official Email Address</span>
              </label>
              <input
                type="email"
                className="chat-text-input"
                style={{ width: "100%", marginTop: "0.35rem", padding: "0.75rem 1rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@sih.gov.in"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Lock size={13} color="var(--primary-emerald)" />
                <span>Password</span>
              </label>
              <input
                type="password"
                className="chat-text-input"
                style={{ width: "100%", marginTop: "0.35rem", padding: "0.75rem 1rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: "0.5rem", padding: "0.85rem" }} 
              disabled={loading}
            >
              <LogIn size={18} />
              <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-secondary)", textAlign: "center", marginBottom: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              One-Click Demo Roles
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: "space-between", padding: "0.65rem 0.95rem", fontSize: "0.85rem" }}
                onClick={() => handleQuickLogin("citizen@sih.gov.in")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <UserCheck size={16} color="var(--primary-emerald)" />
                  <span style={{ fontWeight: "600" }}>Citizen Portal Demo</span>
                </div>
                <span className="badge badge-low" style={{ fontSize: "0.68rem" }}>CITIZEN</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: "space-between", padding: "0.65rem 0.95rem", fontSize: "0.85rem" }}
                onClick={() => handleQuickLogin("officer@sih.gov.in")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Shield size={16} color="#D97706" />
                  <span style={{ fontWeight: "600" }}>Water Department Officer</span>
                </div>
                <span className="badge badge-medium" style={{ fontSize: "0.68rem" }}>OFFICER</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: "space-between", padding: "0.65rem 0.95rem", fontSize: "0.85rem" }}
                onClick={() => handleQuickLogin("admin@sih.gov.in")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={16} color="#7C3AED" />
                  <span style={{ fontWeight: "600" }}>Executive City Admin</span>
                </div>
                <span className="badge badge-submitted" style={{ fontSize: "0.68rem" }}>SUPER_ADMIN</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          New to JanSeva? <Link to="/register" style={{ fontWeight: "700", color: "var(--primary-emerald)" }}>Create Citizen Account</Link>
        </div>
      </div>
    </div>
  );
}
