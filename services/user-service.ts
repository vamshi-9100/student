import { apiPost } from "@/lib/api"

interface UpdatePasswordPayload {
  oldPassword: string
  newPassword: string
}

class UserService {
  public async updatePassword(payload: UpdatePasswordPayload): Promise<boolean> {
    try {
      await apiPost("/iot/user/updatePassword", payload, {
        includeCompanyId: false,
        includeClientId: false,
      })
      return true
    } catch (error) {
      console.error("Failed to update password:", error)
      throw error
    }
  }
}

export const userService = new UserService()


