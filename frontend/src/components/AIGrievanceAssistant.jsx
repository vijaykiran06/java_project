import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
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
  Radio
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
  }, [messages, showPreview, createdGrievance]);

  const [speechLang, setSpeechLang] = useState("en-IN");

  // Common quick prompt chips for citizen ease
  const quickPrompts = [
    { label: "💧 Water Shortage", text: "There is no drinking water supply in our colony since yesterday morning" },
    { label: "💡 Broken Streetlight", text: "The streetlight near the main park entrance is broken and completely dark" },
    { label: "🗑️ Garbage Dump", text: "Garbage has not been collected for three days and is overflowing on the corner" },
    { label: "🚗 Blocked Parking", text: "Vehicles are parked illegally near the hospital entrance and blocking emergency traffic" },
    { label: "⚡ Voltage Fluctuations", text: "Severe low voltage and frequent power cuts in Sector 4 are damaging home appliances" }
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

          const locText = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          if (extractedData) {
            const updated = { ...extractedData, location_text: locText, latitude: lat, longitude: lng, missing_information: [] };
            setExtractedData(updated);
            setShowPreview(true);

            setMessages((prev) => [
              ...prev,
              { sender: "user", text: "📍 Used my current GPS location" },
              { sender: "ai", text: `Understood! Landmark set to ${locText}. Please inspect the confirmation summary below:` },
            ]);
          }
        },
        () => alert("Location access was denied. Please type your locality or landmark manually.")
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
              text: data.ai_message || `I have classified this as a **${result.category}** issue. Where is this problem located? (Please enter your locality, landmark, or street name)`,
              showLocButton: true,
            },
          ]);
          setShowPreview(false);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: data.ai_message || `Thank you. I have extracted your **${result.category}** complaint for the **${result.department}**. Please review and confirm the grievance summary below:`,
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

      setCreatedGrievance(data.grievance);
      setShowPreview(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
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
      {/* Header Description */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", backgroundColor: "var(--status-success-bg)", border: "1px solid var(--status-success-border)", borderRadius: "9999px", fontSize: "0.74rem", fontWeight: "700", color: "var(--primary-dark)", marginBottom: "0.5rem" }}>
            <Cpu size={12} />
            <span>FastAPI Scikit-Learn Microservice Ready</span>
          </div>
          <h2 style={{ fontSize: "1.85rem", color: "var(--deep-navy)", fontWeight: "800", letterSpacing: "-0.02em" }}>
            AI Grievance Assistant
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", marginTop: "0.2rem" }}>
            Lodge complaints conversationally in plain English or Hindi. Local AI automatically extracts categories, assesses urgency, and routes directly to the right municipal office.
          </p>
        </div>

        <button 
          onClick={handleResetChat} 
          className="btn btn-outline btn-sm"
          title="Start fresh grievance conversation"
        >
          <RefreshCw size={14} />
          <span>New Session</span>
        </button>
      </div>

      {createdGrievance ? (
        /* Grievance Successfully Created Card */
        <div 
          className="card" 
          style={{ 
            border: "2px solid var(--status-success-border)", 
            backgroundColor: "#FFFFFF", 
            padding: "2.5rem",
            boxShadow: "0 10px 30px rgba(5, 150, 105, 0.12)",
            animation: "messageIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--status-success-bg)", color: "var(--primary-emerald)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.4rem", color: "var(--deep-navy)", fontWeight: "800" }}>
                Grievance Officially Registered
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                Your complaint has been acknowledged by the municipal routing engine and assigned to field officers.
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "1.5rem", margin: "1.5rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <span style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", fontWeight: "700" }}>
                  Official Tracking ID
                </span>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: "800", color: "var(--deep-navy)" }}>
                  {createdGrievance.tracking_number}
                </div>
              </div>

              <button 
                onClick={() => handleCopyTicket(createdGrievance.tracking_number)}
                className="btn btn-secondary btn-sm"
              >
                {copied ? <Check size={14} color="var(--primary-emerald)" /> : <Copy size={14} />}
                <span>{copied ? "Copied ID!" : "Copy Tracking ID"}</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700" }}>Category</div>
                <div style={{ fontWeight: "700", color: "var(--deep-navy)", marginTop: "0.15rem" }}>{createdGrievance.category}</div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700" }}>Assigned Department</div>
                <div style={{ fontWeight: "700", color: "var(--primary-emerald)", marginTop: "0.15rem" }}>{createdGrievance.department}</div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700" }}>Assessed Priority</div>
                <div style={{ marginTop: "0.15rem" }}>
                  <span className={`badge badge-${(createdGrievance.priority || 'medium').toLowerCase()}`}>
                    {createdGrievance.priority}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "700" }}>Current Status</div>
                <div style={{ marginTop: "0.15rem" }}>
                  <span className="badge badge-submitted">
                    <span className="badge-dot"></span>
                    <span>{createdGrievance.status}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/")}>
              <span>View My Grievances Dashboard</span>
              <ArrowRight size={17} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={handleResetChat}>
              <PlusCircle size={17} />
              <span>Lodge Another Complaint</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Chat Container */
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
                  <span>100% Offline Scikit-Learn NLP Pipeline</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "#E2E8F0", background: "rgba(255,255,255,0.1)", padding: "0.35rem 0.65rem", borderRadius: "6px" }}>
                <Globe size={13} />
                <span>Voice: {speechLang === "en-IN" ? "English" : speechLang === "hi-IN" ? "Hindi" : speechLang}</span>
              </div>
            </div>
          </div>

          {/* Messages Pane */}
          <div className="assistant-chat-pane">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-row ${msg.sender}`}>
                <div className={`bubble-avatar ${msg.sender}`}>
                  {msg.sender === "ai" ? "AI" : (user?.name ? user.name.charAt(0).toUpperCase() : "U")}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="bubble-content">
                    <FormattedMessage text={msg.text} />
                  </div>

                  {msg.showLocButton && (
                    <button 
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: "0.65rem" }}
                      onClick={handleUseMyLocation}
                    >
                      <MapPin size={14} />
                      <span>Use My Current GPS Coordinates</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Prompts Tray for initial turn */}
            {messages.length === 1 && (
              <div className="quick-prompts-tray">
                <div className="quick-prompt-title">
                  💡 Common Municipal Issue Presets (Click to test AI routing):
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
                <div className="bubble-avatar ai">AI</div>
                <div className="bubble-content" style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-secondary)" }}>
                  <RefreshCw className="spin" size={16} color="var(--primary-emerald)" />
                  <span>Local AI is parsing grievance context & extracting category...</span>
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
            <div style={{ backgroundColor: "#FEF2F2", borderTop: "1px solid #FECACA", padding: "0.6rem 1.75rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#DC2626", fontSize: "0.85rem", fontWeight: "600" }}>
              <Radio size={16} className="spin" />
              <span>Listening to voice... Speak your complaint clearly into the microphone</span>
            </div>
          )}

          {/* Chat Input Toolbar */}
          <form onSubmit={handleSendMessage} className="chat-input-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <select 
                value={speechLang} 
                onChange={(e) => setSpeechLang(e.target.value)}
                className="filter-select"
                style={{ padding: "0.6rem 0.65rem", fontSize: "0.82rem" }}
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
                className={`btn ${isListening ? "btn-outline-danger" : "btn-secondary"}`}
                style={{ padding: "0.65rem 0.75rem" }}
                onClick={handleVoiceInput}
                title={isListening ? "Stop listening" : "Speak complaint via microphone"}
              >
                {isListening ? <MicOff size={18} color="#DC2626" /> : <Mic size={18} color="var(--text-secondary)" />}
              </button>
            </div>

            <input
              type="text"
              className="chat-text-input"
              placeholder={isListening ? "Listening... Please speak your complaint" : "Describe problem (e.g. 'Potholes on Ring Road', 'Water supply cut in Sector 5')..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading || showPreview}
            />

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !inputText.trim() || showPreview}
              style={{ padding: "0.75rem 1.25rem" }}
            >
              <Send size={17} />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
