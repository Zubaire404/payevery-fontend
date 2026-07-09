"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API = "http://https://payevery-backend.onrender.com/";

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", phone: "", password: "", pin: "", bkashNumber: "", nagadNumber: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"ok"|"taken">("idle");
  const [pinStrength, setPinStrength] = useState(0);

  const refs = {
    username: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    pin: useRef<HTMLInputElement>(null),
    submit: useRef<HTMLButtonElement>(null),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const checkUsername = async (val: string) => {
    if (!val.trim() || val.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`${API}/api/check-username?u=${val.trim().toLowerCase()}`);
      const data = await res.json();
      setUsernameStatus(data.available ? "ok" : "taken");
    } catch { setUsernameStatus("idle"); }
  };

  const handlePinChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setForm(f => ({ ...f, pin: digits }));
    // Simple strength: 4 digits unique chars
    const unique = new Set(digits).size;
    setPinStrength(digits.length < 4 ? 0 : unique === 1 ? 1 : unique <= 2 ? 2 : 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === "taken") { setError("Username is already taken."); return; }
    if (form.pin.length < 4) { setError("PIN must be exactly 4 digits."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), username: form.username.trim().toLowerCase(),
          phone: form.phone.trim(), password: form.password, pin: form.pin,
          bkash_number: form.bkashNumber, nagad_number: form.nagadNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail); return; }
      alert(`${data.message}\n\nYou received:\n✅ bKash: ৳1000\n✅ Nagad: ৳1000`);
      router.push("/login");
    } catch { setError("Cannot reach server. Is the backend running?"); }
    finally { setLoading(false); }
  };

  const pinStrengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"][pinStrength];
  const pinStrengthText = ["", "Weak PIN", "Moderate PIN", "Strong PIN"][pinStrength];

  const inputClass = "w-full px-5 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white font-medium outline-none transition-all placeholder-slate-600 shadow-inner text-sm";

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-950 p-6 relative overflow-hidden font-sans">
      {/* Deep Space Glowing Orbs */}
      <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Glassmorphic Signup Card */}
      <div className="bg-slate-900/50 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-slate-800/50 w-full max-w-xl z-10 relative my-10">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="PayEvery Logo" className="w-28 h-28 object-contain -mt-12 -mb-2 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10" />
          <h2 className="text-2xl font-extrabold text-white tracking-tight z-10">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1 z-10 font-medium">Join PayEvery — get <span className="text-pink-500 font-bold">৳1000 bKash</span> + <span className="text-orange-500 font-bold">৳1000 Nagad</span> free!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="bg-slate-800/20 p-6 rounded-2xl border border-slate-700/50 space-y-5">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Personal Info
            </h3>

            <div>
              <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                onKeyDown={e => e.key === "Enter" && refs.username.current?.focus()}
                className={inputClass} placeholder="e.g., Sohel Faruque" autoFocus />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Username</label>
              <div className="relative">
                <input ref={refs.username} type="text" name="username" value={form.username}
                  onChange={e => { handleChange(e); setUsernameStatus("idle"); }}
                  onBlur={e => checkUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && refs.phone.current?.focus()}
                  required className={`${inputClass} pr-10`} placeholder="e.g., sohel123" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                  {usernameStatus === "checking" && "⏳"}
                  {usernameStatus === "ok" && "✅"}
                  {usernameStatus === "taken" && "❌"}
                </span>
              </div>
              {usernameStatus === "ok" && <p className="text-green-400 text-xs mt-1.5 font-bold">Username is available!</p>}
              {usernameStatus === "taken" && <p className="text-red-400 text-xs mt-1.5 font-bold">Username already taken. Try another.</p>}
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Phone Number</label>
              <input ref={refs.phone} type="tel" name="phone" value={form.phone} onChange={handleChange} required
                onKeyDown={e => e.key === "Enter" && refs.password.current?.focus()}
                className={inputClass} placeholder="017XXXXXXXX" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Password</label>
                <input ref={refs.password} type="password" name="password" value={form.password} onChange={handleChange} required
                  onKeyDown={e => e.key === "Enter" && refs.pin.current?.focus()}
                  className={inputClass} placeholder="Min 6 chars" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">4-Digit PIN</label>
                <input ref={refs.pin} type="password" value={form.pin}
                  onChange={e => handlePinChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && refs.submit.current?.click()}
                  className={`${inputClass} text-center tracking-[0.5em] font-black`} placeholder="••••" maxLength={4} />
                {form.pin.length === 4 && (
                  <div className="mt-2">
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${pinStrengthColor} transition-all duration-300`} style={{ width: `${pinStrength * 33}%` }} />
                    </div>
                    <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${pinStrength === 3 ? "text-green-400" : pinStrength === 2 ? "text-yellow-400" : "text-red-400"}`}>{pinStrengthText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-slate-800/20 p-6 rounded-2xl border border-slate-700/50 space-y-5">
             <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Connect Wallets
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] inline-block" /> bKash No.
                </label>
                <input type="tel" name="bkashNumber" value={form.bkashNumber} onChange={handleChange}
                  className={inputClass} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] inline-block" /> Nagad No.
                </label>
                <input type="tel" name="nagadNumber" value={form.nagadNumber} onChange={handleChange}
                  className={inputClass} placeholder="Optional" />
              </div>
            </div>
          </div>

          {error && <p className="bg-red-500/10 text-red-400 font-medium p-4 rounded-xl border border-red-500/20 text-sm">{error}</p>}

          <button ref={refs.submit} type="submit"
            disabled={loading || usernameStatus === "taken" || usernameStatus === "checking" || form.pin.length < 4}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-base shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
            {loading ? "Creating Account..." : "Create Account & Get ৳2000 Free"}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
          <p className="text-sm text-slate-400 font-medium">Already have an account?{" "}
            <Link href="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}