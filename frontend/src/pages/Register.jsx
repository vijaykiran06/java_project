import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Shield, Mail, Lock, User, ArrowLeft, CheckCircle2 } from "lucide-react";

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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-soft)" }}>
      {/* Left decorative panel */}
      <div className="hide-mobile" style={{
        flex: 1,
        background: "linear-gradient(145deg, var(--green-deep) 0%, var(--green-forest) 60%, var(--green-primary) 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "4rem 3.5rem", color: "#fff", position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1596422846543-74c6fc1e004a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: "cover", backgroundPosition: "center", opacity: 0.06
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
            <div style={{ background: "rgba(255,255,255,0.15)", padding: "0.6rem", borderRadius: "10px", backdropFilter: "blur(8px)" }}>
              <Shield size={24} />
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.25rem" }}>
              JanSeva <span style={{ color: "#86EFAC" }}>AI</span>
            </div>
          </div>

          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2.4rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.035em", marginBottom: "1.25rem" }}>
            Your Voice.<br />
            <span style={{ color: "#86EFAC" }}>Your City.</span><br />
            Your Right.
          </h2>

          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginBottom: "2.5rem" }}>
            Register as a citizen to lodge grievances, track resolutions, and hold your municipal government accountable.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {[
              "AI-powered complaint classification in seconds",
              "Real-time SLA countdown & auto-escalation",
              "Citizen verification before case closure",
              "Full audit trail for every grievance",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>
                <CheckCircle2 size={18} color="#86EFAC" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 0.9, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", padding: "2.5rem 2rem"
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Back link */}
          <Link to="/login" style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)",
            marginBottom: "2rem", transition: "color 0.15s"
          }}>
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>

          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)", letterSpacing: "-0.025em" }}>
              Create your account
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.3rem" }}>
              Join JanSeva AI and make your voice heard
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
                <User size={13} color="var(--green-primary)" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>

            <div>
              <label className="form-label">
                <Mail size={13} color="var(--green-primary)" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
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
                placeholder="Create a strong password"
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Complete Registration
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ fontWeight: 700, color: "var(--green-primary)" }}>
              Sign In here
            </Link>
          </p>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            By registering, you agree to the Government Technology Platform terms. Your data is protected under applicable data privacy regulations.
          </p>
        </div>
      </div>
    </div>
  );
}
