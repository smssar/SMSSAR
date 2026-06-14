/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function TestAIPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    if (!text) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      console.log("API response:", data);
      setResult(data.response);
    } catch {
      setResult({ error: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🤖 AI Message Analyzer</h1>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message... e.g. I need help with my order"
          style={styles.textarea}
        />

        <button
          onClick={handleAnalyze}
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Message"}
        </button>

        {result && (
          <div style={styles.resultBox}>
            <h3>📊 Result</h3>
            <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    fontFamily: "Arial",
  },
  card: {
    width: "500px",
    padding: "25px",
    borderRadius: "16px",
    background: "#111827",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    color: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  textarea: {
    width: "100%",
    height: "120px",
    borderRadius: "10px",
    padding: "12px",
    border: "1px solid #374151",
    background: "#0b1220",
    color: "#fff",
    outline: "none",
    resize: "none",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    marginTop: "15px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.2s",
  },
  resultBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#0b1220",
    borderRadius: "10px",
    border: "1px solid #374151",
  },
  pre: {
    fontSize: "12px",
    color: "#22c55e",
    overflowX: "auto",
  },
};
