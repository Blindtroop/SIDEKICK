
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }
    } catch (err) {
      const errors = {
        "auth/email-already-in-use": "This email already has an account. Try signing in.",
        "auth/invalid-email": "Please enter a valid email.",
        "auth/weak-password": "Use a password with at least 6 characters.",
        "auth/invalid-credential": "Your email or password is incorrect.",
        "auth/operation-not-allowed": "Enable Email/Password in Firebase Authentication.",
        "auth/network-request-failed": "Check your internet connection.",
      };

      setError(errors[err.code] || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4f0] text-[#383447] flex items-center justify-center p-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-[#e9e2ed] bg-[#fffdfc] p-7 sm:p-10 shadow-[0_18px_60px_rgba(67,51,81,0.08)]"
      >
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#e9e0f7] text-3xl text-[#76609b]">
          ✳
        </div>

        <p className="mb-2 text-[10px] font-bold tracking-[2px] text-[#8d7ba4]">
          YOUR PERSONAL COMPANION
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          Hey, you.
        </h1>

        <p className="mt-2 mb-7 text-sm text-[#817b89]">
          A little company, whenever you need it.
        </p>

        <div className="mb-6 flex gap-1 rounded-xl bg-[#f3eff6] p-1">
          <button
            type="button"
            onClick={() => {
              setIsSignup(true);
              setError("");
            }}
            className={`flex-1 rounded-lg px-2 py-3 text-sm transition ${
              isSignup
                ? "bg-white text-[#594772] shadow-sm font-semibold"
                : "text-[#797184]"
            }`}
          >
            Create account
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignup(false);
              setError("");
            }}
            className={`flex-1 rounded-lg px-2 py-3 text-sm transition ${
              !isSignup
                ? "bg-white text-[#594772] shadow-sm font-semibold"
                : "text-[#797184]"
            }`}
          >
            Sign in
          </button>
        </div>

        <label htmlFor="email" className="mb-2 block text-xs font-semibold">
          Email address
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-5 w-full rounded-xl border border-[#e6e0e9] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a18ac5] focus:ring-4 focus:ring-[#a18ac5]/10"
        />

        <label htmlFor="password" className="mb-2 block text-xs font-semibold">
          Password
        </label>

        <input
          id="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="w-full rounded-xl border border-[#e6e0e9] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a18ac5] focus:ring-4 focus:ring-[#a18ac5]/10"
        />

        {error && (
          <p role="alert" className="mt-4 text-sm leading-relaxed text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-[#796393] px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#66517f] disabled:cursor-wait disabled:opacity-60"
        >
          {loading
            ? "One moment..."
            : isSignup
              ? "Create my account →"
              : "Welcome back →"}
        </button>

        <p className="mt-6 text-center text-xs text-[#99919f]">
          {isSignup
            ? "Your own little corner of the internet."
            : "Your SIDEKICK is right where you left it."}
        </p>
      </form>
    </main>
  );
}
