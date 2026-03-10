// utils/getCurrentUserId.ts
import { getAuth } from "firebase/auth"

export function getCurrentUserId(): string | null {
  const auth = getAuth()
  const currentUser = auth.currentUser

  // Handle null user safely
  if (!currentUser) {
    return null
  }

  return currentUser.uid
}
