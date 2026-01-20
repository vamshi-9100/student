import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { PermissionDTO } from "./permission-service";

class RolePermissionService {
  /**
   * Get permissions assigned to a role
   */
  async getPermissions(roleId: number): Promise<PermissionDTO[]> {
    return apiGet<PermissionDTO[]>(`/admin/roles/${roleId}/permissions`);
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<void> {
    await apiPost<void, number[]>(
      `/admin/roles/${roleId}/permissions`,
      permissionIds
    );
  }

  /**
   * Replace all permissions for role
   */
  async replacePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<void> {
    await apiPut<void, number[]>(
      `/admin/roles/${roleId}/permissions`,
      permissionIds
    );
  }

  /**
   * Remove a permission from role
   */
  async removePermission(roleId: number, permissionId: number): Promise<void> {
    await apiDelete(`/admin/roles/${roleId}/permissions/${permissionId}`);
  }
}

export const rolePermissionService = new RolePermissionService();
