"use client";

import { useState } from "react";
import { Search, Plus, Upload, Calendar, Bell, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sections = [
  { id: 1, name: "Class 1 - A", capacity: 60, enrolled: 55 },
  { id: 2, name: "Class 1 - B", capacity: 60, enrolled: 60 },
  { id: 3, name: "Class 2 - A", capacity: 50, enrolled: 42 },
  { id: 4, name: "Class 3 - A", capacity: 55, enrolled: 48 },
];

export default function SectionsManagement() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Sections Management</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <KpiCard title="Total Sections" value="45" color="blue" />
        <KpiCard title="Capacity" value="95%" color="green" />
        <KpiCard title="Overcapacity" value="2" color="red" />
        <KpiCard title="Vacant Seats" value="150" color="yellow" />
        <KpiCard title="Avg Students" value="63" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">Class-Section</th>
                  <th>Capacity</th>
                  <th>Enrolled</th>
                  <th>Vacant %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.id} className="border-b dark:border-gray-700">
                    <td className="p-3">{s.name}</td>
                    <td className="text-center">
                      {s.enrolled}/{s.capacity}
                    </td>
                    <td className="text-center">
                      {s.enrolled}/{s.capacity}
                    </td>
                    <td className="text-center">
                      {Math.round(
                        ((s.capacity - s.enrolled) / s.capacity) * 100
                      )}
                      %
                    </td>
                    <td className="text-center">⋮</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <ActionButton icon={<Plus />} label="New Section" color="green" />
          <ActionButton icon={<Upload />} label="Import" color="blue" />
          <ActionButton icon={<Calendar />} label="Timetable" color="orange" />
          <ActionButton icon={<Bell />} label="Alerts" color="purple" />
          <ActionButton icon={<Printer />} label="Print" color="gray" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color }: any) {
  const colors: any = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-400 to-yellow-500",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <Card className={`bg-gradient-to-r ${colors[color]} text-white`}>
      <CardContent className="p-4">
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon, label, color }: any) {
  const colors: any = {
    green: "bg-green-500 hover:bg-green-600",
    blue: "bg-blue-500 hover:bg-blue-600",
    orange: "bg-orange-500 hover:bg-orange-600",
    purple: "bg-purple-500 hover:bg-purple-600",
    gray: "bg-gray-400 hover:bg-gray-500",
  };

  return (
    <Button className={`w-full text-white ${colors[color]}`}>
      <span className="mr-2">{icon}</span>
      {label}
    </Button>
  );
}
