// components/AssetTable.tsx
"use client";

import { deleteAsset, EnrichedAsset } from "@/lib/actions";

const formatRupiah = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// Gunakan tipe EnrichedAsset yang sudah kita buat di actions.ts
export function AssetTable({ assets }: { assets: EnrichedAsset[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
          <tr>
            <th className="px-6 py-3">Nama Aset</th>
            <th className="px-6 py-3">Kategori</th>
            <th className="px-6 py-3 text-right">Harga Pasar</th>
            <th className="px-6 py-3 text-right">Jumlah Unit</th>
            <th className="px-6 py-3 text-right">Total Nilai</th>
            <th className="px-6 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {assets.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                Belum ada aset. Silakan tambahkan aset baru.
              </td>
            </tr>
          ) : (
            assets.map((asset) => (
              <tr
                key={asset.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        asset.category === "STOCK"
                          ? "bg-blue-500"
                          : asset.category === "CRYPTO"
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                    ></span>
                    {asset.name}
                    {asset.ticker && (
                      <span className="text-xs text-slate-400">
                        ({asset.ticker})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                    {asset.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {formatRupiah(asset.currentPrice)}
                </td>
                <td className="px-6 py-4 text-right">{asset.amount}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-800 font-mono">
                  {formatRupiah(asset.totalValue)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={async () => {
                      if (confirm("Yakin ingin menghapus aset ini?")) {
                        await deleteAsset(asset.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 font-medium text-sm"
                  >
                    🗑️ Hapus
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
