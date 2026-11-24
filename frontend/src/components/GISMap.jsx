import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { MapPin, Building2, AlertTriangle, Layers, Navigation, X, Shield } from "lucide-react";

export default function GISMap() {
  const { token } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);

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
        setGrievances((data.grievances || []).filter((g) => g.latitude && g.longitude));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getPinColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "#DC2626";
      case "HIGH": return "#E11D48";
      case "MEDIUM": return "#D97706";
      default: return "#059669";
    }
  };

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      {/* Map Header & Legend */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--deep-navy)", fontSize: "1.2rem" }}>
            <Layers size={20} color="var(--primary-emerald)" />
            <span>GIS Spatial Grievance Clustering & Heatmap</span>
          </h3>
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            📍 {grievances.length} Geocoded Incident Coordinates Active across Municipal Zones
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", fontSize: "0.76rem", fontWeight: "600", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#DC2626" }}></span>
            <span>Critical</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#E11D48" }}></span>
            <span>High</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#D97706" }}></span>
            <span>Medium</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#059669" }}></span>
            <span>Low</span>
          </span>
        </div>
      </div>

      {/* Spatial Map Canvas Container */}
      <div
        style={{
          height: "460px",
          background: "linear-gradient(135deg, #091322 0%, #142844 50%, #0F2038 100%)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.4)",
        }}
      >
        {/* Subtle Map Grid Coordinate Lines Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.22) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "28px 28px, 56px 56px, 56px 56px",
          }}
        />

        {/* Map Coordinates Watermark */}
        <div style={{ position: "absolute", top: "1rem", left: "1rem", color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontFamily: "monospace", pointerEvents: "none" }}>
          SYS-GRID: 28.6139° N, 77.2090° E • MUNICIPAL ZONE COVERAGE
        </div>

        {/* Render Map Markers */}
        {grievances.map((g) => {
          // Normalize lat/lng relative position on map canvas
          const topPercent = Math.min(85, Math.max(15, ((28.75 - g.latitude) / 0.3) * 100));
          const leftPercent = Math.min(85, Math.max(15, ((g.longitude - 77.05) / 0.3) * 100));
          const pinColor = getPinColor(g.priority);
          const isSelected = selectedPin?.id === g.id;

          return (
            <div
              key={g.id}
              style={{
                position: "absolute",
                top: `${topPercent}%`,
                left: `${leftPercent}%`,
                cursor: "pointer",
                transform: "translate(-50%, -50%)",
                zIndex: isSelected ? 30 : 10,
                transition: "all var(--transition-fast)"
              }}
              onClick={() => setSelectedPin(g)}
              title={`${g.tracking_number}: ${g.category}`}
            >
              <div
                style={{
                  width: isSelected ? "34px" : "28px",
                  height: isSelected ? "34px" : "28px",
                  borderRadius: "50%",
                  backgroundColor: pinColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: isSelected 
                    ? `0 0 0 4px rgba(255,255,255,0.4), 0 0 20px ${pinColor}`
                    : `0 0 10px ${pinColor}`,
                  border: "2px solid #FFFFFF",
                  transition: "all var(--transition-fast)"
                }}
              >
                <MapPin size={isSelected ? 18 : 14} />
              </div>
            </div>
          );
        })}

        {/* Selected Marker Popup Panel */}
        {selectedPin && (
          <div
            style={{
              position: "absolute",
              bottom: "1.25rem",
              right: "1.25rem",
              width: "340px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.25rem",
              zIndex: 40,
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              animation: "messageIn 200ms ease forwards"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: "800", color: "var(--deep-navy)", fontSize: "0.95rem" }}>
                  {selectedPin.tracking_number}
                </span>
                <div style={{ marginTop: "0.2rem" }}>
                  <span className={`badge badge-${(selectedPin.priority || 'medium').toLowerCase()}`}>
                    {selectedPin.priority}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPin(null)}
                className="btn btn-outline btn-sm"
                style={{ padding: "0.25rem", borderRadius: "50%" }}
              >
                <X size={15} />
              </button>
            </div>

            <h4 style={{ fontSize: "1rem", color: "var(--deep-navy)", marginTop: "0.5rem", marginBottom: "0.25rem" }}>
              {selectedPin.category}
            </h4>
            <div style={{ fontSize: "0.82rem", color: "var(--primary-emerald)", fontWeight: "600" }}>
              {selectedPin.department}
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.5rem 0", lineHeight: "1.4" }}>
              {selectedPin.description}
            </p>

            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <MapPin size={12} color="var(--primary-emerald)" />
              <span>{selectedPin.location_text || "Geocoded Point"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
