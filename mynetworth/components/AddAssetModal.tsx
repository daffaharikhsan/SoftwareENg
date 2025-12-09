// components/AddAssetModal.tsx
"use client";

import { useState } from "react";
import { addAsset } from "@/lib/actions";

export function AddAssetModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("STOCK");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logika Kondisional SRS [cite: 293-295]
  const showTickerInput = category === "STOCK" || category === "CRYPTO";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    await addAsset(formData);

    setIsSubmitting(false);
    setIsOpen(false); // Tutup modal setelah simpan
    (event.target as HTMLFormElement).reset(); // Reset form
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        + Tambah Aset
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Tambah Aset Baru
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kategori Asset */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kategori Aset
                </label>
                <select
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-lg p-2 text-slate-900 bg-white"
                >
                  <option value="STOCK">Saham (Stock)</option>
                  <option value="CRYPTO">Kripto (Crypto)</option>
                  <option value="PROPERTY">Properti</option>
                  <option value="CASH">Kas / Tabungan</option>
                </select>
              </div>

              {/* Nama Aset */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Aset
                </label>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="Contoh: BBCA, Bitcoin, Rumah BSD"
                  className="w-full border rounded-lg p-2 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Input Kondisional: Ticker Symbol [cite: 294] */}
              {showTickerInput && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ticker Symbol (Yahoo Finance)
                  </label>
                  <input
                    required
                    name="ticker"
                    type="text"
                    placeholder="e.g., BBCA.JK, BTC-USD"
                    className="w-full border rounded-lg p-2 bg-blue-50 text-slate-900 placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan .JK untuk saham Indonesia (contoh: BBRI.JK)
                  </p>
                </div>
              )}

              {/* Jumlah Unit */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jumlah Unit / Lembar
                </label>
                <input
                  required
                  name="amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="w-full border rounded-lg p-2 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Input Kondisional: Manual Price [cite: 295] */}
              {!showTickerInput && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estimasi Nilai (Rupiah)
                  </label>
                  <input
                    required
                    name="manualPrice"
                    type="number"
                    placeholder="Contoh: 1500000000"
                    className="w-full border rounded-lg p-2 bg-green-50 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Aset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
