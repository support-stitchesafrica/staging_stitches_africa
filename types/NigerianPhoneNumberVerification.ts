// types/NigerianPhoneNumberVerification.ts

export interface NigerianPhoneNumberVerificationModel {
  success: boolean
  statusCode: number
  message: string
  data?: PhoneNumberData
}

export interface PhoneNumberData {
  parentId: string
  status: string
  dataValidation: boolean
  selfieValidation: boolean
  phoneDetails: PhoneDetails[]
  isConsent: boolean
  idNumber: string
  businessId: string
  type: string
  requestedAt: string
  country: string
  createdAt: string
  lastModifiedAt: string
  requestedBy: RequestedBy
}

export interface PhoneDetails {
  fullName: string
  dateOfBirth: string
}

export interface RequestedBy {
  firstName: string
  lastName: string
  middleName: string
  id: string
}
