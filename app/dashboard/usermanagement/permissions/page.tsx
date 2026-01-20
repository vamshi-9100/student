"use client";

import { useEffect, useState } from "react";
import {
  PermissionDTO,
  permissionService,
} from "@/services/permission-service";

export default function Permissions() {
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null as number | null,
    code: "",
    description: "",
  });

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await permissionService.getAll();
      setPermissions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const savePermission = async () => {
    if (!form.code.trim()) return;

    const payload: PermissionDTO = {
      permissionKey: form.code,
      displayName: form.description,
    };

    if (form.id) {
      await permissionService.update(form.id, payload);
    } else {
      await permissionService.create(payload);
    }

    setForm({ id: null, code: "", description: "" });
    loadPermissions();
  };

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-xl font-semibold">Permissions</h1>

      {/* FORM */}
      <div className="border rounded p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="font-medium mb-3">
          {form.id ? "Edit Permission" : "Add Permission"}
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="border rounded p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            placeholder="Permission Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />

          <input
            className="border rounded p-2 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={savePermission}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            {form.id ? "Update" : "Add"}
          </button>

          {form.id && (
            <button
              onClick={() => setForm({ id: null, code: "", description: "" })}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="p-2 text-left">Code</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 w-24">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={3} className="p-4 text-center">
                Loading...
              </td>
            </tr>
          )}

          {permissions.map((p) => (
            <tr
              key={p.permissionId}
              className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="p-2">{p.permissionKey}</td>
              <td className="p-2">{p.displayName || "-"}</td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setForm({
                      id: p.permissionId!,
                      code: p.permissionKey,
                      description: p.displayName || "",
                    })
                  }
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
