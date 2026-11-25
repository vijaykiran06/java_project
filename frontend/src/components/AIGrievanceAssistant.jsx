import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import GrievancePreviewCard from "./GrievancePreviewCard";
import FormattedMessage from "./FormattedMessage";
import { 
  Bot, 
  Send, 
  MapPin, 
  CheckCircle, 
  Mic, 
  MicOff, 
  RefreshCw, 
  Sparkles, 
  Cpu, 
  Building2, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Globe,
  Radio,
  PlusCircle,
  Eye,
  LayoutDashboard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Navigation
} from "lucide-react";

export default function AIGrievanceAssistant() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Namaste! 👋 I am the JanSeva Civic AI Assistant powered by on-device Machine Learning. Tell me about any civic issue you are facing in your locality (e.g. water supply, roads, garbage, streetlight, or illegal parking), and I will route it directly to the designated department.",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [conversationState, setConversationState] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [createdGrievance, setCreatedGrievance] = useState(null);
  const [geoCoords, setGeoCoords] = useState({ lat: null, lng: null });
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showPreview, createdGrievance, loading]);

  const [speechLang, setSpeechLang] = useState("en-IN");

  // Common quick prompt chips for citizen ease
  const quickPrompts = [
    { label: "💧 Water Supply Cut", text: "There is no drinking water supply in our colony since yesterday morning" },
    { label: "💡 Broken Streetlight", text: "The streetlight near the main park entrance is broken and completely dark" },
    { label: "🗑️ Overflowing Garbage", text: "Garbage has not been collected for three days and is overflowing on the corner" },
    { label: "🚗 Traffic & Blocked Parking", text: "Vehicles are parked illegally near the hospital entrance and blocking emergency traffic" },
    { label: "⚡ Power Outage", text: "Severe low voltage and frequent power cuts in Sector 4 are damaging home appliances" },
    { label: "🕳️ Dangerous Road Potholes", text: "Deep potholes on the main road after recent rains causing vehicle damage and accidents" }
  ];

  // Voice Recognition Handler (Web Speech API)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use text input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGeoCoords({ lat, lng });

          const locText = `GPS Coordinates (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

          if (extractedData) {
            const updated = { ...extractedData, location_text: locText, latitude: lat, longitude: lng, missing_information: [] };
            setExtractedData(updated);
            setShowPreview(true);

            setMessages((prev) => [
              ...prev,
              { sender: "user", text: "📍 Confirmed current GPS location coordinates" },
              { sender: "ai", text: `Location locked to **${locText}**. Please verify the complete grievance summary below and submit officially:` },
            ]);
          }
        },
        () => alert("Location access was denied. Please enter your locality or landmark manually in the chat.")
      );
    }
  };

  const processMessageSubmission = async (textToSend) => {
    if (!textToSend.trim() || loading) return;

    const userQuery = textToSend.trim();
    setInputText("");

    setMessages((prev) => [...prev, { sender: "user", text: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/parse-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: userQuery,
          location_text: extractedData?.location_text || null,
          conversation_state: conversationState,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze message");

      const newState = data.conversation_state || {};
      setConversationState(newState);

      if (data.is_grievance && data.extracted_data) {
        const result = data.extracted_data;
        setExtractedData(result);

        if (newState.awaitingField === "location_text") {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: data.ai_message || `I have classified this under **${result.category}** for the **${result.department}**. Where is this problem occurring? (Please enter your locality, landmark, or click GPS coordinates below)`,
              showLocButton: true,
            },
          ]);
          setShowPreview(false);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: data.ai_message || `Thank you! I have parsed your **${result.category}** grievance and mapped it to the **${result.department}**. Please review and confirm your grievance filing below:`,
            },
          ]);
          setShowPreview(true);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.ai_message,
          },
        ]);
        setShowPreview(false);
      }
    } catch (err) {
      console.error("AI Parse Error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "I encountered an issue analyzing your input. Please describe the problem again or provide the location." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    processMessageSubmission(inputText);
  };

  const handleChipClick = (promptText) => {
    processMessageSubmission(promptText);
  };

  const handleSubmitGrievance = async (finalData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...finalData,
          latitude: geoCoords.lat || finalData.latitude || null,
          longitude: geoCoords.lng || finalData.longitude || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit grievance");

      const grv = data.grievance || {};
      const tNum = grv.tracking_number || grv.trackingNumber || data.tracking_number || ("GRV-" + Date.now());
      setCreatedGrievance({
        ...grv,
        id: grv.id || data.id,
        tracking_number: tNum,
        trackingNumber: tNum,
        category: grv.category || finalData.category || "General Issue",
        department: grv.department || finalData.department || "Municipal Administration",
        priority: grv.priority || finalData.priority || "MEDIUM",
        status: grv.status || "SUBMITTED",
        description: grv.description || finalData.description,
        location_text: grv.location_text || grv.locationText || finalData.location_text || "Registered Location",
      });
      setShowPreview(false);
    } catch (err) {
      console.error("Grievance submission error:", err);
      alert(err.message || "Failed to register grievance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = (ticketId) => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetChat = () => {
    setCreatedGrievance(null);
    setExtractedData(null);
    setConversationState({});
    setShowPreview(false);
    setMessages([
      { sender: "ai", text: "Namaste! 👋 I am the JanSeva Civic AI Assistant. Tell me what civic problem you are facing in your locality." }
    ]);
  };

  return (
    <div className="assistant-wrapper">
      {/* Top Breadcrumb & Heading Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
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
              Lodge New Grievance
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="system-pill" title="Microservice active">
            <span className="pulse-dot"></span>
            <span>AI NLP Pipeline Active</span>
          </div>

          <button 
            onClick={handleResetChat} 
            className="btn btn-outline btn-sm"
            title="Start fresh grievance conversation"
          >
            <RefreshCw size={13} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {createdGrievance ? (
        /* Grievance Successfully Created Card */
        <div 
          className="card" 
          style={{ 
            border: "2px solid var(--green-border)", 
            backgroundColor: "var(--white)", 
            padding: "2.75rem",
            boxShadow: "var(--shadow-xl)",
            borderRadius: "var(--radius-xl)",
            animation: "messageIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--green-pale)", color: "var(--green-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid var(--green-border)" }}>
              <CheckCircle2 size={32} />
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "var(--green-pale)", color: "var(--green-forest)", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
                Official Registration Confirmed
              </div>
              <h2 style={{ fontSize: "1.75rem", color: "var(--text-primary)", fontWeight: "800", fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
                Grievance Filed Successfully
              </h2>
              <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                Your complaint has been parsed, logged into the municipal registry, and routed under the 24-Hour SLA guarantee.
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-soft)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: "1.75rem", margin: "1.75rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-secondary)", fontWeight: "700" }}>
                  Official Municipal Tracking ID
                </span>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "1.65rem", fontWeight: "800", color: "var(--green-forest)", marginTop: "0.2rem", letterSpacing: "0.03em" }}>
                  {createdGrievance.tracking_number || createdGrievance.trackingNumber || "N/A"}
                </div>
              </div>

              <button 
                onClick={() => handleCopyTicket(createdGrievance.tracking_number || createdGrievance.trackingNumber)}
                className="btn btn-secondary"
                style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
              >
                {copied ? <Check size={15} color="var(--green-primary)" /> : <Copy size={15} />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Tracking ID"}</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem", marginTop: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.04em" }}>Civic Category</div>
                <div style={{ fontWeight: "700", color: "var(--text-primary)", marginTop: "0.25rem", fontSize: "0.95rem" }}>{createdGrievance.category}</div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.04em" }}>Assigned Department</div>
                <div style={{ fontWeight: "700", color: "var(--green-primary)", marginTop: "0.25rem", fontSize: "0.95rem" }}>{createdGrievance.department}</div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.04em" }}>Priority Level</div>
                <div style={{ marginTop: "0.25rem" }}>
                  <span className={`badge badge-${(createdGrievance.priority || 'medium').toLowerCase()}`}>
                    {createdGrievance.priority || "MEDIUM"}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.04em" }}>Resolution SLA</div>
                <div style={{ marginTop: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "700", color: "var(--green-forest)", background: "var(--green-pale)", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                  <Clock size={13} />
                  <span>24 Hours Target</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={() => navigate("/", { 
                state: { 
                  openGrievanceId: createdGrievance.id, 
                  trackingNumber: createdGrievance.tracking_number || createdGrievance.trackingNumber 
                } 
              })}
            >
              <Eye size={17} />
              <span>View Registered Grievance</span>
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate("/")}>
              <LayoutDashboard size={17} />
              <span>Return to Dashboard</span>
            </button>
            <button className="btn btn-outline btn-lg" onClick={handleResetChat}>
              <PlusCircle size={17} />
              <span>Lodge Another Complaint</span>
            </button>
          </div>
        </div>
      ) : (
        /* Split Layout: Chat on Left, Assistant Guide on Right */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }} className="assistant-layout-grid">
          {/* Active Chat Container */}
          <div className="assistant-box">
            {/* Assistant Header */}
            <div className="assistant-header">
              <div className="assistant-branding">
                <div className="assistant-avatar">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="assistant-name">Civic AI Lodging Bot</div>
                  <div className="assistant-status">
                    <span className="pulse-dot"></span>
                    <span>100% On-Device Scikit-Learn NLP Pipeline</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "#FFFFFF", background: "rgba(255,255,255,0.15)", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-full)", fontWeight: "600", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Globe size={13} />
                  <span>{speechLang === "en-IN" ? "English (India)" : speechLang === "hi-IN" ? "Hindi (हिंदी)" : speechLang}</span>
                </div>
              </div>
            </div>

            {/* Messages Pane */}
            <div className="assistant-chat-pane">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble-row ${msg.sender}`}>
                  <div className={`bubble-avatar ${msg.sender}`}>
                    {msg.sender === "ai" ? <Bot size={16} /> : (user?.name ? user.name.charAt(0).toUpperCase() : "U")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bubble-content">
                      <FormattedMessage text={msg.text} />
                    </div>

                    {msg.showLocButton && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={handleUseMyLocation}
                          style={{ boxShadow: "var(--shadow-sm)" }}
                        >
                          <Navigation size={14} />
                          <span>Use My Current GPS Coordinates</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Prompts Tray for initial turn */}
              {messages.length === 1 && (
                <div className="quick-prompts-tray">
                  <div className="quick-prompt-title">
                    <Sparkles size={14} />
                    <span>Quick Issue Presets (Click to test instant AI categorization):</span>
                  </div>
                  <div className="chips-container">
                    {quickPrompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        className="prompt-chip"
                        onClick={() => handleChipClick(p.text)}
                        disabled={loading}
                      >
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="chat-bubble-row ai">
                  <div className="bubble-avatar ai">
                    <Bot size={16} />
                  </div>
                  <div className="bubble-content" style={{ display: "flex", alignItems: "center", gap: "0.65rem", color: "var(--green-forest)", background: "var(--green-pale)", border: "1px solid var(--green-border)" }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    <span style={{ fontSize: "0.88rem", fontWeight: "600" }}>
                      Local ML engine is classifying grievance and determining department...
                    </span>
                  </div>
                </div>
              )}

              {showPreview && extractedData && (
                <GrievancePreviewCard
                  data={extractedData}
                  onEdit={(updated) => setExtractedData(updated)}
                  onSubmit={handleSubmitGrievance}
                />
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Listening Indicator when active */}
            {isListening && (
              <div style={{ backgroundColor: "#FEF2F2", borderTop: "1px solid #FECACA", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#DC2626", fontSize: "0.85rem", fontWeight: "700" }}>
                <Radio size={16} className="spin" />
                <span>Listening to microphone... Speak your civic complaint clearly</span>
              </div>
            )}

            {/* Chat Input Toolbar */}
            <form onSubmit={handleSendMessage} className="chat-input-toolbar">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <select 
                  value={speechLang} 
                  onChange={(e) => setSpeechLang(e.target.value)}
                  className="filter-select"
                  style={{ padding: "0.6rem 0.75rem", fontSize: "0.82rem", fontWeight: "600" }}
                  title="Select Speech Recognition Language"
                >
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi (हिंदी)</option>
                  <option value="te-IN">Telugu (తెలుగు)</option>
                  <option value="ta-IN">Tamil (தமிழ்)</option>
                  <option value="mr-IN">Marathi (मराठी)</option>
                  <option value="bn-IN">Bengali (বাংলা)</option>
                </select>

                <button
                  type="button"
                  className={`btn ${isListening ? "btn-danger" : "btn-secondary"}`}
                  style={{ padding: "0.65rem 0.8rem", borderRadius: "var(--radius-md)" }}
                  onClick={handleVoiceInput}
                  title={isListening ? "Stop listening" : "Speak complaint via microphone"}
                >
                  {isListening ? <MicOff size={17} color="#DC2626" /> : <Mic size={17} color="var(--green-primary)" />}
                </button>
              </div>

              <input
                type="text"
                className="chat-text-input"
                placeholder={isListening ? "Listening... Speak your complaint clearly" : "Describe problem (e.g. 'Potholes on Ring Road', 'Water supply cut in Sector 5')..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading || showPreview}
                style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.92rem" }}
              />

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !inputText.trim() || showPreview}
                style={{ padding: "0.75rem 1.4rem" }}
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* Right Guidance Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} className="assistant-sidebar-panel">
            {/* 24-Hour SLA Guarantee Card */}
            <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--green-border)", background: "var(--white)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "10px", background: "var(--green-pale)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green-primary)" }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                    24h Resolution SLA
                  </h4>
                  <div style={{ fontSize: "0.72rem", color: "var(--green-forest)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Guaranteed Accountability
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                Every grievance submitted triggers an automatic 24-hour resolution timer. If department field officers do not act, the complaint is auto-escalated to senior municipal authorities.
              </p>
            </div>

            {/* How AI Routing Works */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Sparkles size={16} color="var(--green-primary)" />
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                  How Local AI Operates
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {[
                  { step: "1", title: "Describe Naturally", desc: "No complex forms. Speak or type in English or Hindi." },
                  { step: "2", title: "Smart Extraction", desc: "ML extracts specific category, urgency, and landmark." },
                  { step: "3", title: "Direct Routing", desc: "Assigned directly to the correct department worker." }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--green-pale)", color: "var(--green-forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "800", flexShrink: 0 }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>{item.title}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, marginTop: "0.1rem" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="card" style={{ padding: "1.25rem", background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                <HelpCircle size={15} color="var(--green-primary)" />
                <span>Tips for Fastest Resolution</span>
              </div>
              <ul style={{ fontSize: "0.78rem", color: "var(--text-secondary)", paddingLeft: "1.2rem", lineHeight: 1.6, margin: 0 }}>
                <li>Include a nearby prominent landmark or street name.</li>
                <li>Tap <strong>GPS Coordinates</strong> for pin-point field inspection.</li>
                <li>Mention duration (e.g. "for 3 days") to help AI calibrate SLA priority.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
