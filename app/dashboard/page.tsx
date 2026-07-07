"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import PaymentModal from "../components/PaymentModal";

export default function Dashboard() {
  const [username, setUsername] = useState("Loading...");
  const [balances, setBalances] = useState({ bkash: 0, nagad: 0, rocket: 0, total: 0 });
  
  const [websiteLink, setWebsiteLink] = useState("");
  const [amount, setAmount] = useState<number | string>(5.0); 
  const [currency, setCurrency] = useState("USD");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState({ type: "", text: "" });
  const [generatedCard, setGeneratedCard] = useState("");

  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser") || "Sohel Faruque Rahman";
    setUsername(user);
    fetchUserBalance(user);
  }, []);

  const fetchUserBalance = async (user: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/user/${user}`);
      if (res.ok) {
        const data = await res.json();
        setBalances(data);
      }
    } catch (err) {
      console.error("Failed to fetch balance");
    }
  };

  const handleAIAnalyze = async () => {
    if (!websiteLink || !amount) return;

    // 🔴 NEW: Hardcoded Security Check (Hackathon Demo)
    if (pin !== "1234" || otp !== "123456") {
      setAiMessage({ type: "error", text: "❌ Invalid PIN or OTP! Access Denied." });
      setPin(""); 
      setOtp(""); 
      return; 
    }

    setIsAnalyzing(true);
    setAiMessage({ type: "", text: "" });
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/split-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          target_url: websiteLink,
          amount: parseFloat(amount as string), 
          currency: currency
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAiMessage({ type: "success", text: `✅ ${data.ai_safety_status}! Card ${data.virtual_card} generated.` });
        setGeneratedCard(data.virtual_card);
        fetchUserBalance(username);
        
        setTimeout(() => setIsPaymentOpen(true), 1500);
      } else {
        setAiMessage({ type: "error", text: `🚨 ${data.detail}` });
      }
    } catch (error) {
      setAiMessage({ type: "error", text: "❌ Backend Error! Is FastAPI running?" });
    } finally {
      setIsAnalyzing(false);
      setPin(""); 
      setOtp(""); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-gray-900 font-sans pb-10">
      
      <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
            <h1 className="text-2xl font-extrabold text-gray-900">Pay<span className="text-blue-600">Every</span></h1>
          </div>
          <div className="flex items-center gap-4">
            
            <Link href="/squad-pay" className="px-5 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors flex items-center gap-2 border border-indigo-100">
              ⚡ Squad Pay
            </Link>

            <span className="text-sm font-bold text-gray-700 hidden md:block">Hello, {username}! 👋</span>
            
            <Link href="/login" className="px-5 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors">
              Logout
            </Link>
          </div>
        </div>    
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        
        <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-8 md:p-10 mb-10 shadow-2xl text-white">
          <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">Pay securely anywhere with AI 🤖</h2>
          <p className="text-indigo-200 font-medium mb-8">Set your payment amount and paste the checkout link. Our AI will handle the rest.</p>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Checkout Link</label>
                <input 
                  type="url" 
                  value={websiteLink} 
                  onChange={(e) => setWebsiteLink(e.target.value)} 
                  placeholder="e.g., https://amazon.com" 
                  className="w-full px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50" 
                />
              </div>
              
              <div className="w-32">
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.1"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="w-full px-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50 font-bold text-center" 
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50 font-bold cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => setIsVerificationOpen(true)} 
              disabled={!websiteLink || !amount || isAnalyzing} 
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-xl disabled:opacity-70 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isAnalyzing ? "Analyzing & Generating Card..." : "Scan & Pay Securely"}
            </button>
          </div>
          
          {aiMessage.text && (
            <div className={`mt-6 p-4 rounded-xl font-bold ${aiMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'}`}>
              {aiMessage.text}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="col-span-1 md:col-span-3 lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-800 p-6 rounded-2xl shadow-xl text-white">
            <p className="text-sm font-medium opacity-80 mb-1">Total Balance ({username})</p>
            <h3 className="text-4xl font-black">৳ {balances.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-bold mb-1">bKash</p>
            <h3 className="text-2xl font-black text-gray-800">৳ {balances.bkash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-bold mb-1">Nagad</p>
            <h3 className="text-2xl font-black text-gray-800">৳ {balances.nagad.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

      </main>

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} cardNumber={generatedCard} />

      {/* Security Verification Modal (PIN & OTP) */}
      {isVerificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsVerificationOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">
              ✕
            </button>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">Security Verification</h3>
            
            {/* 🔴 NEW: Demo PIN & OTP Hint */}
            <p className="text-gray-500 font-medium mb-6">
              Enter your PIN and OTP to authorize this payment.
              <br/>
              <span className="text-xs text-blue-500 font-bold">(Demo PIN: 1234, OTP: 123456)</span>
            </p>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">4-Digit App PIN</label>
                <input 
                  type="password" 
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-center tracking-[0.5em] font-black text-xl outline-none" 
                  placeholder="••••" 
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">6-Digit OTP</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-center tracking-[0.5em] font-mono outline-none" 
                    placeholder="••••••" 
                  />
                  <button type="button" className="bg-blue-100 text-blue-600 font-bold px-4 rounded-xl hover:bg-blue-200 text-sm whitespace-nowrap">
                    Get OTP
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsVerificationOpen(false); 
                handleAIAnalyze(); 
              }}
              disabled={pin.length < 4 || otp.length < 6} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Verify & Proceed
            </button>
          </div>
        </div>
      )}

    </div>
  );
}