import React, { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import GrievanceTimeline from "./GrievanceTimeline";
import SLACountdownBadge from "./SLACountdownBadge";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Shield, 
  MapPin, 
  FileText, 
  Send, 
  User, 
  Search, 
  Filter, 
  RefreshCw, 
  Building2, 
  Calendar, 
  X, 
  ChevronRight,
  LayoutGrid,
  List,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  Check
} from "lucide-react";

export default function OfficerDashboard() {
  const { token, user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [history, setHistory] = useState([]);
  const [notesText, setNotesText] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  useEffect(() => {
    fetchOfficerGrievances();
  }, [token]);

  const fetchOfficerGrievances = async () => {
    try {
      const res = await fetch("/api/grievances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.grievances || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
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

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    if (newStatus === "RESOLVED") {
      if (!resolutionSummary.trim()) {
        alert("Please enter a resolution summary describing how the issue was resolved.");
        return;
      }
      if (!workPerformed.trim()) {
        alert("Please enter details of the work performed on-site.");
        return;
      }
    }

    setSubmittingStatus(true);

    try {
      let res;
      if (newStatus === "RESOLVED") {
        res = await fetch(`/api/grievances/${selectedGrievance.id}/resolve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resolution_summary: resolutionSummary.trim(),
            work_performed: workPerformed.trim(),
            notes: notesText || `Resolved by officer ${user?.name || ''}`,
          }),
        });
      } else {
        res = await fetch(`/api/grievances/${selectedGrievance.id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            notes: notesText || `Officer ${user?.name || ''} updated status to ${newStatus}`,
          }),
        });
      }

      if (res.ok) {
        setNotesText("");
        setResolutionSummary("");
        setWorkPerformed("");
        await fetchOfficerGrievances();
        // Refresh details for current selection
        const updatedRes = await fetch(`/api/grievances/${selectedGrievance.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (updatedRes.ok) {
          const uData = await updatedRes.json();
          setSelectedGrievance(uData.grievance);
          setHistory(uData.history || []);
        }
        alert(`Grievance status successfully updated to ${newStatus}`);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting update");
    } finally {
      setSubmittingStatus(false);
    }
  };

  // KPI Counts
  const assignedCount = grievances.filter((g) => g.status === "ASSIGNED" || g.status === "SUBMITTED").length;
  const inProgressCount = grievances.filter((g) => g.status === "IN_PROGRESS" || g.status === "ACKNOWLEDGED").length;
  const escalatedCount = grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED").length;
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED" || g.status === "CITIZEN_VERIFIED" || g.status === "CLOSED").length;

  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      const matchSearch = searchTerm === "" || 
        (g.tracking_number && g.tracking_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.category && g.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.location_text && g.location_text.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || 
        (statusFilter === "NEW" && (g.status === "ASSIGNED" || g.status === "SUBMITTED")) ||
        (statusFilter === "IN_PROGRESS" && (g.status === "IN_PROGRESS" || g.status === "ACKNOWLEDGED")) ||
        (statusFilter === "ESCALATED" && (g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED")) ||
        (statusFilter === "RESOLVED" && (g.status === "RESOLVED" || g.status === "CITIZEN_VERIFIED" || g.status === "CLOSED")) ||
        g.status === statusFilter;

      const matchPriority = priorityFilter === "ALL" || g.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [grievances, searchTerm, statusFilter, priorityFilter]);

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
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.74rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.4rem" }}>
            <Building2 size={12} color="var(--primary-emerald)" />
            <span>Authorized Department Official Portal</span>
          </div>
          <h2 style={{ fontSize: "1.85rem", color: "var(--deep-navy)", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Department Officer Case Board
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.15rem" }}>
            Oversee assigned civic cases, record field inspection progress notes, and submit resolutions for citizen verification.
          </p>
        </div>

        <button 
          onClick={fetchOfficerGrievances} 
          className="btn btn-secondary btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <RefreshCw size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <span className="stat-label">Newly Assigned</span>
            <div className="stat-icon" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>
              <Clock size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#1D4ED8" }}>{assignedCount}</div>
          <div className="stat-subtext">Awaiting initial departmental acknowledgment</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-header">
            <span className="stat-label">In Progress</span>
            <div className="stat-icon" style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <RefreshCw size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#B45309" }}>{inProgressCount}</div>
          <div className="stat-subtext">Active fieldwork, inspection, or repair ongoing</div>
        </div>

        <div className="stat-card red">
          <div className="stat-header">
            <span className="stat-label">SLA Breached / Escalated</span>
            <div className="stat-icon" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#B91C1C" }}>{escalatedCount}</div>
          <div className="stat-subtext">Urgent priority cases flagged to city administrative office</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-header">
            <span className="stat-label">Resolved Works</span>
            <div className="stat-icon" style={{ backgroundColor: "#ECFDF5", color: "#047857" }}>
              <CheckCircle size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#047857" }}>{resolvedCount}</div>
          <div className="stat-subtext">Successfully resolved & confirmed by citizens</div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, View Modes */}
      <div className="toolbar-bar">
        <div className="search-box">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search assigned cases by ID, locality, keywords..."
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
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({grievances.length})</option>
            <option value="NEW">Newly Assigned</option>
            <option value="IN_PROGRESS">In Progress / Fieldwork</option>
            <option value="ESCALATED">SLA Escalated</option>
            <option value="RESOLVED">Resolved Cases</option>
          </select>

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

          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View (Dense)"
            >
              <List size={16} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Cases + Detail Side Drawer */}
      <div style={{ display: "grid", gridTemplateColumns: selectedGrievance ? "1fr 440px" : "1fr", gap: "1.5rem", alignItems: "start" }}>
        <div>
          {loading ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)" }}>
              <RefreshCw className="spin" size={28} style={{ margin: "0 auto 1rem", color: "var(--primary-emerald)" }} />
              <div style={{ fontWeight: "600", fontSize: "1.05rem", color: "var(--deep-navy)" }}>Loading Department Queue</div>
            </div>
          ) : filteredGrievances.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--bg-subtle)", color: "var(--primary-emerald)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <CheckCircle2 size={30} />
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "var(--deep-navy)", marginBottom: "0.3rem" }}>
                No Assigned Grievances in this Filter
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto" }}>
                All civic complaints matching this criteria have been resolved or reassigned.
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* TABLE VIEW */
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Category & Summary</th>
                    <th>Location</th>
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
                      style={{ 
                        cursor: "pointer", 
                        backgroundColor: selectedGrievance?.id === g.id ? "var(--bg-subtle)" : undefined 
                      }}
                    >
                      <td>
                        <strong style={{ fontFamily: "var(--font-heading)", color: "var(--deep-navy)", fontSize: "0.92rem" }}>
                          {g.tracking_number}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: "700", color: "var(--deep-navy)" }}>{g.category}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.description}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          <MapPin size={12} color="var(--primary-emerald)" />
                          <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.location_text || "Unspecified"}
                          </span>
                        </div>
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
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {new Date(g.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grievances-grid">
              {filteredGrievances.map((g) => (
                <div
                  key={g.id}
                  className={`grievance-card ${selectedGrievance?.id === g.id ? "selected" : ""}`}
                  onClick={() => handleOpenDetail(g)}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <div className="card-top-row">
                      <span className="ticket-id">{g.tracking_number}</span>
                      <span className={`badge ${getPriorityBadgeClass(g.priority)}`}>
                        {g.priority}
                      </span>
                    </div>

                    <div className="card-title" style={{ marginTop: "0.6rem" }}>
                      {g.category}
                    </div>

                    <p className="card-desc" style={{ marginTop: "0.35rem" }}>
                      {g.description}
                    </p>
                  </div>

                  <div>
                    <div className="card-meta-row">
                      <div className="meta-item">
                        <MapPin size={13} color="var(--primary-emerald)" />
                        <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.location_text || "Unspecified"}
                        </span>
                      </div>
                      <div className="meta-item" style={{ marginLeft: "auto" }}>
                        <Calendar size={13} />
                        <span>{new Date(g.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
                      <span className={`badge ${getStatusBadgeClass(g.status)}`}>
                        <span className="badge-dot"></span>
                        <span>{g.status}</span>
                      </span>
                      <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--primary-emerald)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <span>Update Status</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Grievance Detail & Action Panel */}
        {selectedGrievance && (
          <div className="detail-drawer">
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
                title="Close panel"
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

            {/* Complaint Info */}
            <div style={{ margin: "1rem 0" }}>
              <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700" }}>
                Assigned Grievance
              </div>
              <h4 style={{ fontSize: "1.15rem", color: "var(--deep-navy)", margin: "0.25rem 0 0.5rem" }}>
                {selectedGrievance.category}
              </h4>
              <div style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: "0.85rem 1rem", borderRadius: "8px", fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
                {selectedGrievance.description}
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem", backgroundColor: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: "600", color: "var(--deep-navy)" }}>
                <MapPin size={14} color="var(--primary-emerald)" />
                <span>{selectedGrievance.location_text || "Location details on record"}</span>
              </div>
            </div>

            {/* Official Status Update Form */}
            <form 
              onSubmit={handleUpdateStatus} 
              style={{ 
                backgroundColor: "#F8FAFC", 
                border: "1.5px solid var(--border-color)", 
                padding: "1.25rem", 
                borderRadius: "10px", 
                marginBottom: "1.5rem" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.92rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.85rem" }}>
                <Shield size={16} color="var(--primary-emerald)" />
                <span>Update Grievance Progression</span>
              </div>

              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ fontSize: "0.74rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Transition Status To
                </label>
                <select
                  className="filter-select"
                  style={{ width: "100%", marginTop: "0.3rem", padding: "0.6rem 0.75rem", fontSize: "0.88rem" }}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED (Official Received)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Fieldwork Ongoing)</option>
                  <option value="RESOLVED">RESOLVED (Complete Resolution & Close)</option>
                  <option value="REJECTED">REJECTED (Non-jurisdictional / Ineligible)</option>
                </select>
              </div>

              {newStatus === "RESOLVED" && (
                <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", padding: "0.85rem", borderRadius: "8px", marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: "700", color: "#166534", marginBottom: "0.5rem" }}>
                    <FileCheck2 size={15} />
                    <span>Resolution Verification Details (Mandatory)</span>
                  </div>

                  <div style={{ marginBottom: "0.6rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#15803D", display: "block" }}>
                      Resolution Summary <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="chat-text-input"
                      style={{ width: "100%", marginTop: "0.2rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
                      placeholder="e.g. Main water valve replaced, leak resolved"
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#15803D", display: "block" }}>
                      Work Performed Details <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <textarea
                      className="chat-text-input"
                      style={{ width: "100%", height: "60px", marginTop: "0.2rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", resize: "vertical" }}
                      placeholder="Describe steps taken, replacement components, test checks..."
                      value={workPerformed}
                      onChange={(e) => setWorkPerformed(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.74rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Officer Progress / Resolution Notes
                </label>
                <textarea
                  className="chat-text-input"
                  style={{ width: "100%", height: "65px", marginTop: "0.3rem", padding: "0.6rem 0.8rem", fontSize: "0.88rem", resize: "vertical" }}
                  placeholder="Record work details (e.g. 'Inspected pipeline, valve replaced')..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%" }}
                disabled={submittingStatus}
              >
                <Send size={15} />
                <span>{submittingStatus ? "Recording Update..." : (newStatus === "RESOLVED" ? "Submit Official Resolution" : "Submit Status Update")}</span>
              </button>
            </form>

            {/* Audit History Timeline */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700" }}>
                  Case Audit Timeline
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {history.length} Events
                </span>
              </div>
              <GrievanceTimeline history={history} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
