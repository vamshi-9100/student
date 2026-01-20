"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Dummy student data
const students = [
  {
    admissionNo: "ADM2025001",
    name: "Ravi Kumar",
    class: "10th-A",
    passRate: "92%",
    avgScore: "78%",
    topScore: "95%",
    totalStudents: 245,
    subjects: [
      { subject: "Math", grade: "A", score: "92%" },
      { subject: "Science", grade: "B+", score: "82%" },
    ],
    gpa: "A (85%)",
    rank: "5th / 48",
  },
  {
    admissionNo: "ADM2025002",
    name: "Sneha Reddy",
    class: "9th-B",
    passRate: "88%",
    avgScore: "74%",
    topScore: "91%",
    totalStudents: 230,
    subjects: [
      { subject: "Math", grade: "B+", score: "80%" },
      { subject: "Science", grade: "A", score: "90%" },
    ],
    gpa: "A- (82%)",
    rank: "12th / 45",
  },
];

export default function AcademicReport() {
  const [admissionNo, setAdmissionNo] = useState("");
  const [student, setStudent] = useState<any>(null);

  const handleSearch = () => {
    const found = students.find(
      (s) => s.admissionNo.toLowerCase() === admissionNo.toLowerCase()
    );
    setStudent(found || null);
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <h1 className="text-2xl font-semibold text-center">
        Student Exam Results
      </h1>

      {/* Search */}
      <div className="flex max-w-xl mx-auto gap-2">
        <Input
          placeholder="Enter Admission Number (e.g., ADM2025001)"
          value={admissionNo}
          onChange={(e) => setAdmissionNo(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {student && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Pass Rate" value={student.passRate} />
            <StatCard title="Avg Score" value={student.avgScore} />
            <StatCard title="Top Score" value={student.topScore} />
            <StatCard title="Students" value={student.totalStudents} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Student Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-muted-foreground">
                  Admission: {student.admissionNo}
                </p>
                <p className="text-sm text-muted-foreground">
                  Class: {student.class}
                </p>

                <table className="w-full mt-4 text-sm border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Subject</th>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.subjects.map((s: any) => (
                      <tr key={s.subject} className="border-t">
                        <td className="p-2">{s.subject}</td>
                        <td className="p-2 text-center">{s.grade}</td>
                        <td className="p-2 text-center text-green-600">
                          {s.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 font-semibold">
                  Overall GPA: {student.gpa}
                </div>
                <div className="text-sm text-muted-foreground">
                  Class Rank: {student.rank}
                </div>
              </CardContent>
            </Card>

            {/* Full Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Full Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm space-y-2">
                  <li>✔ Academic Performance</li>
                  <li>✔ Progress Trend</li>
                  <li>✔ Achievements</li>
                  <li>✔ Teacher Notes</li>
                </ul>
                <Button className="w-full mt-4">Print Marksheet</Button>
                <Button variant="secondary" className="w-full">
                  Edit Grades
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!student && admissionNo && (
        <p className="text-center text-red-500">No student found</p>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
