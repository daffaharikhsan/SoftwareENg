"use client";

import { useState } from "react";
import { addAssetByAI } from "@/lib/actions";

export function AIInputCard() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  async function handleAISubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setStatus(null);

    try {
      const result = await addAssetByAI(input);
      if (result.success) {
        setStatus({ type: "success", msg: result.message || "Sukses!" });
        setInput("");
      } else {
        setStatus({ type: "error", msg: result.message || "Gagal." });
      }
    } catch (err) {
      // Menggunakan variabel err agar tidak warning
      console.error(err);
      setStatus({ type: "error", msg: "Terjadi kesalahan sistem." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-linear-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">✨</span>
        <h3 className="font-bold text-lg">Input Aset Pintar (AI)</h3>
      </div>

      {/* PERBAIKAN: Menggunakan tanda kutip satu agar ESLint tidak error */}
      <p className="text-slate-300 text-sm mb-4">
        Malas isi form? Ketik saja: <em>Beli 100 lembar saham BCA</em> atau{" "}
        <em>Punya 0.5 Bitcoin</em>.
      </p>

      <form onSubmit={handleAISubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik asetmu di sini..."
          disabled={isLoading}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 pr-24 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={isLoading || !input}
          className="absolute right-2 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : "Kirim ↵"}
        </button>
      </form>

      {status && (
        <div
          className={`mt-3 text-sm ${
            status.type === "success" ? "text-green-400" : "text-red-400"
          }`}
        >
          {status.msg}
        </div>
      )}
    </div>
  );
}
