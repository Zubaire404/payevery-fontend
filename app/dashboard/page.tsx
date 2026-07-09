"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import PaymentModal from "../components/PaymentModal";

const API = "http://127.0.0.1:8000";
const CURRENCIES = ["USD","BDT","EUR","GBP","INR"];

interface CardDetails { number: string; expiry: string; cvv?: string; }
interface Transaction { id: number; merchant: string; amount: number; currency: string; amount_usd: number; status: string; date: string; }

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [balances, setBalances] = useState({ bkash: 0, nagad: 0, rocket: 0, total: 0, total_usd: 0 });
  const [rates, setRates] = useState<Record<string,number>>({ BDT:1, USD:110, EUR:120, GBP:140, INR:1.3 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [websiteLink, setWebsiteLink] = useState("");
  const [amount, setAmount] = useState<number|string>(2);
  const [currency, setCurrency] = useState("USD");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<{ score: number; text: string; type: string } | null>(null);
  
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [phone, setPhone] = useState("");
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [card, setCard] = useState<CardDetails>({ number:"", expiry:"" });

  const pinRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser") || "sohel";
    setUsername(user);
    fetchData(user);
  }, []);

  useEffect(() => { setScanResult(null); }, [websiteLink]);

  const fetchData = async (user: string) => {
    try {
      const res = await fetch(`${API}/api/user/${user}`);
      if (res.ok) {
        const data = await res.json();
        setBalances(data);
        setDisplayName(data.name || user);
        if (data.exchange_rates) setRates(data.exchange_rates);
      }
      const txRes = await fetch(`${API}/api/transactions/${user}`);
      if (txRes.ok) {
        setTransactions(await txRes.json());
      }
    } catch { console.error("Data fetch failed"); }
  };

  const handleScan = async () => {
    if (!websiteLink || !amount) return;
    setIsAnalyzing(true);
    setScanResult(null);
    try {
      const res = await fetch(`${API}/api/check-url?url=${encodeURIComponent(websiteLink)}`);
      const data = await res.json();
      
      if (data.score < 60) {
        setScanResult({ type: "error", text: `⚠️ Security Alert: Low Trust Score (${data.score}/100). ${data.reason}`, score: data.score });
      } else {
        setScanResult({ type: "success", text: `✅ Verified Safe. Trust Score: ${data.score}/100. ${data.reason}`, score: data.score });
      }
    } catch {
      setScanResult({ type: "error", text: "❌ Backend connection failed.", score: -1 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePayClick = () => {
    if (!scanResult) return;
    if (scanResult.score < 60 && scanResult.score !== -1) {
      setIsWarningOpen(true);
    } else {
      requestOTP();
    }
  };

  const requestOTP = async () => {
    setIsWarningOpen(false);
    try {
      const res = await fetch(`${API}/api/payment/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        setDemoOtp(data.demo_otp);
        setPhone(data.phone);
        setIsVerificationOpen(true);
      }
    } catch {
      setScanResult({ type: "error", text: "❌ Verification request failed.", score: -1 });
    }
  };

  const executePayment = async () => {
    try {
      const res = await fetch(`${API}/api/split-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, target_url: websiteLink, amount: parseFloat(amount as string), currency, pin, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setCard({ number: data.virtual_card, expiry: data.expiry, cvv: data.cvv });
        fetchData(username);
        setIsVerificationOpen(false);
        setScanResult(null);
        setWebsiteLink("");
        setTimeout(() => setIsPaymentOpen(true), 500);
      } else {
        alert(`🚨 Payment Failed: ${data.detail}`);
      }
    } catch { alert("❌ System Error."); }
    finally { setPin(""); setOtp(""); setDemoOtp(""); }
  };

  const logout = () => { localStorage.removeItem("loggedInUser"); window.location.href = "/login"; };

  const scoreColor = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans pb-12 selection:bg-blue-500/30 relative overflow-hidden">
      {/* Deep Space Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Sleek Navbar */}
      <nav className="bg-slate-950/50 backdrop-blur-3xl sticky top-0 z-40 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-50">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PayEvery Logo" className="w-16 h-16 object-contain -ml-2 -my-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h1 className="text-xl font-bold tracking-tight text-white">Pay<span className="text-blue-500">Every</span></h1>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/squad-pay" className="px-5 py-2 text-sm font-semibold text-white hover:text-blue-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full transition-all duration-200 shadow-inner">
              ⚡ Squad Pay
            </Link>
            <div className="h-4 w-[1px] bg-slate-700 hidden md:block"></div>
            <span className="text-sm font-medium text-slate-400 hidden md:block">Welcome, <span className="text-white">{displayName || username}</span></span>
            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-400 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-10 relative z-10">
        
        {/* Premium Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
          <div className="md:col-span-6 lg:col-span-5 bg-gradient-to-br from-blue-900/40 via-slate-900/80 to-slate-900 p-8 rounded-3xl shadow-[0_0_30px_rgba(30,58,138,0.2)] border border-blue-500/20 text-white relative overflow-hidden group backdrop-blur-2xl">
            {/* Glossy overlay effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">Total Balance</p>
            <h3 className="text-5xl font-black tracking-tight mb-2 drop-shadow-md">৳ {balances.total.toLocaleString(undefined,{minimumFractionDigits:2})}</h3>
            <p className="text-slate-400 text-sm font-medium">USD Equivalent: <span className="text-slate-300">${balances.total_usd.toLocaleString(undefined,{minimumFractionDigits:2})}</span></p>
          </div>
          
          <div className="md:col-span-6 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-slate-800/50 hover:border-pink-500/30 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                  <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div>
                </div>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">bKash</p>
              </div>
              <h3 className="text-3xl font-bold text-white">৳ {balances.bkash.toLocaleString(undefined,{minimumFractionDigits:2})}</h3>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-slate-800/50 hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                </div>
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Nagad</p>
              </div>
              <h3 className="text-3xl font-bold text-white">৳ {balances.nagad.toLocaleString(undefined,{minimumFractionDigits:2})}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Secure Payment Terminal */}
          <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-800/50 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">Secure AI Checkout</h2>
            </div>
            <p className="text-slate-400 text-sm mb-8 relative z-10 font-medium">Intelligent fraud protection. Enter merchant details to generate a secure burner card.</p>
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Merchant Link</label>
                <input type="url" value={websiteLink} onChange={e => setWebsiteLink(e.target.value)}
                  placeholder="https://merchant.com/checkout"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner" />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Amount</label>
                  <input type="number" step="0.01" min="0.1" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white font-bold focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-white font-bold focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer shadow-inner">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {amount && currency !== "BDT" && (
                <p className="text-slate-400 text-xs font-medium px-1">
                  Estimated deduction: <span className="text-white">৳{(parseFloat(amount as string) * (rates[currency] || 1)).toLocaleString(undefined,{maximumFractionDigits:2})} BDT</span>
                </p>
              )}

              {/* Step 1: Scan Button */}
              {!scanResult && (
                <button onClick={handleScan} disabled={!websiteLink || !amount || isAnalyzing}
                  className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex justify-center w-full text-base tracking-wide">
                  {isAnalyzing ? "Analyzing Security Patterns..." : "Verify Merchant"}
                </button>
              )}
            </div>

            {/* Step 2: Show Scan Result & Pay Button */}
            {scanResult && (
              <div className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
                <div className={`p-5 rounded-2xl border ${scanResult.type === "success" ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : "bg-red-900/20 border-red-500/30 text-red-400"}`}>
                  <p className="text-sm font-bold tracking-wide">{scanResult.text}</p>
                  {scanResult.score >= 0 && (
                     <div className="mt-4">
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${scoreColor(scanResult.score)} transition-all duration-1000 ease-out shadow-[0_0_8px_currentColor]`} style={{ width: `${scanResult.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                
                <button onClick={handlePayClick}
                  className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg text-base tracking-wide ${scanResult.score < 60 ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}>
                  Authorize Payment
                </button>
              </div>
            )}
          </div>

          {/* Payment History Panel */}
          <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-800/50 flex flex-col h-[600px] relative z-10">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-slate-400"></div> Recent Activity
            </h3>
            <div className="overflow-y-auto pr-2 flex-1 space-y-3 relative custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-500">
                  <p className="text-sm font-medium">No activity yet</p>
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-800/30 hover:bg-slate-800/80 border border-slate-700/30 rounded-2xl transition-all group cursor-default">
                    <div className="overflow-hidden pr-3">
                      <p className="text-sm font-bold text-white truncate tracking-tight">{tx.merchant.replace(/^https?:\/\//, '')}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold tracking-wider uppercase">{new Date(tx.date).toLocaleDateString()} • {tx.status}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-white tracking-tight">{tx.amount.toLocaleString()} {tx.currency}</p>
                      {tx.currency !== 'BDT' && <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">${(tx.amount_usd).toFixed(2)}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} card={card} />

      {/* Warning Modal */}
      {isWarningOpen && scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_40px_rgba(220,38,38,0.2)] text-center">
            <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-red-500/20">🛡️</div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">High Risk Target</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
              This domain returned a Trust Score of <strong className="text-red-400">{scanResult.score}/100</strong>. The transaction is highly anomalous.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setIsWarningOpen(false)} className="w-full px-4 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md">Abort Transaction</button>
              <button onClick={requestOTP} className="w-full px-4 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold rounded-xl transition-all border border-red-500/20">Force Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {isVerificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => { setIsVerificationOpen(false); setPin(""); setOtp(""); setDemoOtp(""); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-2">Identity Verification</h3>
            <p className="text-slate-400 text-sm mb-8 font-medium">
              Authorizing <strong className="text-white">{amount} {currency}</strong>
            </p>

            {demoOtp && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5 mb-8 text-center shadow-inner">
                <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Auth Code ({phone})</p>
                <p className="text-4xl font-black text-white tracking-[0.2em] mt-3 drop-shadow-md">{demoOtp}</p>
              </div>
            )}

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Access PIN</label>
                <input ref={pinRef} type="password" maxLength={4} value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g,""))}
                  onKeyDown={e => e.key === "Enter" && pin.length === 4 && otpRef.current?.focus()}
                  className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-center tracking-[0.5em] font-black text-2xl text-white outline-none shadow-inner"
                  placeholder="••••" autoFocus />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">OTP Token</label>
                <input ref={otpRef} type="text" maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,""))}
                  onKeyDown={e => e.key==="Enter" && pin.length===4 && otp.length===6 && executePayment()}
                  className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-center tracking-[0.5em] font-mono text-xl font-bold text-white outline-none shadow-inner"
                  placeholder="••••••" />
              </div>
            </div>
            <button onClick={executePayment} disabled={pin.length<4 || otp.length<6}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 text-base shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              Confirm Authorization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}