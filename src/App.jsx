
import { useState, useRef, useEffect, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./assets/firebase/firebase";
import {
  saveMemory,
  getMemories,
} from "./assets/memories/memoryservice";
import {
  createChat,
  saveMessage,
  getChats,
  getChatMessages,
} from "./assets/chat/chatservice";
import Auth from "./assets/auth/auth";
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
  const [chats, setChats] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const bottomRef = useRef(null);

  const refreshChats = useCallback(async (userId) => {
    const savedChats = await getChats(userId);
    setChats(savedChats);
    return savedChats;
  }, []);

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
      setChats([]);
      return;
    }

    let cancelled = false;

    async function restoreConversation() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const savedChats = await getChats(user.uid);
        if (cancelled) return;

        setChats(savedChats);

        if (savedChats.length > 0) {
          const latestChat = savedChats[0];
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
        console.error("Could not restore conversations:", error);
        if (!cancelled) {
          setHistoryError(
            "Couldn't load saved conversations. Try refreshing."
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

  async function openChat(selectedChat) {
    if (loading || historyLoading || selectedChat.id === chatId) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const savedMessages = await getChatMessages(
        user.uid,
        selectedChat.id
      );

      setChatId(selectedChat.id);
      setMessages(
        savedMessages.length > 0
          ? savedMessages.map(({ role, content }) => ({
              role,
              content,
            }))
          : [greeting]
      );
    } catch (error) {
      console.error("Could not open conversation:", error);
      setHistoryError(
        "Couldn't open that conversation. Please try again."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  
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
      await refreshChats(user.uid);
    }

    await saveMessage(user.uid, activeChatId, userMessage);

    const rememberMatch = text.match(
      /^(?:sidekick,?\s*)?(?:please\s+)?(?:remember(?:\s+that)?|don't forget(?:\s+that)?|never forget(?:\s+that)?)\s+(.+)$/i
    );

    const recallMatch =
      /^(?:what do you remember about me|show me my memories|list my memories)\??$/i.test(
        text
      );

    let reply;

    if (rememberMatch) {
      const memoryText = rememberMatch[1].trim();

      await saveMemory(user.uid, memoryText, "explicit");

      reply = `I'll remember that: ${memoryText}`;
    } else if (recallMatch) {
      const memories = await getMemories(user.uid);

      reply = memories.length
        ? "Here's what I remember about you:\n\n" +
          memories.map((memory) => `• ${memory.text}`).join("\n")
        : "I haven't saved any memories about you yet. Tell me something to remember!";
    } else {
      const memories = await getMemories(user.uid);

      const response = await fetch(
  "/api/chat",
  {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.slice(1),
          memories: memories.map((memory) => memory.text),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      reply = data.reply;
    }

    const assistantMessage = {
      role: "assistant",
      content: reply,
    };

    setMessages((current) => [...current, assistantMessage]);

    await saveMessage(user.uid, activeChatId, assistantMessage);
    await refreshChats(user.uid);
  } catch (error) {
    console.error("Chat error:", error);

    const errorMessage = {
      role: "assistant",
      content: error.message || "I couldn't complete that. Please try again.",
    };

    setMessages((current) => [...current, errorMessage]);

    if (activeChatId) {
      try {
        await saveMessage(user.uid, activeChatId, errorMessage);
        await refreshChats(user.uid);
      } catch (saveError) {
        console.error("Could not save message:", saveError);
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
    if (loading || historyLoading) return;

    setChatId(null);
    setMessages([greeting]);
    setHistoryError("");
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out failed:", error);
      setHistoryError("Couldn't sign out. Please try again.");
    }
  }

  function getChatTitle(chat) {
    return chat.title || "New conversation";
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4f0]">
        <p className="animate-pulse text-sm text-[#796393]">
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
          disabled={loading || historyLoading}
        >
          + New conversation
        </button>

        <div className="sidebar-note">
          <span className="status-dot" />
          Your little corner of calm.
        </div>

        <div className="mt-6 mb-5 flex min-h-0 flex-1 flex-col overflow-y-auto">
          <p className="mb-3 px-2 text-[10px] font-bold tracking-[1.5px] text-black/55">
            YOUR CONVERSATIONS
          </p>

          {historyLoading && (
            <p className="px-2 py-2 text-xs text-black/55">
              Loading conversations...
            </p>
          )}

          {!historyLoading && chats.length === 0 && (
            <p className="px-2 py-2 text-xs leading-relaxed text-black/55">
              Your conversations will appear here.
            </p>
          )}

          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`mb-1 flex w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                chat.id === chatId
                  ? "border-white/10 bg-white/15 text-black/90"
                  : "border-transparent text-black/75 hover:bg-white/10"
              }`}
              onClick={() => openChat(chat)}
              disabled={loading || historyLoading}
              title={getChatTitle(chat)}
            >
              <span className="shrink-0 text-black/80">☁</span>
              <span className="truncate">{getChatTitle(chat)}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <p className="truncate text-xs text-black/60" title={user.email}>
            {user.email}
          </p>

          <button
            className="new-chat"
            onClick={handleSignOut}
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
            <p>
              <span className="status-dot" /> Here with you
            </p>
          </div>
        </header>

        <div className="messages">
          <div className="welcome">
            <h2>
              Here for you, <em>anytime.</em>
            </h2>
            <p>Feel free to share.</p>
          </div>

          {historyError && (
            <p role="alert" className="text-center text-sm text-red-600">
              {historyError}
            </p>
          )}

          {messages.slice(1).map((message, index) => (
            <div
              className={`message-row ${message.role}`}
              key={`${chatId || "new"}-${index}`}
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
                Thinking<span>.</span>
                <span>.</span>
                <span>.</span>
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
