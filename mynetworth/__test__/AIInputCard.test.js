import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIInputCard } from "../components/AIInputCard";
import * as actions from "@/lib/actions";
import "@testing-library/jest-dom";

// Mock Server Action
jest.mock("@/lib/actions", () => ({
  addAssetByAI: jest.fn(),
}));

describe("AIInputCard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("harus menampilkan input dan tombol kirim", () => {
    render(<AIInputCard />);
    expect(
      screen.getByPlaceholderText("Ketik asetmu di sini...")
    ).toBeInTheDocument();
    expect(screen.getByText("Kirim ↵")).toBeInTheDocument();
  });

  it("tombol harus disable jika input kosong", () => {
    render(<AIInputCard />);
    const button = screen.getByText("Kirim ↵");
    expect(button).toBeDisabled();
  });

  it("menampilkan pesan sukses jika AI berhasil", async () => {
    // Setup Mock Return Value (Sukses)
    actions.addAssetByAI.mockResolvedValueOnce({
      success: true,
      message: "✅ Berhasil menambahkan Saham BCA",
    });

    render(<AIInputCard />);
    const input = screen.getByPlaceholderText("Ketik asetmu di sini...");
    const button = screen.getByText("Kirim ↵");

    // User mengetik
    fireEvent.change(input, { target: { value: "Beli 100 saham BCA" } });
    fireEvent.click(button);

    // Cek loading state (opsional, kadang terlalu cepat)
    expect(screen.getByText("...")).toBeInTheDocument();

    // Tunggu hasil
    await waitFor(() => {
      expect(
        screen.getByText("✅ Berhasil menambahkan Saham BCA")
      ).toBeInTheDocument();
    });
  });

  it("menampilkan pesan error jika AI gagal", async () => {
    // Setup Mock Return Value (Gagal)
    actions.addAssetByAI.mockResolvedValueOnce({
      success: false,
      message: "Input tidak valid",
    });

    render(<AIInputCard />);
    const input = screen.getByPlaceholderText("Ketik asetmu di sini...");

    fireEvent.change(input, { target: { value: "Halo" } });
    fireEvent.click(screen.getByText("Kirim ↵"));

    await waitFor(() => {
      expect(screen.getByText("Input tidak valid")).toBeInTheDocument();
      // Pastikan class text-red-400 ada (indikator error)
      expect(screen.getByText("Input tidak valid")).toHaveClass("text-red-400");
    });
  });
  // ... (kode sebelumnya)

  it("menangani error sistem (crash) dengan baik", async () => {
    // Simulasikan Server Action melempar Error (Crash)
    actions.addAssetByAI.mockRejectedValue(new Error("Server Kebakaran"));

    // Kita mock console.error agar terminal testing bersih (opsional)
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<AIInputCard />);
    const input = screen.getByPlaceholderText("Ketik asetmu di sini...");

    fireEvent.change(input, {
      target: { value: "Input valid tapi server mati" },
    });
    fireEvent.click(screen.getByText("Kirim ↵"));

    await waitFor(() => {
      // Harusnya masuk ke blok catch(err) di komponen dan setStatus error
      expect(screen.getByText("Terjadi kesalahan sistem.")).toBeInTheDocument();
    });

    consoleSpy.mockRestore(); // Balikin fungsi console.error
  });
});
