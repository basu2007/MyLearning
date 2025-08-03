import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStats } from '../../types';
import DatabaseService from '../../services/database';

const { width } = Dimensions.get('window');

const AdminDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await DatabaseService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: string;
    color: string;
    onPress?: () => void;
  }> = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
        </View>
        <View style={[styles.statCardIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickActionButton: React.FC<{
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
  }> = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={28} color="#fff" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Overview of your loan business</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Customers"
          value={stats?.total_customers.toString() || '0'}
          icon="people"
          color="#4A90E2"
          onPress={() => navigation.navigate('Customers')}
        />
        
        <StatCard
          title="Active Loans"
          value={stats?.active_loans.toString() || '0'}
          icon="document-text"
          color="#50C878"
          onPress={() => navigation.navigate('Loans')}
        />
        
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(stats?.total_outstanding || 0)}
          icon="cash"
          color="#FF6B6B"
          onPress={() => navigation.navigate('Ledger')}
        />
        
        <StatCard
          title="Today's Collection"
          value={formatCurrency(stats?.today_collections || 0)}
          icon="card"
          color="#FFD93D"
          onPress={() => navigation.navigate('Collections')}
        />
        
        <StatCard
          title="Overdue Payments"
          value={stats?.overdue_payments.toString() || '0'}
          icon="warning"
          color="#FF8C42"
          onPress={() => navigation.navigate('Overdue')}
        />
        
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(stats?.total_principal_disbursed || 0)}
          icon="trending-up"
          color="#9B59B6"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionButton
            title="Add Customer"
            icon="person-add"
            color="#4A90E2"
            onPress={() => navigation.navigate('AddCustomer')}
          />
          
          <QuickActionButton
            title="Create Loan"
            icon="add-circle"
            color="#50C878"
            onPress={() => navigation.navigate('CreateLoan')}
          />
          
          <QuickActionButton
            title="View Reports"
            icon="bar-chart"
            color="#FF6B6B"
            onPress={() => navigation.navigate('Reports')}
          />
          
          <QuickActionButton
            title="Manage Users"
            icon="settings"
            color="#9B59B6"
            onPress={() => navigation.navigate('ManageUsers')}
          />
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Business Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Interest Earned:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(stats?.total_interest_earned || 0)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Active Collection Rate:</Text>
            <Text style={[styles.summaryValue, { color: '#50C878' }]}>
              {stats?.active_loans && stats?.total_customers
                ? `${((stats.active_loans / stats.total_customers) * 100).toFixed(1)}%`
                : '0%'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average Loan Size:</Text>
            <Text style={styles.summaryValue}>
              {stats?.active_loans && stats?.total_outstanding
                ? formatCurrency(stats.total_outstanding / stats.active_loans)
                : formatCurrency(0)}
            </Text>
          </View>
        </View>
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
    backgroundColor: '#4A90E2',
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
    color: '#E6F3FF',
  },
  statsContainer: {
    padding: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardLeft: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AdminDashboard;