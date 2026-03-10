// types/ghanaPassport.ts

export interface RequestedBy {
  firstName: string
  lastName: string
  middleName?: string | null
  id: string
}

export interface GhanaPassportData {
  id: string
  parentId?: string | null
  status: string
  reason?: string | null
  dataValidation: boolean
  selfieValidation: boolean
  firstName: string
  middleName?: string | null
  lastName: string
  fullName: string
  image?: string | null
  signature?: string | null
  placeOfBirth: string
  nationality: string
  dateOfBirth: string
  isConsent: boolean
  idNumber: string
  businessId: string
  type: string
  issuedAt: string
  issuedDate: string
  expiredDate: string
  gender: string
  requestedAt: string
  country: string
  requestedBy: RequestedBy
}

export interface GhanaPassportVerificationModel {
  success: boolean
  statusCode: number
  message: string
  data?: GhanaPassportData | null
}

// Optional: a helper to parse JSON safely
export const parseGhanaPassportVerification = (json: any): GhanaPassportVerificationModel => ({
  success: json.success,
  statusCode: json.statusCode,
  message: json.message,
  data: json.data
    ? {
        ...json.data,
        requestedBy: { ...json.data.requestedBy },
      }
    : null,
})
