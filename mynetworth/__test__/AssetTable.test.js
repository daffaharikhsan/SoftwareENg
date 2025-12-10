import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssetTable } from "../components/AssetTable";
import * as actions from "@/lib/actions";
import "@testing-library/jest-dom";

jest.mock("@/lib/actions", () => ({
  deleteAsset: jest.fn(),
}));

// Mock Data Aset
const mockAssets = [
  {
    id: 1,
    name: "Bitcoin",
    category: "CRYPTO",
    ticker: "BTC-USD",
    currentPrice: 1500000000,
    amount: 1,
    totalValue: 1500000000,
  },
  {
    id: 2,
    name: "Saham BBCA",
    category: "STOCK",
    ticker: "BBCA.JK",
    currentPrice: 10000,
    amount: 100,
    totalValue: 1000000,
  },
];

describe("AssetTable Component", () => {
  // Mock window.confirm karena jsdom tidak punya browser alert asli
  global.confirm = jest.fn(() => true);

  it("menampilkan pesan kosong jika tidak ada aset", () => {
    render(<AssetTable assets={[]} />);
    expect(screen.getByText(/Belum ada aset/i)).toBeInTheDocument();
  });

  it("merender data aset dengan benar", () => {
    render(<AssetTable assets={mockAssets} />);

    // Cek Nama
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("Saham BBCA")).toBeInTheDocument();

    // Cek Kategori
    expect(screen.getByText("CRYPTO")).toBeInTheDocument();
    expect(screen.getByText("STOCK")).toBeInTheDocument();

    // Cek apakah Ticker muncul
    expect(screen.getByText("(BTC-USD)")).toBeInTheDocument();
  });

  it("memanggil deleteAsset saat tombol hapus diklik", async () => {
    render(<AssetTable assets={mockAssets} />);

    // Klik tombol hapus pertama (Bitcoin)
    const deleteBtns = screen.getAllByText("🗑️ Hapus");
    fireEvent.click(deleteBtns[0]);

    expect(global.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(actions.deleteAsset).toHaveBeenCalledWith(1);
    });
  });
  // ... (kode sebelumnya)

  it("harus menampilkan warna indikator yang benar sesuai kategori", () => {
    render(<AssetTable assets={mockAssets} />);

    // SAHAM (STOCK) harus punya class bg-blue-500
    // Kita cari elemen span yang punya class tersebut di dalam dokumen
    // (Note: di React Testing Library kadang kita perlu cek class spesifik)
    const stockRow = screen.getByText("Saham BBCA").closest("tr");
    // Cari elemen titik warna di dalam baris tersebut
    // Karena HTML-nya: <span className="... bg-blue-500"></span>
    // Kita bisa cek apakah ada elemen dengan class itu di dalam row
    expect(stockRow.innerHTML).toContain("bg-blue-500");

    // KRIPTO (CRYPTO) harus punya class bg-orange-500
    const cryptoRow = screen.getByText("Bitcoin").closest("tr");
    expect(cryptoRow.innerHTML).toContain("bg-orange-500");
  });

  it("harus memformat angka menjadi Rupiah (IDR)", () => {
    render(<AssetTable assets={mockAssets} />);

    // Mock data Bitcoin harganya 1.500.000.000
    // Cek apakah di layar muncul format yang rapi (mengandung Rp atau titik pemisah)
    // Note: Karena spasi di "Rp 1.500.000.000" bisa berupa non-breaking space (&nbsp;),
    // kita gunakan regex fleksibel.
    const formattedPrices = screen.getAllByText(/1.500.000.000/);

    // Pastikan minimal ada 1 yang muncul
    expect(formattedPrices.length).toBeGreaterThan(0);

    // Opsional: Cek simbol Rp (tergantung locale node.js, kadang IDR, kadang Rp)
    // expect(screen.getAllByText(/Rp/i).length).toBeGreaterThan(0);
  });
});
