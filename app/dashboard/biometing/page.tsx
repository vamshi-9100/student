"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const attendanceData = [
  {
    id: "ADM2025001",
    name: "Ravi",
    type: "Student",
    checkIn: "08:05",
    checkOut: "15:30",
    duration: "7h 25m",
    status: "Present",
  },
  {
    id: "STAFF001",
    name: "Rao",
    type: "Staff",
    checkIn: "08:55",
    checkOut: "--",
    duration: "--",
    status: "Late",
  },
];

export default function AttendancePage() {
  const [search, setSearch] = useState("");

  const filtered = attendanceData.filter(
    (d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800 border border-cyan-500">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-cyan-500 font-semibold">Date:</span>
            <span className="cursor-pointer hover:text-cyan-500">Today</span>
            <span className="cursor-pointer hover:text-cyan-500">
              Yesterday
            </span>
            <span className="cursor-pointer hover:text-cyan-500">
              Last Week
            </span>
            <span className="cursor-pointer hover:text-cyan-500">
              Last Month
            </span>
            <span className="cursor-pointer hover:text-cyan-500">Custom</span>
          </div>

          <Input
            placeholder="Search: Admission / ID / Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-transparent border-cyan-400 dark:text-white"
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Present" value="950" color="bg-green-600" />
        <StatCard label="Late" value="45" color="bg-yellow-500" />
        <StatCard label="Absent" value="150" color="bg-red-600" />
        <StatCard
          label="Device Status"
          value="Online: 5 | Offline: 1"
          color="bg-slate-600"
        />
      </div>

      {/* Table + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table */}
        <Card className="lg:col-span-3 bg-white dark:bg-slate-800">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-cyan-500 text-black">
                <tr>
                  <th className="p-2 text-left">ID / Name</th>
                  <th className="p-2">Check-In</th>
                  <th className="p-2">Check-Out</th>
                  <th className="p-2">Duration</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <td className="p-2">
                      <div className="font-semibold">{row.id}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {row.name}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="bg-green-600 text-white px-2 py-1 rounded">
                        {row.checkIn}
                      </span>
                    </td>
                    <td className="p-2">{row.checkOut}</td>
                    <td className="p-2">{row.duration}</td>
                    <td className="p-2 font-medium">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Button className="w-full bg-red-600 hover:bg-red-700">
            Export PDF
          </Button>
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Export Excel
          </Button>

          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-4 space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                View Mode
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600">
                  Students
                </Button>
                <Button size="sm" variant="outline">
                  Staff
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Stat Card ---------------- */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className={`${color} text-white`}>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm">{label}</div>
      </CardContent>
    </Card>
  );
}
