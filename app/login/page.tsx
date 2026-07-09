"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = "http://https://payevery-backend.onrender.com/";

export default function Login() {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Refs for Enter-key navigation
  const pinRef = useRef<HTMLInputElement>(null);
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const handleStep1 = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!username.trim() || pin.length < 4) { setError("Enter a valid username and 4-digit PIN."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login-step1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail); return; }
      setDemoOtp(data.demo_otp || "");
      setPhone(data.phone || "");
      setStep(2);
    } catch { setError("Cannot reach server. Is the backend running?"); }
    finally { setLoading(false); }
  };

  const handleStep2 = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length < 6) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login-step2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail); return; }
      localStorage.setItem("loggedInUser", data.username);
      router.push("/dashboard");
    } catch { setError("Cannot reach server. Is the backend running?"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Deep Space Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] opacity-20 pointer-events-none" />

      {/* Glassmorphic Login Card */}
      <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md relative z-10 border border-slate-800/50">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="PayEvery Logo" className="w-32 h-32 object-contain -mt-16 -mb-4 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight z-10">Pay<span className="text-blue-500">Every</span></h1>
          <p className="text-slate-400 text-sm mt-1 text-center z-10 font-medium">Secure AI-powered payments.</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-6">
            <div>
              <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Username</label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && pinRef.current?.focus()}
                className="w-full px-5 py-4 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white font-medium outline-none transition-all placeholder-slate-600 shadow-inner"
                placeholder="e.g., sohel, rifat, ratul" autoFocus />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">4-Digit PIN</label>
              <input
                ref={pinRef} type="password" maxLength={4} value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => { if (e.key === "Enter" && pin.length === 4 && username.trim()) loginBtnRef.current?.click(); }}
                className="w-full px-5 py-4 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-center tracking-[0.75em] font-black text-2xl text-white outline-none transition-all placeholder-slate-600 shadow-inner"
                placeholder="••••" />
              <p className="text-xs text-blue-500/80 mt-2 text-right font-medium">(Demo PIN: 1234)</p>
            </div>
            {error && <p className="bg-red-500/10 text-red-400 font-medium p-4 rounded-xl border border-red-500/20 text-sm">{error}</p>}
            <button ref={loginBtnRef} type="submit" disabled={loading || pin.length < 4 || !username.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2">
              {loading ? "Verifying..." : "Secure Login →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-6">
            {demoOtp && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5 text-center shadow-inner">
                <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-widest">SMS sent to ••••{phone}</p>
                <p className="text-5xl font-black text-white tracking-[0.2em] my-3 drop-shadow-md">{demoOtp}</p>
                <p className="text-xs text-blue-300/70 font-medium">Copy this OTP and paste it below</p>
              </div>
            )}
            <div>
              <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">Enter 6-Digit OTP</label>
              <input
                ref={otpRef} type="text" maxLength={6} value={otp} autoFocus
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => { if (e.key === "Enter" && otp.length === 6) handleStep2(); }}
                className="w-full px-5 py-4 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-center tracking-[0.5em] font-mono font-black text-3xl text-white outline-none transition-all placeholder-slate-700 shadow-inner"
                placeholder="••••••" />
            </div>
            {error && <p className="bg-red-500/10 text-red-400 font-medium p-4 rounded-xl border border-red-500/20 text-sm">{error}</p>}
            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
              {loading ? "Verifying..." : "Confirm & Login ✓"}
            </button>
            <button type="button" onClick={() => { setStep(1); setOtp(""); setError(""); }}
              className="w-full text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors py-2">← Back</button>
          </form>
        )}

        <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
          <p className="text-sm text-slate-400 font-medium">Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Sign up now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}