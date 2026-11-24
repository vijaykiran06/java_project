import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Shield, Mail, Lock, User, ArrowLeft } from "lucide-react";

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "3.5rem auto", padding: "0 1rem" }}>
      <div className="card" style={{ padding: "2.5rem 2rem", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div className="brand-crest" style={{ margin: "0 auto 0.85rem", width: "44px", height: "44px" }}>
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: "1.65rem", color: "var(--deep-navy)", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Create Citizen Account
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.3rem" }}>
            Join JanSeva AI to lodge grievances, track repairs, and verify city resolutions
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", padding: "0.85rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <User size={13} color="var(--primary-emerald)" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              className="chat-text-input"
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.75rem 1rem" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

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
              placeholder="rahul@example.com"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Lock size={13} color="var(--primary-emerald)" />
              <span>Account Password</span>
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
            <UserPlus size={18} />
            <span>{loading ? "Registering Citizen..." : "Complete Registration"}</span>
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-color)", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          Already have an account? <Link to="/login" style={{ fontWeight: "700", color: "var(--primary-emerald)" }}>Sign In here</Link>
        </div>
      </div>
    </div>
  );
}
