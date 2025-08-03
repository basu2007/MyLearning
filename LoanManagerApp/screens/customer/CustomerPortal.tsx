import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Loan, Payment, LedgerEntry } from '../../types';
import DatabaseService from '../../services/database';

const CustomerPortal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'ledger'>('overview');

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      if (user) {
        // Assuming the customer's user ID is linked to their customer record
        const customerLoans = await DatabaseService.getLoansByCustomer(user.id);
        setLoans(customerLoans);

        // Load payments for all customer's loans
        const allPayments: Payment[] = [];
        for (const loan of customerLoans) {
          const loanPayments = await DatabaseService.getPaymentsByLoan(loan.id);
          allPayments.push(...loanPayments);
        }
        setPayments(allPayments);

        // Load ledger entries
        const customerLedger = await DatabaseService.getLedgerByCustomer(user.id);
        setLedger(customerLedger);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomerData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateTotalPaid = (loanId: string) => {
    return payments
      .filter(payment => payment.loan_id === loanId)
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const calculateOutstanding = (loan: Loan) => {
    const totalPaid = calculateTotalPaid(loan.id);
    return Math.max(0, loan.total_amount - totalPaid);
  };

  const LoanCard: React.FC<{ loan: Loan }> = ({ loan }) => {
    const totalPaid = calculateTotalPaid(loan.id);
    const outstanding = calculateOutstanding(loan);
    const progress = (totalPaid / loan.total_amount) * 100;

    return (
      <View style={styles.loanCard}>
        <View style={styles.loanHeader}>
          <Text style={styles.loanTitle}>Loan #{loan.id.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) }]}>
            <Text style={styles.statusText}>{loan.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.loanDetails}>
          <View style={styles.loanRow}>
            <Text style={styles.loanLabel}>Principal Amount:</Text>
            <Text style={styles.loanValue}>{formatCurrency(loan.principal_amount)}</Text>
          </View>
          
          <View style={styles.loanRow}>
            <Text style={styles.loanLabel}>Total Amount:</Text>
            <Text style={styles.loanValue}>{formatCurrency(loan.total_amount)}</Text>
          </View>
          
          <View style={styles.loanRow}>
            <Text style={styles.loanLabel}>Amount Paid:</Text>
            <Text style={[styles.loanValue, { color: '#50C878' }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </View>
          
          <View style={styles.loanRow}>
            <Text style={styles.loanLabel}>Outstanding:</Text>
            <Text style={[styles.loanValue, { color: '#FF6B6B' }]}>
              {formatCurrency(outstanding)}
            </Text>
          </View>
          
          <View style={styles.loanRow}>
            <Text style={styles.loanLabel}>Daily Amount:</Text>
            <Text style={styles.loanValue}>{formatCurrency(loan.daily_amount)}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Payment Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}% Complete</Text>
        </View>

        <View style={styles.loanDates}>
          <Text style={styles.dateText}>Start: {formatDate(loan.start_date)}</Text>
          <Text style={styles.dateText}>End: {formatDate(loan.end_date)}</Text>
        </View>
      </View>
    );
  };

  const PaymentItem: React.FC<{ payment: Payment }> = ({ payment }) => (
    <View style={styles.paymentItem}>
      <View style={styles.paymentLeft}>
        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
        <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
        <Text style={styles.paymentType}>{payment.payment_type}</Text>
      </View>
      <View style={styles.paymentRight}>
        <Ionicons name="checkmark-circle" size={24} color="#50C878" />
      </View>
    </View>
  );

  const LedgerItem: React.FC<{ entry: LedgerEntry }> = ({ entry }) => (
    <View style={styles.ledgerItem}>
      <View style={styles.ledgerLeft}>
        <Text style={styles.ledgerDescription}>{entry.description}</Text>
        <Text style={styles.ledgerDate}>{formatDate(entry.date)}</Text>
      </View>
      <View style={styles.ledgerRight}>
        <Text
          style={[
            styles.ledgerAmount,
            { color: entry.transaction_type === 'credit' ? '#50C878' : '#FF6B6B' }
          ]}
        >
          {entry.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
        </Text>
        <Text style={styles.ledgerBalance}>
          Balance: {formatCurrency(entry.balance_after)}
        </Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#50C878';
      case 'completed': return '#4A90E2';
      case 'defaulted': return '#FF6B6B';
      case 'closed': return '#666';
      default: return '#666';
    }
  };

  const totalOutstanding = loans.reduce((total, loan) => total + calculateOutstanding(loan), 0);
  const totalPaid = payments.reduce((total, payment) => total + payment.amount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your loan information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Loans</Text>
        <Text style={styles.headerSubtitle}>Welcome, {user?.name}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={[styles.summaryValue, { color: '#FF6B6B' }]}>
            {formatCurrency(totalOutstanding)}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: '#50C878' }]}>
            {formatCurrency(totalPaid)}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>
            Payments
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ledger' && styles.activeTab]}
          onPress={() => setActiveTab('ledger')}
        >
          <Text style={[styles.tabText, activeTab === 'ledger' && styles.activeTabText]}>
            Ledger
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <View>
            {loans.length > 0 ? (
              loans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>No loans found</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'payments' && (
          <View>
            {payments.length > 0 ? (
              payments
                .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                .map((payment, index) => <PaymentItem key={index} payment={payment} />)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>No payments recorded</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'ledger' && (
          <View>
            {ledger.length > 0 ? (
              ledger
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry, index) => <LedgerItem key={index} entry={entry} />)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>No ledger entries</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#9B59B6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E6E6FA',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#9B59B6',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 15,
    paddingBottom: 30,
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  loanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loanDetails: {
    marginBottom: 15,
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loanLabel: {
    fontSize: 14,
    color: '#666',
  },
  loanValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#50C878',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loanDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  paymentItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  paymentRight: {
    marginLeft: 10,
  },
  ledgerItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ledgerLeft: {
    flex: 1,
  },
  ledgerDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  ledgerDate: {
    fontSize: 12,
    color: '#666',
  },
  ledgerRight: {
    alignItems: 'flex-end',
  },
  ledgerAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ledgerBalance: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default CustomerPortal;