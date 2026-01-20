"use client";

import { useEffect, useState } from "react";
import RoleForm from "@/components/rolesandpermissions/roleform";
import { roleService, RoleDTO } from "@/services/role-service";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await roleService.getAll();
      setRoles(data);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (roleId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this role?"
    );

    if (!confirmed) return;

    try {
      await roleService.delete(roleId);
      loadRoles(); // reload list
    } catch (error) {
      console.error("Failed to delete role", error);
      alert("Unable to delete role");
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Roles</h1>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => {
            setSelectedRole(null);
            setShowForm(true);
          }}
        >
          + Create Role
        </button>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Role Id</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={2} className="p-4 text-center">
                Loading...
              </td>
            </tr>
          )}

          {roles.map((role) => (
            <tr key={role.roleId} className="border-t">
              <td className="p-2">{role.roleId}</td>
              <td className="p-2">{role.roleName}</td>
              <td className="p-2 text-center">
                <div className="flex justify-center gap-4">
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setSelectedRole(role);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  {/* Delete */}

                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(role.roleId!)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <RoleForm
          role={selectedRole}
          onClose={() => setShowForm(false)}
          onSaved={loadRoles}
        />
      )}
    </div>
  );
}
