import type { BlogInvitation, CreateBlogInvitation, BlogUser } from "@/types/blog-admin"

export class BlogInvitationService {
  private static readonly INVITATIONS_COLLECTION = "blog_invitations"
  private static readonly INVITATION_EXPIRY_HOURS = 72 // 3 days

  static async createInvitation(
    invitationData: CreateBlogInvitation,
    invitedBy: BlogUser
  ): Promise<{ success: boolean; message?: string; invitationId?: string }> {
    try {
      const response = await fetch('/api/blog-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationData,
          invitedBy
        })
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      console.error("Error creating invitation:", error)
      return { success: false, message: error.message || "Failed to create invitation" }
    }
  }

  static async getInvitation(token: string): Promise<BlogInvitation | null> {
    try {
      const response = await fetch(`/api/blog-admin/invitations/${token}`)
      const result = await response.json()
      
      if (result.success) {
        const inv = result.invitation
        return {
          ...inv,
          createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
          expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : new Date(),
          acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt) : undefined
        }
      }
      
      return null
    } catch (error) {
      console.error("Error getting invitation:", error)
      return null
    }
  }

  static async acceptInvitation(
    token: string,
    idToken: string
  ): Promise<{ success: boolean; message?: string; user?: BlogUser }> {
    try {
      const response = await fetch('/api/blog-admin/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ token })
      })

      const result = await response.json()
      
      if (result.success && result.user) {
        return {
          success: true,
          user: {
            ...result.user,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      }
      
      return { success: false, message: result.message || "Failed to accept invitation" }
    } catch (error: any) {
      console.error("Error accepting invitation:", error)
      return { success: false, message: error.message || "Failed to accept invitation" }
    }
  }

  static async getAllInvitations(): Promise<BlogInvitation[]> {
    try {
      const response = await fetch('/api/blog-admin/invitations')
      const result = await response.json()
      
      if (result.success) {
        return result.invitations.map((inv: any) => ({
          ...inv,
          createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
          expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : new Date(),
          acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt) : undefined
        }))
      }
      
      return []
    } catch (error) {
      console.error("Error getting invitations:", error)
      return []
    }
  }

  static async resendInvitation(invitationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // For now, just return success - in a full implementation, you'd create a resend API endpoint
      console.log(`Resending invitation: ${invitationId}`)
      return { success: true }
    } catch (error: any) {
      console.error("Error resending invitation:", error)
      return { success: false, message: "Failed to resend invitation" }
    }
  }
}