// types/said.ts

export interface SAIDValidationDetail {
  validated: boolean
  value: string
}

export interface SAIDValidationData {
  lastName?: SAIDValidationDetail | null
  firstName?: SAIDValidationDetail | null
}

export interface SAIDValidations {
  data?: SAIDValidationData | null
}

export interface Metadata {
  // Currently empty; extend if needed
}

export interface RequestedBy {
  firstName: string
  lastName: string
  middleName?: string | null
  id: string
}

export interface SAIDData {
  id: string
  validations?: SAIDValidations | null
  status: string
  dataValidation: boolean
  selfieValidation: boolean
  firstName: string
  lastName: string
  isSmartCardIssued: string
  idIssueDate: string
  idSequenceNumber: string
  deceasedStatus: string
  dateOfDeath?: string | null
  maritalStatus: string
  dateOfMarriage?: string | null
  onHANIS: string
  onNPR: string
  countryOfBirth: string
  hanisReference: string
  isConsent: boolean
  businessId: string
  type: string
  allValidationPassed: boolean
  requestedAt: string
  country: string
  metadata?: Metadata | null
  requestedBy: RequestedBy
}

export interface SAIDVerificationModel {
  success: boolean
  statusCode: number
  message: string
  data?: SAIDData | null
}

// Optional helper to parse JSON safely
export const parseSAIDVerification = (json: any): SAIDVerificationModel => ({
  success: json.success,
  statusCode: json.statusCode,
  message: json.message,
  data: json.data
    ? {
        ...json.data,
        validations: json.data.validations
          ? { data: { ...json.data.validations.data } }
          : null,
        metadata: json.data.metadata || null,
        requestedBy: { ...json.data.requestedBy },
      }
    : null,
})
