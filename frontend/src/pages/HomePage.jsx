import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Shield,
  MessageSquare,
  ArrowRight,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  Droplets,
  Lightbulb,
  Trash2,
  Car,
  Building2,
  Trees,
  Wifi,
  AlertTriangle,
  Heart,
  FileText,
  ChevronRight
} from "lucide-react";

const DEPARTMENTS = [
  { name: "Water Supply", icon: Droplets, color: "#0ea5e9" },
  { name: "Electricity", icon: Lightbulb, color: "#f59e0b" },
  { name: "Sanitation", icon: Trash2, color: "#10b981" },
  { name: "Traffic / Parking", icon: Car, color: "#8b5cf6" },
  { name: "Public Works", icon: Building2, color: "#f97316" },
  { name: "Parks & Gardens", icon: Trees, color: "#22c55e" },
  { name: "Health Dept.", icon: Heart, color: "#ef4444" },
  { name: "Connectivity", icon: Wifi, color: "#3b82f6" },
  { name: "Encroachment", icon: AlertTriangle, color: "#eab308" },
  { name: "Public Records", icon: FileText, color: "#6366f1" },
];

const LIVE_GRIEVANCES = [
  { dept: "Water Supply", text: "Water pipe leaking near Sector 12 signal", status: "#22c55e", statusLabel: "Resolved" },
  { dept: "Sanitation", text: "Garbage not collected for 3 days on MG Road", status: "#f59e0b", statusLabel: "In Progress" },
  { dept: "Electricity", text: "Street lights out near Ashok Nagar market", status: "#3b82f6", statusLabel: "Assigned" },
  { dept: "Traffic", text: "Pothole at Rajiv Chowk causing accidents", status: "#f59e0b", statusLabel: "Field Work" },
];

