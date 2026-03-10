// types/kenyaPassport.ts

export interface RequestedBy {
  firstName: string
  lastName: string
  middleName?: string | null
  id: string
}

export interface KenyanPassportData {
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
  nationality: string
  dateOfBirth?: string | null
  isConsent: boolean
  idNumber: string
  businessId: string
  type: string
  gender: string
  requestedAt: string
  country: string
  requestedBy: RequestedBy
}

export interface KenyanPassportVerificationModel {
  success: boolean
  statusCode: number
  message: string
  data?: KenyanPassportData | null
}

// Optional helper to parse JSON safely
export const parseKenyanPassportVerification = (json: any): KenyanPassportVerificationModel => ({
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
