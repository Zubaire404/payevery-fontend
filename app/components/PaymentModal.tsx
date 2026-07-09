"use client";
import { useState } from "react";

interface CardDetails { number: string; expiry: string; cvv?: string; }

export default function PaymentModal({ isOpen, onClose, card }: {
  isOpen: boolean; onClose: () => void; card: CardDetails;
}) {
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<{ type: string; text: string } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  const handleCharge = async () => {
    setIsPaying(true);
    setStatus(null);
    try {
      const res = await fetch("http://https://payevery-backend.onrender.com//api/charge-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_number: card.number }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", text: "Payment successful! Card destroyed." });
        setTimeout(() => { onClose(); setStatus(null); setIsFlipped(false); }, 2500);
      } else {
        setStatus({ type: "error", text: data.detail });
      }
    } catch {
      setStatus({ type: "error", text: "Connection Error: Backend not responding!" });
    } finally {
      setIsPaying(false);
    }
  };

  const fmt = (n: string) => n || "•••• •••• •••• ••••";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" style={{ perspective: "1000px" }}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
        <button onClick={() => { onClose(); setIsFlipped(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl z-20">✕</button>
        <h3 className="text-xl font-black text-gray-900 mb-1">One-Time Burner Card</h3>
        <p className="text-gray-400 text-xs font-medium mb-6">Tap card to flip and view CVV.</p>

        {/* 3D Flip Card Container */}
        <div className="relative w-full h-[180px] mb-6 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)} style={{ perspective: "1000px" }}>
          <div className="w-full h-full relative transition-transform duration-700" style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
            
            {/* Front of Card */}
            <div className="absolute w-full h-full rounded-2xl p-6 overflow-hidden backface-hidden"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #4c1d95 100%)", backfaceVisibility: "hidden" }}>
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
              <div className="absolute -bottom-10 -left-6 w-44 h-44 rounded-full bg-white/5" />

              <div className="relative z-10 flex flex-col h-full gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">PayEvery</p>
                    <p className="text-white/40 text-xs">Virtual Card</p>
                  </div>
                  <div className="flex -space-x-3">
                    <div className="w-9 h-9 rounded-full bg-red-500 opacity-90" />
                    <div className="w-9 h-9 rounded-full bg-yellow-400 opacity-90" />
                  </div>
                </div>

                <div className="w-10 h-8 rounded-md border-2 border-yellow-400/60"
                  style={{ background: "linear-gradient(135deg,#d4a017,#f5d96b,#b8860b)" }} />

                <p className="text-white font-mono text-base tracking-widest font-bold">{fmt(card.number)}</p>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Expires</p>
                    <p className="text-white font-bold text-sm">{card.expiry || "MM/YY"}</p>
                  </div>
                  <div className="bg-white/10 px-3 py-1 rounded-full">
                    <p className="text-white/60 text-xs font-bold">SINGLE USE</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back of Card */}
            <div className="absolute w-full h-full rounded-2xl overflow-hidden backface-hidden"
              style={{ background: "linear-gradient(135deg, #312e81 0%, #1e3a8a 50%, #111827 100%)", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <div className="w-full h-10 bg-black mt-6 opacity-80"></div>
              <div className="px-6 mt-4">
                <div className="w-full h-10 bg-gray-200 rounded flex items-center justify-end px-4">
                  <span className="text-black font-bold font-mono tracking-widest">{card.cvv || "123"}</span>
                </div>
                <p className="text-white/40 text-[10px] mt-2 text-right uppercase font-bold tracking-widest">CVV / CVC</p>
              </div>
            </div>

          </div>
        </div>

        {status && (
          <div className={`mb-5 p-4 rounded-xl font-bold text-center text-sm ${status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {status.text}
          </div>
        )}

        <button onClick={handleCharge} disabled={isPaying || status?.type === "success"}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg z-10 relative">
          {isPaying ? "Processing..." : "Pay Now & Destroy Card 🔒"}
        </button>
      </div>
    </div>
  );
}