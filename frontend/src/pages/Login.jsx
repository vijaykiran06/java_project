import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  LogIn, UserCheck, Shield, Sparkles, MapPin,
  CheckCircle2, Lock, Mail, ArrowRight, Zap
} from "lucide-react";

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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-soft)" }}>
      {/* ── LEFT PANEL ── */}
      <div
        className="hide-mobile"
        style={{
          flex: 1.1,
          position: "relative",
          background: "linear-gradient(145deg, #0F2027 0%, #1a3a28 55%, var(--green-forest) 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3.5rem",
          color: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Background texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1529688264445-5b48bfe33ede?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: "cover", backgroundPosition: "center", opacity: 0.08
        }} />

        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Brand */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ background: "var(--green-primary)", padding: "0.65rem", borderRadius: "12px", display: "flex", boxShadow: "var(--shadow-green-lg)" }}>
            <Shield size={26} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-heading)", letterSpacing: "-0.03em" }}>
              JanSeva <span style={{ color: "#86EFAC" }}>AI</span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Unified Civic Grievance Portal
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: "relative", maxWidth: "580px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.9rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, color: "#A7F3D0", marginBottom: "1.5rem" }}>
            <Sparkles size={12} />
            Smart India Hackathon 2026 Initiative
          </div>

          <h2 style={{ fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.12, marginBottom: "1.25rem", letterSpacing: "-0.035em", fontFamily: "var(--font-heading)" }}>
            Empowering Citizens.<br />
            <span style={{ color: "#86EFAC" }}>Transforming</span><br />
            Civic Care.
          </h2>

          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginBottom: "2.5rem" }}>
            Report municipal concerns in natural English or Hindi. Local AI parses, classifies, and routes your complaint to the right department within seconds.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.85rem" }}>
            {[
              { value: "100%", label: "Local ML Privacy" },
              { value: "< 30s", label: "Auto SLA Routing" },
              { value: "10+", label: "Departments Covered" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", padding: "1.1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#86EFAC", letterSpacing: "-0.03em" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", marginTop: "0.2rem", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
          <MapPin size={14} color="#86EFAC" />
          <span>Government Technology Platform • Secured by Spring Security & JWT</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 0.9,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2.5rem 2rem",
        minWidth: 340,
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)", letterSpacing: "-0.025em" }}>
              Welcome back
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.3rem" }}>
              Sign in to access your civic portal
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label className="form-label">
                <Mail size={13} color="var(--green-primary)" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@sih.gov.in"
                required
              />
            </div>

            <div>
              <label className="form-label">
                <Lock size={13} color="var(--green-primary)" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ marginTop: "0.5rem", width: "100%" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In to Portal
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.75rem 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Demo Access
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Quick demo logins */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {[
              { email: "citizen@sih.gov.in", label: "Citizen Portal", roleLabel: "CITIZEN", icon: UserCheck, iconColor: "var(--green-primary)" },
              { email: "officer@sih.gov.in", label: "Department Officer", roleLabel: "OFFICER", icon: Zap, iconColor: "#D97706" },
              { email: "admin@sih.gov.in", label: "Executive City Admin", roleLabel: "SUPER_ADMIN", icon: Sparkles, iconColor: "#7C3AED" },
            ].map(({ email: dEmail, label, roleLabel, icon: Icon, iconColor }) => (
              <button
                key={dEmail}
                type="button"
                onClick={() => handleQuickLogin(dEmail)}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.7rem 1rem", background: "var(--white)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                  cursor: "pointer", transition: "all 0.15s", width: "100%",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green-border)"; e.currentTarget.style.background = "var(--green-pale)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--white)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Icon size={16} color={iconColor} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
                </div>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-full)", background: "var(--bg-soft)",
                  color: "var(--text-secondary)", letterSpacing: "0.04em",
                  border: "1px solid var(--border)"
                }}>
                  {roleLabel}
                </span>
              </button>
            ))}
          </div>

          {/* Register link */}
          <p style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            New to JanSeva?{" "}
            <Link to="/register" style={{ fontWeight: 700, color: "var(--green-primary)" }}>
              Create Citizen Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
