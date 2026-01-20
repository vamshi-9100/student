"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, UserCheck, UserX, Layers } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/* ---------- DATA ---------- */

const stats = [
  { title: "Students", value: 1138, icon: Users, color: "bg-pink-500" },
  {
    title: "Teaching Staff",
    value: 74,
    icon: UserCheck,
    color: "bg-emerald-500",
  },
  {
    title: "Non-Teaching Staff",
    value: 28,
    icon: UserX,
    color: "bg-purple-500",
  },
  { title: "Sections", value: 33, icon: Layers, color: "bg-orange-500" },
];

const classData = [
  { class: "I", students: 45 },
  { class: "II", students: 52 },
  { class: "III", students: 60 },
  { class: "IV", students: 58 },
  { class: "V", students: 65 },
];

const staffData = [
  { name: "Teachers", value: 74 },
  { name: "Non-Teaching", value: 28 },
];

const COLORS = ["#22c55e", "#f97316"];

/* ---------- PAGE ---------- */

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title} className="text-white">
            <CardContent
              className={`${s.color} p-4 rounded-xl flex justify-between`}
            >
              <div>
                <p className="text-sm">{s.title}</p>
                <h2 className="text-2xl font-bold">{s.value}</h2>
              </div>
              <s.icon className="h-8 w-8 opacity-80" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Class-wise Student Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Composition</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={staffData} dataKey="value" outerRadius={80}>
                  {staffData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModuleBar title="Events" data={[{ name: "Events", value: 8 }]} />
        <ModuleBar title="Transport" data={[{ name: "Routes", value: 12 }]} />
        <ModuleBar title="Hostel" data={[{ name: "Rooms", value: 150 }]} />
        <ModuleBar title="Fees" data={[{ name: "Collected", value: 180000 }]} />
      </div>
    </div>
  );
}

/* ---------- HELPERS ---------- */

type ModuleBarProps = {
  title: string;
  data: { name: string; value: number }[];
};

function ModuleBar({ title, data }: ModuleBarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
