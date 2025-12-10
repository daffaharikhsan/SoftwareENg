import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddAssetModal } from "../components/AddAssetModal";
import * as actions from "@/lib/actions";
import "@testing-library/jest-dom";

// 1. Mock Server Action agar tidak connect database beneran
jest.mock("@/lib/actions", () => ({
  addAsset: jest.fn(),
}));

describe("AddAssetModal Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("harus merender tombol tambah aset", () => {
    render(<AddAssetModal />);
    expect(screen.getByText("+ Tambah Aset")).toBeInTheDocument();
  });

  it("harus membuka modal saat tombol diklik", () => {
    render(<AddAssetModal />);
    fireEvent.click(screen.getByText("+ Tambah Aset"));
    expect(screen.getByText("Tambah Aset Baru")).toBeInTheDocument();
  });

  it("harus menampilkan input Ticker jika kategori STOCK dipilih", () => {
    render(<AddAssetModal />);
    fireEvent.click(screen.getByText("+ Tambah Aset"));

    // Default STOCK -> Ticker harus ada
    expect(screen.getByPlaceholderText(/e.g., BBCA.JK/i)).toBeInTheDocument();

    // Manual Price harus TIDAK ada
    expect(
      screen.queryByPlaceholderText(/Contoh: 1500000000/i)
    ).not.toBeInTheDocument();
  });

  it("harus mengganti input ke Manual Price jika kategori PROPERTY dipilih", () => {
    render(<AddAssetModal />);
    fireEvent.click(screen.getByText("+ Tambah Aset"));

    // Ganti select option ke PROPERTY
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "PROPERTY" } });

    // Ticker harus hilang
    expect(
      screen.queryByPlaceholderText(/e.g., BBCA.JK/i)
    ).not.toBeInTheDocument();

    // Manual Price harus muncul
    expect(
      screen.getByPlaceholderText(/Contoh: 1500000000/i)
    ).toBeInTheDocument();
  });

  it("harus memanggil server action addAsset saat form disubmit", async () => {
    render(<AddAssetModal />);
    fireEvent.click(screen.getByText("+ Tambah Aset"));

    // Isi Form
    fireEvent.change(screen.getByPlaceholderText(/Contoh: BBCA/i), {
      target: { value: "Bank BCA" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g., BBCA.JK/i), {
      target: { value: "BBCA.JK" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "100" },
    });

    // Klik Simpan
    const submitBtn = screen.getByText("Simpan Aset");
    fireEvent.click(submitBtn);

    // Pastikan fungsi addAsset dipanggil
    await waitFor(() => {
      expect(actions.addAsset).toHaveBeenCalledTimes(1);
    });
  });
  it("harus menutup modal saat tombol Batal diklik", () => {
    render(<AddAssetModal />);

    // Buka modal dulu
    fireEvent.click(screen.getByText("+ Tambah Aset"));
    expect(screen.getByText("Tambah Aset Baru")).toBeInTheDocument();

    // Klik tombol Batal
    fireEvent.click(screen.getByText("Batal"));

    // Pastikan modal hilang (gunakan queryByText untuk elemen yang diharapkan tidak ada)
    expect(screen.queryByText("Tambah Aset Baru")).not.toBeInTheDocument();
  });

  it("harus mereset form setelah submit sukses", async () => {
    render(<AddAssetModal />);
    fireEvent.click(screen.getByText("+ Tambah Aset"));

    const inputNama = screen.getByPlaceholderText(/Contoh: BBCA/i);

    // ISI SEMUA FIELD WAJIB AGAR BISA SUBMIT
    fireEvent.change(inputNama, { target: { value: "Saham Test Reset" } });

    // Karena default kategori STOCK, Ticker wajib diisi
    fireEvent.change(screen.getByPlaceholderText(/e.g., BBCA.JK/i), {
      target: { value: "TEST.JK" },
    });

    // Amount juga wajib
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "10" },
    });

    // Submit
    fireEvent.click(screen.getByText("Simpan Aset"));

    // Sekarang pasti terpanggil
    await waitFor(() => expect(actions.addAsset).toHaveBeenCalled());

    // Buka lagi modalnya untuk cek reset
    fireEvent.click(screen.getByText("+ Tambah Aset"));

    // Pastikan input nama sudah kosong lagi
    expect(inputNama).toHaveValue("");
  });
});