export default function HomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleReport = () => {
    if (user) {
      navigate("/citizen/grievance/new");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="homepage">
      {/* ── TOP NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        height: "64px", display: "flex", alignItems: "center",
        padding: "0 2rem", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 36, height: 36, background: "var(--green-primary)",
            borderRadius: "10px", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff"
          }}>
            <Shield size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
              JanSeva <span style={{ color: "#86EFAC" }}>AI</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user ? (
            <button onClick={() => navigate("/")} className="btn-hero-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
              My Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "0.9rem" }}>Sign In</Link>
              <button onClick={handleReport} className="btn-hero-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ paddingTop: "64px" }}>
        <div className="hero-bg-image" />
        <div className="hero-content" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
          <div className="hero-left">
            <div className="hero-badge">
              <Sparkles size={12} />
              Smart India Hackathon 2026 Initiative
            </div>

            <h1 className="hero-title">
              Empowering Citizens.<br />
              <span className="accent">Transforming</span><br />
              Civic Care.
            </h1>

            <p className="hero-subtitle">
              Report municipal problems in natural language. Our on-device AI instantly categorizes your grievance, routes it to the right department, and enforces 24-hour SLA accountability.
            </p>

            <div className="hero-ctas">
              <button onClick={handleReport} className="btn-hero-primary">
                <MessageSquare size={18} />
                Report a Grievance
              </button>
              <button onClick={() => navigate("/login")} className="btn-hero-secondary">
                <ArrowRight size={18} />
                Track My Complaints
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat-item">
                <div className="hero-stat-value">24h</div>
                <div className="hero-stat-label">SLA Enforcement</div>
              </div>
              <div className="hero-stat-item">
                <div className="hero-stat-value">10+</div>
                <div className="hero-stat-label">Dept. Coverage</div>
              </div>
              <div className="hero-stat-item">
                <div className="hero-stat-value">AI</div>
                <div className="hero-stat-label">Auto-Classification</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-card">
              <div className="hero-card-title">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse-ring 2s infinite" }} />
                Live Grievance Feed
              </div>
              {LIVE_GRIEVANCES.map((g, i) => (
                <div key={i} className="hero-grievance-item">
                  <div className="hero-grievance-dot" style={{ background: g.status }} />
                  <div className="hero-grievance-info">
                    <div className="hero-grievance-dept">{g.dept}</div>
                    <div className="hero-grievance-text">{g.text}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem", fontWeight: 600 }}>
                      Status: <span style={{ color: g.status }}>{g.statusLabel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section>
        <div className="how-section">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <div className="section-label">
              <Zap size={13} />
              How It Works
            </div>
            <h2 className="section-heading">From Complaint to Resolution in 3 Steps</h2>
            <p className="section-desc" style={{ margin: "0 auto" }}>
              JanSeva AI makes civic complaint resolution fast, transparent, and accountable using local ML and strict SLA enforcement.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon"><MessageSquare size={24} /></div>
              <div className="step-title">Describe Your Problem</div>
              <div className="step-desc">
                Type your grievance in plain English or Hindi. Our AI understands natural language and extracts the category, location, and urgency automatically.
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon"><Zap size={24} /></div>
              <div className="step-title">AI Routes to Department</div>
              <div className="step-desc">
                On-device ML classifies and routes your complaint to the responsible municipal department within seconds. No manual sorting required.
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon"><CheckCircle2 size={24} /></div>
              <div className="step-title">Track & Verify Resolution</div>
              <div className="step-desc">
                Get real-time status updates. Confirm resolution when you're satisfied or escalate automatically if the 24-hour SLA is breached.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section className="dept-section">
        <div className="dept-section-inner">
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <div className="section-label">
              <Building2 size={13} />
              Department Coverage
            </div>
            <h2 className="section-heading">10 Municipal Departments</h2>
            <p className="section-desc" style={{ margin: "0 auto" }}>
              Every complaint is routed to the correct department. No wrong queues, no delays.
            </p>
          </div>

          <div className="dept-grid">
            {DEPARTMENTS.map((dept, i) => {
              const Icon = dept.icon;
              return (
                <div key={i} className="dept-card" onClick={handleReport}>
                  <div className="dept-icon" style={{ background: `${dept.color}18`, color: dept.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="dept-name">{dept.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SLA FEATURE ── */}
      <section style={{ padding: "5rem 2rem", background: "var(--white)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <div className="section-label"><Clock size={13} />24-Hour SLA Guarantee</div>
            <h2 className="section-heading">Every Complaint Has a Deadline</h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "2rem" }}>
              JanSeva AI enforces strict 24-hour service level agreements. If a department fails to respond, the system automatically escalates to supervisors and flags the breach in the admin console.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { icon: Clock, text: "Real-time SLA countdown on every grievance" },
                { icon: AlertTriangle, text: "Auto-escalation when deadline is breached" },
                { icon: CheckCircle2, text: "Citizen verification before closure" },
                { icon: MapPin, text: "GPS location tagging for field work" },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    <div style={{ width: 36, height: 36, background: "var(--green-pale)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green-primary)", flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    {f.text}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "var(--bg-soft)", borderRadius: "var(--radius-xl)", padding: "2rem", border: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)", fontSize: "0.9rem" }}>
              SLA Performance Overview
            </div>
            {[
              { dept: "Water Supply", pct: 94, color: "#22c55e" },
              { dept: "Sanitation", pct: 87, color: "#22c55e" },
              { dept: "Electricity", pct: 91, color: "#22c55e" },
              { dept: "Traffic / Parking", pct: 78, color: "#f59e0b" },
              { dept: "Public Works", pct: 82, color: "#22c55e" },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.3rem", fontWeight: 600 }}>
                  <span>{item.dept}</span>
                  <span style={{ color: item.color, fontWeight: 700 }}>{item.pct}%</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 999, transition: "width 1s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-section-inner">
          <div className="section-label" style={{ color: "#86EFAC", justifyContent: "center" }}>
            <Sparkles size={13} />
            Get Started Today
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: "1rem" }}>
            Your Voice. Your City.<br />
            <span style={{ color: "#86EFAC" }}>Your Right.</span>
          </h2>
          <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.75)", marginBottom: "2rem", lineHeight: 1.65 }}>
            Join thousands of citizens using JanSeva AI to hold their municipal government accountable.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleReport} style={{
              display: "inline-flex", alignItems: "center", gap: "0.6rem",
              padding: "0.9rem 2rem", background: "#fff", color: "var(--green-forest)",
              borderRadius: "var(--radius-md)", fontSize: "0.95rem", fontWeight: 700,
              border: "none", cursor: "pointer", transition: "all 0.15s",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
            }}>
              <MessageSquare size={18} />
              Report a Grievance
            </button>
            <button onClick={() => navigate("/login")} style={{
              display: "inline-flex", alignItems: "center", gap: "0.6rem",
              padding: "0.9rem 2rem", background: "rgba(255,255,255,0.12)", color: "#fff",
              borderRadius: "var(--radius-md)", fontSize: "0.95rem", fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer",
              backdropFilter: "blur(8px)", transition: "all 0.15s"
            }}>
              <ChevronRight size={18} />
              Sign In to Portal
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1rem" }}>
                <div style={{ width: 32, height: 32, background: "var(--green-primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={18} color="#fff" />
                </div>
                <div className="footer-brand-title">JanSeva AI</div>
              </div>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)", maxWidth: 260 }}>
                Unified Civic Grievance Portal — AI-powered municipal complaint management for Indian cities.
              </p>
            </div>
            <div>
              <div className="footer-col-title">Platform</div>
              <a href="#" className="footer-link">Report Grievance</a>
              <a href="#" className="footer-link">Track Status</a>
              <a href="#" className="footer-link">SLA Policy</a>
              <a href="#" className="footer-link">Department Map</a>
            </div>
            <div>
              <div className="footer-col-title">Access</div>
              <Link to="/login" className="footer-link">Citizen Login</Link>
              <Link to="/register" className="footer-link">Register</Link>
              <a href="#" className="footer-link">Officer Portal</a>
              <a href="#" className="footer-link">Admin Console</a>
            </div>
            <div>
              <div className="footer-col-title">About</div>
              <a href="#" className="footer-link">SIH 2026</a>
              <a href="#" className="footer-link">Technology Stack</a>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Use</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 JanSeva AI · Smart India Hackathon Initiative</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={13} color="#86EFAC" />
              Secured by Spring Security & JWT
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
