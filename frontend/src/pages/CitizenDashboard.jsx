import React, { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import GrievanceTimeline from "../components/GrievanceTimeline";
import SLACountdownBadge from "../components/SLACountdownBadge";
import {
  PlusCircle, MapPin, Calendar, CheckCircle2, XCircle, ShieldCheck,
  RefreshCw, Search, Filter, LayoutGrid, List, ChevronRight, Clock,
  AlertTriangle, Building2, Sparkles, X, UserCheck, Phone, FileCheck2,
  RotateCcw
} from "lucide-react";

function StatusBadge({ status }) {
  const map = {
    SUBMITTED: "badge-submitted",
    ASSIGNED: "badge-in-progress",
    ACKNOWLEDGED: "badge-in-progress",
    IN_PROGRESS: "badge-in-progress",
    FIELD_WORK: "badge-field-work",
    RESOLVED: "badge-resolved",
    CITIZEN_VERIFIED: "badge-verified",
    CLOSED: "badge-closed",
    ESCALATED: "badge-escalated",
    REOPENED: "badge-escalated",
  };
  const cls = map[(status || "").toUpperCase()] || "badge-closed";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function PriorityBadge({ priority }) {
  const map = { CRITICAL: "badge-critical", HIGH: "badge-high", MEDIUM: "badge-medium", LOW: "badge-low" };
  const cls = map[(priority || "").toUpperCase()] || "badge-low";
  return <span className={`badge ${cls}`}>{priority}</span>;
}

export default function CitizenDashboard() {
  const { token, user } = useContext(AuthContext);
  const location = useLocation();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [history, setHistory] = useState([]);
  const [verifyReason, setVerifyReason] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState("");
  const [submittingReopen, setSubmittingReopen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => { fetchGrievances(); }, [token]);

  const fetchGrievances = async () => {
    try {
      const res = await fetch("/api/grievances", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const list = data.grievances || [];
        setGrievances(list);
        if (location.state?.openGrievanceId || location.state?.trackingNumber) {
          const match = list.find(g =>
            (location.state.openGrievanceId && g.id === location.state.openGrievanceId) ||
            (location.state.trackingNumber && (g.tracking_number === location.state.trackingNumber || g.trackingNumber === location.state.trackingNumber))
          );
          if (match) handleOpenDetail(match);
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleOpenDetail = async (g) => {
    setSelectedGrievance(g);
    try {
      const res = await fetch(`/api/grievances/${g.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setHistory(data.history || []); }
    } catch (e) { console.error(e); }
  };

  const handleVerifyResolution = async (verified) => {
    if (!selectedGrievance) return;
    setSubmittingVerification(true);
    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ verified, reason: verifyReason || (verified ? "Citizen confirmed resolution" : "Citizen reported issue persists") }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setVerifyReason("");
        await fetchGrievances();
        handleOpenDetail(selectedGrievance);
      }
    } catch (e) { console.error(e); }
    finally { setSubmittingVerification(false); }
  };

  const handleReopenGrievance = async () => {
    if (!selectedGrievance || !reopenReasonText.trim()) { alert("Please enter a valid reason for reopening."); return; }
    setSubmittingReopen(true);
    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reopenReasonText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        alert("Grievance reopened successfully. A fresh 24-hour resolution SLA cycle has started.");
        setReopenModalOpen(false);
        setReopenReasonText("");
        await fetchGrievances();
        handleOpenDetail(updated);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reopen grievance");
      }
    } catch (e) { alert("Error reopening grievance"); }
    finally { setSubmittingReopen(false); }
  };

  const stats = useMemo(() => ({
    total: grievances.length,
    inProgress: grievances.filter(g => ["SUBMITTED","ASSIGNED","ACKNOWLEDGED","IN_PROGRESS"].includes(g.status)).length,
    resolved: grievances.filter(g => ["RESOLVED","CITIZEN_VERIFIED","CLOSED"].includes(g.status)).length,
    escalated: grievances.filter(g => g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED").length,
  }), [grievances]);

  const categories = useMemo(() => Array.from(new Set(grievances.map(g => g.category).filter(Boolean))), [grievances]);

  const filteredGrievances = useMemo(() => grievances.filter(g => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      (g.tracking_number && g.tracking_number.toLowerCase().includes(q)) ||
      (g.description && g.description.toLowerCase().includes(q)) ||
      (g.category && g.category.toLowerCase().includes(q)) ||
      (g.department && g.department.toLowerCase().includes(q)) ||
      (g.location_text && g.location_text.toLowerCase().includes(q));
    const matchStatus = statusFilter === "ALL" ||
      (statusFilter === "IN_PROGRESS" && ["SUBMITTED","ASSIGNED","ACKNOWLEDGED","IN_PROGRESS"].includes(g.status)) ||
      (statusFilter === "RESOLVED" && ["RESOLVED","CITIZEN_VERIFIED","CLOSED"].includes(g.status)) ||
      (statusFilter === "ESCALATED" && (g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED")) ||
      g.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || g.priority === priorityFilter;
    const matchCategory = categoryFilter === "ALL" || g.category === categoryFilter;
    return matchSearch && matchStatus && matchPriority && matchCategory;
  }), [grievances, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
    catch { return "—"; }
  };

  return (
    <div>
      {/* ── WELCOME HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--green-deep) 0%, var(--green-forest) 60%, var(--green-primary) 100%)",
        borderRadius: "var(--radius-xl)",
        padding: "2.5rem",
        marginBottom: "2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.8rem", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700, color: "#A7F3D0", marginBottom: "0.85rem" }}>
              <Sparkles size={11} />
              AI-Powered Citizen Grievance Portal
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.9rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
              Welcome back, {user?.name || "Citizen"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 520 }}>
              Track your civic complaints, verify resolutions, and hold departments accountable with 24-hour SLA enforcement.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/citizen/grievance/new" className="btn" style={{ background: "#fff", color: "var(--green-forest)", fontSize: "0.9rem", fontWeight: 700, padding: "0.7rem 1.4rem", boxShadow: "var(--shadow-lg)" }}>
              <PlusCircle size={18} />
              Report Grievance
            </Link>
            <button onClick={fetchGrievances} className="btn" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", fontSize: "0.9rem", fontWeight: 600 }}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Total Filed", value: stats.total, icon: ShieldCheck, iconBg: "var(--green-pale)", iconColor: "var(--green-primary)", valueColor: "var(--text-primary)" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, iconBg: "#FFFBEB", iconColor: "#D97706", valueColor: "#B45309" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, iconBg: "#EFF6FF", iconColor: "#2563EB", valueColor: "#1D4ED8" },
          { label: "Escalated", value: stats.escalated, icon: AlertTriangle, iconBg: "#FEF2F2", iconColor: "#DC2626", valueColor: "#B91C1C" },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
          <div key={label} className="card" style={{ padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
              <div style={{ width: 36, height: 36, background: iconBg, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: iconColor }}>
                <Icon size={17} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "2.25rem", fontWeight: 800, color: valueColor, letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search by ticket ID, keyword, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "2.4rem", paddingRight: searchTerm ? "2rem" : "0.95rem" }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <select style={{ padding: "0.6rem 0.9rem", width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="IN_PROGRESS">Active / In Progress</option>
          <option value="RESOLVED">Resolved / Verified</option>
          <option value="ESCALATED">Escalated</option>
        </select>

        <select style={{ padding: "0.6rem 0.9rem", width: "auto" }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {categories.length > 0 && (
          <select style={{ padding: "0.6rem 0.9rem", width: "auto" }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="ALL">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        )}

        {/* View toggle */}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
          {[
            { mode: "grid", icon: LayoutGrid },
            { mode: "table", icon: List },
          ].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: "0.5rem 0.75rem",
                background: viewMode === mode ? "var(--green-primary)" : "var(--white)",
                color: viewMode === mode ? "#fff" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                transition: "all 0.15s"
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN AREA: LIST + SIDE DRAWER ── */}
      <div style={{ display: "grid", gridTemplateColumns: selectedGrievance ? "1fr 420px" : "1fr", gap: "1.5rem", alignItems: "start" }}>

        {/* ── LIST ── */}
        <div>
          {loading ? (
            <div className="card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 1rem", borderWidth: 3 }} />
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Synchronizing grievance records...</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>Connecting to municipal database</div>
            </div>
          ) : filteredGrievances.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><ShieldCheck size={28} /></div>
              <div className="empty-state-title">
                {grievances.length === 0 ? "No Grievances Filed Yet" : "No Matching Grievances"}
              </div>
              <div className="empty-state-desc">
                {grievances.length === 0
                  ? "Report your first civic issue using our AI-powered assistant."
                  : "Try clearing your search or filter settings."}
              </div>
              {grievances.length === 0 ? (
                <Link to="/citizen/grievance/new" className="btn btn-primary btn-sm">
                  <PlusCircle size={16} /> File First Grievance
                </Link>
              ) : (
                <button onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setPriorityFilter("ALL"); setCategoryFilter("ALL"); }} className="btn btn-outline btn-sm">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {filteredGrievances.map(g => {
                const isSelected = selectedGrievance?.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => handleOpenDetail(g)}
                    style={{
                      background: "var(--white)",
                      border: `1px solid ${isSelected ? "var(--green-primary)" : "var(--border)"}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "1.25rem",
                      cursor: "pointer",
                      transition: "all 0.18s",
                      boxShadow: isSelected ? "var(--shadow-green)" : "var(--shadow-xs)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "var(--green-border)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; e.currentTarget.style.transform = "none"; } }}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.72rem", fontWeight: 700, color: "var(--green-primary)", background: "var(--green-pale)", padding: "0.2rem 0.5rem", borderRadius: "5px", border: "1px solid var(--green-border)" }}>
                        {g.tracking_number}
                      </span>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {g.is_escalated === 1 && <span className="badge badge-escalated"><AlertTriangle size={10} /> Escalated</span>}
                        <PriorityBadge priority={g.priority} />
                      </div>
                    </div>

                    {/* Dept + SLA */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--green-forest)", background: "var(--green-pale)", padding: "0.2rem 0.5rem", borderRadius: "5px" }}>
                        <Building2 size={12} />
                        <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.department || "Municipal Admin"}</span>
                      </div>
                      <SLACountdownBadge slaDeadline={g.sla_deadline} status={g.status} slaStatus={g.sla_status} compact={true} />
                    </div>

                    {/* Category + Description */}
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{g.category}</div>
                    <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {g.description}
                    </div>

                    {/* Officer */}
                    {(g.assigned_worker_name || g.officer_name) && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--green-forest)", background: "var(--green-pale)", padding: "0.2rem 0.5rem", borderRadius: "5px" }}>
                        <UserCheck size={12} />
                        <span>Assigned: <strong>{g.assigned_worker_name || g.officer_name}</strong></span>
                      </div>
                    )}

                    {/* Bottom meta */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.65rem", borderTop: "1px solid var(--border)", marginTop: "0.1rem" }}>
                      <StatusBadge status={g.status} />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <MapPin size={11} />{(g.location_text || "").slice(0, 20)}{g.location_text?.length > 20 ? "…" : ""}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Calendar size={11} />{formatDate(g.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="card" style={{ overflow: "hidden", padding: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Assigned Official</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>SLA</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrievances.map(g => (
                      <tr key={g.id} onClick={() => handleOpenDetail(g)} style={{ cursor: "pointer", background: selectedGrievance?.id === g.id ? "var(--green-pale)" : undefined }}>
                        <td>
                          <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.78rem", fontWeight: 700, color: "var(--green-primary)" }}>{g.tracking_number}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{g.category}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.description}</div>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--green-forest)", background: "var(--green-pale)", padding: "0.2rem 0.5rem", borderRadius: "5px" }}>
                            <Building2 size={11} />{g.department}
                          </span>
                        </td>
                        <td>
                          {g.assigned_worker_name || g.officer_name ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                              <UserCheck size={13} color="var(--green-primary)" />{g.assigned_worker_name || g.officer_name}
                            </div>
                          ) : <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Unassigned</span>}
                        </td>
                        <td><PriorityBadge priority={g.priority} /></td>
                        <td><StatusBadge status={g.status} /></td>
                        <td><SLACountdownBadge slaDeadline={g.sla_deadline} status={g.status} slaStatus={g.sla_status} compact={true} /></td>
                        <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatDate(g.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results count */}
          {!loading && filteredGrievances.length > 0 && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Showing {filteredGrievances.length} of {grievances.length} grievance{grievances.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* ── DETAIL DRAWER ── */}
        {selectedGrievance && (
          <div className="card" style={{ padding: "1.5rem", position: "sticky", top: "80px", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
              <div>
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--green-primary)", background: "var(--green-pale)", padding: "0.25rem 0.6rem", borderRadius: "5px", border: "1px solid var(--green-border)" }}>
                  {selectedGrievance.tracking_number}
                </span>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <StatusBadge status={selectedGrievance.status} />
                  <PriorityBadge priority={selectedGrievance.priority} />
                </div>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* SLA Banner */}
            <div style={{ padding: "0.85rem 1rem", background: "var(--bg-soft)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 700 }}>24-Hour Resolution SLA</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", marginTop: "0.1rem" }}>
                  {selectedGrievance.sla_deadline
                    ? `Target: ${new Date(selectedGrievance.sla_deadline).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "Standard 24h Window"}
                </div>
              </div>
              <SLACountdownBadge slaDeadline={selectedGrievance.sla_deadline} status={selectedGrievance.status} slaStatus={selectedGrievance.sla_status} />
            </div>

            {/* Assigned Official */}
            {(selectedGrievance.assigned_worker_name || selectedGrievance.officer_name) && (
              <div style={{ marginBottom: "1.1rem", padding: "0.9rem", background: "var(--green-pale)", borderRadius: "var(--radius-md)", border: "1px solid var(--green-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--green-forest)" }}>
                    <UserCheck size={15} />Assigned Field Official
                  </div>
                  <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem", borderRadius: "5px", background: "var(--green-light)", color: "var(--green-forest)", fontWeight: 700 }}>Active</span>
                </div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{selectedGrievance.assigned_worker_name || selectedGrievance.officer_name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--green-primary)" }}>{selectedGrievance.department}</div>
                {selectedGrievance.assigned_worker_phone && (
                  <a href={`tel:${selectedGrievance.assigned_worker_phone}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--green-forest)", fontWeight: 600, marginTop: "0.4rem" }}>
                    <Phone size={12} />Call Official ({selectedGrievance.assigned_worker_phone})
                  </a>
                )}
                {selectedGrievance.assignment_notes && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.78rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.7)", padding: "0.4rem 0.6rem", borderRadius: "5px" }}>
                    <strong>Instructions: </strong>{selectedGrievance.assignment_notes}
                  </div>
                )}
              </div>
            )}

            {/* Resolution Report */}
            {["RESOLVED","CITIZEN_VERIFIED","CLOSED"].includes(selectedGrievance.status) && (
              <div style={{ marginBottom: "1.1rem", padding: "0.9rem", background: "#EFF6FF", borderRadius: "var(--radius-md)", border: "1px solid #BFDBFE" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 700, color: "#1E40AF", marginBottom: "0.4rem" }}>
                  <FileCheck2 size={15} />Field Resolution Report
                </div>
                <div style={{ fontSize: "0.83rem", color: "#1E3A8A", lineHeight: 1.5 }}>
                  <strong>Summary: </strong>{selectedGrievance.resolution_summary || selectedGrievance.resolution_notes || "Field works inspected and completed."}
                </div>
                {selectedGrievance.work_performed && (
                  <div style={{ fontSize: "0.82rem", color: "#1E3A8A", marginTop: "0.3rem" }}>
                    <strong>Work Performed: </strong>{selectedGrievance.work_performed}
                  </div>
                )}
                {selectedGrievance.resolved_at && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.4rem" }}>
                    <Clock size={11} />Completed on {new Date(selectedGrievance.resolved_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
                {selectedGrievance.status === "CITIZEN_VERIFIED" && (
                  <button onClick={() => setReopenModalOpen(true)} className="btn btn-outline btn-sm" style={{ marginTop: "0.75rem", width: "100%", borderColor: "#BFDBFE", color: "#1E40AF" }}>
                    <RotateCcw size={13} />Reopen if Problem Persists
                  </button>
                )}
              </div>
            )}

            {/* Case Info */}
            <div style={{ marginBottom: "1.1rem" }}>
              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.35rem" }}>Grievance Classification</div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>{selectedGrievance.category}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.7rem", background: "var(--bg-soft)", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                <Building2 size={13} color="var(--green-primary)" />{selectedGrievance.department}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "1.1rem" }}>
              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.35rem" }}>Citizen Description</div>
              <div style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.55 }}>
                {selectedGrievance.description}
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: "1.1rem", padding: "0.75rem 1rem", background: "var(--bg-soft)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                <MapPin size={15} color="var(--green-primary)" />
                {selectedGrievance.location_text || "Location details on record"}
              </div>
              {selectedGrievance.latitude && selectedGrievance.longitude && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem", paddingLeft: "1.4rem" }}>
                  GPS: {selectedGrievance.latitude.toFixed(4)}° N, {selectedGrievance.longitude.toFixed(4)}° E
                </div>
              )}
            </div>

            {/* Citizen Verification Prompt */}
            {selectedGrievance.status === "RESOLVED" && (
              <div style={{ background: "var(--green-pale)", border: "1px solid var(--green-border)", padding: "1.1rem", borderRadius: "var(--radius-md)", marginBottom: "1.1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "var(--green-forest)", marginBottom: "0.4rem" }}>
                  <CheckCircle2 size={17} />Department Marked as Resolved
                </div>
                <p style={{ fontSize: "0.83rem", color: "var(--green-primary)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  Has your civic issue been satisfactorily resolved? Please verify:
                </p>
                <input
                  type="text"
                  placeholder="Optional feedback or reason if issue persists..."
                  value={verifyReason}
                  onChange={(e) => setVerifyReason(e.target.value)}
                  style={{ width: "100%", fontSize: "0.84rem", marginBottom: "0.75rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleVerifyResolution(true)} disabled={submittingVerification}>
                    <CheckCircle2 size={14} />YES, Resolved
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleVerifyResolution(false)} disabled={submittingVerification}>
                    <XCircle size={14} />Reopen Case
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
                <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 700 }}>Lifecycle Audit Trail</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{history.length} Events</span>
              </div>
              <GrievanceTimeline history={history} />
            </div>
          </div>
        )}
      </div>

      {/* ── REOPEN MODAL ── */}
      {reopenModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#B45309", fontWeight: 700 }}>
                <RotateCcw size={18} />Reopen Grievance
              </div>
              <button onClick={() => setReopenModalOpen(false)} className="btn btn-outline btn-xs" style={{ borderRadius: "50%", width: 28, height: 28, padding: 0 }}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.1rem", lineHeight: 1.6 }}>
                Reopening ticket <strong style={{ color: "var(--text-primary)" }}>{selectedGrievance?.tracking_number}</strong> will reset the case to active status and initiate a fresh <strong>24-Hour Resolution SLA</strong>.
              </p>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                Reason for Reopening <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe why the issue persists or what further work is required..."
                value={reopenReasonText}
                onChange={(e) => setReopenReasonText(e.target.value)}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setReopenModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button
                onClick={handleReopenGrievance}
                disabled={submittingReopen || !reopenReasonText.trim()}
                className="btn btn-sm"
                style={{ background: "#D97706", color: "#fff", fontWeight: 700, border: "none" }}
              >
                {submittingReopen ? "Reopening..." : "Confirm & Reopen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
