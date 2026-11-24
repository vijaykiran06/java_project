import React, { useState } from "react";
import { CheckCircle2, Edit3, MapPin, Building2, AlertTriangle, FileText, Send, X, Check } from "lucide-react";

export default function GrievancePreviewCard({ data, onSubmit, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...data });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "CRITICAL": return { text: "Critical", bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" };
      case "HIGH": return { text: "High", bg: "#FFF1F2", color: "#E11D48", border: "#FECDD3" };
      case "MEDIUM": return { text: "Medium", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" };
      default: return { text: "Low", bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" };
    }
  };

  const pBadge = getPriorityBadge(editedData.priority || "MEDIUM");

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit(editedData);
  };

  return (
    <div 
      style={{
        backgroundColor: "#FFFFFF",
        border: "1.5px solid var(--primary-emerald)",
        borderRadius: "14px",
        padding: "1.5rem",
        marginTop: "1rem",
        boxShadow: "0 4px 16px rgba(5, 150, 105, 0.12)",
        animation: "messageIn 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "var(--status-success-bg)", color: "var(--primary-emerald)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={16} />
          </div>
          <h3 style={{ fontSize: "1.05rem", color: "var(--deep-navy)", fontWeight: "700" }}>
            AI-Extracted Grievance Summary
          </h3>
        </div>
        
        <span 
          style={{ 
            padding: "0.25rem 0.65rem", 
            borderRadius: "6px", 
            fontSize: "0.75rem", 
            fontWeight: "700", 
            backgroundColor: pBadge.bg, 
            color: pBadge.color, 
            border: `1px solid ${pBadge.border}`,
            textTransform: "uppercase",
            letterSpacing: "0.04em"
          }}
        >
          {editedData.priority} Priority
        </span>
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.1rem", lineHeight: "1.45" }}>
        Our local machine learning model classified your complaint into the verified municipal category below. Please review or adjust details before filing officially:
      </p>

      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", backgroundColor: "var(--bg-subtle)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <div>
            <label style={{ fontSize: "0.74rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
              Location / Landmark
            </label>
            <input
              type="text"
              className="chat-text-input"
              style={{ width: "100%", marginTop: "0.3rem", padding: "0.55rem 0.85rem" }}
              value={editedData.location_text || ""}
              onChange={(e) => setEditedData({ ...editedData, location_text: e.target.value })}
              placeholder="e.g. Near Community Center, Block B, Main Road"
            />
          </div>
          <div>
            <label style={{ fontSize: "0.74rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
              Complaint Description
            </label>
            <textarea
              className="chat-text-input"
              style={{ width: "100%", height: "85px", marginTop: "0.3rem", padding: "0.55rem 0.85rem", fontFamily: "inherit", resize: "vertical" }}
              value={editedData.description || ""}
              onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(false)}>
              <X size={14} /> Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
              <Check size={14} /> Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
              gap: "0.85rem", 
              marginBottom: "1rem", 
              backgroundColor: "var(--bg-main)", 
              padding: "1rem", 
              borderRadius: "10px", 
              border: "1px solid var(--border-color)" 
            }}
          >
            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                Civic Category
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--deep-navy)", marginTop: "0.2rem" }}>
                {editedData.category}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                Specific Issue
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.2rem" }}>
                {editedData.subcategory || "General Complaint"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Building2 size={12} color="var(--primary-emerald)" /> Designated Department
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--primary-emerald)", marginTop: "0.2rem" }}>
                {editedData.department}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <MapPin size={12} color="var(--primary-emerald)" /> Location
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.2rem" }}>
                {editedData.location_text || "To be captured from GPS"}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-subtle)", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
              <FileText size={12} /> Complaint Summary Description
            </div>
            <div style={{ fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
              {editedData.description}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
              <Edit3 size={15} />
              <span>Edit Details</span>
            </button>
            <button className="btn btn-primary" onClick={() => onSubmit(editedData)}>
              <Send size={15} />
              <span>Confirm & Submit Grievance</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
