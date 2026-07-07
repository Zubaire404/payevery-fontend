"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import PaymentModal from "../components/PaymentModal";

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------
interface SquadMember {
  id: number;
  name: string;
  initials: string;
  inputAmount: string | number;
  isLoadingRequest: boolean;
  hasContributed: boolean;
  hasPaid: boolean; // 🔴 NEW: Pay অপশনের স্টেট
  avatarColor: string;
}

export default function SquadPay() {
  const [username, setUsername] = useState("Loading...");
  
  // রিয়েল ডাটাবেস ব্যালেন্স
  const [balances, setBalances] = useState({ bkash: 0, nagad: 0, rocket: 0, total: 0 });

  // ডামি ইউজার লিস্ট (Request এবং Pay দুটির জন্যই)
  const [squad, setSquad] = useState<SquadMember[]>([
    { id: 1, name: "Alice Rahman", initials: "AR", inputAmount: 10.00, isLoadingRequest: false, hasContributed: false, hasPaid: false, avatarColor: "bg-pink-500" },
    { id: 2, name: "Bob Hossain", initials: "BH", inputAmount: 20.00, isLoadingRequest: false, hasContributed: false, hasPaid: false, avatarColor: "bg-orange-500" },
    { id: 3, name: "Charlie Khan", initials: "CK", inputAmount: 5.00, isLoadingRequest: false, hasContributed: false, hasPaid: false, avatarColor: "bg-emerald-500" },
  ]);

  // ওয়েবসাইটের চেকআউটের জন্য স্টেট (ড্যাশবোর্ডের মতো)
  const [websiteLink, setWebsiteLink] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState<number | string>(35.0); 
  const [currency, setCurrency] = useState("USD");

  // 🔴 NEW: পেমেন্ট ও ভেরিফিকেশন স্টেট
  const [activeMember, setActiveMember] = useState<SquadMember | null>(null); // বন্ধুকে পে করার ট্র্যাক রাখতে
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [generatedCard, setGeneratedCard] = useState("");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: "", type: 'success' });

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

  const handleAmountChange = (id: number, value: string) => {
    setSquad((prev) => prev.map((m) => m.id === id ? { ...m, inputAmount: value } : m));
  };

  // 🔴 Function 1: Request Funds (পুনরায় রিকোয়েস্ট করার লজিকসহ)
  const handleRequestFunds = (memberId: number, name: string, inputAmount: string | number) => {
    const amount = parseFloat(inputAmount as string);
    if (!amount || amount <= 0) return;

    setSquad((prev) => prev.map((m) => (m.id === memberId ? { ...m, isLoadingRequest: true } : m)));

    setTimeout(() => {
      const amountInBdt = amount * 120; // ডেমো ম্যাজিক: ব্যালেন্স বাড়ানো হচ্ছে
      setBalances((prev) => ({
        ...prev,
        bkash: prev.bkash + amountInBdt, 
        total: prev.total + amountInBdt
      }));

      // সফল হওয়ার পর hasContributed true করা হলো
      setSquad((prev) => prev.map((m) => m.id === memberId ? { ...m, isLoadingRequest: false, hasContributed: true } : m));
      
      setToast({ show: true, message: `✅ Request granted! $${amount.toFixed(2)} added to your balance.`, type: 'info' });
      setTimeout(() => setToast({ show: false, message: "", type: 'info' }), 4000);

      // 🔴 NEW: ৩ সেকেন্ড পর বাটনটি আবার আগের অবস্থায় ফিরে আসবে (Reusable)
      setTimeout(() => {
        setSquad((prev) => prev.map((m) => m.id === memberId ? { ...m, hasContributed: false } : m));
      }, 3000);

    }, 1500);
  };

  // 🔴 Function 2: Initiate Friend Payment
  const initiateFriendPayment = (member: SquadMember) => {
    const amount = parseFloat(member.inputAmount as string);
    if (!amount || amount <= 0) return;
    setActiveMember(member);
    setIsVerificationOpen(true);
  };

  // 🔴 Function 3: Initiate Website Checkout
  const initiateWebsitePayment = () => {
    if (!websiteLink || !checkoutAmount) return;
    setActiveMember(null); // ওয়েবসাইটের ক্ষেত্রে activeMember null থাকবে
    setIsVerificationOpen(true);
  };

  // 🔴 Function 4: Execute Payment (বন্ধু বা ওয়েবসাইট উভয়ের জন্য)
  const executePayment = async () => {
    // 🔴 Security Check (Hackathon Demo PIN/OTP)
    if (pin !== "1234" || otp !== "123456") {
      setToast({ show: true, message: "❌ Invalid PIN or OTP! Access Denied.", type: 'error' });
      setTimeout(() => setToast({ show: false, message: "", type: 'error' }), 3000);
      return; 
    }

    setIsVerificationOpen(false); 
    setIsAnalyzing(true);
    
    // বন্ধুকে পে করলে একটি ডামি লোকাল URL, ওয়েবসাইটের ক্ষেত্রে আসল URL
    const targetUrl = activeMember ? `https://squadpay.local/transfer/${activeMember.name.replace(/\s+/g, '').toLowerCase()}` : websiteLink;
    const amountToPay = activeMember ? parseFloat(activeMember.inputAmount as string) : parseFloat(checkoutAmount as string);
    const payCurrency = activeMember ? "USD" : currency;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/split-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          target_url: targetUrl, 
          amount: amountToPay, 
          currency: payCurrency
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedCard(data.virtual_card);
        fetchUserBalance(username); 
        
        // যদি বন্ধুকে পে করা হয়, তবে তার বাটনটি Paid করে দেওয়া (৩ সেকেন্ড পর আবার রিসেট হবে)
        if (activeMember) {
          setSquad(prev => prev.map(m => m.id === activeMember.id ? { ...m, hasPaid: true } : m));
          setTimeout(() => {
            setSquad(prev => prev.map(m => m.id === activeMember.id ? { ...m, hasPaid: false } : m));
          }, 3000);
        }

        setToast({ show: true, message: `✅ ${data.ai_safety_status}! Paid Securely. Card ${data.virtual_card} generated.`, type: 'success' });
        setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 4000);
        
        setTimeout(() => setIsPaymentOpen(true), 1500);
      } else {
        setToast({ show: true, message: `🚨 ${data.detail}`, type: 'error' });
        setTimeout(() => setToast({ show: false, message: "", type: 'error' }), 4000);
      }
    } catch (error) {
      setToast({ show: true, message: "❌ Backend Error! Is FastAPI running?", type: 'error' });
      setTimeout(() => setToast({ show: false, message: "", type: 'error' }), 4000);
    } finally {
      setIsAnalyzing(false);
      setPin("");
      setOtp("");
      setActiveMember(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-gray-900 font-sans pb-10 relative overflow-hidden">
      
      {toast.show && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border 
            ${toast.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 
              toast.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' : 
              'bg-blue-100 border-blue-500 text-blue-700'}`}>
            {toast.message}
          </div>
        </div>
      )}

      <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
            <h1 className="text-2xl font-extrabold text-gray-900">Pay<span className="text-blue-600">Every</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700 hidden md:block">Hello, {username}! 👋</span>
            <Link href="/dashboard" className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-2">
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Squad Pay ⚡</h2>
            <p className="text-gray-500 font-medium">Pool funds from friends, pay them directly, or safely pay shared bills with AI verification.</p>
          </div>
        </div>

        {/* Real Database Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="col-span-1 md:col-span-3 lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-800 p-6 rounded-2xl shadow-xl text-white transition-all transform hover:scale-[1.02]">
            <p className="text-sm font-medium opacity-80 mb-1">Total Squad Power (USD)</p>
            <h3 className="text-4xl font-black">$ {(balances.total / 120).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-bold mb-1">bKash (Real)</p>
            <h3 className="text-2xl font-black text-gray-800">৳ {balances.bkash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-bold mb-1">Nagad (Real)</p>
            <h3 className="text-2xl font-black text-gray-800">৳ {balances.nagad.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
          
          {/* 🔴 SECTION 1: Manage Squad Funds (Request & Pay Friends) */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-2">1. Manage Squad Funds</h3>
            <p className="text-gray-500 text-sm mb-6">Request contributions to boost your balance, or pay your squad directly.</p>
            
            <div className="space-y-4">
              {squad.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner flex-shrink-0 ${member.avatarColor}`}>
                    {member.initials}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-md font-bold text-gray-900">{member.name}</h4>
                  </div>
                  <div className="w-full sm:w-24 relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                    <input 
                      type="number" min="1" step="0.1" value={member.inputAmount} 
                      onChange={(e) => handleAmountChange(member.id, e.target.value)}
                      disabled={member.hasContributed || member.isLoadingRequest || member.hasPaid}
                      className="w-full pl-7 pr-2 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 disabled:bg-gray-100 text-sm"
                    />
                  </div>
                  
                  {/* 🔴 NEW: Action Buttons (Request & Pay) */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleRequestFunds(member.id, member.name, member.inputAmount)}
                      disabled={member.isLoadingRequest || member.hasContributed || member.hasPaid || isAnalyzing}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm
                        ${member.hasContributed 
                          ? 'bg-green-50 text-green-600 cursor-not-allowed' 
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }
                      `}
                    >
                      {member.isLoadingRequest ? "..." : member.hasContributed ? "Added ✓" : "Request"}
                    </button>

                    <button
                      onClick={() => initiateFriendPayment(member)}
                      disabled={member.isLoadingRequest || member.hasContributed || member.hasPaid || isAnalyzing}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm
                        ${member.hasPaid 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                        }
                      `}
                    >
                      {member.hasPaid ? "Paid ✓" : "Pay"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🔴 SECTION 2: Checkout Shared Bill (Pay on Website) */}
          <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-8 shadow-2xl text-white">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">2. Pay Shared Bill 🤖</h3>
            <p className="text-indigo-200 text-sm mb-6">Enter the merchant link. Our AI will secure the shared transaction.</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Checkout Link</label>
                <input 
                  type="url" value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} 
                  placeholder="e.g., https://netflix.com" 
                  className="w-full px-5 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50" 
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Total Bill</label>
                  <input 
                    type="number" step="0.01" min="0.1" value={checkoutAmount} onChange={(e) => setCheckoutAmount(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50 font-bold text-center" 
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Currency</label>
                  <select 
                    value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50 font-bold cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={initiateWebsitePayment} 
                disabled={!websiteLink || !checkoutAmount || isAnalyzing} 
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-xl disabled:opacity-70 transition-all shadow-lg flex items-center justify-center gap-2 w-full"
              >
                {isAnalyzing && !activeMember ? "Analyzing Merchant..." : "Scan & Pay Bill"}
              </button>
            </div>
          </div>

        </div>
      </main>

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} cardNumber={generatedCard} />

      {/* 🔴 PIN & OTP Verification Modal (Dynamic Text for Friend vs Website) */}
      {isVerificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => { setIsVerificationOpen(false); setActiveMember(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">Authorize Payment</h3>
            
            {/* Dynamic Text Rendering */}
            <p className="text-gray-500 font-medium mb-6">
              {activeMember ? (
                <>You are paying <strong>${parseFloat(activeMember.inputAmount as string).toFixed(2)}</strong> directly to <strong>{activeMember.name}</strong>.</>
              ) : (
                <>You are paying <strong>${parseFloat(checkoutAmount as string).toFixed(2)} {currency}</strong> on a merchant site.</>
              )}
              <br/>
              Please enter your app PIN and OTP. <span className="text-xs text-blue-500 font-bold">(Demo PIN: 1234, OTP: 123456)</span>
            </p>
             
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">4-Digit PIN</label>
                <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-center tracking-[0.5em] font-black text-xl outline-none" placeholder="••••" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">6-Digit OTP</label>
                <div className="flex gap-2">
                  <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-center tracking-[0.5em] font-mono outline-none" placeholder="••••••" />
                  <button type="button" className="bg-blue-100 text-blue-600 font-bold px-4 rounded-xl hover:bg-blue-200 text-sm whitespace-nowrap">Get OTP</button>
                </div>
              </div>
            </div>

            <button onClick={executePayment} disabled={pin.length < 4 || otp.length < 6} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg">
              Verify & Send Funds
            </button>
          </div>
        </div>
      )}
    </div>
  );
}