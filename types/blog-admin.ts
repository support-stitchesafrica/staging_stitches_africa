export interface BlogUser {
  uid: string
  email: string
  firstName: string
  lastName: string
  username: string
  role: 'editor' | 'author' | 'admin'
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface CreateBlogUser {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
  role: 'editor' | 'author' | 'admin'
}

export interface BlogAuthContextType {
  user: BlogUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (userData: CreateBlogUser) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  hasPermission: (permission: BlogPermission) => boolean
  canCreatePost: () => boolean
  canEditPost: (postAuthorId: string) => boolean
  canDeletePost: (postAuthorId: string) => boolean
  refreshUser: () => Promise<void>
}

export type BlogPermission = 
  | 'create_post'
  | 'edit_own_post'
  | 'edit_any_post'
  | 'delete_own_post'
  | 'delete_any_post'
  | 'manage_users'
  | 'view_analytics'
  | 'invite_users'

export interface BlogPost extends Omit<import('./news').NewsArticle, 'author'> {
  authorId: string
  authorName: string
}

export interface CreateBlogPost extends Omit<import('./news').CreateNewsArticle, 'author'> {
  authorId: string
  authorName: string
}

export interface BlogInvitation {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'editor' | 'author'
  invitedBy: string
  invitedByName: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  createdAt: Date
  expiresAt: Date
  acceptedAt?: Date
}

export interface CreateBlogInvitation {
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'editor' | 'author'
}