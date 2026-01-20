"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { roleService } from "@/services/role-service";
import { rolePermissionService } from "@/services/rolepermission-service";
import type { RoleDTO } from "@/services/role-service";
import type { PermissionDTO } from "@/services/permission-service";

const RolePermissions = () => {
  const searchParams = useSearchParams();
  const roleIdFromUrl = searchParams.get("roleId");

  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(
    roleIdFromUrl ? Number(roleIdFromUrl) : null
  );
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- Load Roles (Dropdown) ---------------- */
  useEffect(() => {
    roleService.getAll().then(setRoles).catch(console.error);
  }, []);

  /* ---------------- Load Permissions ---------------- */
  useEffect(() => {
    if (!selectedRole) return;

    setLoading(true);
    rolePermissionService
      .getPermissions(selectedRole)
      .then(setPermissions)
      .finally(() => setLoading(false));
  }, [selectedRole]);

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-semibold mb-4">Role Permissions</h2>

      {/* Role Dropdown */}
      <select
        className="
          border rounded-md p-2 mb-6
          bg-white text-gray-900
          dark:bg-gray-800 dark:text-gray-100
          dark:border-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
        value={selectedRole ?? ""}
        onChange={(e) => {
          const roleId = Number(e.target.value) || null;
          setSelectedRole(roleId);

          if (roleId) {
            window.history.replaceState(null, "", `?roleId=${roleId}`);
          } else {
            window.history.replaceState(null, "", location.pathname);
          }
        }}
      >
        <option value="">Select Role</option>
        {roles.map((role) => (
          <option key={role.roleId} value={role.roleId}>
            {role.roleName}
          </option>
        ))}
      </select>

      {/* Permissions */}
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading permissions...
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissions.map((permission) => (
            <label
              key={permission.permissionId}
              className="
                flex items-center gap-3 p-3 rounded-md border
                bg-white dark:bg-gray-800
                border-gray-200 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-700
                transition
              "
            >
              <input
                type="checkbox"
                checked={permission.assigned}
                onChange={() => togglePermission(permission.permissionId)}
                className="accent-blue-600"
              />
              <span>{permission.permissionName}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  /* ---------------- Toggle Permission (UI only) ---------------- */
  function togglePermission(permissionId: number) {
    setPermissions((prev) =>
      prev.map((p) =>
        p.permissionId === permissionId ? { ...p, assigned: !p.assigned } : p
      )
    );
  }
};

export default RolePermissions;
