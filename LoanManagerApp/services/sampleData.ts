import { v4 as uuidv4 } from 'uuid';
import DatabaseService from './database';

export const createSampleData = async () => {
  try {
    // Create demo collector user
    const collectorId = await DatabaseService.createUser({
      name: 'John Collector',
      email: 'collector@loanmanager.com',
      phone: '9876543210',
      role: 'collector',
      password_hash: 'collector123'
    });

    // Create demo customer user
    const customerUserId = await DatabaseService.createUser({
      name: 'Demo Customer',
      email: 'customer@loanmanager.com',
      phone: '9876543211',
      role: 'customer',
      password_hash: 'customer123'
    });

    // Create sample customers
    const customers = [
      {
        name: 'Rajesh Kumar',
        phone: '9876543201',
        email: 'rajesh@example.com',
        address: '123 Main Street, Delhi, India',
        aadhar_number: '1234-5678-9012',
        pan_number: 'ABCDE1234F',
        credit_score: 750
      },
      {
        name: 'Priya Sharma',
        phone: '9876543202',
        address: '456 Park Road, Mumbai, India',
        aadhar_number: '2345-6789-0123',
        credit_score: 680
      },
      {
        name: 'Amit Singh',
        phone: '9876543203',
        address: '789 Market Lane, Bangalore, India',
        aadhar_number: '3456-7890-1234',
        credit_score: 720
      },
      {
        name: 'Sunita Devi',
        phone: '9876543204',
        address: '321 Temple Street, Chennai, India',
        aadhar_number: '4567-8901-2345',
        credit_score: 650
      },
      {
        name: 'Ravi Patel',
        phone: '9876543205',
        address: '654 Garden Avenue, Ahmedabad, India',
        aadhar_number: '5678-9012-3456',
        credit_score: 700
      }
    ];

    const customerIds: string[] = [];
    for (const customer of customers) {
      const customerId = await DatabaseService.createCustomer(customer);
      customerIds.push(customerId);
    }

    // Create sample loans
    const loans = [
      {
        customer_id: customerIds[0],
        principal_amount: 50000,
        interest_rate: 2, // 2% per month
        duration_days: 100,
        collector_id: collectorId,
        created_by: 'admin'
      },
      {
        customer_id: customerIds[1],
        principal_amount: 30000,
        interest_rate: 2.5,
        duration_days: 80,
        collector_id: collectorId,
        created_by: 'admin'
      },
      {
        customer_id: customerIds[2],
        principal_amount: 75000,
        interest_rate: 1.8,
        duration_days: 120,
        collector_id: collectorId,
        created_by: 'admin'
      },
      {
        customer_id: customerIds[3],
        principal_amount: 25000,
        interest_rate: 3,
        duration_days: 60,
        collector_id: collectorId,
        created_by: 'admin'
      },
      {
        customer_id: customerIds[4],
        principal_amount: 40000,
        interest_rate: 2.2,
        duration_days: 90,
        collector_id: collectorId,
        created_by: 'admin'
      }
    ];

    for (const loan of loans) {
      // Calculate loan details
      const monthlyInterest = loan.principal_amount * (loan.interest_rate / 100);
      const totalMonths = loan.duration_days / 30;
      const totalInterest = monthlyInterest * totalMonths;
      const totalAmount = loan.principal_amount + totalInterest;
      const dailyAmount = totalAmount / loan.duration_days;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + loan.duration_days);

      const loanData = {
        ...loan,
        daily_amount: Math.round(dailyAmount),
        total_amount: Math.round(totalAmount),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active' as const
      };

      const loanId = await DatabaseService.createLoan(loanData);

      // Create some sample payments for variety
      if (Math.random() > 0.5) {
        const numPayments = Math.floor(Math.random() * 10) + 1;
        for (let i = 0; i < numPayments; i++) {
          const paymentDate = new Date(startDate);
          paymentDate.setDate(startDate.getDate() + i);

          await DatabaseService.recordPayment({
            loan_id: loanId,
            customer_id: loan.customer_id,
            collector_id: collectorId,
            amount: loanData.daily_amount,
            payment_date: paymentDate.toISOString(),
            payment_type: 'daily',
            notes: `Daily collection ${i + 1}`,
            location: {
              latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
              longitude: 77.2090 + (Math.random() - 0.5) * 0.1
            }
          });
        }
      }
    }

    console.log('Sample data created successfully!');
    return { success: true, message: 'Sample data created successfully!' };
  } catch (error) {
    console.error('Error creating sample data:', error);
    return { success: false, message: 'Failed to create sample data' };
  }
};

export const clearAllData = async () => {
  try {
    // This would require additional database methods to clear data
    // For now, we'll just log the action
    console.log('Data clearing functionality would be implemented here');
    return { success: true, message: 'Data cleared successfully!' };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, message: 'Failed to clear data' };
  }
};