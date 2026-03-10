// types/NigerianDriverLicenseVerification.ts

export interface NigerianDriverLicenseVerificationModel {
  success: boolean
  message: string
  data?: DriversLicenseData // optional, because API may return null
}

export interface DriversLicenseData {
  licenseNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  issuedDate: string
  expiryDate: string
  // valid?: boolean // uncomment if your API returns this
}

// ✅ A helper to map raw API JSON into our model
export function mapToNigerianDriverLicenseVerificationModel(
  json: any
): NigerianDriverLicenseVerificationModel {
  return {
    success: json.success as boolean,
    message: json.message as string,
    data: json.data
      ? {
          licenseNumber: json.data.idNumber as string, // mapping idNumber -> licenseNumber
          firstName: json.data.firstName as string,
          lastName: json.data.lastName as string,
          dateOfBirth: json.data.dateOfBirth as string,
          issuedDate: json.data.issuedDate as string,
          expiryDate: json.data.expiredDate as string, // API uses expiredDate
          // valid: json.data.valid as boolean, // uncomment if needed
        }
      : undefined,
  }
}
