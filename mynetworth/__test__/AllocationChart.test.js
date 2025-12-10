import { render, screen } from "@testing-library/react";
import { AllocationChart } from "../components/AllocationChart";
import "@testing-library/jest-dom";

// MOCK RECHARTS: Kita bypass render chart aslinya agar tidak error di terminal
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="chart-container">{children}</div>
    ),
    PieChart: ({ children }) => <div>{children}</div>,
    Pie: () => <div>Pie Chart Mock</div>,
  };
});

describe("AllocationChart Component", () => {
  it("menampilkan pesan kosong jika data 0", () => {
    render(<AllocationChart data={[]} />);
    expect(screen.getByText("Belum ada data aset.")).toBeInTheDocument();
  });

  it("merender chart jika ada data", () => {
    const mockData = [{ name: "Stock", value: 100000 }];
    render(<AllocationChart data={mockData} />);

    expect(screen.getByText("Alokasi Aset")).toBeInTheDocument();
    // Karena kita mock Pie dengan teks "Pie Chart Mock"
    expect(screen.getByText("Pie Chart Mock")).toBeInTheDocument();
  });
});
