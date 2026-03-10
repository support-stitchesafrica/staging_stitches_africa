// models/BusinessVerificationModel.ts

export interface KeyPersonnel {
  name?: string
  designation?: string
  address?: string
  occupation?: string
  nationality?: string
  countryOfResidence?: string
  gender?: string
  isCorporate?: boolean
  sharesType?: string
  sharesValue?: string
  sharesCount?: string
}

export interface BusinessData {
  name?: string
  registrationNumber?: string
  address?: string
  state?: string
  city?: string
  email?: string
  phone?: string
  typeOfEntity?: string
  status?: string
  keyPersonnel?: KeyPersonnel[]
}

export interface BusinessVerificationModel {
  success: boolean
  statusCode: number
  message: string
  data?: BusinessData
}
