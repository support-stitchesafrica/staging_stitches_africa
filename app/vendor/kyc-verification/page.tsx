"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Scissors, Upload, FileText, CheckCircle, AlertCircle, Building, Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface KeyPersonnel {
  name: string
  designation: string
  gender: string
  countryOfResidence: string
  nationality: string | null
  isCorporate: boolean | null
}

export default function KYCVerification() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Company Verification Data
  const [companyData, setCompanyData] = useState({
    businessName: "VICKIETEDDIES PLUS GLOBAL SERVICES LIMITED",
    registrationNumber: "RC1348977",
    address: "NO 93, LAMBO LASUNWON STREET, OPP, LASPOTECH FIRSTGATE BUS STOP, IKORODU, , LAGOS",
    state: "LAGOS",
    city: "",
    typeOfEntity: "PRIVATE_COMPANY_LIMITED_BY_SHARES",
    companyStatus: "Verified",
    status: "approved",
    verifiedAt: "11 July 2025 at 01:15:23 UTC+1",
    documentImageUrl: "",
  })

  const [keyPersonnel] = useState<KeyPersonnel[]>([
    {
      name: "SEIDUN, VICTORIA OLUBUSOLA",
      designation: "DIRECTOR",
      gender: "Female",
      countryOfResidence: "NIGERIA",
      nationality: null,
      isCorporate: null,
    },
    {
      name: "POPOOLA, OLAYINKA ABIGAIL",
      designation: "DIRECTOR",
      gender: "Female",
      countryOfResidence: "NIGERIA",
      nationality: null,
      isCorporate: null,
    },
    {
      name: "POPOOLA, SUNDAY ADEYINKA",
      designation: "DIRECTOR",
      gender: "Male",
      countryOfResidence: "NIGERIA",
      nationality: null,
      isCorporate: null,
    },
    {
      name: "POPOOLA, OLAYINKA ABIGAIL",
      designation: "SECRETARY_COMPANY",
      gender: "Female",
      countryOfResidence: "NIGERIA",
      nationality: null,
      isCorporate: null,
    },
    {
      name: "SEIDUN, VICTORIA OLUBUSOLA",
      designation: "SHAREHOLDER",
      gender: "Female",
      countryOfResidence: "NIGERIA",
      nationality: null,
      isCorporate: null,
    },
    {
      name: "POPOOLA, OLAYINKA ABIGAIL",
      designation: "SHAREHOLDER",
      gender: "Female",
      countryOfResidence: "NIGERIA",
      nationality: null,
      isCorporate: null,
    },
    {
      name: "POPOOLA, SUNDAY ADEYINKA",
      designation: "SHAREHOLDER",
      gender: "Male",
      countryOfResidence: "NIGERIA",
      nationality: null,
      isCorporate: null,
    },
  ])

  // Identity Verification Data
  const [identityData, setIdentityData] = useState({
    fullName: "PRINCE IZUCHUKWU IBEKWE",
    middleName: "",
    idNumber: "08160287793",
    countryCode: "NG",
    verificationType: "phone number",
    status: "failed",
    feedbackMessage: "Identity verification failed. No matching name found in key personnel records.",
  })

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    companyDocument: null,
    identityDocument: null,
    proofOfAddress: null,
  })

  const handleFileUpload = (documentType: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [documentType]: file }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    // Simulate KYC submission
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 3000)
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
              <Scissors className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
          <p className="text-gray-600">Complete your verification to access all features</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Company Verification */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Verification</span>
              </CardTitle>
              <CardDescription>Verify your business information and upload company documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={companyData.businessName}
                    onChange={(e) => setCompanyData({ ...companyData, businessName: e.target.value })}
                    className="border-gray-300 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={companyData.registrationNumber}
                    onChange={(e) => setCompanyData({ ...companyData, registrationNumber: e.target.value })}
                    className="border-gray-300 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={companyData.state}
                    onValueChange={(value) => setCompanyData({ ...companyData, state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAGOS">Lagos</SelectItem>
                      <SelectItem value="ABUJA">Abuja</SelectItem>
                      <SelectItem value="KANO">Kano</SelectItem>
                      <SelectItem value="RIVERS">Rivers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeOfEntity">Type of Entity</Label>
                  <Select
                    value={companyData.typeOfEntity}
                    onValueChange={(value) => setCompanyData({ ...companyData, typeOfEntity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE_COMPANY_LIMITED_BY_SHARES">
                        Private Company Limited by Shares
                      </SelectItem>
                      <SelectItem value="PUBLIC_COMPANY">Public Company</SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  rows={3}
                  className="border-gray-300 focus:border-purple-500"
                />
              </div>

              <div className="space-y-4">
                <Label>Company Status</Label>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {companyData.companyStatus}
                  </Badge>
                  <span className="text-sm text-gray-600">Verified on {companyData.verifiedAt}</span>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <Label>Company Registration Document</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload your company registration certificate</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload("companyDocument", file)
                    }}
                    className="hidden"
                    id="company-doc"
                  />
                  <Label htmlFor="company-doc" className="cursor-pointer">
                    <Button variant="outline" type="button">
                      Choose File
                    </Button>
                  </Label>
                  {uploadedFiles.companyDocument && (
                    <p className="text-sm text-green-600 mt-2">✓ {uploadedFiles.companyDocument.name}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Key Personnel */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Key Personnel</span>
              </CardTitle>
              <CardDescription>Review and verify key personnel information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keyPersonnel.map((person, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Name</Label>
                        <p className="text-sm text-gray-900">{person.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Designation</Label>
                        <p className="text-sm text-gray-900">{person.designation.replace(/_/g, " ")}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Gender</Label>
                        <p className="text-sm text-gray-900">{person.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Country</Label>
                        <p className="text-sm text-gray-900">{person.countryOfResidence}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Identity Verification */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Identity Verification</span>
              </CardTitle>
              <CardDescription>Complete your personal identity verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={identityData.fullName}
                    onChange={(e) => setIdentityData({ ...identityData, fullName: e.target.value })}
                    className="border-gray-300 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name (Optional)</Label>
                  <Input
                    id="middleName"
                    value={identityData.middleName}
                    onChange={(e) => setIdentityData({ ...identityData, middleName: e.target.value })}
                    className="border-gray-300 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={identityData.idNumber}
                    onChange={(e) => setIdentityData({ ...identityData, idNumber: e.target.value })}
                    className="border-gray-300 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationType">Verification Type</Label>
                  <Select
                    value={identityData.verificationType}
                    onValueChange={(value) => setIdentityData({ ...identityData, verificationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone number">Phone Number</SelectItem>
                      <SelectItem value="national id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers license">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current Status */}
              <div className="space-y-4">
                <Label>Verification Status</Label>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <Badge className="bg-red-100 text-red-800">{identityData.status}</Badge>
                  </div>
                  <p className="text-sm text-red-700">{identityData.feedbackMessage}</p>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Identity Document</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 mb-2">Upload ID document</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("identityDocument", file)
                      }}
                      className="hidden"
                      id="identity-doc"
                    />
                    <Label htmlFor="identity-doc" className="cursor-pointer">
                      <Button variant="outline" size="sm" type="button">
                        Choose File
                      </Button>
                    </Label>
                    {uploadedFiles.identityDocument && (
                      <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.identityDocument.name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Proof of Address</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 mb-2">Upload utility bill or bank statement</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("proofOfAddress", file)
                      }}
                      className="hidden"
                      id="address-doc"
                    />
                    <Label htmlFor="address-doc" className="cursor-pointer">
                      <Button variant="outline" size="sm" type="button">
                        Choose File
                      </Button>
                    </Label>
                    {uploadedFiles.proofOfAddress && (
                      <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.proofOfAddress.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="bg-transparent">
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? "Submitting..." : "Complete Verification"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
