import React from "react";

/**
 * Clean, robust markdown formatter for chat bubbles.
 * Parses **bold**, *italic*, bullet lists, and line breaks into native React JSX elements.
 * Eliminates all raw markdown symbols (like literal **) from the user interface.
 * Uses 'inherit' for text colors so it seamlessly adapts with high contrast to both AI bubbles and User bubbles.
 */
export default function FormattedMessage({ text }) {
  if (!text) return null;

  // Split into lines
  const lines = text.split("\n");
  const elements = [];
  let currentList = [];

  const parseInline = (line, lineKey) => {
    // Regex matches **bold**, __bold__, *italic*, `code`
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;
    let partIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`${lineKey}-${partIdx++}`}>{line.substring(lastIndex, match.index)}</span>);
      }
      const raw = match[0];
      if (raw.startsWith("**") && raw.endsWith("**")) {
        parts.push(
          <strong key={`${lineKey}-${partIdx++}`} style={{ fontWeight: "700", color: "inherit" }}>
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith("__") && raw.endsWith("__")) {
        parts.push(
          <strong key={`${lineKey}-${partIdx++}`} style={{ fontWeight: "700", color: "inherit" }}>
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith("`") && raw.endsWith("`")) {
        parts.push(
          <code key={`${lineKey}-${partIdx++}`} style={{ background: "rgba(0,0,0,0.06)", padding: "0.15rem 0.35rem", borderRadius: "4px", color: "inherit", fontFamily: "monospace" }}>
            {raw.slice(1, -1)}
          </code>
        );
      } else if (raw.startsWith("*") && raw.endsWith("*")) {
        parts.push(<em key={`${lineKey}-${partIdx++}`}>{raw.slice(1, -1)}</em>);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(<span key={`${lineKey}-${partIdx++}`}>{line.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : line;
  };

  const flushList = (keyPrefix) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} style={{ margin: "0.4rem 0", paddingLeft: "1.25rem", listStyleType: "disc", color: "inherit" }}>
          {currentList.map((item, idx) => (
            <li key={`${keyPrefix}-li-${idx}`} style={{ marginBottom: "0.25rem", color: "inherit" }}>
              {item}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check if line is a bullet item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const bulletContent = trimmed.replace(/^[-*•]\s+/, "");
      currentList.push(parseInline(bulletContent, `b-${idx}`));
    } else {
      flushList(`flush-${idx}`);
      if (trimmed === "") {
        // Empty line -> spacing
        elements.push(<div key={`empty-${idx}`} style={{ height: "0.5rem" }} />);
      } else {
        elements.push(
          <div key={`p-${idx}`} style={{ lineHeight: "1.5", color: "inherit", marginBottom: "0.25rem" }}>
            {parseInline(line, `inline-${idx}`)}
          </div>
        );
      }
    }
  });

  flushList("final");

  return <div style={{ color: "inherit" }}>{elements}</div>;
}
