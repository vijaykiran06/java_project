import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Bot, Send, Database, AlertCircle, Sparkles, RefreshCw, BarChart2 } from "lucide-react";
import FormattedMessage from "./FormattedMessage";

export default function AIAdminAssistant() {
  const { token } = useContext(AuthContext);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Greetings, Executive Administrator. I am connected directly to your municipal SQL database and Python analytics microservice. Ask any strategic question regarding regional complaint patterns, department SLA adherence, backlog bottlenecks, or resolution velocities.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const suggestedQueries = [
    "Which department currently has the highest backlog of pending complaints?",
    "Show me all grievances that have breached SLA and require executive intervention",
    "What are the top 3 most common civic categories reported across the city?",
    "Compare resolution rates between Water Supply and Roads PWD"
  ];

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q || loading) return;

    setQuestion("");
    setMessages((prev) => [...prev, { sender: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/admin-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.answer,
          metrics: data.metrics,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "I encountered an error querying live analytical database metrics. Please try rephrasing your question." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", height: "620px", padding: "0", overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, var(--deep-navy) 0%, #163659 100%)", padding: "1.25rem 1.75rem", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: "700", fontSize: "1.05rem", color: "#FFFFFF" }}>
              JanSeva AI Strategic Analyst
            </div>
            <div style={{ fontSize: "0.75rem", color: "#A7F3D0", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Database size={12} />
              <span>Grounded in Real-time Database SQL Aggregations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Pane */}
      <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "#FAF9F6" }}>
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble-row ${m.sender}`}>
            <div className={`bubble-avatar ${m.sender}`}>
              {m.sender === "ai" ? "AI" : "Admin"}
            </div>
            <div style={{ flex: 1 }}>
              <div className="bubble-content">
                <FormattedMessage text={m.text} />
                {m.metrics && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid var(--border-color)", fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <BarChart2 size={13} color="var(--primary-emerald)" />
                    <span>Database Context: <strong>{m.metrics.total_grievances || 0}</strong> Total | <strong>{m.metrics.escalated_grievances || 0}</strong> Escalated</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Suggested Queries Chips */}
        {messages.length === 1 && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Suggested Strategic Queries:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {suggestedQueries.map((sq, sqIdx) => (
                <button
                  key={sqIdx}
                  className="prompt-chip"
                  onClick={() => handleAsk(sq)}
                  disabled={loading}
                >
                  <BarChart2 size={12} color="var(--primary-emerald)" />
                  <span>{sq}</span>
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
              <span>Querying database tables and generating analytical response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleAsk(question); }} className="chat-input-toolbar">
        <input
          type="text"
          className="chat-text-input"
          placeholder="Ask an analytical question about complaint volumes, delays, or department trends..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || !question.trim()}
        >
          <Send size={16} />
          <span>Ask Analyst</span>
        </button>
      </form>
    </div>
  );
}
