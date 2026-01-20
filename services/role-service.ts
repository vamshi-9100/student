import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface RoleDTO {
  roleId?: number;
  roleName: string;
}

class RoleService {
  async getAll(): Promise<RoleDTO[]> {
    return apiGet<RoleDTO[]>("/iot/admin/roles");
  }

  async create(payload: RoleDTO): Promise<RoleDTO> {
    return apiPost<any, RoleDTO>("/iot/admin/roles", payload);
  }

  async update(id: number, payload: RoleDTO): Promise<RoleDTO> {
    return apiPut<any, RoleDTO>(`/iot/admin/roles/${id}`, payload);
  }

  async delete(id: number): Promise<boolean> {
    await apiDelete(`/iot/admin/roles/${id}`);
    return true;
  }
}

export const roleService = new RoleService();
