import React, { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import GrievanceTimeline from "../components/GrievanceTimeline";
import SLACountdownBadge from "../components/SLACountdownBadge";
import { 
  PlusCircle, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  Building2,
  Sparkles,
  ExternalLink,
  X,
  UserCheck,
  Phone,
  FileCheck2,
  RotateCcw
} from "lucide-react";

export default function CitizenDashboard() {
  const { token, user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [history, setHistory] = useState([]);
  const [verifyReason, setVerifyReason] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState("");
  const [submittingReopen, setSubmittingReopen] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  useEffect(() => {
    fetchGrievances();
  }, [token]);

  const fetchGrievances = async () => {
    try {
      const res = await fetch("/api/grievances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.grievances || []);
      }
    } catch (err) {
      console.error("Fetch grievances error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (g) => {
    setSelectedGrievance(g);
    try {
      const res = await fetch(`/api/grievances/${g.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyResolution = async (verified) => {
    if (!selectedGrievance) return;
    setSubmittingVerification(true);

    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verified,
          reason: verifyReason || (verified ? "Citizen confirmed resolution" : "Citizen reported issue persists"),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setVerifyReason("");
        await fetchGrievances();
        // Refresh detail
        handleOpenDetail(selectedGrievance);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleReopenGrievance = async () => {
    if (!selectedGrievance || !reopenReasonText.trim()) {
      alert("Please enter a valid reason for reopening.");
      return;
    }
    setSubmittingReopen(true);
    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}/reopen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    } catch (e) {
      console.error(e);
      alert("Error reopening grievance");
    } finally {
      setSubmittingReopen(false);
    }
  };

  // KPI Counts
  const stats = useMemo(() => {
    const total = grievances.length;
    const inProgress = grievances.filter((g) => 
      ["SUBMITTED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(g.status)
    ).length;
    const resolved = grievances.filter((g) => 
      ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status)
    ).length;
    const escalated = grievances.filter((g) => 
      g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED"
    ).length;
    return { total, inProgress, resolved, escalated };
  }, [grievances]);

  // Unique Categories for Filter
  const categories = useMemo(() => {
    const cats = new Set(grievances.map((g) => g.category).filter(Boolean));
    return Array.from(cats);
  }, [grievances]);

  // Filtered List
  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      const matchSearch = searchTerm === "" || 
        (g.tracking_number && g.tracking_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.category && g.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.department && g.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.location_text && g.location_text.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || 
        (statusFilter === "IN_PROGRESS" && ["SUBMITTED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(g.status)) ||
        (statusFilter === "RESOLVED" && ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status)) ||
        (statusFilter === "ESCALATED" && (g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED")) ||
        g.status === statusFilter;

      const matchPriority = priorityFilter === "ALL" || g.priority === priorityFilter;
      const matchCategory = categoryFilter === "ALL" || g.category === categoryFilter;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [grievances, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "CRITICAL": return "badge-critical";
      case "HIGH": return "badge-high";
      case "MEDIUM": return "badge-medium";
      default: return "badge-low";
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    return `badge-${s}`;
  };

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={13} />
            <span>AI-Powered Citizen Grievance Portal</span>
          </div>
          <h1 className="hero-title">
            Welcome back, {user?.name || "Citizen"}
          </h1>
          <p className="hero-desc">
            Report local civic concerns via AI, track departmental resolution progress in real time, and verify fixes directly with municipal authorities.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/citizen/grievance/new" className="btn btn-primary btn-lg">
              <PlusCircle size={19} />
              <span>Report Grievance with Civic AI</span>
            </Link>
            <button 
              onClick={fetchGrievances} 
              className="btn btn-secondary btn-lg" 
              style={{ color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              <RefreshCw size={17} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card emerald">
          <div className="stat-header">
            <span className="stat-label">Total Filed</span>
            <div className="stat-icon" style={{ backgroundColor: "#ECFDF5", color: "#047857" }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-subtext">All complaints registered under your citizen ID</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-header">
            <span className="stat-label">In Progress</span>
            <div className="stat-icon" style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#B45309" }}>{stats.inProgress}</div>
          <div className="stat-subtext">Assigned to engineers and field officials</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-header">
            <span className="stat-label">Resolved & Verified</span>
            <div className="stat-icon" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#1D4ED8" }}>{stats.resolved}</div>
          <div className="stat-subtext">Completed works ready for citizen confirmation</div>
        </div>

        <div className="stat-card red">
          <div className="stat-header">
            <span className="stat-label">Escalated / Critical</span>
            <div className="stat-icon" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#B91C1C" }}>{stats.escalated}</div>
          <div className="stat-subtext">SLA breach alerts flagged to department heads</div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, View Toggle */}
      <div className="toolbar-bar">
        <div className="search-box">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search by Ticket ID, locality, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={{ color: "var(--text-secondary)" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          {/* Status Filter */}
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">Active / In Progress</option>
            <option value="RESOLVED">Resolved / Verified</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          {/* Priority Filter */}
          <select 
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select 
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grievances + Side Detail Panel */}
      <div style={{ display: "grid", gridTemplateColumns: selectedGrievance ? "1fr 440px" : "1fr", gap: "1.5rem", alignItems: "start" }}>
        <div>
          {loading ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)" }}>
              <RefreshCw className="spin" size={28} style={{ margin: "0 auto 1rem", color: "var(--primary-emerald)" }} />
              <div style={{ fontWeight: "600", fontSize: "1.05rem", color: "var(--deep-navy)" }}>Synchronizing Grievance Records</div>
              <div style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>Connecting to municipal database...</div>
            </div>
          ) : filteredGrievances.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "var(--bg-subtle)", color: "var(--primary-emerald)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <ShieldCheck size={36} />
              </div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>
                {grievances.length === 0 ? "No Grievances Registered Yet" : "No Matching Grievances Found"}
              </h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: "440px", margin: "0 auto 1.5rem", fontSize: "0.92rem" }}>
                {grievances.length === 0
                  ? "You have not filed any civic grievances yet. Use our conversational Civic AI Assistant to report your issue in seconds."
                  : "Try clearing your search term or filter parameters to view other complaints."}
              </p>
              {grievances.length === 0 ? (
                <Link to="/citizen/grievance/new" className="btn btn-primary">
                  <PlusCircle size={18} />
                  <span>File Your First Grievance</span>
                </Link>
              ) : (
                <button 
                  onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setPriorityFilter("ALL"); setCategoryFilter("ALL"); }}
                  className="btn btn-outline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grievances-grid">
              {filteredGrievances.map((g) => {
                const isSelected = selectedGrievance?.id === g.id;
                return (
                  <div
                    key={g.id}
                    className={`grievance-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleOpenDetail(g)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      {/* Top Row: Ticket ID & Priority Badge */}
                      <div className="card-top-row">
                        <span className="ticket-id">{g.tracking_number}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {g.is_escalated === 1 && (
                            <span className="badge badge-escalated" title="SLA Escalated">
                              <AlertTriangle size={11} /> Escalated
                            </span>
                          )}
                          <span className={`badge ${getPriorityBadgeClass(g.priority)}`}>
                            {g.priority}
                          </span>
                        </div>
                      </div>

                      {/* Department Tag & SLA Badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", margin: "0.6rem 0 0.4rem" }}>
                        <span className="dept-tag">
                          <Building2 size={12} />
                          <span>{g.department || "Municipal Administration"}</span>
                        </span>
                        <SLACountdownBadge 
                          slaDeadline={g.sla_deadline} 
                          status={g.status} 
                          slaStatus={g.sla_status} 
                          compact={true} 
                        />
                      </div>

                      {/* Category & Description */}
                      <div className="card-title" style={{ marginTop: "0.3rem" }}>
                        {g.category}
                      </div>
                      <p className="card-desc" style={{ marginTop: "0.4rem" }}>
                        {g.description}
                      </p>

                      {/* Assigned Worker / Official Badge */}
                      {(g.assigned_worker_name || g.officer_name) && (
                        <div style={{ marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--deep-navy)", backgroundColor: "var(--bg-subtle)", padding: "0.25rem 0.5rem", borderRadius: "5px" }}>
                          <UserCheck size={12} color="var(--primary-emerald)" />
                          <span>Assigned: <strong>{g.assigned_worker_name || g.officer_name}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata Row */}
                    <div>
                      <div className="card-meta-row">
                        <div className="meta-item">
                          <MapPin size={13} color="var(--primary-emerald)" />
                          <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.location_text || "Location on Record"}
                          </span>
                        </div>
                        <div className="meta-item" style={{ marginLeft: "auto" }}>
                          <Calendar size={13} />
                          <span>{new Date(g.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
                        <span className={`badge ${getStatusBadgeClass(g.status)}`}>
                          <span className="badge-dot"></span>
                          <span>{g.status}</span>
                        </span>

                        <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--primary-emerald)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          <span>Track Case</span>
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Assigned Official</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>24h SLA Countdown</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrievances.map((g) => (
                    <tr 
                      key={g.id} 
                      onClick={() => handleOpenDetail(g)} 
                      style={{ cursor: "pointer", backgroundColor: selectedGrievance?.id === g.id ? "var(--bg-subtle)" : undefined }}
                    >
                      <td>
                        <strong style={{ color: "var(--deep-navy)", fontFamily: "var(--font-heading)" }}>
                          {g.tracking_number}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: "600" }}>{g.category}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.description}
                        </div>
                      </td>
                      <td>
                        <span className="dept-tag">
                          {g.department}
                        </span>
                      </td>
                      <td>
                        {g.assigned_worker_name || g.officer_name ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: "600", color: "var(--deep-navy)" }}>
                            <UserCheck size={13} color="var(--primary-emerald)" />
                            <span>{g.assigned_worker_name || g.officer_name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(g.priority)}`}>
                          {g.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(g.status)}`}>
                          <span className="badge-dot"></span>
                          <span>{g.status}</span>
                        </span>
                      </td>
                      <td>
                        <SLACountdownBadge 
                          slaDeadline={g.sla_deadline} 
                          status={g.status} 
                          slaStatus={g.sla_status} 
                          compact={true} 
                        />
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {new Date(g.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" style={{ padding: "0.3rem 0.6rem" }}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Grievance Detail Side Drawer */}
        {selectedGrievance && (
          <div className="detail-drawer">
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <span className="ticket-id" style={{ fontSize: "1.1rem" }}>
                  {selectedGrievance.tracking_number}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
                  <span className={`badge ${getStatusBadgeClass(selectedGrievance.status)}`}>
                    <span className="badge-dot"></span>
                    <span>{selectedGrievance.status}</span>
                  </span>
                  <span className={`badge ${getPriorityBadgeClass(selectedGrievance.priority)}`}>
                    {selectedGrievance.priority}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedGrievance(null)}
                className="btn btn-outline btn-sm"
                style={{ padding: "0.35rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* 24-Hour SLA Banner */}
            <div style={{ padding: "0.85rem 1rem", backgroundColor: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)", margin: "1rem 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700" }}>
                  24-Hour Resolution SLA
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--deep-navy)", marginTop: "0.15rem" }}>
                  {selectedGrievance.sla_deadline 
                    ? `Target: ${new Date(selectedGrievance.sla_deadline).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "Standard 24h Window"}
                </div>
              </div>
              <SLACountdownBadge 
                slaDeadline={selectedGrievance.sla_deadline} 
                status={selectedGrievance.status} 
                slaStatus={selectedGrievance.sla_status} 
              />
            </div>

            {/* Assigned Official Card */}
            {(selectedGrievance.assigned_worker_name || selectedGrievance.officer_name) && (
              <div style={{ marginBottom: "1.25rem", padding: "0.85rem 1rem", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", fontWeight: "700", color: "#166534" }}>
                    <UserCheck size={16} />
                    <span>Assigned Field Official</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#DCFCE7", color: "#15803D", fontWeight: "600" }}>
                    Active Assignment
                  </span>
                </div>

                <div style={{ marginTop: "0.45rem", fontSize: "0.92rem", fontWeight: "700", color: "#142B45" }}>
                  {selectedGrievance.assigned_worker_name || selectedGrievance.officer_name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#15803D", marginTop: "0.1rem" }}>
                  {selectedGrievance.department}
                </div>

                {selectedGrievance.assigned_worker_phone && (
                  <div style={{ marginTop: "0.45rem" }}>
                    <a 
                      href={`tel:${selectedGrievance.assigned_worker_phone}`} 
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", color: "#047857", fontWeight: "600", textDecoration: "none" }}
                    >
                      <Phone size={13} /> Call Official ({selectedGrievance.assigned_worker_phone})
                    </a>
                  </div>
                )}

                {selectedGrievance.assignment_notes && (
                  <div style={{ marginTop: "0.45rem", fontSize: "0.8rem", color: "#374151", backgroundColor: "rgba(255,255,255,0.7)", padding: "0.4rem 0.6rem", borderRadius: "4px", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <span style={{ fontWeight: "600" }}>Instructions: </span>
                    <span>{selectedGrievance.assignment_notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Resolution Report Card (if resolved or closed) */}
            {["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(selectedGrievance.status) && (
              <div style={{ marginBottom: "1.25rem", padding: "0.9rem 1rem", backgroundColor: "#EFF6FF", borderRadius: "8px", border: "1px solid #BFDBFE" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", fontWeight: "700", color: "#1E40AF" }}>
                  <FileCheck2 size={16} />
                  <span>Field Resolution Report</span>
                </div>
                <div style={{ marginTop: "0.45rem", fontSize: "0.85rem", color: "#1E3A8A", lineHeight: "1.4" }}>
                  <strong>Summary: </strong>
                  <span>{selectedGrievance.resolution_summary || selectedGrievance.resolution_notes || "Field works inspected and completed."}</span>
                </div>
                {selectedGrievance.work_performed && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.83rem", color: "#1E3A8A", lineHeight: "1.4" }}>
                    <strong>Work Performed: </strong>
                    <span>{selectedGrievance.work_performed}</span>
                  </div>
                )}
                {selectedGrievance.resolved_at && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Clock size={12} />
                    <span>Completed on {new Date(selectedGrievance.resolved_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )}

                {/* Citizen Reopen Trigger */}
                {selectedGrievance.status === "CITIZEN_VERIFIED" && (
                  <button 
                    onClick={() => setReopenModalOpen(true)}
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: "0.75rem", width: "100%", borderColor: "#BFDBFE", color: "#1E40AF" }}
                  >
                    <RotateCcw size={13} /> Reopen Grievance If Problem Persists
                  </button>
                )}
              </div>
            )}

            {/* Case Information */}
            <div style={{ margin: "1.25rem 0" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700" }}>
                Grievance Classification
              </div>
              <h4 style={{ fontSize: "1.15rem", color: "var(--deep-navy)", margin: "0.25rem 0 0.5rem" }}>
                {selectedGrievance.category}
              </h4>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "600", color: "var(--deep-navy)" }}>
                <Building2 size={14} color="var(--primary-emerald)" />
                <span>{selectedGrievance.department}</span>
              </div>
            </div>

            {/* Complaint Text */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700", marginBottom: "0.35rem" }}>
                Citizen Description
              </div>
              <div style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: "0.85rem 1rem", borderRadius: "8px", fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
                {selectedGrievance.description}
              </div>
            </div>

            {/* Location & Geocode */}
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem", backgroundColor: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: "600", color: "var(--deep-navy)" }}>
                <MapPin size={15} color="var(--primary-emerald)" />
                <span>{selectedGrievance.location_text || "Location details on record"}</span>
              </div>
              {selectedGrievance.latitude && selectedGrievance.longitude && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", paddingLeft: "1.35rem" }}>
                  GPS: {selectedGrievance.latitude.toFixed(4)}° N, {selectedGrievance.longitude.toFixed(4)}° E
                </div>
              )}
            </div>

            {/* Citizen Resolution Verification Prompt */}
            {selectedGrievance.status === "RESOLVED" && (
              <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", padding: "1.25rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.95rem", fontWeight: "700", color: "#166534" }}>
                  <CheckCircle2 size={18} />
                  <span>Department Marked as Resolved</span>
                </div>
                <p style={{ fontSize: "0.84rem", color: "#15803D", margin: "0.5rem 0 0.85rem", lineHeight: "1.4" }}>
                  Please confirm whether the civic issue has been satisfactorily resolved in your locality:
                </p>

                <div style={{ marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    className="chat-text-input"
                    placeholder="Optional feedback or reason if issue persists..."
                    value={verifyReason}
                    onChange={(e) => setVerifyReason(e.target.value)}
                    style={{ width: "100%", fontSize: "0.85rem", padding: "0.55rem 0.85rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1 }} 
                    onClick={() => handleVerifyResolution(true)}
                    disabled={submittingVerification}
                  >
                    <CheckCircle2 size={14} /> YES, RESOLVED
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-sm" 
                    style={{ flex: 1 }} 
                    onClick={() => handleVerifyResolution(false)}
                    disabled={submittingVerification}
                  >
                    <XCircle size={14} /> REOPEN CASE
                  </button>
                </div>
              </div>
            )}

            {/* Audit History Timeline */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700" }}>
                  Lifecycle Audit Trail
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {history.length} Events Logged
                </span>
              </div>
              <GrievanceTimeline history={history} />
            </div>
          </div>
        )}
      </div>

      {/* Citizen Reopen Case Modal */}
      {reopenModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "480px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#B45309", fontWeight: "700", fontSize: "1.05rem" }}>
                <RotateCcw size={18} />
                <span>Reopen Grievance</span>
              </div>
              <button onClick={() => setReopenModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: "1.5" }}>
              Reopening ticket <strong>{selectedGrievance?.tracking_number}</strong> will reset the case to active status and initiate a fresh <strong>24-Hour Resolution SLA</strong> with department supervisors.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--deep-navy)", marginBottom: "0.4rem" }}>
                Reason for Reopening <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <textarea
                rows={3}
                className="chat-text-input"
                placeholder="Describe why the issue persists or what further work is required..."
                value={reopenReasonText}
                onChange={(e) => setReopenReasonText(e.target.value)}
                style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem 0.8rem", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button 
                type="button" 
                onClick={() => setReopenModalOpen(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleReopenGrievance}
                disabled={submittingReopen || !reopenReasonText.trim()}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: "#D97706", borderColor: "#B45309" }}
              >
                {submittingReopen ? "Reopening..." : "Confirm & Reopen Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
