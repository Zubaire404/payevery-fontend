"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import PaymentModal from "../components/PaymentModal";

const API = "https://payevery-backend.onrender.com";
const CURRENCIES = ["USD", "BDT", "EUR", "GBP", "INR"];

interface CardDetails { number: string; expiry: string; cvv?: string; }
interface Contribution { username: string; amount_bdt: number; paid_at: string; }
interface PoolDetails {
  pool_code: string; leader: string; leader_name: string;
  target_url: string; total_amount: number; currency: string;
  total_bdt: number; collected_bdt: number; remaining_bdt: number;
  remaining_amount: number; progress_pct: number; status: string;
  description: string; contributions: Contribution[];
  virtual_card?: string; expiry?: string; cvv?: string;
}
interface MyPool {
  pool_code: string; description: string; target_url: string;
  total_amount: number; currency: string; total_bdt: number;
  collected_bdt: number; progress_pct: number; status: string;
  is_leader: boolean; leader: string; date: string;
}

type Tab = "create" | "join" | "my-pools";
type Step = "form" | "scan" | "verify" | "done";

export default function SquadPay() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [balances, setBalances] = useState({ bkash: 0, nagad: 0, total: 0, total_usd: 0 });
  const [rates, setRates] = useState<Record<string, number>>({ BDT: 1, USD: 110 });

  const [activeTab, setActiveTab] = useState<Tab>("create");

  // --- Create Pool State ---
  const [createForm, setCreateForm] = useState({
    description: "", target_url: "", total_amount: "", currency: "USD",
  });
  const [createStep, setCreateStep] = useState<Step>("form");
  const [scanResult, setScanResult] = useState<{ score: number; text: string; type: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [createdPool, setCreatedPool] = useState<PoolDetails | null>(null);

  // --- Join / Contribute State ---
  const [joinCode, setJoinCode] = useState("");
  const [joinedPool, setJoinedPool] = useState<PoolDetails | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  // --- My Pools ---
  const [myPools, setMyPools] = useState<MyPool[]>([]);
  const [myPoolsLoading, setMyPoolsLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolDetails | null>(null);

  // --- Auth (PIN + OTP) for Contribute / Execute ---
  const [authPin, setAuthPin] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authDemoOtp, setAuthDemoOtp] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<"contribute" | "execute" | null>(null);
  const [verifyPoolCode, setVerifyPoolCode] = useState("");

  // --- Payment Card Modal ---
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [card, setCard] = useState<CardDetails>({ number: "", expiry: "" });

  const pinRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser") || "sohel";
    setUsername(user);
    fetchUser(user);
  }, []);

  useEffect(() => {
    if (activeTab === "my-pools" && username) fetchMyPools();
  }, [activeTab, username]);

  const fetchUser = async (user: string) => {
    try {
      const res = await fetch(`${API}/api/user/${user}`);
      if (res.ok) {
        const d = await res.json();
        setBalances({ bkash: d.bkash, nagad: d.nagad, total: d.total, total_usd: d.total_usd });
        setDisplayName(d.name || user);
        if (d.exchange_rates) setRates(d.exchange_rates);
      }
    } catch { /* silent */ }
  };

  const fetchMyPools = async () => {
    setMyPoolsLoading(true);
    try {
      const res = await fetch(`${API}/api/squad/my-pools/${username}`);
      if (res.ok) setMyPools(await res.json());
    } catch { /* silent */ }
    finally { setMyPoolsLoading(false); }
  };

  const requestOtp = async (u: string) => {
    const res = await fetch(`${API}/api/payment/request-otp`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u }),
    });
    const d = await res.json();
    if (res.ok) { setAuthDemoOtp(d.demo_otp); setAuthPhone(d.phone); }
  };

  // ────────────────────────────── CREATE POOL FLOW ──────────────────────────
  const handleScanUrl = async () => {
    if (!createForm.target_url || !createForm.total_amount) return;
    setIsAnalyzing(true); setScanResult(null);
    try {
      const res = await fetch(`${API}/api/check-url?url=${encodeURIComponent(createForm.target_url)}`);
      const d = await res.json();
      setScanResult({
        type: d.score >= 60 ? "success" : "error",
        text: d.score >= 60
          ? `✅ Verified Safe. Trust Score: ${d.score}/100. ${d.reason}`
          : `⚠️ Low Trust Score (${d.score}/100). ${d.reason}`,
        score: d.score,
      });
      setCreateStep("scan");
    } catch { setScanResult({ type: "error", text: "❌ Backend connection failed.", score: -1 }); setCreateStep("scan"); }
    finally { setIsAnalyzing(false); }
  };

  const handleCreatePool = async () => {
    try {
      const res = await fetch(`${API}/api/squad/create-pool`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leader_username: username,
          target_url: createForm.target_url,
          total_amount: parseFloat(createForm.total_amount),
          currency: createForm.currency,
          description: createForm.description,
        }),
      });
      const d = await res.json();
      if (!res.ok) { alert(`Error: ${d.detail}`); return; }
      // Now fetch full pool details
      const pr = await fetch(`${API}/api/squad/pool/${d.pool_code}`);
      setCreatedPool(await pr.json());
      setCreateStep("done");
      fetchMyPools();
    } catch { alert("❌ Backend connection failed."); }
  };

  // ────────────────────────────── JOIN / CONTRIBUTE FLOW ────────────────────
  const handleLookupPool = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    try {
      const res = await fetch(`${API}/api/squad/pool/${joinCode.trim().toUpperCase()}`);
      if (!res.ok) { alert("Pool not found. Check the code and try again."); return; }
      setJoinedPool(await res.json());
    } catch { alert("❌ Backend connection failed."); }
    finally { setJoinLoading(false); }
  };

  const openVerify = async (target: "contribute" | "execute", code: string) => {
    setVerifyTarget(target);
    setVerifyPoolCode(code);
    setAuthPin(""); setAuthOtp(""); setAuthDemoOtp(""); setAuthPhone("");
    setIsVerifying(true);
    await requestOtp(username);
    setTimeout(() => pinRef.current?.focus(), 100);
  };

  const handleContribute = async () => {
    try {
      const res = await fetch(`${API}/api/squad/contribute`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool_code: verifyPoolCode, contributor_username: username, pin: authPin, otp: authOtp }),
      });
      const d = await res.json();
      if (!res.ok) { alert(`❌ ${d.detail}`); return; }
      alert(`✅ ${d.message}`);
      setIsVerifying(false);
      fetchUser(username);
      // Refresh pool
      const pr = await fetch(`${API}/api/squad/pool/${verifyPoolCode}`);
      if (joinedPool?.pool_code === verifyPoolCode) setJoinedPool(await pr.json());
      if (selectedPool?.pool_code === verifyPoolCode) setSelectedPool(await pr.json());
      fetchMyPools();
    } catch { alert("❌ System error."); }
  };

  const handleExecute = async () => {
    try {
      const res = await fetch(`${API}/api/squad/execute`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool_code: verifyPoolCode, leader_username: username, pin: authPin, otp: authOtp }),
      });
      const d = await res.json();
      if (!res.ok) { alert(`❌ ${d.detail}`); return; }
      setCard({ number: d.virtual_card, expiry: d.expiry, cvv: d.cvv });
      setIsVerifying(false);
      fetchUser(username);
      fetchMyPools();
      // Refresh pool details
      const pr = await fetch(`${API}/api/squad/pool/${verifyPoolCode}`);
      const updated = await pr.json();
      if (selectedPool?.pool_code === verifyPoolCode) setSelectedPool(updated);
      setTimeout(() => setIsPaymentOpen(true), 500);
    } catch { alert("❌ System error."); }
  };

  const handleVerifySubmit = () => {
    if (authPin.length < 4 || authOtp.length < 6) return;
    if (verifyTarget === "contribute") handleContribute();
    else handleExecute();
  };

  const logout = () => { localStorage.removeItem("loggedInUser"); window.location.href = "/login"; };

  const statusColor = (s: string) =>
    s === "COMPLETED" ? "text-emerald-400 bg-emerald-900/30 border-emerald-500/30"
    : s === "FUNDED" ? "text-blue-400 bg-blue-900/30 border-blue-500/30"
    : s === "OPEN" ? "text-purple-400 bg-purple-900/30 border-purple-500/30"
    : "text-slate-400 bg-slate-800/30 border-slate-700/30";

  const scoreColor = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans pb-16 relative overflow-hidden">
      {/* Glowing Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <nav className="bg-slate-950/50 backdrop-blur-3xl sticky top-0 z-40 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PayEvery" className="w-16 h-16 object-contain -ml-2 -my-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <h1 className="text-xl font-bold text-white">Pay<span className="text-purple-500">Every</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold text-white hover:text-purple-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full transition-all">
              ← Dashboard
            </Link>
            <div className="h-4 w-[1px] bg-slate-700 hidden md:block" />
            <span className="text-sm text-slate-400 hidden md:block">Welcome, <span className="text-white">{displayName || username}</span></span>
            <button onClick={logout} className="text-sm text-slate-500 hover:text-red-400 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-10 relative z-10">

        {/* Header */}
        <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 via-slate-900/80 to-slate-900 border border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.1)] relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Squad Pay</h2>
                  <p className="text-purple-300/70 text-sm font-medium">Pool funds with your team for unified global payments.</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                Create a payment pool → share the code with your squad → everyone contributes their share → one unified virtual card is generated for checkout.
              </p>
            </div>
            <div className="flex gap-8 flex-shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Your Balance</p>
                <p className="text-2xl font-bold text-white">৳{balances.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">${balances.total_usd.toFixed(2)} USD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50 w-fit">
          {(["create", "join", "my-pools"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "text-slate-400 hover:text-white"}`}>
              {tab === "create" ? "✦ Create Pool" : tab === "join" ? "🔗 Join Pool" : "📋 My Pools"}
            </button>
          ))}
        </div>

        {/* ─────────────── TAB: CREATE POOL ─────────────── */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50 shadow-2xl">
              {createStep === "form" && (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">Create a Payment Pool</h3>
                  <p className="text-slate-400 text-sm mb-8">Set up a fund pool for your squad. Share the pool code so members can contribute their share.</p>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">What are you paying for?</label>
                      <input type="text" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="e.g. GitHub Copilot yearly plan for our team"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-600 shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Merchant / Checkout URL</label>
                      <input type="url" value={createForm.target_url} onChange={e => setCreateForm(f => ({ ...f, target_url: e.target.value }))}
                        placeholder="https://github.com/features/copilot"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-600 shadow-inner" />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Amount</label>
                        <input type="number" step="0.01" min="0.1" value={createForm.total_amount} onChange={e => setCreateForm(f => ({ ...f, total_amount: e.target.value }))}
                          placeholder="30.00"
                          className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner" />
                      </div>
                      <div className="w-28">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Currency</label>
                        <select value={createForm.currency} onChange={e => setCreateForm(f => ({ ...f, currency: e.target.value }))}
                          className="w-full px-4 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer shadow-inner">
                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    {createForm.total_amount && createForm.currency !== "BDT" && (
                      <p className="text-slate-500 text-xs font-medium px-1">
                        ≈ <span className="text-white">৳{(parseFloat(createForm.total_amount) * (rates[createForm.currency] || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BDT</span> total pool size
                      </p>
                    )}
                    <button onClick={handleScanUrl} disabled={!createForm.target_url || !createForm.total_amount || isAnalyzing}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                      {isAnalyzing ? "Analyzing security..." : "Verify & Create Pool →"}
                    </button>
                  </div>
                </>
              )}

              {createStep === "scan" && scanResult && (
                <>
                  <h3 className="text-xl font-bold text-white mb-6">Security Report</h3>
                  <div className={`p-5 rounded-2xl border mb-6 ${scanResult.type === "success" ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : "bg-red-900/20 border-red-500/30 text-red-400"}`}>
                    <p className="text-sm font-bold">{scanResult.text}</p>
                    {scanResult.score >= 0 && (
                      <div className="mt-4 w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${scoreColor(scanResult.score)} transition-all duration-1000`} style={{ width: `${scanResult.score}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30 mb-6 space-y-2">
                    <p className="text-xs text-slate-400"><span className="text-white font-bold">URL:</span> {createForm.target_url}</p>
                    <p className="text-xs text-slate-400"><span className="text-white font-bold">Amount:</span> {createForm.total_amount} {createForm.currency}</p>
                    <p className="text-xs text-slate-400"><span className="text-white font-bold">For:</span> {createForm.description || "—"}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setCreateStep("form"); setScanResult(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all">← Back</button>
                    <button onClick={handleCreatePool}
                      className={`flex-1 font-bold py-4 rounded-2xl transition-all ${scanResult.score < 60 ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"}`}>
                      {scanResult.score < 60 ? "⚠️ Create Anyway" : "✦ Create Pool"}
                    </button>
                  </div>
                </>
              )}

              {createStep === "done" && createdPool && (
                <>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-2xl">✅</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Pool Created!</h3>
                    <p className="text-slate-400 text-sm">Share this code with your squad members.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-purple-900/20 border border-purple-500/30 text-center mb-6">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Pool Code</p>
                    <p className="text-4xl font-black text-white tracking-widest font-mono">{createdPool.pool_code}</p>
                    <button onClick={() => { navigator.clipboard.writeText(createdPool.pool_code); alert("Copied!"); }}
                      className="mt-3 text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors">📋 Copy Code</button>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30 mb-6 space-y-3">
                    <div className="flex justify-between"><span className="text-xs text-slate-400">Target</span><span className="text-xs text-white font-bold">{createdPool.target_url.replace(/^https?:\/\//, '')}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-400">Total</span><span className="text-xs text-white font-bold">{createdPool.total_amount} {createdPool.currency}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-400">≈ BDT</span><span className="text-xs text-white font-bold">৳{createdPool.total_bdt.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-400">Status</span><span className="text-xs font-bold text-purple-400">{createdPool.status}</span></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setCreateStep("form"); setCreatedPool(null); setScanResult(null); setCreateForm({ description: "", target_url: "", total_amount: "", currency: "USD" }); }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-2xl transition-all text-sm">Create Another</button>
                    <button onClick={() => { setActiveTab("my-pools"); fetchMyPools(); }}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]">My Pools →</button>
                  </div>
                </>
              )}
            </div>

            {/* How it works */}
            <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/30">
              <h3 className="text-lg font-bold text-white mb-6">How Squad Pay Works</h3>
              <div className="space-y-5">
                {[
                  { icon: "✦", title: "1. Create a Pool", desc: "Set the merchant URL, total amount, and currency. Squad Pay verifies the merchant is safe." },
                  { icon: "🔗", title: "2. Share the Code", desc: "Share your unique 8-character pool code with teammates via WhatsApp, Discord, etc." },
                  { icon: "💳", title: "3. Squad Contributes", desc: "Each member joins with the pool code, verifies with PIN + OTP, and their share is deducted from their local wallet instantly." },
                  { icon: "⚡", title: "4. Execute Payment", desc: "Once enough funds are collected, the Squad Leader executes to generate one unified virtual dollar card for checkout." },
                ].map(s => (
                  <div key={s.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{s.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-5 rounded-2xl bg-blue-900/10 border border-blue-500/20">
                <p className="text-xs font-bold text-blue-400 mb-2">📌 Example</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  3 devs want to buy a $30 GitHub Copilot plan. User A creates a $30 pool. B & C each join and contribute $10 from their bKash. A also chips in $10. Once $30 is pooled, A executes — and a <strong className="text-white">$30 virtual card</strong> is instantly generated!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────── TAB: JOIN POOL ─────────────── */}
        {activeTab === "join" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Join a Squad Pool</h3>
              <p className="text-slate-400 text-sm mb-8">Enter the pool code shared by your squad leader to look up the pool and contribute your share.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pool Code</label>
                  <div className="flex gap-3">
                    <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && handleLookupPool()}
                      placeholder="SQUAD-XXXXXX"
                      className="flex-1 px-5 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-600 uppercase shadow-inner" />
                    <button onClick={handleLookupPool} disabled={!joinCode.trim() || joinLoading}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-4 rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      {joinLoading ? "..." : "Find"}
                    </button>
                  </div>
                </div>
              </div>

              {joinedPool && (
                <div className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Pool</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor(joinedPool.status)}`}>{joinedPool.status}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-xs text-slate-400">Leader</span><span className="text-xs text-white font-bold">@{joinedPool.leader}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-400">For</span><span className="text-xs text-white font-bold">{joinedPool.description || joinedPool.target_url.replace(/^https?:\/\//, '')}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-400">Total</span><span className="text-xs text-white font-bold">{joinedPool.total_amount} {joinedPool.currency}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-slate-400">Collected</span><span className="text-xs text-white font-bold">৳{joinedPool.collected_bdt.toLocaleString()} / ৳{joinedPool.total_bdt.toLocaleString()}</span></div>
                    <div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mt-2">
                        <div className="h-full bg-purple-500 transition-all duration-1000 shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ width: `${joinedPool.progress_pct}%` }} />
                      </div>
                      <p className="text-[10px] text-purple-400 font-bold mt-1 text-right">{joinedPool.progress_pct}% funded</p>
                    </div>
                  </div>

                  {joinedPool.contributions.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Contributors</p>
                      <div className="space-y-2">
                        {joinedPool.contributions.map((c, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <span className="text-sm text-white font-bold">@{c.username}</span>
                            <span className="text-sm text-purple-400 font-bold">৳{c.amount_bdt.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {joinedPool.status === "OPEN" && (
                    <button onClick={() => openVerify("contribute", joinedPool.pool_code)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      ⚡ Contribute My Share
                    </button>
                  )}
                  {joinedPool.status === "COMPLETED" && joinedPool.virtual_card && (
                    <div className="p-5 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 text-center">
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-2">Pool Completed!</p>
                      <p className="text-white font-bold font-mono tracking-widest">{joinedPool.virtual_card}</p>
                      <p className="text-slate-400 text-xs mt-1">Card was generated for this pool.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/30">
              <h3 className="text-lg font-bold text-white mb-6">Your Share Calculator</h3>
              {joinedPool ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-purple-900/20 border border-purple-500/30 text-center">
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-2">Remaining to Fund</p>
                    <p className="text-4xl font-black text-white">{joinedPool.remaining_amount.toFixed(2)} {joinedPool.currency}</p>
                    <p className="text-sm text-slate-400 mt-1 font-medium">৳{joinedPool.remaining_bdt.toLocaleString()} BDT</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30 space-y-2">
                    <p className="text-xs text-slate-400">Your bKash: <span className="text-white font-bold">৳{balances.bkash.toLocaleString()}</span></p>
                    <p className="text-xs text-slate-400">Your Nagad: <span className="text-white font-bold">৳{balances.nagad.toLocaleString()}</span></p>
                    <p className="text-xs text-slate-400 pt-2 border-t border-slate-700">Available: <span className="text-emerald-400 font-bold">৳{balances.total.toLocaleString()}</span></p>
                  </div>
                  {balances.total < joinedPool.remaining_bdt && (
                    <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/30">
                      <p className="text-xs text-amber-400 font-bold">⚠️ You can contribute your full balance of ৳{balances.total.toLocaleString()} towards this pool.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-600">
                  <p className="text-sm">Enter a pool code to see details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────── TAB: MY POOLS ─────────────── */}
        {activeTab === "my-pools" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Your Pools</h3>
                <button onClick={fetchMyPools} className="text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors">↻ Refresh</button>
              </div>
              {myPoolsLoading ? (
                <div className="flex items-center justify-center h-48 text-slate-500"><p className="text-sm">Loading...</p></div>
              ) : myPools.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500 flex-col gap-3">
                  <span className="text-3xl">⚡</span>
                  <p className="text-sm">No squad pools yet. Create one!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {myPools.map(pool => (
                    <button key={pool.pool_code} onClick={async () => {
                      const res = await fetch(`${API}/api/squad/pool/${pool.pool_code}`);
                      if (res.ok) setSelectedPool(await res.json());
                    }}
                      className={`w-full text-left p-5 rounded-2xl border transition-all hover:border-purple-500/50 hover:bg-slate-800/50 ${selectedPool?.pool_code === pool.pool_code ? "border-purple-500/50 bg-slate-800/50" : "border-slate-700/30 bg-slate-800/20"}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-mono font-bold text-purple-400">{pool.pool_code}</p>
                          <p className="text-sm font-bold text-white mt-0.5">{pool.description || pool.target_url.replace(/^https?:\/\//, '')}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ml-2 ${statusColor(pool.status)}`}>{pool.status}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">{pool.total_amount} {pool.currency} • {pool.is_leader ? "👑 Leader" : "👤 Member"}</span>
                        <span className="text-xs text-slate-400">{pool.date}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${pool.progress_pct}%` }} />
                      </div>
                      <p className="text-[10px] text-purple-400/70 font-bold mt-1 text-right">{pool.progress_pct}%</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pool Detail Panel */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50 shadow-2xl">
              {!selectedPool ? (
                <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-3">
                  <span className="text-3xl">👈</span>
                  <p className="text-sm">Select a pool to see details</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs font-mono font-bold text-purple-400 mb-1">{selectedPool.pool_code}</p>
                      <h3 className="text-xl font-bold text-white">{selectedPool.description || selectedPool.target_url.replace(/^https?:\/\//, '')}</h3>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0 ml-3 ${statusColor(selectedPool.status)}`}>{selectedPool.status}</span>
                  </div>

                  {/* Progress */}
                  <div className="p-5 rounded-2xl bg-purple-900/20 border border-purple-500/20 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Pool Progress</span>
                      <span className="text-sm font-bold text-white">{selectedPool.progress_pct}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.6)]" style={{ width: `${selectedPool.progress_pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Collected: <strong className="text-white">৳{selectedPool.collected_bdt.toLocaleString()}</strong></span>
                      <span className="text-slate-400">Total: <strong className="text-white">৳{selectedPool.total_bdt.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target</p>
                      <p className="text-sm text-white font-bold truncate">{selectedPool.total_amount} {selectedPool.currency}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Leader</p>
                      <p className="text-sm text-white font-bold">@{selectedPool.leader}</p>
                    </div>
                  </div>

                  {/* Contributors */}
                  {selectedPool.contributions.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Contributors ({selectedPool.contributions.length})</p>
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {selectedPool.contributions.map((c, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <span className="text-sm text-white font-bold">@{c.username}</span>
                            <span className="text-sm text-purple-400 font-bold">৳{c.amount_bdt.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed card */}
                  {selectedPool.status === "COMPLETED" && selectedPool.virtual_card && (
                    <div className="p-5 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 text-center mb-4">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Virtual Card Generated!</p>
                      <p className="text-white font-bold font-mono tracking-widest text-lg">{selectedPool.virtual_card}</p>
                      <p className="text-slate-400 text-xs mt-1">Expiry: {selectedPool.expiry} • CVV: {selectedPool.cvv}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedPool.status === "OPEN" && selectedPool.leader === username && (
                    <button onClick={() => openVerify("execute", selectedPool.pool_code)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      ⚡ Execute Pool Payment
                    </button>
                  )}
                  {selectedPool.status === "FUNDED" && selectedPool.leader === username && (
                    <button onClick={() => openVerify("execute", selectedPool.pool_code)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      🚀 Generate Unified Card
                    </button>
                  )}
                  {selectedPool.status === "OPEN" && selectedPool.leader !== username && (
                    <button onClick={() => openVerify("contribute", selectedPool.pool_code)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      ⚡ Contribute My Share
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─────── Verification Modal ─────── */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setIsVerifying(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-1">
              {verifyTarget === "contribute" ? "Confirm Contribution" : "Execute Pool Payment"}
            </h3>
            <p className="text-slate-400 text-sm mb-8 font-medium">
              {verifyTarget === "contribute" ? "Your share will be deducted from your wallet." : "Remaining balance (if any) will be deducted from your wallet and the virtual card will be generated."}
            </p>

            {authDemoOtp && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-5 mb-8 text-center">
                <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Auth Code (••••{authPhone})</p>
                <p className="text-4xl font-black text-white tracking-[0.2em] mt-3">{authDemoOtp}</p>
              </div>
            )}

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Your PIN</label>
                <input ref={pinRef} type="password" maxLength={4} value={authPin}
                  onChange={e => setAuthPin(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && authPin.length === 4 && otpRef.current?.focus()}
                  className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-purple-500/50 text-center tracking-[0.5em] font-black text-2xl text-white outline-none shadow-inner"
                  placeholder="••••" autoFocus />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">OTP Code</label>
                <input ref={otpRef} type="text" maxLength={6} value={authOtp}
                  onChange={e => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && authPin.length === 4 && authOtp.length === 6 && handleVerifySubmit()}
                  className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-purple-500/50 text-center tracking-[0.5em] font-mono text-xl font-bold text-white outline-none shadow-inner"
                  placeholder="••••••" />
              </div>
            </div>
            <button onClick={handleVerifySubmit} disabled={authPin.length < 4 || authOtp.length < 6}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {verifyTarget === "contribute" ? "⚡ Confirm Contribution" : "🚀 Generate Unified Card"}
            </button>
          </div>
        </div>
      )}

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} card={card} />
    </div>
  );
}