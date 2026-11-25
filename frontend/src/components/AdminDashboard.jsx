import React, { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import AIAdminAssistant from "./AIAdminAssistant";
import GISMap from "./GISMap";
import SLACountdownBadge from "./SLACountdownBadge";
import GrievanceTimeline from "./GrievanceTimeline";
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
  UserCheck,
  UserPlus,
  Phone,
  FileCheck2,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Send,
  CheckCircle,
  Briefcase,
  XCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { token, user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [activeTab, setActiveTab] = useState("all_grievances"); // Default to management console
  
  // Table search & filters
  const [adminSearch, setAdminSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [slaFilter, setSlaFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc"); // 'date_desc' | 'deadline_asc' | 'priority'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [assignModalGrievance, setAssignModalGrievance] = useState(null);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const [resolveModalGrievance, setResolveModalGrievance] = useState(null);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submittingResolve, setSubmittingResolve] = useState(false);

  const [reopenModalGrievance, setReopenModalGrievance] = useState(null);
  const [reopenReason, setReopenReason] = useState("");
  const [submittingReopen, setSubmittingReopen] = useState(false);

  const [rejectModalGrievance, setRejectModalGrievance] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const [detailModalGrievance, setDetailModalGrievance] = useState(null);
  const [detailHistory, setDetailHistory] = useState([]);

  // SLA Overview state
  const [slaOverview, setSlaOverview] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchSlaOverview();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Grievances with primary and fallback support
      try {
        let gRes = await fetch("/api/admin/grievances", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!gRes.ok) {
          console.warn("Primary /api/admin/grievances returned " + gRes.status + ", falling back to /api/grievances");
          gRes = await fetch("/api/grievances", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        if (gRes.ok) {
          const gData = await gRes.json();
          const list = Array.isArray(gData) ? gData : (gData?.grievances || gData?.data || []);
          setGrievances(list);
        } else {
          console.error("Grievances fetch failed with HTTP status:", gRes.status);
        }
      } catch (gErr) {
        console.error("Grievances fetch network error, trying fallback:", gErr);
        try {
          const fallbackRes = await fetch("/api/grievances", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const list = Array.isArray(fallbackData) ? fallbackData : (fallbackData?.grievances || fallbackData?.data || []);
            setGrievances(list);
          }
        } catch (fErr) {
          console.error("Fallback grievances fetch failed:", fErr);
        }
      }

      // 2. Fetch Incidents independently so incident errors never block grievances
      try {
        const iRes = await fetch("/api/incidents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (iRes.ok) {
          const iData = await iRes.json();
          setIncidents(iData.incidents || (Array.isArray(iData) ? iData : []));
        }
      } catch (iErr) {
        console.warn("Incidents fetch error (non-fatal):", iErr);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlaOverview = async () => {
    try {
      let res = await fetch("/api/admin/sla/monitoring", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        res = await fetch("/api/sla/monitoring", {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (res.ok) {
        const data = await res.json();
        setSlaOverview(data);
      }
    } catch (e) {
      console.warn("SLA overview fetch notice:", e);
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

  // Open Worker Assignment Modal
  const handleOpenAssignModal = async (g) => {
    setAssignModalGrievance(g);
    setSelectedWorkerId(g.assigned_officer_id ? String(g.assigned_officer_id) : "");
    setAssignmentNotes(g.assignment_notes || "");
    setLoadingWorkers(true);

    try {
      const deptParam = g.department ? `?department=${encodeURIComponent(g.department)}` : "";
      let res = await fetch(`/api/admin/workers/available${deptParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        res = await fetch(`/api/grievances/workers/available${deptParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (res.ok) {
        const workers = await res.json();
        setAvailableWorkers(Array.isArray(workers) ? workers : (workers.workers || []));
      }
    } catch (err) {
      console.error("Fetch workers error:", err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleAssignWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalGrievance || !selectedWorkerId) {
      alert("Please select a worker/official to assign.");
      return;
    }
    setSubmittingAssign(true);

    try {
      let res = await fetch(`/api/admin/grievances/${assignModalGrievance.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          worker_id: Number(selectedWorkerId),
          notes: assignmentNotes.trim(),
        }),
      });
      if (!res.ok) {
        res = await fetch(`/api/grievances/${assignModalGrievance.id}/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            worker_id: Number(selectedWorkerId),
            notes: assignmentNotes.trim(),
          }),
        });
      }

      if (res.ok) {
        const updated = await res.json();
        alert(`Successfully assigned grievance ${updated.tracking_number} to field official.`);
        setAssignModalGrievance(null);
        await fetchDashboardData();
        await fetchSlaOverview();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to assign worker");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning worker");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Open Resolution Modal
  const handleOpenResolveModal = (g) => {
    setResolveModalGrievance(g);
    setResolutionSummary("");
    setWorkPerformed("");
    setResolutionNotes("");
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalGrievance) return;
    if (!resolutionSummary.trim()) {
      alert("Resolution summary is mandatory.");
      return;
    }
    if (!workPerformed.trim()) {
      alert("Work performed details are required.");
      return;
    }
    setSubmittingResolve(true);

    try {
      let res = await fetch(`/api/admin/grievances/${resolveModalGrievance.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resolution_summary: resolutionSummary.trim(),
          work_performed: workPerformed.trim(),
          notes: resolutionNotes.trim(),
        }),
      });
      if (!res.ok) {
        res = await fetch(`/api/grievances/${resolveModalGrievance.id}/resolve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resolution_summary: resolutionSummary.trim(),
            work_performed: workPerformed.trim(),
            notes: resolutionNotes.trim(),
          }),
        });
      }

      if (res.ok) {
        alert(`Grievance ${resolveModalGrievance.tracking_number} successfully marked as resolved.`);
        setResolveModalGrievance(null);
        await fetchDashboardData();
        await fetchSlaOverview();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to resolve grievance");
      }
    } catch (err) {
      console.error(err);
      alert("Error resolving grievance");
    } finally {
      setSubmittingResolve(false);
    }
  };

  // Open Reopen Modal
  const handleOpenReopenModal = (g) => {
    setReopenModalGrievance(g);
    setReopenReason("");
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenModalGrievance || !reopenReason.trim()) {
      alert("Please enter a reason for reopening this grievance.");
      return;
    }
    setSubmittingReopen(true);

    try {
      let res = await fetch(`/api/admin/grievances/${reopenModalGrievance.id}/reopen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reopenReason.trim() }),
      });
      if (!res.ok) {
        res = await fetch(`/api/grievances/${reopenModalGrievance.id}/reopen`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: reopenReason.trim() }),
        });
      }

      if (res.ok) {
        alert(`Grievance ${reopenModalGrievance.tracking_number} reopened. Fresh 24-hour SLA started.`);
        setReopenModalGrievance(null);
        await fetchDashboardData();
        await fetchSlaOverview();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reopen grievance");
      }
    } catch (err) {
      console.error(err);
      alert("Error reopening grievance");
    } finally {
      setSubmittingReopen(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (g) => {
    setRejectModalGrievance(g);
    setRejectReason("Invalid or incomplete complaint details");
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalGrievance) return;
    const finalReason = rejectReason.trim() || "Rejected by municipal authority";
    setSubmittingReject(true);

    try {
      let res = await fetch(`/api/admin/grievances/${rejectModalGrievance.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: finalReason }),
      });
      if (!res.ok) {
        res = await fetch(`/api/grievances/${rejectModalGrievance.id}/reject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: finalReason }),
        });
      }

      if (res.ok) {
        alert(`Grievance ${rejectModalGrievance.tracking_number} has been rejected.`);
        setRejectModalGrievance(null);
        if (detailModalGrievance && detailModalGrievance.id === rejectModalGrievance.id) {
          setDetailModalGrievance(null);
        }
        await fetchDashboardData();
        await fetchSlaOverview();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reject grievance");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting grievance");
    } finally {
      setSubmittingReject(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetailModal = async (g) => {
    setDetailModalGrievance(g);
    try {
      const res = await fetch(`/api/grievances/${g.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetailHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and Sort Grievances
  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      // Search
      const searchLower = adminSearch.toLowerCase();
      const matchSearch = !adminSearch || 
        (g.tracking_number && g.tracking_number.toLowerCase().includes(searchLower)) ||
        (g.citizen_name && g.citizen_name.toLowerCase().includes(searchLower)) ||
        (g.category && g.category.toLowerCase().includes(searchLower)) ||
        (g.department && g.department.toLowerCase().includes(searchLower)) ||
        (g.location_text && g.location_text.toLowerCase().includes(searchLower)) ||
        (g.description && g.description.toLowerCase().includes(searchLower)) ||
        (g.assigned_worker_name && g.assigned_worker_name.toLowerCase().includes(searchLower));

      // Department
      const matchDept = deptFilter === "ALL" || g.department === deptFilter;

      // Category
      const matchCat = categoryFilter === "ALL" || g.category === categoryFilter;

      // Priority
      const matchPri = priorityFilter === "ALL" || g.priority === priorityFilter;

      // Status
      const matchStatus = statusFilter === "ALL" || 
        (statusFilter === "ACTIVE" && ["SUBMITTED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(g.status)) ||
        (statusFilter === "RESOLVED" && ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status)) ||
        (statusFilter === "ESCALATED" && (g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED")) ||
        g.status === statusFilter;

      // SLA Status
      let matchSla = true;
      if (slaFilter !== "ALL") {
        const isResolved = ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status);
        if (slaFilter === "BREACHED") {
          matchSla = !isResolved && (g.sla_status === "SLA_BREACHED" || (g.sla_deadline && new Date(g.sla_deadline).getTime() < Date.now()));
        } else if (slaFilter === "APPROACHING") {
          if (isResolved || !g.sla_deadline) matchSla = false;
          else {
            const diffHours = (new Date(g.sla_deadline).getTime() - Date.now()) / (1000 * 60 * 60);
            matchSla = diffHours > 0 && diffHours <= 12;
          }
        } else if (slaFilter === "WITHIN_SLA") {
          if (isResolved || !g.sla_deadline) matchSla = false;
          else {
            const diffHours = (new Date(g.sla_deadline).getTime() - Date.now()) / (1000 * 60 * 60);
            matchSla = diffHours > 12;
          }
        } else if (slaFilter === "RESOLVED_ON_TIME") {
          matchSla = isResolved && g.sla_status !== "RESOLVED_OVERDUE";
        } else if (slaFilter === "RESOLVED_OVERDUE") {
          matchSla = isResolved && g.sla_status === "RESOLVED_OVERDUE";
        }
      }

      return matchSearch && matchDept && matchCat && matchPri && matchStatus && matchSla;
    }).sort((a, b) => {
      if (sortBy === "deadline_asc") {
        if (!a.sla_deadline) return 1;
        if (!b.sla_deadline) return -1;
        return new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime();
      } else if (sortBy === "priority") {
        const priWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priWeights[b.priority] || 0) - (priWeights[a.priority] || 0);
      } else {
        // date_desc
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [grievances, adminSearch, deptFilter, categoryFilter, priorityFilter, statusFilter, slaFilter, sortBy]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredGrievances.length / pageSize) || 1;
  const paginatedGrievances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGrievances.slice(start, start + pageSize);
  }, [filteredGrievances, currentPage, pageSize]);

  // Unique Lists for Dropdown Filters
  const departments = useMemo(() => {
    return Array.from(new Set(grievances.map((g) => g.department).filter(Boolean)));
  }, [grievances]);

  const categories = useMemo(() => {
    return Array.from(new Set(grievances.map((g) => g.category).filter(Boolean)));
  }, [grievances]);

  // High-level Metrics
  const total = grievances.length;
  const pending = grievances.filter((g) => ["SUBMITTED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(g.status)).length;
  const resolved = grievances.filter((g) => ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status)).length;
  const escalated = grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED" || g.status === "REOPENED").length;

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
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", backgroundColor: "var(--status-info-bg)", border: "1px solid var(--status-info-border)", borderRadius: "6px", fontSize: "0.74rem", fontWeight: "700", color: "var(--status-info)", marginBottom: "0.4rem" }}>
            <Building2 size={12} />
            <span>Executive Municipal Oversight Console</span>
          </div>
          <h2 style={{ fontSize: "1.85rem", color: "var(--deep-navy)", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Admin Grievance Management & 24h SLA Operations
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.15rem" }}>
            Assign field workers, enforce strict 24-hour SLAs with automated escalations, and manage end-to-end municipal resolutions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => { fetchDashboardData(); fetchSlaOverview(); }}
          >
            <RefreshCw size={14} />
            <span>Refresh Operations</span>
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
          <div className="stat-subtext">All complaints registered across 10 departments</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-header">
            <span className="stat-label">Active / Field Work</span>
            <div className="stat-icon" style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
              <Clock size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: "#B45309" }}>{pending}</div>
          <div className="stat-subtext">Currently assigned to engineers & field officials</div>
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
            {total > 0 ? `${Math.round((resolved / total) * 100)}% resolution success rate` : "No cases"}
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
          <div className="stat-subtext">
            {slaOverview?.breached || 0} tickets exceeded strict 24h deadline
          </div>
        </div>
      </div>

      {/* Real-time 24-Hour SLA Monitoring Panel */}
      <div className="card" style={{ marginBottom: "1.75rem", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={18} color="var(--primary-emerald)" />
            <h3 style={{ fontSize: "1.1rem", color: "var(--deep-navy)", fontWeight: "700" }}>
              24-Hour Resolution SLA Live Monitoring
            </h3>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Strict 24h Window • Auto Escalation Cron: Active (30s)
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
          {/* Within SLA */}
          <div 
            onClick={() => setSlaFilter(slaFilter === "WITHIN_SLA" ? "ALL" : "WITHIN_SLA")}
            style={{ 
              backgroundColor: slaFilter === "WITHIN_SLA" ? "#ECFDF5" : "var(--bg-main)", 
              border: `1.5px solid ${slaFilter === "WITHIN_SLA" ? "#059669" : "var(--border-color)"}`, 
              padding: "0.85rem 1rem", 
              borderRadius: "8px", 
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#047857" }}>SAFE (&gt;12h)</span>
              <CheckCircle size={15} color="#059669" />
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--deep-navy)", marginTop: "0.2rem" }}>
              {slaOverview?.within_sla || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Tickets comfortably on track</div>
          </div>

          {/* Approaching Deadline (6h - 12h) */}
          <div 
            onClick={() => setSlaFilter(slaFilter === "APPROACHING" ? "ALL" : "APPROACHING")}
            style={{ 
              backgroundColor: slaFilter === "APPROACHING" ? "#FFFBEB" : "var(--bg-main)", 
              border: `1.5px solid ${slaFilter === "APPROACHING" ? "#D97706" : "var(--border-color)"}`, 
              padding: "0.85rem 1rem", 
              borderRadius: "8px", 
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#B45309" }}>APPROACHING (6-12h)</span>
              <Clock size={15} color="#D97706" />
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "#B45309", marginTop: "0.2rem" }}>
              {slaOverview?.approaching_deadline || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Supervisors notified</div>
          </div>

          {/* Due Soon (<6h) */}
          <div 
            onClick={() => setSlaFilter(slaFilter === "APPROACHING" ? "ALL" : "APPROACHING")}
            style={{ 
              backgroundColor: "var(--bg-main)", 
              border: "1.5px solid var(--border-color)", 
              padding: "0.85rem 1rem", 
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#EA580C" }}>CRITICAL DUE (&lt;6h)</span>
              <AlertTriangle size={15} color="#EA580C" />
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "#EA580C", marginTop: "0.2rem" }}>
              {(slaOverview?.critical_due_soon || 0) + (slaOverview?.urgent || 0)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Immediate action required</div>
          </div>

          {/* SLA Breached */}
          <div 
            onClick={() => setSlaFilter(slaFilter === "BREACHED" ? "ALL" : "BREACHED")}
            style={{ 
              backgroundColor: slaFilter === "BREACHED" ? "#FEF2F2" : "var(--bg-main)", 
              border: `1.5px solid ${slaFilter === "BREACHED" ? "#DC2626" : "var(--border-color)"}`, 
              padding: "0.85rem 1rem", 
              borderRadius: "8px", 
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#B91C1C" }}>SLA BREACHED</span>
              <ShieldAlert size={15} color="#DC2626" />
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "#B91C1C", marginTop: "0.2rem" }}>
              {slaOverview?.breached || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Auto-escalated to Executive</div>
          </div>
        </div>
      </div>

      {/* Admin Feature Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <button
          className={`nav-tab ${activeTab === "all_grievances" ? "active" : ""}`}
          onClick={() => setActiveTab("all_grievances")}
        >
          <LayoutDashboard size={16} />
          <span>Grievance Operations & Assignments ({filteredGrievances.length})</span>
        </button>

        <button
          className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 size={16} />
          <span>Department Performance</span>
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

      {/* TAB: GRIEVANCE OPERATIONS & WORKER ASSIGNMENT */}
      {activeTab === "all_grievances" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          {/* Table Controls & Filters Toolbar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              {/* Search */}
              <div className="search-box" style={{ maxWidth: "340px", flex: 1 }}>
                <Search size={15} color="var(--text-secondary)" />
                <input
                  type="text"
                  placeholder="Search ID, citizen, worker, locality..."
                  value={adminSearch}
                  onChange={(e) => { setAdminSearch(e.target.value); setCurrentPage(1); }}
                />
                {adminSearch && (
                  <button onClick={() => setAdminSearch("")} style={{ color: "var(--text-secondary)" }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sorting */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600" }}>Sort By:</span>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date_desc">Submission Date (Newest)</option>
                  <option value="deadline_asc">Nearest SLA Deadline</option>
                  <option value="priority">Priority (Critical First)</option>
                </select>
              </div>
            </div>

            {/* Filter Pills / Selects */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Department */}
              <select
                className="filter-select"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Category */}
              {categories.length > 0 && (
                <select
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}

              {/* Priority */}
              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Status */}
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active (Assigned/In Progress)</option>
                <option value="RESOLVED">Resolved / Verified</option>
                <option value="ESCALATED">Escalated</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="REOPENED">REOPENED</option>
                <option value="REJECTED">REJECTED</option>
              </select>

              {/* SLA Filter */}
              <select
                className="filter-select"
                value={slaFilter}
                onChange={(e) => { setSlaFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All SLA States</option>
                <option value="WITHIN_SLA">Within SLA Target (&gt;12h)</option>
                <option value="APPROACHING">Approaching Deadline (&lt;12h)</option>
                <option value="BREACHED">SLA Breached (Overdue)</option>
                <option value="RESOLVED_ON_TIME">Resolved On Time</option>
                <option value="RESOLVED_OVERDUE">Resolved Overdue</option>
              </select>

              {(adminSearch || deptFilter !== "ALL" || categoryFilter !== "ALL" || priorityFilter !== "ALL" || statusFilter !== "ALL" || slaFilter !== "ALL") && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setAdminSearch("");
                    setDeptFilter("ALL");
                    setCategoryFilter("ALL");
                    setPriorityFilter("ALL");
                    setStatusFilter("ALL");
                    setSlaFilter("ALL");
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Interactive Management Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Citizen</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Assigned Official</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>24h SLA Countdown</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "3rem" }}>
                      <RefreshCw className="spin" size={24} style={{ margin: "0 auto 0.5rem", color: "var(--primary-emerald)" }} />
                      <div>Loading grievance registry...</div>
                    </td>
                  </tr>
                ) : paginatedGrievances.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                      No grievances matching current search and filter settings.
                    </td>
                  </tr>
                ) : (
                  paginatedGrievances.map((g) => {
                    const isEscalated = g.is_escalated === 1 || g.status === "ESCALATED";
                    const isResolved = ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status);

                    return (
                      <tr key={g.id}>
                        {/* 1. ID */}
                        <td>
                          <span 
                            onClick={() => handleOpenDetailModal(g)}
                            style={{ 
                              fontFamily: "var(--font-heading)", 
                              fontWeight: "700", 
                              color: "var(--deep-navy)", 
                              cursor: "pointer",
                              textDecoration: "underline",
                              fontSize: "0.88rem"
                            }}
                          >
                            {g.tracking_number}
                          </span>
                        </td>

                        {/* 2. Citizen */}
                        <td>
                          <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--deep-navy)" }}>
                            {g.citizen_name || "Citizen (App User)"}
                          </div>
                        </td>

                        {/* 3. Category */}
                        <td>
                          <div style={{ fontWeight: "600", fontSize: "0.84rem" }}>{g.category}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.description}
                          </div>
                        </td>

                        {/* 4. Department */}
                        <td>
                          <span className="dept-tag">
                            {g.department}
                          </span>
                        </td>

                        {/* 5. Location */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            <MapPin size={12} color="var(--primary-emerald)" />
                            <span style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {g.location_text || "Unspecified"}
                            </span>
                          </div>
                        </td>

                        {/* 6. Assigned Worker */}
                        <td>
                          {g.assigned_worker_name || g.officer_name ? (
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)" }}>
                                <UserCheck size={13} color="var(--primary-emerald)" />
                                <span>{g.assigned_worker_name || g.officer_name}</span>
                              </div>
                              {g.assigned_worker_phone && (
                                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", paddingLeft: "1.1rem" }}>
                                  {g.assigned_worker_phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "#DC2626", fontWeight: "600", backgroundColor: "#FEF2F2", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* 7. Priority */}
                        <td>
                          <span className={`badge ${getPriorityBadgeClass(g.priority)}`}>
                            {g.priority}
                          </span>
                        </td>

                        {/* 8. Status */}
                        <td>
                          <span className={`badge ${getStatusBadgeClass(g.status)}`}>
                            <span className="badge-dot"></span>
                            <span>{g.status}</span>
                          </span>
                          {isEscalated && (
                            <span className="badge badge-critical" style={{ marginTop: "0.2rem", display: "inline-block" }}>
                              ESCALATED
                            </span>
                          )}
                        </td>

                        {/* 9. 24h SLA Countdown */}
                        <td>
                          <SLACountdownBadge 
                            slaDeadline={g.sla_deadline} 
                            status={g.status} 
                            slaStatus={g.sla_status} 
                            compact={true} 
                          />
                        </td>

                        {/* 10. Date */}
                        <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {new Date(g.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </td>

                        {/* 11. Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                            {/* Assign / Reassign Button */}
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
                              onClick={() => handleOpenAssignModal(g)}
                              title={g.assigned_officer_id ? "Reassign Worker" : "Assign Worker"}
                            >
                              <UserPlus size={13} />
                              <span>{g.assigned_officer_id ? "Reassign" : "Assign"}</span>
                            </button>

                            {/* Mark Resolved Button */}
                            {!isResolved && g.status !== "REJECTED" && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
                                onClick={() => handleOpenResolveModal(g)}
                                title="Record Resolution"
                              >
                                <CheckCircle size={13} />
                                <span>Resolve</span>
                              </button>
                            )}

                            {/* Reject Button (if not resolved or rejected) */}
                            {!isResolved && g.status !== "REJECTED" && (
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: "0.3rem 0.55rem", fontSize: "0.78rem", color: "#DC2626", borderColor: "#FECACA" }}
                                onClick={() => handleOpenRejectModal(g)}
                                title="Reject Complaint"
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                            )}

                            {/* Reopen Button if resolved */}
                            {isResolved && (
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem", color: "#B45309", borderColor: "#FDE68A" }}
                                onClick={() => handleOpenReopenModal(g)}
                                title="Reopen Case"
                              >
                                <RotateCcw size={13} />
                              </button>
                            )}

                            {/* Detail Drawer Button */}
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "0.3rem 0.45rem" }}
                              onClick={() => handleOpenDetailModal(g)}
                              title="View Full Case History"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Showing {filteredGrievances.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(currentPage * pageSize, filteredGrievances.length)} of {filteredGrievances.length} grievances
            </div>

            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span style={{ fontSize: "0.85rem", fontWeight: "600", padding: "0 0.5rem" }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: OPERATIONS & CLUSTERED INCIDENTS */}
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
                        borderRadius: "10px"
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
                  <span>Active 24h SLA Breach Alerts</span>
                </h3>
                <span className="badge badge-critical">
                  <Flame size={11} /> Auto Escalated
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "380px", overflowY: "auto" }}>
                {grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED").length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-secondary)" }}>
                    <CheckCircle2 size={32} style={{ margin: "0 auto 0.75rem", color: "var(--primary-emerald)" }} />
                    <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--deep-navy)" }}>All Grievances Within 24h SLA Target</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Automated background monitor reports no overdue deadlines.
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          Worker: {g.assigned_worker_name || "Unassigned"}
                        </span>
                        <SLACountdownBadge slaDeadline={g.sla_deadline} status={g.status} slaStatus={g.sla_status} compact={true} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: GIS SPATIAL MAP */}
      {activeTab === "gis" && <GISMap />}

      {/* TAB: AI ADMIN ANALYST */}
      {activeTab === "ai" && <AIAdminAssistant />}

      {/* ============================================================ */}
      {/* MODAL 1: ASSIGN FIELD WORKER / OFFICIAL */}
      {/* ============================================================ */}
      {assignModalGrievance && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "560px", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--deep-navy)", fontWeight: "800", fontSize: "1.15rem" }}>
                <UserPlus size={20} color="var(--primary-emerald)" />
                <span>Assign Field Official / Worker</span>
              </div>
              <button onClick={() => setAssignModalGrievance(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Grievance Summary Card */}
            <div style={{ backgroundColor: "var(--bg-subtle)", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontFamily: "var(--font-heading)", color: "var(--deep-navy)" }}>
                  {assignModalGrievance.tracking_number}
                </strong>
                <span className="dept-tag">{assignModalGrievance.department}</span>
              </div>
              <div style={{ fontSize: "0.86rem", color: "var(--deep-navy)", fontWeight: "600", marginTop: "0.25rem" }}>
                {assignModalGrievance.category}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Locality: {assignModalGrievance.location_text || "General Jurisdiction"}
              </div>
            </div>

            <form onSubmit={handleAssignWorkerSubmit}>
              {/* Worker Selection with Workload Badges */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)" }}>
                    Select Field Officer for {assignModalGrievance.department} <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <span style={{ fontSize: "0.72rem", color: "var(--primary-emerald)", fontWeight: "700", background: "var(--status-success-bg)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                    Department-Filtered
                  </span>
                </div>

                {loadingWorkers ? (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
                    <RefreshCw className="spin" size={18} style={{ margin: "0 auto 0.4rem" }} />
                    <div style={{ fontSize: "0.82rem" }}>Fetching available departmental workers...</div>
                  </div>
                ) : availableWorkers.length === 0 ? (
                  <div style={{ padding: "0.85rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px", fontSize: "0.82rem", color: "#DC2626" }}>
                    No field officers currently registered for <strong>{assignModalGrievance.department}</strong>. Grievance remains safely unassigned until an official is configured.
                  </div>
                ) : (
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {availableWorkers.map((w) => {
                      const isSelected = selectedWorkerId === String(w.id);
                      return (
                        <div
                          key={w.id}
                          onClick={() => setSelectedWorkerId(String(w.id))}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.6rem 0.8rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            backgroundColor: isSelected ? "#ECFDF5" : "#FFFFFF",
                            border: `1.5px solid ${isSelected ? "#059669" : "var(--border-subtle)"}`,
                            transition: "all 0.15s"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span style={{ fontWeight: "700", fontSize: "0.86rem", color: isSelected ? "#065F46" : "var(--deep-navy)" }}>
                                {w.name}
                              </span>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>({w.role})</span>
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                              {w.department_name} • {w.zone || "Zone 1"} {w.phone && `• 📞 ${w.phone}`}
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span 
                              style={{ 
                                fontSize: "0.72rem", 
                                fontWeight: "700", 
                                padding: "0.2rem 0.5rem", 
                                borderRadius: "4px",
                                backgroundColor: w.active_cases > 3 ? "#FEF2F2" : w.active_cases > 0 ? "#FFFBEB" : "#ECFDF5",
                                color: w.active_cases > 3 ? "#DC2626" : w.active_cases > 0 ? "#D97706" : "#047857"
                              }}
                            >
                              {w.active_cases} Active {w.active_cases === 1 ? "Case" : "Cases"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assignment Instructions / Notes */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.4rem" }}>
                  Operational Instructions / Priorities
                </label>
                <textarea
                  rows={3}
                  className="chat-text-input"
                  placeholder="e.g. Inspect water valve at Sector 4, replace gasket within 24h SLA target..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem 0.8rem", resize: "vertical" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setAssignModalGrievance(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingAssign || !selectedWorkerId}
                >
                  <Send size={14} />
                  <span>{submittingAssign ? "Assigning..." : "Confirm Worker Assignment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: RESOLUTION DETAILS MODAL */}
      {/* ============================================================ */}
      {resolveModalGrievance && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "520px", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#065F46", fontWeight: "800", fontSize: "1.15rem" }}>
                <FileCheck2 size={20} color="#059669" />
                <span>Mark Grievance as Resolved</span>
              </div>
              <button onClick={() => setResolveModalGrievance(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
              Record mandatory completion details for ticket <strong>{resolveModalGrievance.tracking_number}</strong>. This will compute the resolution SLA duration and notify the citizen for verification.
            </p>

            <form onSubmit={handleResolveSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.35rem" }}>
                  Resolution Summary <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  className="chat-text-input"
                  placeholder="e.g. Main sewage line unblocked and sanitized"
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  style={{ width: "100%", fontSize: "0.86rem", padding: "0.6rem 0.8rem" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.35rem" }}>
                  Work Performed On-Site <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  className="chat-text-input"
                  placeholder="Describe tools deployed, pipes/valves replaced, flow tests conducted..."
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem 0.8rem", resize: "vertical" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.35rem" }}>
                  Administrative Completion Notes
                </label>
                <textarea
                  rows={2}
                  className="chat-text-input"
                  placeholder="Optional notes for supervisory audit..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem 0.8rem", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setResolveModalGrievance(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingResolve || !resolutionSummary.trim() || !workPerformed.trim()}
                >
                  <CheckCircle size={14} />
                  <span>{submittingResolve ? "Submitting..." : "Complete & Mark Resolved"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: REOPEN GRIEVANCE MODAL */}
      {/* ============================================================ */}
      {reopenModalGrievance && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "480px", padding: "1.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#B45309", fontWeight: "800", fontSize: "1.1rem" }}>
                <RotateCcw size={18} />
                <span>Reopen Grievance (Fresh 24h SLA)</span>
              </div>
              <button onClick={() => setReopenModalGrievance(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
              Reopening ticket <strong>{reopenModalGrievance.tracking_number}</strong> will reset its status to <strong>REOPENED</strong>, escalate the supervisory tier, and start a <strong>fresh 24-hour resolution cycle</strong>.
            </p>

            <form onSubmit={handleReopenSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.35rem" }}>
                  Reason for Reopening <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  className="chat-text-input"
                  placeholder="State reason why additional work or reinspection is required..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem 0.8rem", resize: "vertical" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setReopenModalGrievance(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: "#D97706", borderColor: "#B45309" }}
                  disabled={submittingReopen || !reopenReason.trim()}
                >
                  <span>{submittingReopen ? "Reopening..." : "Confirm Reopen & Reset SLA"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: FULL CASE DETAILS & AUDIT MODAL */}
      {/* ============================================================ */}
      {detailModalGrievance && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
              <div>
                <span className="ticket-id" style={{ fontSize: "1.15rem" }}>
                  {detailModalGrievance.tracking_number}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
                  <span className={`badge ${getStatusBadgeClass(detailModalGrievance.status)}`}>
                    <span className="badge-dot"></span>
                    <span>{detailModalGrievance.status}</span>
                  </span>
                  <span className={`badge ${getPriorityBadgeClass(detailModalGrievance.priority)}`}>
                    {detailModalGrievance.priority}
                  </span>
                  <span className="dept-tag">{detailModalGrievance.department}</span>
                </div>
              </div>

              <button onClick={() => setDetailModalGrievance(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={20} />
              </button>
            </div>

            {/* SLA Countdown Header */}
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700" }}>
                  24-Hour Resolution SLA Target
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--deep-navy)", marginTop: "0.15rem" }}>
                  {detailModalGrievance.sla_deadline ? new Date(detailModalGrievance.sla_deadline).toLocaleString() : "24h from submission"}
                </div>
              </div>
              <SLACountdownBadge slaDeadline={detailModalGrievance.sla_deadline} status={detailModalGrievance.status} slaStatus={detailModalGrievance.sla_status} />
            </div>

            {/* Citizen Description */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700", marginBottom: "0.25rem" }}>
                Citizen Description
              </div>
              <div style={{ backgroundColor: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "8px", fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
                {detailModalGrievance.description}
              </div>
            </div>

            {/* Assignment & Worker Info */}
            <div style={{ marginBottom: "1rem", padding: "0.85rem", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#166534", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <UserCheck size={16} />
                <span>Assigned Field Official</span>
              </div>
              <div style={{ marginTop: "0.35rem", fontSize: "0.9rem", fontWeight: "700", color: "var(--deep-navy)" }}>
                {detailModalGrievance.assigned_worker_name || detailModalGrievance.officer_name || "Unassigned"}
              </div>
              {detailModalGrievance.assigned_worker_phone && (
                <div style={{ fontSize: "0.8rem", color: "#15803D", marginTop: "0.15rem" }}>
                  Phone: {detailModalGrievance.assigned_worker_phone}
                </div>
              )}
              {detailModalGrievance.assignment_notes && (
                <div style={{ fontSize: "0.8rem", color: "#374151", marginTop: "0.35rem", fontStyle: "italic" }}>
                  Notes: "{detailModalGrievance.assignment_notes}"
                </div>
              )}
            </div>

            {/* Resolution Report if exists */}
            {["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(detailModalGrievance.status) && (
              <div style={{ marginBottom: "1rem", padding: "0.85rem", backgroundColor: "#EFF6FF", borderRadius: "8px", border: "1px solid #BFDBFE" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: "700", color: "#1E40AF", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <FileCheck2 size={16} />
                  <span>Resolution Details</span>
                </div>
                <div style={{ marginTop: "0.35rem", fontSize: "0.85rem", color: "#1E3A8A" }}>
                  <strong>Summary: </strong>{detailModalGrievance.resolution_summary || detailModalGrievance.resolution_notes || "Field resolved"}
                </div>
                {detailModalGrievance.work_performed && (
                  <div style={{ marginTop: "0.3rem", fontSize: "0.83rem", color: "#1E3A8A" }}>
                    <strong>Work: </strong>{detailModalGrievance.work_performed}
                  </div>
                )}
                {detailModalGrievance.resolved_at && (
                  <div style={{ marginTop: "0.35rem", fontSize: "0.78rem", color: "#64748B" }}>
                    Resolved at: {new Date(detailModalGrievance.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Audit History Timeline */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "700", marginBottom: "0.5rem" }}>
                Lifecycle Audit Trail ({detailHistory.length} Events)
              </div>
              <GrievanceTimeline history={detailHistory} />
            </div>

            {/* Executive Authority Actions Toolbar (Admin Powers) */}
            <div style={{ paddingTop: "1.25rem", borderTop: "2px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--deep-navy)", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ShieldAlert size={16} color="var(--primary-emerald)" />
                  <span>Executive Administrative Actions</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Current Status: <strong style={{ color: "var(--deep-navy)" }}>{detailModalGrievance.status}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                {/* 1. Assign / Reassign Field Official */}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    handleOpenAssignModal(detailModalGrievance);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", fontWeight: "700" }}
                >
                  <UserPlus size={15} />
                  <span>{detailModalGrievance.assigned_officer_id ? "Reassign Field Worker" : "Assign Field Worker"}</span>
                </button>

                {/* 2. Resolve Complaint Button */}
                {!["RESOLVED", "CITIZEN_VERIFIED", "CLOSED", "REJECTED"].includes(detailModalGrievance.status) && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      handleOpenResolveModal(detailModalGrievance);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#059669", padding: "0.5rem 1rem", fontWeight: "700" }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Resolve Complaint</span>
                  </button>
                )}

                {/* 3. Reject Complaint Button (Admin Executive Power) */}
                {!["REJECTED", "CLOSED"].includes(detailModalGrievance.status) && (
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      handleOpenRejectModal(detailModalGrievance);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#DC2626", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "0.5rem 1rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)" }}
                  >
                    <XCircle size={15} />
                    <span>Reject Complaint</span>
                  </button>
                )}

                {/* 4. Reopen Case Button (if resolved or rejected) */}
                {["RESOLVED", "CITIZEN_VERIFIED", "CLOSED", "REJECTED"].includes(detailModalGrievance.status) && (
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      handleOpenReopenModal(detailModalGrievance);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#D97706", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "0.5rem 1rem", fontWeight: "700", cursor: "pointer" }}
                  >
                    <RotateCcw size={15} />
                    <span>Reopen / Restart 24h SLA</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Grievance */}
      {rejectModalGrievance && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "540px", padding: "1.75rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#991B1B", margin: 0 }}>
                    Reject Grievance
                  </h3>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Tracking: <strong>{rejectModalGrievance.tracking_number}</strong> • {rejectModalGrievance.department}
                  </div>
                </div>
              </div>
              <button onClick={() => setRejectModalGrievance(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.4rem" }}>
                  Select Preset Rejection Reason:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {[
                    "Invalid or incomplete complaint details",
                    "Outside municipal corporation jurisdiction",
                    "Duplicate grievance already being handled",
                    "Private property dispute / not a public civic issue",
                    "False or fraudulent report"
                  ].map((preset) => (
                    <label key={preset} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.83rem", color: "#374151", cursor: "pointer", padding: "0.45rem 0.75rem", borderRadius: "6px", backgroundColor: rejectReason === preset ? "#FEE2E2" : "#F9FAFB", border: `1px solid ${rejectReason === preset ? "#FCA5A5" : "#E5E7EB"}`, transition: "all 0.15s ease" }}>
                      <input
                        type="radio"
                        name="preset_reason"
                        checked={rejectReason === preset}
                        onChange={() => setRejectReason(preset)}
                      />
                      <span>{preset}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--deep-navy)", marginBottom: "0.3rem" }}>
                  Official Reason & Notes to Citizen *
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explain why this grievance is being rejected. This notice will be visible to the citizen..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRejectModalGrievance(null)}
                  disabled={submittingReject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{ backgroundColor: "#DC2626", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "0.5rem 1.25rem", fontWeight: "700", cursor: "pointer" }}
                  disabled={submittingReject}
                >
                  {submittingReject ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
