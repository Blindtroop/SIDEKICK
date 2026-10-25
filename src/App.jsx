
import { useState, useRef, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./assets/firebase/firebase";
import Auth from "./assets/auth/auth";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey, I'm SIDEKICK. ☁️ What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const updatedMessages = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.slice(1),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error.message || "I couldn't connect. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#f7f4f0] flex items-center justify-center">
        <p className="text-sm text-[#796393] animate-pulse">
          Waking up SIDEKICK...
        </p>
      </main>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="sun-mark" />
          <span>sidekick</span>
        </div>

        <button
          className="new-chat"
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                content: "Fresh start! What's on your mind? ☁️",
              },
            ])
          }
          disabled={loading}
        >
          New conversation
        </button>

        <div className="sidebar-note">
          <span className="status-dot" />
          Your little corner of calm.
        </div>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <p className="truncate text-xs text-white/60" title={user.email}>
            {user.email}
          </p>
          <button
            className="new-chat"
            onClick={async () => {
              try {
                await signOut(auth);
              } catch {
                alert("Couldn't sign out. Please try again.");
              }
            }}
            disabled={loading}
          >
            Sign out
          </button>
        </div>

        <div className="sidebar-footer">A companion, not a crowd.</div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div className="avatar">
            <span className="sun-mark small" />
          </div>
          <div>
            <h1>Sidekick</h1>
            <p><span className="status-dot" /> Here with you</p>
          </div>
        </header>

        <div className="messages">
          <div className="welcome">
            <h2>Here for you, <em>anytime.</em></h2>
            <p>Feel free to share.</p>
          </div>

          {messages.slice(1).map((message, index) => (
            <div
              className={`message-row ${message.role}`}
              key={index}
            >
              {message.role === "assistant" && (
                <div className="message-avatar">
                  <span className="sun-mark tiny" />
                </div>
              )}
              <div className="message-bubble">{message.content}</div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message-avatar">
                <span className="sun-mark tiny" />
              </div>
              <div className="message-bubble typing">
                Thinking<span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what's on your mind..."
            aria-label="Message SIDEKICK"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            ↑
          </button>
        </form>

        <p className="disclaimer">
          Personal Digital Assistant made by Lance Kaluhi.
        </p>
      </section>
    </main>
  );
}

export default App;
