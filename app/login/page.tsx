"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // 🔴 NEW: Link ইমপোর্ট করা হয়েছে

export default function Login() {
  // 🔴 FIX: ডিফল্ট নাম ফাঁকা রাখা হলো
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || pin.length < 4) {
      setError("⚠️ Please enter a valid username and 4-digit PIN.");
      return;
    }

    setIsLoading(true);

    // Security Check (Hackathon Demo)
    setTimeout(() => {
      if (pin === "1234") {
        localStorage.setItem("loggedInUser", username);
        router.push("/dashboard");
      } else {
        setError("❌ Invalid PIN! Please use the demo PIN: 1234");
        setPin(""); // ভুল পিন দিলে বক্স ফাঁকা করে দেবে
        setIsLoading(false);
      }
    }, 1500); 
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-md relative z-10 border border-gray-100">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg mb-4 transform transition-transform hover:scale-105">
            P
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Pay<span className="text-blue-600">Every</span></h1>
          <p className="text-gray-500 font-medium mt-2 text-center">Secure AI-powered payments for squads & professionals.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 uppercase tracking-wide">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-gray-900 outline-none transition-all" 
              placeholder="e.g., Sohel, Rifat, Ratul" 
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 uppercase tracking-wide">4-Digit PIN</label>
            <input 
              type="password" 
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-center tracking-[0.5em] font-black text-2xl outline-none transition-all" 
              placeholder="••••" 
              required
            />
            <p className="text-xs text-blue-500 mt-2 font-bold text-right">(Demo PIN: 1234)</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 font-bold p-4 rounded-xl border border-red-200 text-sm flex items-center gap-2 animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || pin.length < 4 || !username}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </>
            ) : "Secure Login"}
          </button>
        </form>

        {/* 🔴 FIX: Sign Up Link Added Back */}
        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
            >
              Sign up now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}