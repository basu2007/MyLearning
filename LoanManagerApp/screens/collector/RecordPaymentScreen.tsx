import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DatabaseService from '../../services/database';

interface CustomerRoute {
  id: string;
  name: string;
  phone: string;
  address: string;
  daily_amount: number;
  loan_id: string;
  total_paid: number;
}

const RecordPaymentScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { customer, collectorId } = route.params as {
    customer: CustomerRoute;
    collectorId: string;
  };

  const [amount, setAmount] = useState(customer.daily_amount.toString());
  const [paymentType, setPaymentType] = useState<'daily' | 'partial' | 'full' | 'penalty'>('daily');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handlePaymentTypeChange = (type: 'daily' | 'partial' | 'full' | 'penalty') => {
    setPaymentType(type);
    if (type === 'daily') {
      setAmount(customer.daily_amount.toString());
    } else if (type === 'full') {
      // This would need to calculate the full outstanding amount
      // For now, we'll leave it as is
    }
  };

  const validatePayment = () => {
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return false;
    }

    if (paymentAmount > 100000) {
      Alert.alert('Error', 'Payment amount seems unusually high. Please verify.');
      return false;
    }

    return true;
  };

  const handleRecordPayment = async () => {
    if (!validatePayment()) return;

    Alert.alert(
      'Confirm Payment',
      `Record payment of ₹${parseFloat(amount).toLocaleString('en-IN')} from ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: recordPayment },
      ]
    );
  };

  const recordPayment = async () => {
    setLoading(true);
    try {
      const paymentData = {
        loan_id: customer.loan_id,
        customer_id: customer.id,
        collector_id: collectorId,
        amount: parseFloat(amount),
        payment_date: new Date().toISOString(),
        payment_type: paymentType,
        notes: notes.trim() || undefined,
        location,
      };

      await DatabaseService.recordPayment(paymentData);
      
      Alert.alert(
        'Success',
        'Payment recorded successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const PaymentTypeButton: React.FC<{
    type: 'daily' | 'partial' | 'full' | 'penalty';
    label: string;
    description: string;
    suggested?: number;
  }> = ({ type, label, description, suggested }) => (
    <TouchableOpacity
      style={[
        styles.paymentTypeButton,
        paymentType === type && styles.selectedPaymentType,
      ]}
      onPress={() => handlePaymentTypeChange(type)}
    >
      <View style={styles.paymentTypeContent}>
        <Text style={[
          styles.paymentTypeLabel,
          paymentType === type && styles.selectedPaymentTypeText,
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.paymentTypeDescription,
          paymentType === type && styles.selectedPaymentTypeText,
        ]}>
          {description}
        </Text>
        {suggested && (
          <Text style={[
            styles.suggestedAmount,
            paymentType === type && styles.selectedPaymentTypeText,
          ]}>
            Suggested: {formatCurrency(suggested)}
          </Text>
        )}
      </View>
      {paymentType === type && (
        <Ionicons name="checkmark-circle" size={24} color="#50C878" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Payment</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Ionicons name="person-circle" size={40} color="#4A90E2" />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerPhone}>{customer.phone}</Text>
            <Text style={styles.customerAddress} numberOfLines={2}>
              {customer.address}
            </Text>
          </View>
        </View>
        
        <View style={styles.loanInfo}>
          <Text style={styles.loanInfoLabel}>Daily Amount: {formatCurrency(customer.daily_amount)}</Text>
          <Text style={styles.loanInfoLabel}>Total Paid: {formatCurrency(customer.total_paid)}</Text>
        </View>
      </View>

      {/* Payment Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Type</Text>
        
        <PaymentTypeButton
          type="daily"
          label="Daily Payment"
          description="Regular daily collection"
          suggested={customer.daily_amount}
        />
        
        <PaymentTypeButton
          type="partial"
          label="Partial Payment"
          description="Less than daily amount"
        />
        
        <PaymentTypeButton
          type="full"
          label="Full Payment"
          description="Complete loan settlement"
        />
        
        <PaymentTypeButton
          type="penalty"
          label="Penalty Payment"
          description="Late payment penalty"
        />
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#ccc"
          />
        </View>
        
        {/* Quick Amount Buttons */}
        <View style={styles.quickAmountContainer}>
          <TouchableOpacity
            style={styles.quickAmountButton}
            onPress={() => setAmount(customer.daily_amount.toString())}
          >
            <Text style={styles.quickAmountText}>Daily</Text>
            <Text style={styles.quickAmountValue}>{formatCurrency(customer.daily_amount)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAmountButton}
            onPress={() => setAmount((customer.daily_amount * 2).toString())}
          >
            <Text style={styles.quickAmountText}>2x Daily</Text>
            <Text style={styles.quickAmountValue}>{formatCurrency(customer.daily_amount * 2)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAmountButton}
            onPress={() => setAmount((customer.daily_amount * 0.5).toString())}
          >
            <Text style={styles.quickAmountText}>Half</Text>
            <Text style={styles.quickAmountValue}>{formatCurrency(customer.daily_amount * 0.5)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about this payment..."
          placeholderTextColor="#ccc"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Location Info */}
      {location && (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.locationText}>
            Location will be recorded: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Record Button */}
      <TouchableOpacity
        style={[styles.recordButton, loading && styles.recordButtonDisabled]}
        onPress={handleRecordPayment}
        disabled={loading}
      >
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <Text style={styles.recordButtonText}>
          {loading ? 'Recording...' : 'Record Payment'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#50C878',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerInfo: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  customerDetails: {
    marginLeft: 15,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
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
  loanInfo: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loanInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paymentTypeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedPaymentType: {
    borderColor: '#50C878',
    backgroundColor: '#f0fff0',
  },
  paymentTypeContent: {
    flex: 1,
  },
  paymentTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentTypeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  suggestedAmount: {
    fontSize: 12,
    color: '#50C878',
    fontWeight: '600',
  },
  selectedPaymentTypeText: {
    color: '#50C878',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  quickAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickAmountText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  quickAmountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#50C878',
    margin: 15,
    borderRadius: 12,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recordButtonDisabled: {
    backgroundColor: '#ccc',
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});

export default RecordPaymentScreen;