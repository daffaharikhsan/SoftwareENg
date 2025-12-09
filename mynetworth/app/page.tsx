// app/page.tsx
import { getPortfolioData, EnrichedAsset } from "../lib/actions"; // Pakai ../ agar aman
import { AddAssetModal } from "@/components/AddAssetModal";
import { AssetTable } from "@/components/AssetTable";
import { AllocationChart } from "@/components/AllocationChart";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { assets, totalNetWorth } = await getPortfolioData();

  // Menyiapkan data untuk grafik
  const chartData = [
    {
      name: "Saham",
      value: assets
        .filter((a) => a.category === "STOCK")
        .reduce((acc: number, curr: EnrichedAsset) => acc + curr.totalValue, 0),
    },
    {
      name: "Kripto",
      value: assets
        .filter((a) => a.category === "CRYPTO")
        .reduce((acc: number, curr: EnrichedAsset) => acc + curr.totalValue, 0),
    },
    {
      name: "Properti",
      value: assets
        .filter((a) => a.category === "PROPERTY")
        .reduce((acc: number, curr: EnrichedAsset) => acc + curr.totalValue, 0),
    },
    {
      name: "Kas",
      value: assets
        .filter((a) => a.category === "CASH")
        .reduce((acc: number, curr: EnrichedAsset) => acc + curr.totalValue, 0),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            MyNetWorth
          </h1>
        </div>
        <AddAssetModal />
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Grid Layout: Kartu Total & Grafik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kartu Total Kekayaan */}
          <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-blue-100 text-lg font-medium mb-1">
                Total Kekayaan Bersih
              </h2>
              <p className="text-5xl font-bold tracking-tight">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(totalNetWorth)}
              </p>
              <div className="mt-6 flex gap-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  🚀 Aset Terpantau: {assets.length} item
                </span>
              </div>
            </div>
          </div>

          {/* Kartu Grafik Alokasi */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <AllocationChart data={chartData} />
          </div>
        </div>

        {/* Tabel Aset */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              Portofolio Aset
            </h3>
          </div>
          <AssetTable assets={assets} />
        </div>
      </div>
    </main>
  );
}
