import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

/**
 * DTO should match backend PermissionsDTO
 */
export interface PermissionDTO {
  permissionId?: number;
  permissionKey: string;
  displayName: string;
}

class PermissionService {
  /**
   * Get all permissions
   */
  async getAll(): Promise<PermissionDTO[]> {
    try {
      const res = await apiGet<PermissionDTO[]>("/iot/admin/permissions");
      return res;
    } catch (error) {
      console.error("Failed to fetch permissions", error);
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async create(payload: PermissionDTO): Promise<PermissionDTO> {
    try {
      const res = await apiPost<any, PermissionDTO>(
        "/iot/admin/permissions",
        payload
      );
      return res;
    } catch (error) {
      console.error("Failed to create permission", error);
      throw error;
    }
  }

  /**
   * Update existing permission
   */
  async update(id: number, payload: PermissionDTO): Promise<PermissionDTO> {
    try {
      const res = await apiPut<any, PermissionDTO>(
        `/iot/admin/permissions/${id}`,
        payload
      );
      return res;
    } catch (error) {
      console.error("Failed to update permission", error);
      throw error;
    }
  }

  /**
   * Delete permission
   */
  async delete(id: number): Promise<boolean> {
    try {
      await apiDelete(`/iot/admin/permissions/${id}`);
      return true;
    } catch (error) {
      console.error("Failed to delete permission", error);
      throw error;
    }
  }
}

export const permissionService = new PermissionService();
