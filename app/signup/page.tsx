"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dob: "",
    bkashNumber: "",
    bkashOtp: "",
    nagadNumber: "",
    nagadOtp: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // হ্যাকাথনের জন্য শুধু ডামি সাকসেস মেসেজ দেখানো হচ্ছে
    alert("Account created successfully! Please log in with your new account.");
    router.push("/login"); 
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#f4f7fe] text-gray-900 font-sans p-6 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-gray-100 w-full max-w-2xl z-10 relative mt-10 mb-10">
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg mb-3">P</div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">Join PayEvery and secure your payments</p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-6">
          
          {/* 🔴 Personal Information Section */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Personal Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                <input 
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="e.g., Sohel Faruque Rahman" 
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                <input 
                  type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="017XXXXXXXX" 
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Date of Birth</label>
                <input 
                  type="date" name="dob" required value={formData.dob} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-600" 
                />
              </div>
            </div>
          </div>

          {/* 🔴 Wallet Connection Section */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4">Connect Wallets</h3>
            
            {/* bKash Section */}
            <div className="mb-5 pb-5 border-b border-blue-100 border-dashed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span> bKash Number
                  </label>
                  <input 
                    type="tel" name="bkashNumber" value={formData.bkashNumber} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all" 
                    placeholder="Enter bKash No." 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">bKash OTP</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" maxLength={6} name="bkashOtp" value={formData.bkashOtp} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all tracking-widest font-mono text-center" 
                      placeholder="• • • • • •" 
                    />
                    <button type="button" className="bg-pink-100 text-pink-600 font-bold px-4 rounded-xl hover:bg-pink-200 transition-colors text-sm whitespace-nowrap">
                      Get OTP
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Nagad Section */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Nagad Number
                  </label>
                  <input 
                    type="tel" name="nagadNumber" value={formData.nagadNumber} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                    placeholder="Enter Nagad No." 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Nagad OTP</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" maxLength={6} name="nagadOtp" value={formData.nagadOtp} onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all tracking-widest font-mono text-center" 
                      placeholder="• • • • • •" 
                    />
                    <button type="button" className="bg-orange-100 text-orange-600 font-bold px-4 rounded-xl hover:bg-orange-200 transition-colors text-sm whitespace-nowrap">
                      Get OTP
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 shadow-lg transition-all text-lg mt-4">
            Complete Registration
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
              Log in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}