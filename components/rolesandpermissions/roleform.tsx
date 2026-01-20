"use client";

import { useEffect, useState } from "react";
import { roleService, RoleDTO } from "@/services/role-service";
import {
  permissionService,
  PermissionDTO,
} from "@/services/permission-service";
interface RoleFormProps {
  role: {
    roleId: number;
    roleName: string;
    permissions: string[]; // permissionKey[]
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function RoleForm({ role, onClose, onSaved }: RoleFormProps) {
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDTO[]>([]);
  const [loading, setLoading] = useState(false);

  /** Load permissions + role data */
  useEffect(() => {
    loadPermissions();

    if (role) {
      setRoleName(role.roleName);
      setPermissions(role.permissions || []);
    }
  }, [role]);

  const loadPermissions = async () => {
    const data = await permissionService.getAll();
    setAllPermissions(data);
  };

  const togglePermission = (permissionKey: string) => {
    setPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((p) => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const save = async () => {
    if (!roleName.trim()) return;

    setLoading(true);

    try {
      const payload: RoleDTO & { permissions?: string[] } = {
        roleName,
        permissions,
      };

      if (role?.roleId) {
        await roleService.update(role.roleId, payload);
      } else {
        await roleService.create(payload);
      }

      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white w-[520px] p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">
          {role ? "Edit Role" : "Create Role"}
        </h2>

        {/* Role name */}
        <label className="block mb-4">
          <span className="text-sm font-medium">Role Name</span>
          <input
            className="border w-full p-2 mt-1 rounded"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </label>
        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 border rounded"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={save}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
