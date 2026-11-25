import React, { useState } from "react";
import { CheckCircle2, Edit3, MapPin, Building2, AlertTriangle, FileText, Send, X, Check, ShieldCheck } from "lucide-react";

export default function GrievancePreviewCard({ data, onSubmit, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...data });

  const getPriorityBadgeClass = (priority) => {
    switch ((priority || "").toUpperCase()) {
      case "CRITICAL": return "badge-critical";
      case "HIGH": return "badge-high";
      case "MEDIUM": return "badge-medium";
      default: return "badge-low";
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit(editedData);
  };

  return (
    <div 
      className="card"
      style={{
        backgroundColor: "var(--white)",
        border: "2px solid var(--green-border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.75rem",
        marginTop: "1.25rem",
        boxShadow: "var(--shadow-md)",
        animation: "messageIn 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "var(--green-pale)", color: "var(--green-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={18} />
          </div>
          <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: "800", fontFamily: "var(--font-heading)" }}>
            AI-Extracted Grievance Summary
          </h3>
        </div>
        
        <span className={`badge ${getPriorityBadgeClass(editedData.priority)}`}>
          {editedData.priority || "MEDIUM"} Priority
        </span>
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
        Our local machine learning model classified your complaint into the verified municipal category below. Please review or adjust details before filing officially:
      </p>

      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-soft)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <div>
            <label className="form-label">
              <MapPin size={13} color="var(--green-primary)" />
              Location / Landmark
            </label>
            <input
              type="text"
              className="chat-text-input"
              value={editedData.location_text || ""}
              onChange={(e) => setEditedData({ ...editedData, location_text: e.target.value })}
              placeholder="e.g. Near Community Center, Block B, Main Road"
            />
          </div>
          <div>
            <label className="form-label">
              <FileText size={13} color="var(--green-primary)" />
              Complaint Description
            </label>
            <textarea
              className="chat-text-input"
              style={{ width: "100%", height: "90px", resize: "vertical" }}
              value={editedData.description || ""}
              onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
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
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", 
              gap: "1rem", 
              marginBottom: "1.25rem", 
              backgroundColor: "var(--bg-soft)", 
              padding: "1.25rem", 
              borderRadius: "var(--radius-lg)", 
              border: "1px solid var(--border)" 
            }}
          >
            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                Civic Category
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)", marginTop: "0.25rem" }}>
                {editedData.category}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                Specific Issue
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.25rem" }}>
                {editedData.subcategory || "General Complaint"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Building2 size={12} color="var(--green-primary)" /> Designated Department
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--green-forest)", marginTop: "0.25rem" }}>
                {editedData.department}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <MapPin size={12} color="var(--green-primary)" /> Location / Area
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.25rem" }}>
                {editedData.location_text || "To be captured from GPS"}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--white)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.35rem" }}>
              <FileText size={13} color="var(--green-primary)" /> Complaint Summary Description
            </div>
            <div style={{ fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: "1.55" }}>
              {editedData.description}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
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
