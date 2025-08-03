import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseService from '../../services/database';

interface CustomerRoute {
  id: string;
  name: string;
  phone: string;
  address: string;
  daily_amount: number;
  loan_id: string;
  total_paid: number;
  visited_today?: boolean;
}

const CollectorDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [route, setRoute] = useState<CustomerRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayCollection, setTodayCollection] = useState(0);

  useEffect(() => {
    loadCollectionRoute();
  }, []);

  const loadCollectionRoute = async () => {
    try {
      if (user) {
        const routeData = await DatabaseService.getTodayCollectionRoute(user.id);
        setRoute(routeData as CustomerRoute[]);
        
        // Calculate today's collection
        const today = new Date().toISOString().split('T')[0];
        // This would be calculated from actual payments recorded today
        setTodayCollection(0); // Placeholder
      }
    } catch (error) {
      console.error('Error loading collection route:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollectionRoute();
    setRefreshing(false);
  };

  const handleVisitCustomer = (customer: CustomerRoute) => {
    navigation.navigate('CustomerVisit', {
      customer,
      collectorId: user?.id,
    });
  };

  const handleRecordPayment = (customer: CustomerRoute) => {
    navigation.navigate('RecordPayment', {
      customer,
      collectorId: user?.id,
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const CustomerCard: React.FC<{ customer: CustomerRoute }> = ({ customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
          <Text style={styles.customerAddress} numberOfLines={1}>
            {customer.address}
          </Text>
        </View>
        <View style={styles.customerAmount}>
          <Text style={styles.amountLabel}>Daily Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(customer.daily_amount)}
          </Text>
        </View>
      </View>
      
      <View style={styles.customerActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.visitButton]}
          onPress={() => handleVisitCustomer(customer)}
        >
          <Ionicons name="location" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Visit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.paymentButton]}
          onPress={() => handleRecordPayment(customer)}
        >
          <Ionicons name="cash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Record Payment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => {
            // Handle phone call
            Alert.alert('Call', `Call ${customer.name}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Call', onPress: () => console.log('Calling...') },
            ]);
          }}
        >
          <Ionicons name="call" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: string;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
        </View>
        <View style={[styles.statCardIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="#fff" />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading collection route...</Text>
      </View>
    );
  }

  const totalExpected = route.reduce((sum, customer) => sum + customer.daily_amount, 0);
  const visitedCount = route.filter(customer => customer.visited_today).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collection Route</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Daily Statistics */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Customers"
          value={route.length.toString()}
          icon="people"
          color="#4A90E2"
        />
        
        <StatCard
          title="Expected Collection"
          value={formatCurrency(totalExpected)}
          icon="cash"
          color="#50C878"
        />
        
        <StatCard
          title="Collected Today"
          value={formatCurrency(todayCollection)}
          icon="card"
          color="#FFD93D"
        />
        
        <StatCard
          title="Customers Visited"
          value={`${visitedCount}/${route.length}`}
          icon="checkmark-circle"
          color="#FF8C42"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('CollectionSummary')}
          >
            <Ionicons name="document-text" size={24} color="#4A90E2" />
            <Text style={styles.quickActionText}>Summary</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('RouteMap')}
          >
            <Ionicons name="map" size={24} color="#50C878" />
            <Text style={styles.quickActionText}>Route Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('OfflineSync')}
          >
            <Ionicons name="sync" size={24} color="#FF6B6B" />
            <Text style={styles.quickActionText}>Sync Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer List */}
      <View style={styles.customersContainer}>
        <Text style={styles.sectionTitle}>Today's Route ({route.length} customers)</Text>
        {route.length > 0 ? (
          route.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No customers assigned for today</Text>
            <Text style={styles.emptyStateSubtext}>
              Contact your admin to assign collection routes
            </Text>
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
    backgroundColor: '#50C878',
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
    color: '#E6FFE6',
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
    fontSize: 18,
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
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  customersContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 12,
    color: '#999',
  },
  customerAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#50C878',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  visitButton: {
    backgroundColor: '#4A90E2',
    flex: 1,
    marginRight: 5,
  },
  paymentButton: {
    backgroundColor: '#50C878',
    flex: 1,
    marginHorizontal: 5,
  },
  callButton: {
    backgroundColor: '#FF8C42',
    marginLeft: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default CollectorDashboard;