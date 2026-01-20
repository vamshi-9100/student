"use client";

import { useState } from "react";
import { Search, Plus, Bus } from "lucide-react";

// -------------------- Dummy Vehicle Data --------------------
const vehicles = [
  {
    id: 1,
    name: "Bus 5 - School P",
    reg: "WB-07G-1672",
    status: "Moving",
    engine: "On",
    speed: 89.76,
    lastMove: "5 min ago",
  },
  {
    id: 2,
    name: "Bus 3 - VP Travelers",
    reg: "HR-06F-4322",
    status: "Online",
    engine: "On",
    speed: 74.0,
    lastMove: "2 min ago",
  },
  {
    id: 3,
    name: "Mini - VP Travels",
    reg: "HR-58T-3675",
    status: "Offline",
    engine: "Off",
    speed: 0,
    lastMove: "1 day ago",
  },
  {
    id: 4,
    name: "Bus 1 - VP Travelers",
    reg: "DL-04H-3267",
    status: "Online",
    engine: "Off",
    speed: 75.21,
    lastMove: "2 min ago",
  },
];

export default function VehicleDashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-[360px] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-semibold text-lg">Vehicles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All Vehicles
          </p>

          <div className="flex gap-2 mt-3">
            <StatusBadge label="Moving" count={1} color="bg-yellow-400" />
            <StatusBadge label="Offline" count={4} color="bg-gray-400" />
            <StatusBadge label="Online" count={3} color="bg-green-500" />
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search here..."
              className="pl-9 w-full border rounded-md p-2 text-sm bg-transparent border-gray-300 dark:border-slate-600"
            />
          </div>
        </div>

        {vehicles.map((v) => (
          <div
            key={v.id}
            onClick={() => setSelectedVehicle(v.id)}
            className={`p-4 border-b border-gray-200 dark:border-slate-700 cursor-pointer
              hover:bg-gray-50 dark:hover:bg-slate-700
              ${
                selectedVehicle === v.id
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : ""
              }`}
          >
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {v.reg}
                </p>
              </div>
              <span
                className={`h-2 w-2 rounded-full mt-2 ${
                  v.engine === "On" ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last Movement: {v.lastMove}
            </div>

            <div className="flex justify-between text-xs mt-2">
              <span>Engine {v.engine}</span>
              <span>{v.speed} km/h</span>
            </div>
          </div>
        ))}
      </aside>

      {/* Map Area */}
      <main className="flex-1 relative">
        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-end">
          <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm flex items-center gap-2 shadow">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        {/* Fake Map Background */}
        <div className="h-full w-full bg-[url('https://tile.openstreetmap.org/5/17/10.png')] bg-cover relative">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="absolute"
              style={{
                top: `${30 + v.id * 10}%`,
                left: `${40 + v.id * 8}%`,
              }}
            >
              <div className="bg-yellow-400 rounded-full p-2 shadow-lg">
                <Bus className="text-white" size={20} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Status Badge ---------------- */
function StatusBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      className={`${color} px-3 py-1 rounded text-xs font-medium text-black`}
    >
      {label} {count}
    </div>
  );
}
