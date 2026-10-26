
import { useState, useRef, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./assets/firebase/firebase";
import {
  createChat,
  saveMessage,
  getChats,
  getChatMessages,
} from "./assets/chat/chatservice";
import Auth from "./assets/auth/Auth";
import "./App.css";

const greeting = {
  role: "assistant",
  content: "Hey, I'm SIDEKICK. ☁️ What's on your mind?",
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setChatId(null);
      setMessages([greeting]);
      return;
    }

    let cancelled = false;

    async function restoreConversation() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const chats = await getChats(user.uid);
        if (cancelled) return;

        if (chats.length > 0) {
          const latestChat = chats[0];
          const savedMessages = await getChatMessages(
            user.uid,
            latestChat.id
          );

          if (cancelled) return;

          setChatId(latestChat.id);
          setMessages(
            savedMessages.length > 0
              ? savedMessages.map(({ role, content }) => ({
                  role,
                  content,
                }))
              : [greeting]
          );
        } else {
          setChatId(null);
          setMessages([greeting]);
        }
      } catch (error) {
        console.error("Could not restore conversation:", error);
        if (!cancelled) {
          setHistoryError(
            "Couldn't load saved chats. Check your connection and refresh."
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    restoreConversation();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();

    const text = input.trim();
    if (!text || loading || !user || historyLoading) return;

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setHistoryError("");

    let activeChatId = chatId;

    try {
      if (!activeChatId) {
        activeChatId = await createChat(user.uid, text);
        setChatId(activeChatId);
      }

      await saveMessage(user.uid, activeChatId, userMessage);

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

      const assistantMessage = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((current) => [...current, assistantMessage]);

      await saveMessage(user.uid, activeChatId, assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = {
        role: "assistant",
        content:
          error.message || "I couldn't complete that. Please try again.",
      };

      setMessages((current) => [...current, errorMessage]);

      if (activeChatId) {
        try {
          await saveMessage(user.uid, activeChatId, errorMessage);
        } catch (saveError) {
          console.error("Could not save error message:", saveError);
          setHistoryError("A message couldn't be saved. Check your connection.");
        }
      } else {
        setHistoryError(
          "Couldn't create a saved conversation. Check your connection and Firestore rules."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    if (loading) return;
    setChatId(null);
    setMessages([greeting]);
    setHistoryError("");
  }

  async function handleSignOut() {
    try {
      await import("firebase/auth").then(({ signOut }) =>
        signOut(auth)
      );
    } catch (error) {
      console.error("Sign-out failed:", error);
      setHistoryError("Couldn't sign out. Please try again.");
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

  if (!user) return <Auth />;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="sun-mark" />
          <span>sidekick</span>
        </div>

        <button
          className="new-chat"
          onClick={newConversation}
          disabled={loading}
        >
          + New conversation
        </button>

        <div className="sidebar-note">
          <span className="status-dot" />
          Your little corner of calm.
        </div>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <p className="truncate text-xs text-white/60" title={user.email}>
            {user.email}
          </p>
          <button className="new-chat" onClick={handleSignOut} disabled={loading}>
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

          {historyLoading && (
            <p className="text-center text-sm text-[#817b89]">
              Finding your saved conversations...
            </p>
          )}

          {historyError && (
            <p role="alert" className="text-center text-sm text-red-600">
              {historyError}
            </p>
          )}

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
            disabled={loading || historyLoading}
          />
          <button
            type="submit"
            disabled={loading || historyLoading || !input.trim()}
          >
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
