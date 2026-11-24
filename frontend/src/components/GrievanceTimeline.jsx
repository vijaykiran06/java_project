import React from "react";
import { CheckCircle2, Clock, AlertTriangle, UserCheck } from "lucide-react";

export default function GrievanceTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", padding: "1rem 0", textAlign: "center" }}>
        No lifecycle audit events recorded yet.
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED":
      case "CITIZEN_VERIFIED":
      case "CLOSED":
        return { dot: "#059669", bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" };
      case "ESCALATED":
      case "REOPENED":
        return { dot: "#DC2626", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" };
      case "IN_PROGRESS":
      case "ACKNOWLEDGED":
        return { dot: "#D97706", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" };
      default:
        return { dot: "#2563EB", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", paddingLeft: "1.75rem", marginTop: "0.5rem" }}>
      {/* Vertical line connecting events */}
      <div
        style={{
          position: "absolute",
          left: "9px",
          top: "8px",
          bottom: "8px",
          width: "2px",
          backgroundColor: "var(--border-color)",
        }}
      />

      {history.map((event, idx) => {
        const theme = getStatusColor(event.new_status);
        return (
          <div key={idx} style={{ position: "relative" }}>
            {/* Bullet node */}
            <div
              style={{
                position: "absolute",
                left: "-1.75rem",
                top: "2px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor: theme.dot,
                border: "3px solid #FFFFFF",
                boxShadow: "0 1px 3px rgba(20, 43, 69, 0.15)",
              }}
            />

            <div style={{ fontSize: "0.88rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span 
                  style={{ 
                    padding: "0.2rem 0.55rem", 
                    fontSize: "0.72rem", 
                    fontWeight: "700",
                    borderRadius: "6px",
                    backgroundColor: theme.bg,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    letterSpacing: "0.04em"
                  }}
                >
                  {event.new_status}
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "500" }}>
                  {new Date(event.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <div style={{ color: "var(--deep-navy)", marginTop: "0.35rem", fontWeight: "600", lineHeight: "1.4" }}>
                {event.notes || `Status transitioned to ${event.new_status}`}
              </div>

              {event.changed_by_name && (
                <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <UserCheck size={12} />
                  <span>Authorized by: <strong>{event.changed_by_name}</strong></span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
