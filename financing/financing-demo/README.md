# Stitches Africa - Product Financing Simulator

A standalone web application demonstrating the user-facing experience of the Buy Now, Pay Later (BNPL) and Product Financing system for Stitches Africa.

## Features

### User Journey
1. **Product Catalog** - Browse fashion products with financing options displayed
2. **Shopping Cart** - Add multiple products and proceed to checkout
3. **Payment Options** - Choose between "Pay in Full" or "Finance This Purchase"
4. **KYC Collection** - Complete profile verification for financing eligibility
5. **Credit Assessment** - Automatic credit tier assignment based on user profile
6. **Financing Plans** - Select from 3, 6, 9, or 12-month payment plans
7. **Order Confirmation** - View complete repayment schedule
8. **User Dashboard** - Track active loans and make payments
9. **Payment Processing** - Make monthly payments on active loans

### Credit Tier System
- **New User**: $500 credit limit
- **Verified User**: $2,000 credit limit (Monthly income ≥ $1,500)
- **Trusted User**: $5,000 credit limit (Monthly income ≥ $3,000)

### Financing Plans
- 3 Months - 0% Interest
- 6 Months - 5% Interest
- 9 Months - 8% Interest
- 12 Months - 10% Interest

## Technology Stack
- Pure HTML5
- CSS3 with modern flexbox/grid layouts
- Vanilla JavaScript (ES6+)
- LocalStorage for data persistence

## Installation

No installation required! This is a static web application.

### Local Development
Simply open `index.html` in your web browser.

Or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## Deployment

### Deploy to Vercel
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd financing-demo
vercel
```

Or use the Vercel dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Import the `financing-demo` folder
3. Deploy!

### Deploy to Netlify
1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
cd financing-demo
netlify deploy
```

Or drag and drop the `financing-demo` folder to [Netlify Drop](https://app.netlify.com/drop).

## Usage Flow

### First-Time User
1. Browse products in the catalog
2. Add products to cart
3. Proceed to checkout
4. Select "Finance This Purchase"
5. Complete KYC form with personal and financial information
6. Receive instant credit limit based on profile
7. Choose a payment plan
8. Confirm order and view repayment schedule
9. Access dashboard to manage loans

### Returning User
1. Credit limit is displayed at the top of the catalog
2. Available credit updates based on active loans
3. Dashboard shows all active loans with:
   - Payment progress
   - Remaining balance
   - Next payment date
   - Payments remaining
4. Make payments directly from dashboard
5. Credit limit restores when loans are paid off

## Data Persistence

All user data is stored in browser LocalStorage:
- User profile and KYC information
- Credit tier and limits
- Active loans and payment history

**Note**: Data is browser-specific. Clearing browser data will reset the application.

## Key Features Demonstrated

### Credit Limit Management
- Dynamic credit limit based on user tier
- Real-time available credit calculation
- Credit restoration upon loan completion

### Overdue Handling
- Visual indicators for overdue payments
- Status badges (Active/Overdue)
- Next payment date tracking

### Payment Processing
- Flexible payment amounts
- Multiple payment methods (Card, Bank Transfer, Mobile Money)
- Payment history tracking
- Automatic balance updates

### User Experience
- Clean, modern interface
- Responsive design for mobile and desktop
- Real-time updates and notifications
- Intuitive navigation flow

## Future Enhancements

Based on the PDF specifications, this simulator could be extended with:
- Backend API integration
- Real payment gateway integration
- Advanced credit scoring algorithms
- Email/SMS notifications
- Document upload for KYC verification
- Multi-currency support
- Admin dashboard integration
- Risk assessment integration
- Late payment penalties
- Credit score tracking

## License

Copyright © 2024 Stitches Africa. All rights reserved.
