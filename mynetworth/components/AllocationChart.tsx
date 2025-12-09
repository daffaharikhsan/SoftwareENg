// components/AllocationChart.tsx
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#6366f1"];

// Definisi tipe props agar tidak merah
interface ChartProps {
  data: { name: string; value: number }[];
}

export function AllocationChart({ data }: ChartProps) {
  const activeData = data.filter((d) => d.value > 0);

  if (activeData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        Belum ada data aset.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">
        Alokasi Aset
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {activeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(value)
            }
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
