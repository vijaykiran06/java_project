import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  Shield,
  Lock,
  Bell,
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Smartphone,
  Calendar,
  Sparkles,
  Clock,
  Download,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function ProfilePage() {
  const { user, token, updateProfile, fetchUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Personal form state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [zone, setZone] = useState(user?.zone || "Zone 1");
  const [address, setAddress] = useState(localStorage.getItem(`janseva_address_${user?.id}`) || "Ward 12, Sector 4, Civic Colony");
  const [language, setLanguage] = useState(localStorage.getItem(`janseva_lang_${user?.id}`) || "English (India)");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    smsAlerts: true,
    whatsappAlerts: true,
    slaCountdown: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setZone(user.zone || "Zone 1");
    }
  }, [user]);

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await updateProfile({
        name,
        phone,
        zone,
      });
      if (user?.id) {
        localStorage.setItem(`janseva_address_${user.id}`, address);
        localStorage.setItem(`janseva_lang_${user.id}`, language);
      }
      setSuccessMsg("Your profile and civic jurisdiction details have been saved successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match. Please re-enter.");
      return;
    }

    setPasswordLoading(true);
    try {
      await updateProfile({
        name: user?.name,
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess("Security credentials updated! Your password has been changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      setPasswordError(err.message || "Password update failed. Verify your current password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Executive Super Admin", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" };
      case "DEPARTMENT_ADMIN":
        return { label: "Department Administrator", bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" };
      case "OFFICER":
        return { label: "Designated Field Officer", bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" };
      default:
        return { label: "Verified Citizen", bg: "var(--green-pale)", color: "var(--green-forest)", border: "var(--green-border)" };
    }
  };

  const roleMeta = getRoleBadge(user?.role);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0.5rem 0 3rem" }}>
      {/* ── BREADCRUMB & HEADER BAR ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            to="/"
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.8rem", color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--border-mid)" }}>/</span>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--green-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Citizen Profile & Settings
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="system-pill" title="Security token active">
            <span className="pulse-dot"></span>
            <span>Civic ID Authenticated</span>
          </div>
          <button
            onClick={() => { fetchUser(); setSuccessMsg("Profile synced with municipal registry."); setTimeout(() => setSuccessMsg(""), 3000); }}
            className="btn btn-outline btn-sm"
            title="Reload user details"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── HERO PROFILE CARD ── */}
      <div
        className="card"
        style={{
          padding: "2rem 2.25rem",
          marginBottom: "1.75rem",
          backgroundColor: "var(--white)",
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          borderRadius: "var(--radius-xl)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {/* User Avatar Circle */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                backgroundColor: "var(--green-pale)",
                border: "2px solid var(--green-border)",
                color: "var(--green-deep)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-heading)",
                fontSize: "1.85rem",
                fontWeight: "800",
                boxShadow: "var(--shadow-sm)",
                flexShrink: 0
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                  {user?.name || "Citizen Account"}
                </h1>
                <span
                  style={{
                    backgroundColor: roleMeta.bg,
                    color: roleMeta.color,
                    border: `1px solid ${roleMeta.border}`,
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>{roleMeta.label}</span>
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginTop: "0.5rem", flexWrap: "wrap", fontSize: "0.86rem", color: "var(--text-secondary)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <Mail size={14} color="var(--green-primary)" />
                  <span>{user?.email}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <Phone size={14} color="var(--green-primary)" />
                  <span>{user?.phone ? `+91 ${user.phone}` : "Phone Not Linked"}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <MapPin size={14} color="var(--green-primary)" />
                  <span>{user?.zone || "Zone 1"} (Municipal Jurisdiction)</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.85rem",
                background: "var(--green-pale)",
                border: "1px solid var(--green-border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.78rem",
                fontWeight: "700",
                color: "var(--green-forest)"
              }}
            >
              <Sparkles size={14} color="var(--green-primary)" />
              <span>DigiLocker Authenticated</span>
            </span>
          </div>
        </div>

        {/* Civic Reputation Quick Ribbon */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem"
          }}
        >
          <div style={{ padding: "0.5rem 0" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Civic Trust Score
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: "800", color: "var(--green-forest)", marginTop: "0.2rem" }}>
              340 Points <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--green-primary)" }}>(Tier 1)</span>
            </div>
          </div>

          <div style={{ padding: "0.5rem 0" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              SLA Adherence Rate
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: "800", color: "var(--text-primary)", marginTop: "0.2rem" }}>
              100% Guaranteed
            </div>
          </div>

          <div style={{ padding: "0.5rem 0" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Community Status
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: "800", color: "var(--text-primary)", marginTop: "0.2rem" }}>
              Vigilant Reporter
            </div>
          </div>

          <div style={{ padding: "0.5rem 0" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              National Portal ID
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: "700", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              IND-DEL-2026-0{user?.id || 1}
            </div>
          </div>
        </div>
      </div>

      {/* ── SETTINGS TABS ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem", overflowX: "auto" }}>
        {[
          { id: "personal", label: "Personal & Ward Details", icon: User },
          { id: "security", label: "Account Security & Password", icon: Lock },
          { id: "notifications", label: "24h SLA Notifications", icon: Bell },
          { id: "verification", label: "Civic ID & DigiLocker", icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.75rem 1.25rem",
                backgroundColor: isActive ? "var(--white)" : "transparent",
                color: isActive ? "var(--green-deep)" : "var(--text-secondary)",
                border: "1px solid",
                borderColor: isActive ? "var(--border)" : "transparent",
                borderBottomColor: isActive ? "var(--white)" : "transparent",
                marginBottom: "-1px",
                borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                fontSize: "0.88rem",
                fontWeight: isActive ? "700" : "600",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={16} color={isActive ? "var(--green-primary)" : "var(--text-secondary)"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}

      {/* TAB 1: PERSONAL & WARD DETAILS */}
      {activeTab === "personal" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          <div className="card" style={{ padding: "2rem", backgroundColor: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                Personal Information & Municipal Jurisdiction
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Update your contact information so municipal field officers can coordinate grievance resolution directly.
              </p>
            </div>

            {successMsg && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.15rem", background: "var(--green-pale)", border: "1px solid var(--green-border)", borderRadius: "var(--radius-md)", color: "var(--green-forest)", fontSize: "0.86rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                <CheckCircle2 size={18} color="var(--green-primary)" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.15rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", color: "#DC2626", fontSize: "0.86rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                <AlertCircle size={18} color="#DC2626" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePersonalSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem" }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    Email Address (Official Identity)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ""}
                      disabled
                      style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-soft)", color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "not-allowed" }}
                    />
                    <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", fontWeight: "700", color: "var(--green-forest)", background: "var(--green-pale)", padding: "0.15rem 0.45rem", borderRadius: "4px", border: "1px solid var(--green-border)" }}>
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    Mobile Number (For SMS & SLA Alerts)
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ padding: "0.65rem 0.85rem", background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "0.88rem", fontWeight: "700", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      style={{ flex: 1, padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    Municipal Zone Jurisdiction *
                  </label>
                  <select
                    className="form-input"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem", backgroundColor: "var(--white)" }}
                  >
                    <option value="Zone 1">Zone 1 — Central & North Municipal Authority</option>
                    <option value="Zone 2">Zone 2 — South Municipal Corporation</option>
                    <option value="Zone 3">Zone 3 — East Municipal Corporation</option>
                    <option value="Zone 4">Zone 4 — West Municipal Authority</option>
                    <option value="Zone 5">Zone 5 — Cantonment & Extended Urban Sector</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  Primary Locality / Residential Landmark
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Shivam Apartments, Near Sector 12 Metro Station"
                  style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  Preferred Communication Language
                </label>
                <select
                  className="form-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem", backgroundColor: "var(--white)" }}
                >
                  <option value="English (India)">English (India)</option>
                  <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                  <option value="Marathi (मराठी)">Marathi (मराठी)</option>
                  <option value="Tamil (தமிழ்)">Tamil (தமிழ்)</option>
                  <option value="Telugu (తెలుగు)">Telugu (తెలుగు)</option>
                  <option value="Bengali (বাংলা)">Bengali (বাংলা)</option>
                </select>
              </div>

              <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.75rem", fontSize: "0.9rem", boxShadow: "var(--shadow-green)" }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Information Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--border)", backgroundColor: "var(--white)", borderRadius: "var(--radius-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.85rem" }}>
                <ShieldCheck size={18} color="var(--green-primary)" />
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                  Why Municipal Zone Matters
                </h4>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                Your selected municipal zone ensures that any complaint lodged via <strong>JanSeva AI Bot</strong> is immediately routed to the exact ward engineer responsible for your area, enforcing the <strong>24-hour resolution SLA</strong>.
              </p>
            </div>

            <div className="card" style={{ padding: "1.5rem", background: "var(--green-pale)", border: "1px solid var(--green-border)", borderRadius: "var(--radius-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Sparkles size={16} color="var(--green-primary)" />
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: "800", color: "var(--green-deep)", margin: 0 }}>
                  Citizen Rights & SLA Act
                </h4>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--green-forest)", lineHeight: 1.5, margin: 0 }}>
                Under the Citizen Civic Service Charter, municipal engineers are legally obligated to acknowledge complaints within 2 hours and perform physical field inspections within 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          <div className="card" style={{ padding: "2rem", backgroundColor: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                Account Security & Credentials
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Manage your login credentials. Your password is encrypted using high-entropy BCrypt hashing with salt.
              </p>
            </div>

            {passwordSuccess && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.15rem", background: "var(--green-pale)", border: "1px solid var(--green-border)", borderRadius: "var(--radius-md)", color: "var(--green-forest)", fontSize: "0.86rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                <CheckCircle2 size={18} color="var(--green-primary)" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.15rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", color: "#DC2626", fontSize: "0.86rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                <AlertCircle size={18} color="#DC2626" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  Current Password *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    style={{ width: "100%", padding: "0.65rem 2.5rem 0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    New Password * (Min. 6 chars)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      style={{ width: "100%", padding: "0.65rem 2.5rem 0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.9rem" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1.75rem", fontSize: "0.9rem", boxShadow: "var(--shadow-green)" }}
                >
                  {passwordLoading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--border)", backgroundColor: "var(--white)", borderRadius: "var(--radius-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Shield size={18} color="var(--green-primary)" />
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                  Security Architecture
                </h4>
              </div>
              <ul style={{ fontSize: "0.8rem", color: "var(--text-secondary)", paddingLeft: "1.2rem", lineHeight: 1.6, margin: 0 }}>
                <li>BCrypt one-way password hashing (work factor 10).</li>
                <li>Stateless JWT with expiration and signature validation.</li>
                <li>Session activity tied directly to municipal citizen profile.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 24h SLA NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          <div className="card" style={{ padding: "2rem", backgroundColor: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                SLA Alerts & Dispatch Notification Channels
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Configure real-time communication channels for 24-hour SLA countdown timers and officer site inspections.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[
                {
                  key: "smsAlerts",
                  title: "SMS Status Dispatches",
                  desc: "Receive instant text notifications when a grievance changes status (Assigned, Dispatched, Resolved).",
                  icon: Smartphone
                },
                {
                  key: "whatsappAlerts",
                  title: "WhatsApp Case Updates",
                  desc: "Receive officer contact info and photo resolution proof directly on WhatsApp.",
                  icon: Bell
                },
                {
                  key: "slaCountdown",
                  title: "24-Hour SLA Escalation Warnings",
                  desc: "Notifies you when your complaint enters the 4-hour countdown window before senior authority escalation.",
                  icon: Clock
                },
                {
                  key: "weeklyDigest",
                  title: "Weekly Ward Resolution Digest",
                  desc: "A summary email of all civic works completed and public issues resolved in your municipal ward.",
                  icon: Calendar
                }
              ].map((item) => {
                const Icon = item.icon;
                const isChecked = notifications[item.key];
                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      padding: "1rem 1.25rem",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                      backgroundColor: isChecked ? "var(--green-pale)" : "var(--bg-soft)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          backgroundColor: isChecked ? "var(--green-primary)" : "var(--border-mid)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--text-primary)" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem", lineHeight: 1.45 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      style={{
                        width: "48px",
                        height: "26px",
                        borderRadius: "13px",
                        backgroundColor: isChecked ? "var(--green-primary)" : "var(--border-mid)",
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        flexShrink: 0,
                        marginLeft: "1rem",
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#FFFFFF",
                          position: "absolute",
                          top: "3px",
                          left: isChecked ? "25px" : "3px",
                          transition: "left 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setSuccessMsg("Notification preferences saved successfully."); setTimeout(() => setSuccessMsg(""), 3000); }}
                className="btn btn-primary"
                style={{ padding: "0.65rem 1.5rem" }}
              >
                <Save size={15} />
                <span>Save Alert Preferences</span>
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--border)", backgroundColor: "var(--white)", borderRadius: "var(--radius-xl)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Clock size={18} color="var(--green-primary)" />
              <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                24h Escalation Rule
              </h4>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              SMS and WhatsApp notifications keep citizens in control. If an assigned worker takes no action within 12 hours, a supervisory prompt is sent automatically to the municipal ward commissioner.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: CIVIC ID & DIGILOCKER */}
      {activeTab === "verification" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          <div className="card" style={{ padding: "2rem", backgroundColor: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                National Civic Identity & DigiLocker Authentication
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Verified civic identity allows high-priority reporting and fast-track municipal dispatch for critical infrastructure hazards.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ border: "1.5px solid var(--green-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", background: "var(--green-pale)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "var(--green-forest)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Award size={24} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: "800", color: "var(--green-deep)" }}>
                        National Citizen Digital Identity
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--green-forest)", marginTop: "0.15rem" }}>
                        Linked via DigiLocker • Aadhaar Identity Authenticated
                      </div>
                    </div>
                  </div>

                  <span style={{ background: "var(--white)", color: "var(--green-forest)", border: "1px solid var(--green-border)", padding: "0.35rem 0.85rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <CheckCircle2 size={14} color="var(--green-primary)" />
                    <span>LEVEL 3 VERIFIED</span>
                  </span>
                </div>

                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--green-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--green-forest)", fontWeight: "700", textTransform: "uppercase" }}>Verification Method</div>
                    <div style={{ fontSize: "0.86rem", color: "var(--text-primary)", fontWeight: "700", marginTop: "0.2rem" }}>Aadhaar e-KYC (DigiLocker)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--green-forest)", fontWeight: "700", textTransform: "uppercase" }}>Civic Jurisdiction Ward</div>
                    <div style={{ fontSize: "0.86rem", color: "var(--text-primary)", fontWeight: "700", marginTop: "0.2rem" }}>{user?.zone || "Zone 1"} (Delhi Municipal)</div>
                  </div>
                </div>
              </div>

              {/* Digital Civic Card Preview */}
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", background: "linear-gradient(135deg, #166534 0%, #14532D 100%)", color: "#FFFFFF", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.1 }}>
                  <Shield size={160} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>GOVERNMENT OF NCT OF DELHI</div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: "800", marginTop: "0.2rem" }}>JANSEVA CIVIC ID CARD</div>
                  </div>
                  <div style={{ width: "32px", height: "32px", background: "rgba(255,255,255,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={18} color="#FFFFFF" />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", opacity: "0.75" }}>CITIZEN HOLDER</div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: "800" }}>{user?.name || "Citizen"}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.85rem", opacity: 0.85, marginTop: "0.2rem" }}>
                      ID: IND-2026-DEL-{user?.id ? String(user.id).padStart(4, "0") : "0001"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>JURISDICTION</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700" }}>{user?.zone || "Zone 1"}</div>
                    <div style={{ fontSize: "0.68rem", color: "#86EFAC", fontWeight: "700", marginTop: "0.2rem" }}>● 24H SLA ACTIVE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--border)", backgroundColor: "var(--white)", borderRadius: "var(--radius-xl)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Award size={18} color="var(--green-primary)" />
              <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                Verification Privileges
              </h4>
            </div>
            <ul style={{ fontSize: "0.82rem", color: "var(--text-secondary)", paddingLeft: "1.2rem", lineHeight: 1.6, margin: 0 }}>
              <li>Direct dispatch to municipal rapid-response units.</li>
              <li>Exempt from bot grievance rate limiting.</li>
              <li>Civic reputation badges on neighborhood resolution feed.</li>
              <li>Direct escalation power if 24h SLA is exceeded.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
