"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type EventItem = {
  time: string;
  title: string;
};

type EventsMap = Record<string, EventItem[]>;

const eventsData: EventsMap = {
  "2021-11-02": [
    { time: "10:00 - 11:00", title: "Event 3" },
    { time: "08:00 - 09:30", title: "Statistics" },
    { time: "09:30 - 10:30", title: "Biology" },
    { time: "11:00 - 12:30", title: "French" },
  ],
  "2021-11-04": [{ time: "14:00 - 15:00", title: "Microbiology" }],
  "2021-11-11": [{ time: "10:00 - 12:00", title: "Economic Balance" }],
};

export default function TimelineCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2021, 10));
  const [selectedDate, setSelectedDate] = useState("2021-11-02");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-900 dark:text-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel */}
        <Card className="lg:col-span-1 bg-pink-400 text-white">
          <CardContent className="p-4">
            <p className="text-sm">02 Nov 2021</p>
            <h2 className="text-5xl font-bold">02</h2>
            <p className="mt-4 font-semibold">TO DO LIST</p>
            <p className="text-sm opacity-80">Don't forget about activities</p>

            <div className="mt-4 space-y-2">
              {eventsData[selectedDate]?.map((e, i) => (
                <div key={i} className="bg-white/20 p-2 rounded">
                  <p className="text-xs">{e.time}</p>
                  <p className="font-medium">{e.title}</p>
                </div>
              )) || <p className="text-sm">No events</p>}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              {currentMonth.toLocaleString("default", { month: "long" })} {year}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1))}
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1))}
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
              const hasEvent = eventsData[dateKey];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`h-10 w-10 mx-auto rounded-full transition
            ${
              selectedDate === dateKey
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }
            ${hasEvent ? "font-bold border border-blue-400" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Events</h3>
            {eventsData[selectedDate]?.length ? (
              eventsData[selectedDate].map((e, i) => (
                <div
                  key={i}
                  className="mb-3 p-3 rounded bg-gradient-to-r from-green-400 to-teal-400 text-white"
                >
                  <p className="text-sm">{e.title}</p>
                  <p className="text-xs">{e.time}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No events for this day</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
