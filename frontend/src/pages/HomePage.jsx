import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ChevronRight,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
  Layers,
  Phone
} from "lucide-react";

const DEPARTMENTS = [
  { name: "Water Supply & Sewerage", icon: Droplets, color: "#15803D", sub: "Pipeline bursts, contaminated water, low pressure" },
  { name: "Public Works & Roads", icon: Building2, color: "#166534", sub: "Potholes, broken footpaths, drainage overflow" },
  { name: "Sanitation & Waste", icon: Trash2, color: "#15803D", sub: "Garbage collection, overflowing dumpsters, sweeping" },
  { name: "Electricity & Streetlights", icon: Lightbulb, color: "#B45309", sub: "Blackout zones, broken streetlights, transformer spark" },
  { name: "Traffic & Urban Mobility", icon: Car, color: "#1F2937", sub: "Illegal parking, signal failure, bottleneck clearance" },
  { name: "Parks & Urban Forestry", icon: Trees, color: "#15803D", sub: "Fallen trees, park maintenance, encroachment" },
];

const LIVE_GRIEVANCES = [
  { 
    id: "GRV-2026-8841", 
    dept: "Delhi Jal Board", 
    title: "Severe sewage pipeline leakage flooding main pedestrian walkway", 
    location: "Ward 12, Sector 4 Main Market", 
    sla: "20h 15m remaining", 
    status: "In Progress", 
    badgeClass: "badge-in-progress" 
  },
  { 
    id: "GRV-2026-8839", 
    dept: "Public Works (PWD)", 
    title: "Dangerous pothole near Flyover Pillar 42 causing vehicle damage", 
    location: "Ward 7, Outer Ring Road", 
    sla: "04h 30m remaining", 
    status: "Dispatched", 
    badgeClass: "badge-critical" 
  },
  { 
    id: "GRV-2026-8820", 
    dept: "Municipal Sanitation", 
    title: "Uncollected municipal dumpster overflowing across commercial street", 
    location: "Ward 4, Sector 4 Central Market", 
    sla: "14h 45m remaining", 
    status: "En Route", 
    badgeClass: "badge-submitted" 
  },
];

