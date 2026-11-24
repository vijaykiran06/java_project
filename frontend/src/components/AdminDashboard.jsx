import React, { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import AIAdminAssistant from "./AIAdminAssistant";
import GISMap from "./GISMap";
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Building2, 
  MapPin, 
  Clock, 
  ShieldAlert,
  Search,
  Filter,
  BarChart3,
  Flame,
  ArrowUpRight
} from "lucide-react";

export default function AdminDashboard() {
  const { token, user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [adminSearch, setAdminSearch] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const gRes = await fetch("/api/grievances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const iRes = await fetch("/api/incidents", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (gRes.ok) {
        const gData = await gRes.json();
        setGrievances(gData.grievances || []);
      }

      if (iRes.ok) {
        const iData = await iRes.json();
        setIncidents(iData.incidents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClusterDuplicates = async () => {
    setClustering(true);
    try {
      const res = await fetch("/api/incidents/cluster-duplicates", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClustering(false);
    }
  };

  const total = grievances.length;
  const pending = grievances.filter((g) => ["SUBMITTED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(g.status)).length;
  const resolved = grievances.filter((g) => ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status)).length;
  const escalated = grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED").length;

  // Department breakdown
  const deptStats = useMemo(() => {
    const map = {};
    grievances.forEach((g) => {
      const dept = g.department || "General";
      if (!map[dept]) map[dept] = { total: 0, pending: 0, resolved: 0, escalated: 0 };
      map[dept].total += 1;
      if (["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status)) map[dept].resolved += 1;
      else map[dept].pending += 1;
      if (g.is_escalated === 1 || g.status === "ESCALATED") map[dept].escalated += 1;
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [grievances]);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", backgroundColor: "var(--status-info-bg)", border: "1px solid var(--status-info-border)", borderRadius: "6px", fontSize: "0.74rem", fontWeight: "700", color: "var(--status-info)", marginBottom: "0.4rem" }}>
            <Building2 size={12} />
            <span>Executive Municipal Oversight Console</span>
          </div>
          <h2 style={{ fontSize: "1.85rem", color: "var(--deep-navy)", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Executive Administration Dashboard
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.15rem" }}>
            Real-time cross-departmental operations, automated SLA escalation management, FAISS vector spatial clustering, and AI analytics.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchDashboardData}
          >
            <RefreshCw size={14} />
            <span>Refresh Metrics</span>
          </button>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleClusterDuplicates} 
            disabled={clustering}
          >
            <Layers size={15} />
            <span>{clustering ? "Scanning Embeddings..." : "Run FAISS Vector Clustering"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card navy">
          <div className="stat-header">
            <span className="stat-label">Total City Complaints</span>
            <div className="stat-icon" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--deep-navy)" }}>
              <LayoutDashboard size={17} />
            </div>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-subtext">Across all connected municipal zones</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-header">
            <span className="stat-label">Pending Resolution</span>
            <div className="stat-icon" style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <Clock size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#B45309" }}>{pending}</div>
          <div className="stat-subtext">Under active departmental processing</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-header">
            <span className="stat-label">Resolved & Confirmed</span>
            <div className="stat-icon" style={{ backgroundColor: "#ECFDF5", color: "#047857" }}>
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#047857" }}>{resolved}</div>
          <div className="stat-subtext">
            {total > 0 ? `${Math.round((resolved / total) * 100)}% resolution rate` : "No cases"}
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-header">
            <span className="stat-label">SLA Breached / Escalated</span>
            <div className="stat-icon" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#B91C1C" }}>{escalated}</div>
          <div className="stat-subtext">Automated 30s cron escalations triggered</div>
        </div>
      </div>

      {/* Admin Feature Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <button
          className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 size={16} />
          <span>Operations & Incidents</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "all_grievances" ? "active" : ""}`}
          onClick={() => setActiveTab("all_grievances")}
        >
          <LayoutDashboard size={16} />
          <span>All Grievances ({grievances.length})</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "gis" ? "active" : ""}`}
          onClick={() => setActiveTab("gis")}
        >
          <MapPin size={16} />
          <span>GIS Spatial Hotspots</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          <Sparkles size={16} />
          <span>AI Strategic Analyst</span>
        </button>
      </div>

      {/* TAB 1: OPERATIONS & INCIDENTS */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
            {/* Clustered Master Incidents */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--deep-navy)" }}>
                  <Layers size={18} color="var(--primary-emerald)" />
                  <span>Clustered Master Incidents ({incidents.length})</span>
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                  AI Deduplicated
                </span>
              </div>

              {incidents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-secondary)" }}>
                  <Layers size={32} style={{ margin: "0 auto 0.75rem", color: "var(--text-muted)" }} />
                  <p style={{ fontSize: "0.9rem" }}>No duplicate incident clusters currently formed.</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Click "Run FAISS Vector Clustering" above to auto-group localized civic complaints.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: "380px", overflowY: "auto" }}>
                  {incidents.map((inc) => (
                    <div 
                      key={inc.id} 
                      style={{ 
                        backgroundColor: "var(--bg-main)", 
                        border: "1px solid var(--border-color)", 
                        padding: "1rem", 
                        borderRadius: "10px",
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontWeight: "700", color: "var(--deep-navy)", fontSize: "0.92rem" }}>
                          {inc.incident_number}
                        </span>
                        <span className="badge badge-high">
                          <Users size={11} /> {inc.affected_citizens_count || 1} Citizens
                        </span>
                      </div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--deep-navy)", marginBottom: "0.25rem" }}>
                        {inc.title}
                      </h4>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "var(--primary-emerald)", fontWeight: "600" }}>{inc.department}</span>
                        <span>•</span>
                        <span>{inc.primary_location || "Location Centroid"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active SLA Breach Alerts */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--deep-navy)" }}>
                  <AlertTriangle size={18} color="var(--status-critical)" />
                  <span>Active SLA Breach Stream</span>
                </h3>
                <span className="badge badge-critical">
                  <Flame size={11} /> Auto Escalate
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "380px", overflowY: "auto" }}>
                {grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED").length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-secondary)" }}>
                    <CheckCircle2 size={32} style={{ margin: "0 auto 0.75rem", color: "var(--primary-emerald)" }} />
                    <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--deep-navy)" }}>All Grievances Within SLA Target</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Automated 30-second scheduler reports no breached deadlines at this time.
                    </p>
                  </div>
                ) : (
                  grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED").map((g) => (
                    <div 
                      key={g.id} 
                      style={{ 
                        backgroundColor: "#FEF2F2", 
                        border: "1px solid #FECACA", 
                        padding: "0.85rem 1rem", 
                        borderRadius: "10px" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                        <span style={{ fontWeight: "700", color: "#B91C1C", fontFamily: "var(--font-heading)" }}>
                          {g.tracking_number}
                        </span>
                        <span className="badge badge-critical">
                          LEVEL {g.escalation_level || 1} ESCALATION
                        </span>
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "var(--deep-navy)", fontWeight: "600", marginTop: "0.3rem" }}>
                        {g.category} — {g.department}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                        {g.location_text || "Location details on record"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Department Workload Distribution Table */}
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--deep-navy)" }}>
              Department Workload & Performance Summary
            </h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Cases</th>
                    <th>Active Pending</th>
                    <th>Resolved</th>
                    <th>Escalated</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {deptStats.map((d) => {
                    const healthPct = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 100;
                    return (
                      <tr key={d.name}>
                        <td>
                          <strong>{d.name}</strong>
                        </td>
                        <td>{d.total}</td>
                        <td style={{ color: "#B45309", fontWeight: "600" }}>{d.pending}</td>
                        <td style={{ color: "#047857", fontWeight: "600" }}>{d.resolved}</td>
                        <td style={{ color: d.escalated > 0 ? "#DC2626" : "var(--text-secondary)", fontWeight: "600" }}>
                          {d.escalated}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ flex: 1, width: "80px", height: "6px", backgroundColor: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${healthPct}%`, height: "100%", backgroundColor: healthPct >= 60 ? "var(--primary-emerald)" : healthPct >= 30 ? "var(--status-warning)" : "var(--status-critical)" }} />
                            </div>
                            <span style={{ fontSize: "0.78rem", fontWeight: "600" }}>{healthPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL GRIEVANCES MASTER LIST */}
      {activeTab === "all_grievances" && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--deep-navy)" }}>City-Wide Master Grievances Register</h3>
            <div className="search-box" style={{ maxWidth: "300px" }}>
              <Search size={15} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Filter city complaints..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Escalated</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {grievances
                  .filter((g) => !adminSearch || 
                    (g.tracking_number && g.tracking_number.toLowerCase().includes(adminSearch.toLowerCase())) ||
                    (g.category && g.category.toLowerCase().includes(adminSearch.toLowerCase())) ||
                    (g.department && g.department.toLowerCase().includes(adminSearch.toLowerCase()))
                  )
                  .map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.tracking_number}</strong>
                      </td>
                      <td>{g.category}</td>
                      <td>
                        <span className="dept-tag">{g.department}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${(g.priority || 'medium').toLowerCase()}`}>
                          {g.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${(g.status || 'submitted').toLowerCase()}`}>
                          <span className="badge-dot"></span>
                          <span>{g.status}</span>
                        </span>
                      </td>
                      <td>
                        {g.is_escalated === 1 ? (
                          <span className="badge badge-critical">YES</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No</span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {new Date(g.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GIS SPATIAL MAP */}
      {activeTab === "gis" && <GISMap />}

      {/* TAB 4: AI ADMIN ANALYST */}
      {activeTab === "ai" && <AIAdminAssistant />}
    </div>
  );
}
