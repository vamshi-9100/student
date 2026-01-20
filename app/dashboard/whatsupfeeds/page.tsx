"use client";

import { useState } from "react";
import { Send, CheckSquare, Users } from "lucide-react";

// ---------------- Dummy Contacts ----------------
const contacts = [
  {
    id: 1,
    name: "Ravi Kumar",
    role: "Student",
    class: "5",
    section: "A",
    phone: "9876543210",
  },
  {
    id: 2,
    name: "Sita Devi",
    role: "Student",
    class: "5",
    section: "B",
    phone: "9876543211",
  },
  {
    id: 3,
    name: "Anil Sharma",
    role: "Teacher",
    class: null,
    section: null,
    phone: "9876543212",
  },
  {
    id: 4,
    name: "Meena Rao",
    role: "Teacher",
    class: null,
    section: null,
    phone: "9876543213",
  },
  {
    id: 5,
    name: "Rahul Verma",
    role: "Student",
    class: "6",
    section: "A",
    phone: "9876543214",
  },
];

export default function WhatsAppManagement() {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSection, setFilterSection] = useState("ALL");

  const filteredContacts = contacts.filter((c) => {
    if (filterRole !== "ALL" && c.role !== filterRole) return false;
    if (filterClass !== "ALL" && c.class !== filterClass) return false;
    if (filterSection !== "ALL" && c.section !== filterSection) return false;
    return true;
  });

  const toggleContact = (id: number) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedContacts(filteredContacts.map((c) => c.id));
  };

  const sendMessage = () => {
    alert(
      `Message sent to ${selectedContacts.length} contacts\n\nMessage:\n${message}\n\nAttachments: ${attachments.length}`
    );
    setMessage("");
    setSelectedContacts([]);
    setAttachments([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Users size={20} /> WhatsApp Management
          </h2>

          <button
            onClick={sendMessage}
            disabled={!message || selectedContacts.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={16} /> Send
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Filters */}
          <div className="p-4 border-r dark:border-gray-700 space-y-3">
            <h3 className="font-medium text-gray-700 dark:text-gray-200">
              Recipients
            </h3>

            {[
              {
                value: filterRole,
                set: setFilterRole,
                options: ["ALL", "Student", "Teacher"],
                labels: ["Full School", "Students Only", "Teachers Only"],
              },
              {
                value: filterClass,
                set: setFilterClass,
                options: ["ALL", "5", "6"],
                labels: ["All Classes", "Class 5", "Class 6"],
              },
              {
                value: filterSection,
                set: setFilterSection,
                options: ["ALL", "A", "B"],
                labels: ["All Sections", "Section A", "Section B"],
              },
            ].map((item, idx) => (
              <select
                key={idx}
                value={item.value}
                onChange={(e) => item.set(e.target.value)}
                className="w-full border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-2 rounded"
              >
                {item.options.map((opt, i) => (
                  <option key={opt} value={opt}>
                    {item.labels[i]}
                  </option>
                ))}
              </select>
            ))}

            <button
              onClick={selectAll}
              className="w-full mt-2 border dark:border-gray-600 px-3 py-2 rounded flex items-center gap-2 justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <CheckSquare size={16} /> Select All
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selected: {selectedContacts.length} users
            </p>
          </div>

          {/* Contact List */}
          <div className="p-4 border-r dark:border-gray-700 max-h-[420px] overflow-y-auto">
            {filteredContacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 border-b dark:border-gray-700 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(c.id)}
                  onChange={() => toggleContact(c.id)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {c.role}
                    {c.class ? ` | Class ${c.class}${c.section}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Box */}
          <div className="p-4">
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">
              Message
            </h3>

            {/* Attachments */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                Attachments
              </label>
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setAttachments(
                    e.target.files ? Array.from(e.target.files) : []
                  )
                }
                className="block w-full text-sm border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded p-2"
              />
              {attachments.length > 0 && (
                <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {attachments.map((file, idx) => (
                    <li key={idx}>📎 {file.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your WhatsApp message here..."
              className="w-full h-40 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded p-3 text-sm"
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This message will be sent to all selected contacts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
