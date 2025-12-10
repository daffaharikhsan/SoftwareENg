// lib/actions.ts
"use server";

import { PrismaClient } from "@prisma/client";
import yahooFinance from "yahoo-finance2";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

// --- TYPE DEFINITIONS ---
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

// --- FUNGSI HELPER: GET USD TO IDR RATE ---
async function getUsdToIdrRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote("IDR=X");
    if (quote && typeof quote.regularMarketPrice === "number") {
      return quote.regularMarketPrice;
    }
  } catch (error) {
    console.warn("⚠️ Gagal fetch USD/IDR rate, gunakan rate default");
  }
  // Fallback rate (update manual jika perlu)
  return 15800; // 1 USD = 15,800 IDR (rata-rata 2024)
}

// --- FUNGSI UTAMA: GET DATA ---
export async function getPortfolioData() {
  const assets = await prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
  });

  let totalNetWorth = 0;

  // Ambil rate USD/IDR sekali di awal
  const usdToIdr = await getUsdToIdrRate();

  const enrichedAssets: EnrichedAsset[] = await Promise.all(
    assets.map(async (asset) => {
      let currentPrice = asset.manualPrice || 0;

      // Logika Saham Indonesia
      if (asset.category === "STOCK" && asset.ticker) {
        try {
          const quote = await yahooFinance.quote(asset.ticker);
          if (quote && typeof quote.regularMarketPrice === "number") {
            currentPrice = quote.regularMarketPrice * usdToIdr;
          }
        } catch (error) {
          console.error(
            `⚠️ Gagal koneksi Yahoo untuk ${asset.ticker}. Menggunakan data cadangan.`
          );

          // Fallback untuk saham Indonesia
          if (asset.ticker.includes("BCA") || asset.ticker.includes("BBCA"))
            currentPrice = 10200;
          else if (
            asset.ticker.includes("BRI") ||
            asset.ticker.includes("BBRI")
          )
            currentPrice = 5800;
          else currentPrice = 5000;
        }
      }

      // Logika Crypto (konversi USD ke IDR)
      if (asset.category === "CRYPTO" && asset.ticker) {
        try {
          const quote = await yahooFinance.quote(asset.ticker);
          if (quote && typeof quote.regularMarketPrice === "number") {
            // ✅ Konversi USD ke IDR
            currentPrice = quote.regularMarketPrice * usdToIdr;
          }
        } catch (error) {
          console.error(
            `⚠️ Gagal koneksi Yahoo untuk ${asset.ticker}. Menggunakan data cadangan.`
          );

          // Fallback untuk crypto (dalam IDR)
          if (asset.ticker.includes("BTC"))
            currentPrice = 1400000000; // ~1.4 Milyar IDR
          else if (asset.ticker.includes("ETH"))
            currentPrice = 50000000; // ~50 Juta IDR
          else currentPrice = 100000; // Default 100k IDR
        }
      }

      const totalValue = asset.amount * currentPrice;
      totalNetWorth += totalValue;

      return { ...asset, currentPrice, totalValue };
    })
  );

  return { assets: enrichedAssets, totalNetWorth };
}

// --- FUNGSI ADD BY FORM ---
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

