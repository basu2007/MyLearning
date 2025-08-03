# Loan Manager App

A comprehensive mobile application for small financiers to manage daily loan collections, customers, and financial tracking.

## Features

### Admin Dashboard
- **Dashboard Overview**: Real-time statistics of loans, customers, and collections
- **Customer Management**: Add, edit, and view customer information
- **Loan Management**: Create and manage loans with interest calculations
- **Financial Reports**: View comprehensive financial reports and analytics
- **User Management**: Manage collectors and other users

### Collector Interface
- **Daily Collection Routes**: View assigned customers for daily collections
- **Payment Recording**: Record payments with location tracking
- **Customer Visit Tracking**: Track visits and payment status
- **Offline Capability**: Work offline and sync when connected
- **Route Optimization**: Optimized collection routes

### Customer Portal
- **Loan Overview**: View active loans and payment status
- **Payment History**: Complete payment history and receipts
- **Outstanding Balance**: Real-time outstanding amount tracking
- **Progress Tracking**: Visual payment progress indicators

### Financial Modules
- **Accounts Management**: Track different account types (assets, liabilities, income, expenses)
- **Ledger System**: Complete double-entry ledger system
- **Credit/Debit Tracking**: Automated transaction recording
- **Interest Calculations**: Flexible interest rate management
- **Payment Scheduling**: Daily payment amount calculations

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite (local storage)
- **Navigation**: React Navigation
- **UI Components**: React Native Paper, Expo Vector Icons
- **Location Services**: Expo Location
- **Storage**: AsyncStorage for session management

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

### Installation

1. **Clone the repository** (if using git):
   ```bash
   git clone <repository-url>
   cd LoanManagerApp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   - For Android: `npm run android`
   - For iOS: `npm run ios` (macOS only)
   - For Web: `npm run web`

### Demo Accounts

The application comes with pre-configured demo accounts:

**Admin Account:**
- Email: `admin@loanmanager.com`
- Password: `admin123`

**Collector Account:**
- Email: `collector@loanmanager.com`
- Password: `collector123`

**Customer Account:**
- Email: `customer@loanmanager.com`
- Password: `customer123`

### Sample Data

To populate the app with sample data for testing:

1. Open the app and go to the login screen
2. Click on "Create Sample Data" button
3. This will create:
   - 5 demo customers with contact information
   - Multiple active loans with different amounts and terms
   - Sample payment records
   - Collection routes for collectors

## App Structure

```
LoanManagerApp/
├── components/           # Reusable UI components
├── contexts/            # React contexts (Auth, etc.)
├── screens/             # Screen components
│   ├── admin/          # Admin-specific screens
│   ├── collector/      # Collector-specific screens
│   └── customer/       # Customer-specific screens
├── services/           # Business logic and database
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Database Schema

The app uses SQLite with the following main tables:

- **users**: User accounts with role-based access
- **customers**: Customer information and KYC data
- **loans**: Loan details with terms and status
- **payments**: Payment records with location tracking
- **ledger_entries**: Double-entry accounting records
- **accounts**: Chart of accounts for financial tracking
- **collections**: Daily collection summaries

## Key Features in Detail

### Interest Calculation
- Flexible interest rates (monthly percentage)
- Automatic daily amount calculation
- Compound interest support
- Early payment handling

### Location Tracking
- GPS coordinates recorded with each payment
- Helps verify collector visits
- Route optimization for efficiency

### Offline Support
- Local SQLite database for offline operation
- Data synchronization when online
- Conflict resolution for concurrent updates

### Security Features
- Role-based access control
- Encrypted password storage
- Session management
- Data validation and sanitization

### Financial Reporting
- Real-time dashboard statistics
- Payment collection reports
- Outstanding balance tracking
- Interest income calculations
- Customer payment patterns

## Usage Guide

### For Administrators
1. **Login** with admin credentials
2. **Add Customers** with complete KYC information
3. **Create Loans** with appropriate terms
4. **Assign Collectors** to collection routes
5. **Monitor Performance** through dashboard analytics

### For Collectors
1. **Login** with collector credentials
2. **View Today's Route** with assigned customers
3. **Visit Customers** and record payments
4. **Track Progress** throughout the day
5. **Submit Daily Summary** at end of route

### For Customers
1. **Login** with customer credentials
2. **View Loan Details** and payment schedule
3. **Check Payment History** and receipts
4. **Monitor Outstanding Balance**
5. **Contact Support** if needed

## Development Notes

### Adding New Features
1. Define TypeScript types in `types/index.ts`
2. Update database schema in `services/database.ts`
3. Create UI components in appropriate screen directories
4. Update navigation in `App.tsx`

### Database Migrations
When updating the database schema:
1. Modify table creation SQL in `database.ts`
2. Handle data migration for existing users
3. Update TypeScript interfaces
4. Test thoroughly with existing data

### Performance Optimization
- Use FlatList for large data sets
- Implement pagination for customer/loan lists
- Optimize database queries with indexes
- Cache frequently accessed data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or feature requests, please contact the development team.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This is a demo application for educational purposes. For production use, additional security measures, data encryption, and compliance features should be implemented based on local regulations.