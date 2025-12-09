// lib/actions.ts
"use server";

import { PrismaClient } from "@prisma/client";
import yahooFinance from "yahoo-finance2";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// Definisi tipe data
export interface EnrichedAsset {
  id: number;
  name: string;
  category: string;
  ticker: string | null;
  amount: number;
  manualPrice: number | null;
  currentPrice: number;
  totalValue: number;
  createdAt: Date;
}

export async function getPortfolioData() {
  const assets = await prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
  });

  let totalNetWorth = 0;

  const enrichedAssets: EnrichedAsset[] = await Promise.all(
    assets.map(async (asset) => {
      let currentPrice = asset.manualPrice || 0;

      // Logika API Yahoo Finance
      if (
        (asset.category === "STOCK" || asset.category === "CRYPTO") &&
        asset.ticker
      ) {
        try {
          // Ambil data quote
          const quote = await yahooFinance.quote(asset.ticker);

          // Cek dan ambil harga regularMarketPrice
          if (quote && typeof quote.regularMarketPrice === "number") {
            currentPrice = quote.regularMarketPrice;
            console.log(
              `✅ Sukses ambil harga ${asset.ticker}: Rp ${currentPrice}`
            );
          } else {
            console.log(
              `⚠️ Data ditemukan tapi harga kosong untuk ${asset.ticker}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Gagal koneksi Yahoo Finance untuk ${asset.ticker}. Menggunakan harga 0.`
          );
        }
      }

      const totalValue = asset.amount * currentPrice;
      totalNetWorth += totalValue;

      return {
        ...asset,
        currentPrice,
        totalValue,
      };
    })
  );

  return { assets: enrichedAssets, totalNetWorth };
}

export async function addAsset(formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const ticker = formData.get("ticker") as string | null;
  const amount = parseFloat(formData.get("amount") as string);
  const manualPrice = formData.get("manualPrice")
    ? parseFloat(formData.get("manualPrice") as string)
    : null;

  if (!name || !category || isNaN(amount)) {
    throw new Error("Input tidak valid");
  }

  await prisma.asset.create({
    data: {
      name,
      category,
      ticker: category === "STOCK" || category === "CRYPTO" ? ticker : null,
      amount,
      manualPrice: manualPrice || 0,
    },
  });

  revalidatePath("/");
}

export async function deleteAsset(id: number) {
  await prisma.asset.delete({ where: { id } });
  revalidatePath("/");
}