// --- FUNGSI ADD BY AI (GEMINI) ---
export async function addAssetByAI(rawText: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return { success: false, message: "API Key Gemini tidak ditemukan." };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a financial asset extraction AI. Analyze this input: "${rawText}"
    
    YOUR JOB:
    1. Extract ALL financial assets mentioned in the input (can be multiple)
    2. If input is just greeting/question with NO asset → Return error
    3. Each asset should be a separate object in an array
    
    REJECT ONLY:
    - Pure greetings: "halo", "hi" (no context)
    - Pure questions: "apa itu saham?" (no asset info)
    - Complete nonsense
    
    EXTRACTION RULES:
    - Stocks: Add correct suffix based on market:
      * Indonesia (.JK): BCA→BBCA.JK, BRI→BBRI.JK, Mandiri→BMRI.JK, Telkom→TLKM.JK
      * US (no suffix): Apple→AAPL, Tesla→TSLA, Microsoft→MSFT, Google→GOOGL
      * Hong Kong (.HK): Tencent→0700.HK, Alibaba→9988.HK
      * Japan (.T): Toyota→7203.T, Sony→6758.T
      * Singapore (.SI): DBS→D05.SI, OCBC→O39.SI
      * Malaysia (.KL): Maybank→1155.KL, Public Bank→1295.KL
      * UK (.L): BP→BP.L, HSBC→HSBA.L
      * Australia (.AX): CBA→CBA.AX, BHP→BHP.AX
      * China Shanghai (.SS): Kweichow Moutai→600519.SS
      * China Shenzhen (.SZ): Ping An→000001.SZ
      * Korea (.KS): Samsung→005930.KS, Hyundai→005380.KS
      * India (.NS or .BO): Reliance→RELIANCE.NS, TCS→TCS.NS
      * Germany (.DE): SAP→SAP.DE, Volkswagen→VOW3.DE
      * France (.PA): LVMH→MC.PA, Total→TTE.PA
    - Crypto: BTC→BTC-USD, ETH→ETH-USD, BNB→BNB-USD, SOL→SOL-USD, ADA→ADA-USD
    - Property/Real Estate/Cash: extract mentioned price as manualPrice
    - Stocks/Crypto: set manualPrice=0 (auto-fetch)
    - Convert: "juta"→1000000, "M"/"milyar"→1000000000, "ribu"→1000, "billion"→1000000000
    - "keping" for crypto means units/coins
    
    CRITICAL: Return ONLY pure JSON array, no markdown, no backticks, no explanation.
    
    If REJECTED:
    {"error": "Input tidak valid. Contoh: '100 saham BCA', '0.5 Bitcoin', 'Rumah BSD 2M'"}
    
    If ACCEPTED (always return array, even for single asset):
    [
      {
        "name": "descriptive name",
        "category": "STOCK" | "CRYPTO" | "PROPERTY" | "CASH",
        "ticker": "string or null",
        "amount": number,
        "manualPrice": number
      }
    ]
    
    Examples:
    
    Single asset:
    "100 saham BCA" → [{"name":"Saham BCA","category":"STOCK","ticker":"BBCA.JK","amount":100,"manualPrice":0}]
    
    "50 shares Apple" → [{"name":"Apple Stock","category":"STOCK","ticker":"AAPL","amount":50,"manualPrice":0}]
    
    "200 shares Tencent" → [{"name":"Tencent","category":"STOCK","ticker":"0700.HK","amount":200,"manualPrice":0}]
    
    "100 Toyota stock" → [{"name":"Toyota","category":"STOCK","ticker":"7203.T","amount":100,"manualPrice":0}]
    
    Multiple assets:
    "beli 2 bitcoin dan 100 saham BRI" → [{"name":"Bitcoin","category":"CRYPTO","ticker":"BTC-USD","amount":2,"manualPrice":0},{"name":"Saham BRI","category":"STOCK","ticker":"BBRI.JK","amount":100,"manualPrice":0}]
    
    "punya 50 Apple stock dan 100 Samsung" → [{"name":"Apple Stock","category":"STOCK","ticker":"AAPL","amount":50,"manualPrice":0},{"name":"Samsung","category":"STOCK","ticker":"005930.KS","amount":100,"manualPrice":0}]
    
    "kemarin beli bitcoin 2 keping terus beli rumah 50 juta di tangerang" → [{"name":"Bitcoin","category":"CRYPTO","ticker":"BTC-USD","amount":2,"manualPrice":0},{"name":"Rumah Tangerang","category":"PROPERTY","ticker":null,"amount":1,"manualPrice":50000000}]
    
    Rejected:
    "halo" → {"error":"Input tidak valid. Contoh: '100 saham BCA', '0.5 Bitcoin', 'Rumah BSD 2M'"}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // ✅ DEBUG: Log response dari AI
    console.log("🤖 AI Response:", text);

    // Hapus markdown code blocks
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // ✅ DEBUG: Log setelah cleaning
    console.log("🧹 Cleaned text:", text);

    const data = JSON.parse(text);

    // ✅ CEK JIKA AI MENOLAK INPUT
    if (data.error) {
      return {
        success: false,
        message: data.error,
      };
    }

    // ✅ HANDLE MULTIPLE ASSETS (data sekarang array)
    const assets = Array.isArray(data) ? data : [data];

    // Validasi setiap asset
    for (const asset of assets) {
      if (!asset.name || !asset.category || isNaN(asset.amount)) {
        return {
          success: false,
          message:
            "Input tidak valid. Harap masukkan informasi aset seperti: '100 saham BCA' atau '0.5 Bitcoin'",
        };
      }
    }

    // ✅ INSERT SEMUA ASSETS KE DATABASE
    let addedCount = 0;
    const addedNames: string[] = [];

    for (const asset of assets) {
      const finalManualPrice =
        asset.category === "PROPERTY" || asset.category === "CASH"
          ? asset.manualPrice || 0
          : 0;

      await prisma.asset.create({
        data: {
          name: asset.name,
          category: asset.category,
          ticker: asset.ticker || null,
          amount: asset.amount,
          manualPrice: finalManualPrice,
        },
      });

      addedCount++;
      addedNames.push(asset.name);
    }

    revalidatePath("/");

    // ✅ RETURN MESSAGE YANG SESUAI
    if (addedCount === 1) {
      return {
        success: true,
        message: `✅ Berhasil menambahkan ${addedNames[0]}`,
      };
    } else {
      return {
        success: true,
        message: `✅ Berhasil menambahkan ${addedCount} aset: ${addedNames.join(
          ", "
        )}`,
      };
    }
  } catch (error) {
    console.error("❌ AI Error:", error);

    // ✅ Tampilkan error yang lebih detail
    if (error instanceof SyntaxError) {
      return {
        success: false,
        message:
          "AI mengembalikan format yang salah. Coba lagi atau gunakan form manual.",
      };
    }

    return {
      success: false,
      message:
        "Gagal memproses input. Coba format lain seperti: '100 saham BCA' atau 'Rumah Jakarta 2M'",
    };
  }
}

// --- FUNGSI DELETE ---
export async function deleteAsset(id: number) {
  await prisma.asset.delete({ where: { id } });
  revalidatePath("/");
}
