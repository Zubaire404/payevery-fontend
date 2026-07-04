"use client";
import { useState } from "react";

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  cardNumber 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  cardNumber: string; 
}) {
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{type: string, text: string} | null>(null);

  if (!isOpen) return null;

  // 🔴 কার্ড চার্জ ও ডেস্ট্রয় করার API কল
  const handleChargeCard = async () => {
    setIsPaying(true);
    setPaymentStatus(null);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/charge-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          card_number: cardNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentStatus({ type: "success", text: data.message });
        
        // পেমেন্ট সফল হলে ৩ সেকেন্ড পর মডালটি নিজে থেকেই বন্ধ হয়ে যাবে
        setTimeout(() => {
          onClose();
          setPaymentStatus(null);
        }, 3000);
      } else {
        setPaymentStatus({ type: "error", text: data.detail });
      }
    } catch (error) {
      setPaymentStatus({ type: "error", text: "Connection Error: Backend is not responding!" });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">
          ✕
        </button>
        
        <h3 className="text-2xl font-black text-gray-900 mb-2">Complete Payment</h3>
        <p className="text-gray-500 font-medium mb-6">
          Your one-time burner card has been created.
        </p>

        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-5 rounded-xl mb-6 shadow-lg">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Virtual Card Number</p>
          <p className="text-xl font-mono tracking-widest font-bold">{cardNumber}</p>
        </div>

        {/* Status Message */}
        {paymentStatus && (
          <div className={`mb-6 p-4 rounded-xl font-bold text-center ${paymentStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {paymentStatus.text}
          </div>
        )}

        <button
          onClick={handleChargeCard}
          disabled={isPaying || paymentStatus?.type === 'success'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isPaying ? "Processing Payment..." : "Pay Now & Destroy Card"}
        </button>
      </div>
    </div>
  );
}