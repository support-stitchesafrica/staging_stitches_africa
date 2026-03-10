# Vendor SLA Agreement Implementation

## Overview
This implementation adds a comprehensive Vendor Platform Agreement (SLA) to the vendor registration flow. Vendors must review and accept the agreement before completing their account creation.

## Features

### 1. **VendorSLAAgreement Component** (`components/vendor/VendorSLAAgreement.tsx`)
- Fully responsive modal dialog displaying the complete SLA
- Scrollable content area for easy reading
- Dynamic date population (current date)
- Dynamic brand name population from registration form
- Accept/Decline buttons
- Professional document-style formatting
- Mobile-optimized layout

### 2. **Integration with Signup Flow** (`app/vendor/signup/page.tsx`)
- Added SLA acceptance checkbox
- Opens modal when checkbox is clicked
- Prevents signup submission until SLA is accepted
- Toast notifications for acceptance/decline
- Validation ensures all agreements (Terms, Privacy, SLA) are accepted

### 3. **Standalone SLA Page** (`app/vendor/sla-agreement/page.tsx`)
- Accessible at `/vendor/sla-agreement`
- Allows vendors to review the agreement anytime
- Print/Download functionality
- Clean, professional layout
- Back navigation to dashboard

## Key Agreement Sections

The SLA covers:
1. Purpose and Definitions
2. Commencement and Duration (1-year auto-renewal)
3. Scope of Services and Platform Access
4. Registration, Representations, and Warranties
5. Product Listing, Quality, and Authenticity
6. Pricing, Commission (20%), and Payment Terms
7. Delivery and Logistics (12-24 hours RTW, 2 weeks Bespoke)
8. Return, Refund, and Exchange Policy
9. Intellectual Property Rights
10. Confidentiality and Data Protection (NDPR compliance)
11. Indemnity and Limitation of Liability
12. Termination Conditions
13. Governing Law (Federal Republic of Nigeria)
14. General Provisions

## Usage

### In Signup Flow
```tsx
import { VendorSLAAgreement } from "@/components/vendor/VendorSLAAgreement";

// In your component
const [acceptedSLA, setAcceptedSLA] = useState(false);
const [showSLADialog, setShowSLADialog] = useState(false);

<VendorSLAAgreement
  open={showSLADialog}
  onOpenChange={setShowSLADialog}
  brandName={form.watch("brandName")}
  businessAddress="[Business Address]"
  onAccept={() => {
    setAcceptedSLA(true);
    setShowSLADialog(false);
  }}
  onDecline={() => {
    setAcceptedSLA(false);
    setShowSLADialog(false);
  }}
/>
```

### Component Props
```typescript
interface VendorSLAAgreementProps {
  open: boolean;              // Controls dialog visibility
  onOpenChange: (open: boolean) => void;  // Dialog state handler
  onAccept: () => void;       // Called when vendor accepts
  onDecline: () => void;      // Called when vendor declines
  brandName?: string;         // Vendor's brand name (optional)
  businessAddress?: string;   // Vendor's business address (optional)
}
```

## Mobile Responsiveness

The component is fully responsive with:
- Adaptive dialog sizing (max-w-4xl on desktop, full-width on mobile)
- Scrollable content area with max-height constraints
- Touch-friendly buttons and spacing
- Readable font sizes across all devices
- Proper padding and margins for mobile screens

## Styling

- Uses Tailwind CSS for styling
- Shadcn/ui components (Dialog, Button, ScrollArea)
- Professional document formatting
- Color-coded sections for better readability
- Print-friendly styles for the standalone page

## Future Enhancements

Potential improvements:
1. Store SLA acceptance timestamp in database
2. Version tracking for agreement updates
3. Email copy of signed agreement to vendor
4. Digital signature capture
5. Multi-language support
6. PDF generation for download

## Testing Checklist

- [ ] SLA modal opens when checkbox is clicked
- [ ] Accept button enables signup submission
- [ ] Decline button prevents signup
- [ ] Brand name populates correctly
- [ ] Current date displays properly
- [ ] Mobile layout is responsive
- [ ] Scrolling works smoothly
- [ ] All sections are readable
- [ ] Standalone page is accessible
- [ ] Print functionality works

## Notes

- Agreement date automatically uses current date
- Brand name is pulled from the signup form
- Business address can be added to form if needed
- All three agreements (Terms, Privacy, SLA) must be accepted
- SLA is legally binding once accepted
