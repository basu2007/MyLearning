export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'collector' | 'customer';
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  aadhar_number?: string;
  pan_number?: string;
  photo_url?: string;
  id_proof_url?: string;
  credit_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  customer_id: string;
  principal_amount: number;
  interest_rate: number; // percentage per month
  duration_days: number;
  daily_amount: number; // calculated amount to be collected daily
  total_amount: number; // principal + interest
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'defaulted' | 'closed';
  collector_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  loan_id: string;
  customer_id: string;
  collector_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'daily' | 'partial' | 'full' | 'penalty';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  customer_id: string;
  loan_id?: string;
  payment_id?: string;
  transaction_type: 'debit' | 'credit';
  amount: number;
  description: string;
  balance_after: number;
  date: string;
  created_by: string;
  created_at: string;
}

export interface Account {
  id: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'income' | 'expense';
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  collector_id: string;
  date: string;
  total_collected: number;
  total_customers: number;
  route_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface CustomerLoan extends Customer {
  loans: Loan[];
  total_outstanding: number;
  total_paid: number;
  last_payment_date?: string;
}

export interface CollectionRoute {
  id: string;
  collector_id: string;
  customers: CustomerLoan[];
  expected_amount: number;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface DashboardStats {
  total_customers: number;
  active_loans: number;
  total_outstanding: number;
  today_collections: number;
  overdue_payments: number;
  total_principal_disbursed: number;
  total_interest_earned: number;
}