export default function HomePage() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleQuickDemo = async (email) => {
    try {
      await login(email, "password123");
      navigate("/");
    } catch (e) {
      console.error(e);
      navigate("/login");
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-soft)", minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* ── TOP CITIZEN NAVIGATION BAR (Figma Frame 1) ── */}
      <header style={{
        backgroundColor: "var(--white)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "var(--shadow-xs)"
      }}>
        <div style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Brand */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.85rem", textDecoration: "none" }}>
            <div style={{
              width: "38px",
              height: "38px",
              backgroundColor: "var(--green-primary)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "var(--shadow-green)"
            }}>
              <Shield size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: "800", color: "var(--green-deep)", letterSpacing: "-0.02em", lineHeight: "1.1" }}>
                JanSeva <span style={{ color: "var(--green-primary)" }}>AI</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Unified National Grievance Portal
              </div>
            </div>
          </Link>

          {/* Quick Demo Shortcuts Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Quick Live View:
              </span>
              <button 
                onClick={() => handleQuickDemo("citizen@sih.gov.in")}
                className="btn btn-secondary btn-xs"
                style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--green-forest)", borderColor: "var(--green-border)", background: "var(--green-pale)" }}
                title="Enter Citizen Dashboard with active SLA tickets"
              >
                Citizen Portal
              </button>
              <button 
                onClick={() => handleQuickDemo("admin@sih.gov.in")}
                className="btn btn-secondary btn-xs"
                style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--green-deep)", borderColor: "var(--border)" }}
                title="Enter Admin Operations Console"
              >
                Admin Console
              </button>
            </div>

            {user ? (
              <button onClick={() => navigate("/")} className="btn btn-primary btn-sm">
                <LayoutDashboard size={15} />
                <span>My Dashboard</span>
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Link to="/login" className="btn btn-secondary btn-sm" style={{ padding: "0.5rem 0.95rem" }}>
                  Sign In
                </Link>
                <Link to="/citizen/grievance/new" className="btn btn-primary btn-sm" style={{ padding: "0.5rem 1rem" }}>
                  <MessageSquare size={14} />
                  <span>Report Grievance</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION: HUMAN-DESIGNED CIVIC OVERVIEW ── */}
      <section style={{ maxWidth: "1320px", margin: "0 auto", padding: "3rem 1.5rem 2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "2.5rem", alignItems: "center" }} className="assistant-layout-grid">
          {/* Left Column: Purpose & Immediate Action */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.3rem 0.85rem", backgroundColor: "var(--green-pale)", border: "1px solid var(--green-border)", borderRadius: "9999px", fontSize: "0.76rem", fontWeight: "700", color: "var(--green-forest)", marginBottom: "1.25rem", letterSpacing: "0.03em" }}>
              <Sparkles size={13} color="var(--green-primary)" />
              <span>Smart India Hackathon 2026 • Municipal AI Initiative</span>
            </div>

            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.85rem", fontWeight: "800", color: "var(--green-deep)", lineHeight: "1.15", letterSpacing: "-0.035em", marginBottom: "1.25rem" }}>
              Empowering Citizens.<br />
              <span style={{ color: "var(--green-primary)" }}>Transforming</span> Civic Care.
            </h1>

            <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: "1.65", marginBottom: "2rem", maxWidth: "560px" }}>
              Report municipal concerns in plain English or Hindi. On-device local AI parses complaints, identifies priority, and directly assigns field work orders to the responsible municipal department within seconds.
            </p>

            <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
              <Link to="/citizen/grievance/new" className="btn btn-primary btn-lg" style={{ boxShadow: "var(--shadow-green-lg)" }}>
                <MessageSquare size={18} />
                <span>Report Grievance with AI</span>
              </Link>
              <button onClick={() => handleQuickDemo("admin@sih.gov.in")} className="btn btn-secondary btn-lg" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                <Building2 size={18} color="var(--green-primary)" />
                <span>Admin Operations Console</span>
              </button>
            </div>

            {/* 4 Restrained Highlight Metrics (Figma Frame 2) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.85rem", fontWeight: "800", color: "var(--green-forest)", lineHeight: "1" }}>
                  24 Hours
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem", fontWeight: "600" }}>
                  Guaranteed SLA Target
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.85rem", fontWeight: "800", color: "var(--green-forest)", lineHeight: "1" }}>
                  10+ Depts
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem", fontWeight: "600" }}>
                  Automated NLP Routing
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.85rem", fontWeight: "800", color: "var(--green-forest)", lineHeight: "1" }}>
                  100%
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem", fontWeight: "600" }}>
                  Local Privacy Verified
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Grievance Telemetry Preview Card (Figma Frame 2 & 5) */}
          <div className="card" style={{ padding: "1.75rem", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-lg)", background: "var(--white)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.85rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="pulse-dot"></span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)" }}>
                  Live Civic Telemetry Feed
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--green-forest)", fontWeight: "700", background: "var(--green-pale)", padding: "0.2rem 0.55rem", borderRadius: "var(--radius-full)" }}>
                Active Municipal Grid
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {LIVE_GRIEVANCES.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    backgroundColor: "var(--bg-soft)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.85rem 1rem",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.72rem", fontWeight: "700", color: "var(--green-primary)", background: "var(--white)", padding: "0.15rem 0.4rem", borderRadius: "4px", border: "1px solid var(--green-border)" }}>
                      {item.id}
                    </span>
                    <span className={`badge ${item.badgeClass}`} style={{ fontSize: "0.68rem" }}>
                      {item.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.35", marginBottom: "0.3rem" }}>
                    {item.title}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <MapPin size={11} color="var(--green-primary)" />
                      {item.location}
                    </span>
                    <span style={{ fontWeight: "700", color: item.badgeClass === "badge-critical" ? "#DC2626" : "var(--green-forest)" }}>
                      ⏳ {item.sla}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                24-Hour SLA Escalation Cron: Active (30s)
              </span>
              <button 
                onClick={() => handleQuickDemo("citizen@sih.gov.in")}
                style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--green-primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <span>Open Dashboard</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP CIVIC RESOLUTION PROCESS (Figma Frame 3) ── */}
      <section style={{ backgroundColor: "var(--white)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto 3rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: "700", color: "var(--green-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              <Zap size={14} />
              <span>How JanSeva AI Works</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2.15rem", fontWeight: "800", color: "var(--green-deep)", letterSpacing: "-0.03em" }}>
              From Complaint to Verified Resolution
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              No bureaucratic runarounds. Local machine learning parses the issue, assigns field officers, and enforces strict 24-hour turnaround.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.75rem" }} className="assistant-layout-grid">
            <div className="card" style={{ padding: "1.75rem", border: "1px solid var(--border)", background: "var(--bg-soft)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--green-pale)", color: "var(--green-forest)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem", marginBottom: "1.25rem" }}>
                01
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.5rem", fontFamily: "var(--font-heading)" }}>
                Conversational Intake
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: "1.55" }}>
                Citizens report issues in natural English or Hindi via chat or voice. AI extracts locality, urgency, and category automatically.
              </p>
            </div>

            <div className="card" style={{ padding: "1.75rem", border: "1px solid var(--border)", background: "var(--bg-soft)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--green-pale)", color: "var(--green-forest)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem", marginBottom: "1.25rem" }}>
                02
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.5rem", fontFamily: "var(--font-heading)" }}>
                Department Routing & 24h SLA
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: "1.55" }}>
                The request is instantly mapped to the correct municipal ward and officer. A strict 24-hour resolution countdown initiates.
              </p>
            </div>

            <div className="card" style={{ padding: "1.75rem", border: "1px solid var(--border)", background: "var(--bg-soft)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--green-pale)", color: "var(--green-forest)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem", marginBottom: "1.25rem" }}>
                03
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.5rem", fontFamily: "var(--font-heading)" }}>
                Field Action & Citizen Sign-Off
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: "1.55" }}>
                Engineers resolve the issue and submit proof. The ticket is only closed once the citizen verifies satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10 DEPARTMENTS GRID ── */}
      <section style={{ maxWidth: "1320px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--green-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
              Integrated City Coverage
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: "800", color: "var(--green-deep)", letterSpacing: "-0.03em" }}>
              Municipal Departments Connected
            </h2>
          </div>
          <Link to="/citizen/grievance/new" className="btn btn-secondary btn-sm">
            <span>View All Departments</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {DEPARTMENTS.map((dept, i) => {
            const Icon = dept.icon;
            return (
              <div 
                key={i} 
                className="card card-hover"
                style={{ padding: "1.5rem", border: "1px solid var(--border)", background: "var(--white)", cursor: "pointer" }}
                onClick={() => navigate("/citizen/grievance/new")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--green-pale)", color: "var(--green-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={20} />
                  </div>
                  <h4 style={{ fontSize: "0.98rem", fontWeight: "800", color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                    {dept.name}
                  </h4>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {dept.sub}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: "var(--green-deep)", color: "#FFFFFF", padding: "3rem 1.5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "32px", height: "32px", background: "var(--green-primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: "800", fontSize: "1.1rem" }}>
                JanSeva <span style={{ color: "#86EFAC" }}>AI</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>
                Unified National Civic Grievance & SLA Enforcement Engine
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>
            © 2026 Smart India Hackathon Initiative • Secured by Spring Security & Supabase PostgreSQL
          </div>
        </div>
      </footer>
    </div>
  );
}
