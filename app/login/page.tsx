"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState(""); // 🔴 ডামি PIN-এর জন্য স্টেট
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN চেক করার কোনো লজিক নেই, নাম থাকলেই ড্যাশবোর্ডে চলে যাবে
    if (username.trim()) {
      localStorage.setItem("loggedInUser", username);
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#f4f7fe] text-gray-900 font-sans relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>

      <div className="bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-gray-100 w-[400px] z-10 relative">
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg mb-3">P</div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pay<span className="text-blue-600">Every</span></h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">Log in to your smart wallet</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block text-gray-700 text-sm font-bold mb-2">Username or Phone </label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 font-semibold outline-none transition-all" 
              placeholder="e.g. Sohel, Rifat, Hasan" 
            />
          </div>

          {/* 🔴 NEW: Dummy PIN Box */}
          <div className="mb-8">
            <label className="block text-gray-700 text-sm font-bold mb-2">Secure PIN</label>
            <input 
              type="password" 
              required
              maxLength={4}
              value={pin}
              // শুধু নম্বর টাইপ করতে পারবে, অন্য কোনো ক্যারেক্টার নয়
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 font-black text-xl tracking-[0.5em] text-center outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-medium" 
              placeholder="4-digit PIN" 
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 shadow-[0_8px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgb(37,99,235,0.4)] transition-all flex justify-center items-center gap-2 text-lg">
            Log in
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </form>

        {/* 🔴 NEW: Dummy Sign Up Link */}
        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            Don't have an account?{" "}
            {/* 🔴 Alert মুছে Next.js এর Link ব্যবহার করা হলো */}
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