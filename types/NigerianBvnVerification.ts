// types/NigerianBvnVerification.ts
export interface NigerianBvnVerificationModel {
  bvn: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  phoneNumber?: string
  enrollmentBank?: string
  enrollmentBranch?: string
  image?: string
  gender?: string
  nationality?: string
  stateOfResidence?: string
  lgaOfResidence?: string
  registrationDate?: string
  [key: string]: any // fallback for any other fields returned by API
}
