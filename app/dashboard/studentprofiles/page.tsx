"use client";
import React, { useState } from "react";

export default function Studentprofiles() {
  const studentsData = [
    {
      studentId: "ST12345",
      name: "Aarav Sharma",
      class: "10A",
      dob: "01-03-2007",
      email: "aarav@gmail.com",
      contact: "+91 98765 4210",
      address: "123, School Road, New Delhi",
      father: "Mr. Rajesh Sharma",
      mother: "Mrs. Priya Sharma",
      parentContact: "+91 99887 76655",
      image: "https://i.pravatar.cc/150?img=12",
    },
    {
      studentId: "ST12346",
      name: "Vihaan Patel",
      class: "10A",
      dob: "11-06-2007",
      email: "vihaan@gmail.com",
      contact: "+91 98765 4321",
      address: "Ahmedabad, Gujarat",
      father: "Mr. Amit Patel",
      mother: "Mrs. Neha Patel",
      parentContact: "+91 91234 56789",
      image: "https://i.pravatar.cc/150?img=14",
    },
    {
      studentId: "ST22345",
      name: "Ananya Rao",
      class: "10B",
      dob: "21-01-2007",
      email: "ananya@gmail.com",
      contact: "+91 99876 54321",
      address: "Hyderabad, Telangana",
      father: "Mr. Suresh Rao",
      mother: "Mrs. Kavya Rao",
      parentContact: "+91 90123 45678",
      image: "https://i.pravatar.cc/150?img=16",
    },
  ];

  const classes = ["10A", "10B"];

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedStudentId("");
    const students = studentsData.filter((s) => s.class === value);
    setFilteredStudents(students);
    setSelectedStudent(null);
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    const student = studentsData.find((s) => s.studentId === value);
    setSelectedStudent(student || null);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      {/* Tabs */}
      <div className="flex gap-4">
        <button className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 shadow text-blue-600 font-semibold">
          Profile
        </button>
        {["Attendance", "Fee Details", "Remarks"].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-3 py-2 mt-1 rounded-lg border bg-transparent dark:border-slate-600"
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Student</label>
          <select
            value={selectedStudentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            disabled={!filteredStudents.length}
            className="w-full px-3 py-2 mt-1 rounded-lg border bg-transparent dark:border-slate-600"
          >
            <option value="">-- Select Student --</option>
            {filteredStudents.map((s) => (
              <option key={s.studentId} value={s.studentId}>
                {s.name} ({s.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Cards */}
      {(selectedStudent || filteredStudents.length > 0) && (
        <div className="space-y-6">
          {(selectedStudent ? [selectedStudent] : filteredStudents).map(
            (student) => (
              <div key={student.studentId}>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex gap-6">
                  <img
                    src={student.image}
                    alt="student"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
                    <p>
                      <b>Name:</b> {student.name}
                    </p>
                    <p>
                      <b>ID:</b> {student.studentId}
                    </p>
                    <p>
                      <b>Class:</b> {student.class}
                    </p>
                    <p>
                      <b>DOB:</b> {student.dob}
                    </p>
                    <p>
                      <b>Email:</b> {student.email}
                    </p>
                    <p>
                      <b>Contact:</b> {student.contact}
                    </p>
                    <p className="col-span-2">
                      <b>Address:</b> {student.address}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mt-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Parent / Guardian Details
                  </h3>
                  <p>
                    <b>Father:</b> {student.father}
                  </p>
                  <p>
                    <b>Mother:</b> {student.mother}
                  </p>
                  <p>
                    <b>Contact:</b> {student.parentContact}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
