import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Customer,
  Loan,
  Payment,
  LedgerEntry,
  Account,
  Collection,
  DashboardStats
} from '../types';

class DatabaseService {
  private db: SQLite.Database;

  constructor() {
    this.db = SQLite.openDatabase('loan_manager.db');
    this.initDatabase();
  }

  private initDatabase() {
    this.db.transaction((tx) => {
      // Users table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          role TEXT CHECK(role IN ('admin', 'collector', 'customer')) NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Customers table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          address TEXT NOT NULL,
          aadhar_number TEXT,
          pan_number TEXT,
          photo_url TEXT,
          id_proof_url TEXT,
          credit_score INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Loans table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS loans (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          principal_amount REAL NOT NULL,
          interest_rate REAL NOT NULL,
          duration_days INTEGER NOT NULL,
          daily_amount REAL NOT NULL,
          total_amount REAL NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          status TEXT CHECK(status IN ('active', 'completed', 'defaulted', 'closed')) DEFAULT 'active',
          collector_id TEXT,
          created_by TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (collector_id) REFERENCES users (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Payments table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          loan_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          collector_id TEXT NOT NULL,
          amount REAL NOT NULL,
          payment_date TEXT NOT NULL,
          payment_type TEXT CHECK(payment_type IN ('daily', 'partial', 'full', 'penalty')) NOT NULL,
          notes TEXT,
          latitude REAL,
          longitude REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (loan_id) REFERENCES loans (id),
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (collector_id) REFERENCES users (id)
        )
      `);

      // Ledger entries table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS ledger_entries (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          loan_id TEXT,
          payment_id TEXT,
          transaction_type TEXT CHECK(transaction_type IN ('debit', 'credit')) NOT NULL,
          amount REAL NOT NULL,
          description TEXT NOT NULL,
          balance_after REAL NOT NULL,
          date TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (loan_id) REFERENCES loans (id),
          FOREIGN KEY (payment_id) REFERENCES payments (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Accounts table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          account_name TEXT NOT NULL,
          account_type TEXT CHECK(account_type IN ('asset', 'liability', 'income', 'expense')) NOT NULL,
          balance REAL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Collections table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY,
          collector_id TEXT NOT NULL,
          date TEXT NOT NULL,
          total_collected REAL DEFAULT 0,
          total_customers INTEGER DEFAULT 0,
          route_completed BOOLEAN DEFAULT 0,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (collector_id) REFERENCES users (id)
        )
      `);

      // Create default admin user
      tx.executeSql(`
        INSERT OR IGNORE INTO users (id, name, email, phone, role, password_hash)
        VALUES (?, 'Admin', 'admin@loanmanager.com', '9999999999', 'admin', 'admin123')
      `, [uuidv4()]);

      // Create default accounts
      const defaultAccounts = [
        { name: 'Cash', type: 'asset' },
        { name: 'Loans Receivable', type: 'asset' },
        { name: 'Interest Income', type: 'income' },
        { name: 'Operating Expenses', type: 'expense' }
      ];

      defaultAccounts.forEach(account => {
        tx.executeSql(`
          INSERT OR IGNORE INTO accounts (id, account_name, account_type)
          VALUES (?, ?, ?)
        `, [uuidv4(), account.name, account.type]);
      });
    });
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO users (id, name, email, phone, role, password_hash)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, user.name, user.email, user.phone, user.role, user.password_hash],
          () => resolve(id),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM users WHERE email = ? AND password_hash = ?',
          [email, password],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0) as User);
            } else {
              resolve(null);
            }
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Customer operations
  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO customers (id, name, phone, email, address, aadhar_number, pan_number, photo_url, id_proof_url, credit_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, customer.name, customer.phone, customer.email || null, customer.address, 
           customer.aadhar_number || null, customer.pan_number || null, customer.photo_url || null,
           customer.id_proof_url || null, customer.credit_score || null],
          () => resolve(id),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async getCustomers(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM customers ORDER BY name',
          [],
          (_, { rows }) => {
            const customers: Customer[] = [];
            for (let i = 0; i < rows.length; i++) {
              customers.push(rows.item(i) as Customer);
            }
            resolve(customers);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Loan operations
  async createLoan(loan: Omit<Loan, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO loans (id, customer_id, principal_amount, interest_rate, duration_days, 
           daily_amount, total_amount, start_date, end_date, status, collector_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, loan.customer_id, loan.principal_amount, loan.interest_rate, loan.duration_days,
           loan.daily_amount, loan.total_amount, loan.start_date, loan.end_date, loan.status,
           loan.collector_id || null, loan.created_by],
          () => {
            // Create ledger entry for loan disbursement
            this.createLedgerEntry({
              customer_id: loan.customer_id,
              loan_id: id,
              transaction_type: 'debit',
              amount: loan.principal_amount,
              description: 'Loan disbursed',
              balance_after: loan.total_amount,
              date: loan.start_date,
              created_by: loan.created_by
            });
            resolve(id);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async getActiveLoans(): Promise<Loan[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM loans WHERE status = "active" ORDER BY start_date',
          [],
          (_, { rows }) => {
            const loans: Loan[] = [];
            for (let i = 0; i < rows.length; i++) {
              loans.push(rows.item(i) as Loan);
            }
            resolve(loans);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async getLoansByCustomer(customerId: string): Promise<Loan[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM loans WHERE customer_id = ? ORDER BY start_date DESC',
          [customerId],
          (_, { rows }) => {
            const loans: Loan[] = [];
            for (let i = 0; i < rows.length; i++) {
              loans.push(rows.item(i) as Loan);
            }
            resolve(loans);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Payment operations
  async recordPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO payments (id, loan_id, customer_id, collector_id, amount, payment_date, 
           payment_type, notes, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, payment.loan_id, payment.customer_id, payment.collector_id, payment.amount,
           payment.payment_date, payment.payment_type, payment.notes || null,
           payment.location?.latitude || null, payment.location?.longitude || null],
          () => {
            // Create ledger entry for payment
            this.createLedgerEntry({
              customer_id: payment.customer_id,
              loan_id: payment.loan_id,
              payment_id: id,
              transaction_type: 'credit',
              amount: payment.amount,
              description: `Payment received - ${payment.payment_type}`,
              balance_after: 0, // Will be calculated
              date: payment.payment_date,
              created_by: payment.collector_id
            });
            resolve(id);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async getPaymentsByLoan(loanId: string): Promise<Payment[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date DESC',
          [loanId],
          (_, { rows }) => {
            const payments: Payment[] = [];
            for (let i = 0; i < rows.length; i++) {
              payments.push(rows.item(i) as Payment);
            }
            resolve(payments);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Ledger operations
  async createLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'created_at'>): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO ledger_entries (id, customer_id, loan_id, payment_id, transaction_type,
           amount, description, balance_after, date, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, entry.customer_id, entry.loan_id || null, entry.payment_id || null,
           entry.transaction_type, entry.amount, entry.description, entry.balance_after,
           entry.date, entry.created_by],
          () => resolve(id),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  async getLedgerByCustomer(customerId: string): Promise<LedgerEntry[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM ledger_entries WHERE customer_id = ? ORDER BY date DESC',
          [customerId],
          (_, { rows }) => {
            const entries: LedgerEntry[] = [];
            for (let i = 0; i < rows.length; i++) {
              entries.push(rows.item(i) as LedgerEntry);
            }
            resolve(entries);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        let stats: Partial<DashboardStats> = {};
        let queriesCompleted = 0;
        const totalQueries = 7;

        const checkComplete = () => {
          queriesCompleted++;
          if (queriesCompleted === totalQueries) {
            resolve(stats as DashboardStats);
          }
        };

        // Total customers
        tx.executeSql(
          'SELECT COUNT(*) as count FROM customers',
          [],
          (_, { rows }) => {
            stats.total_customers = rows.item(0).count;
            checkComplete();
          }
        );

        // Active loans
        tx.executeSql(
          'SELECT COUNT(*) as count FROM loans WHERE status = "active"',
          [],
          (_, { rows }) => {
            stats.active_loans = rows.item(0).count;
            checkComplete();
          }
        );

        // Total outstanding
        tx.executeSql(
          'SELECT SUM(total_amount) as total FROM loans WHERE status = "active"',
          [],
          (_, { rows }) => {
            stats.total_outstanding = rows.item(0).total || 0;
            checkComplete();
          }
        );

        // Today's collections
        const today = new Date().toISOString().split('T')[0];
        tx.executeSql(
          'SELECT SUM(amount) as total FROM payments WHERE DATE(payment_date) = ?',
          [today],
          (_, { rows }) => {
            stats.today_collections = rows.item(0).total || 0;
            checkComplete();
          }
        );

        // Overdue payments (simplified - loans past end date)
        tx.executeSql(
          'SELECT COUNT(*) as count FROM loans WHERE status = "active" AND DATE(end_date) < DATE("now")',
          [],
          (_, { rows }) => {
            stats.overdue_payments = rows.item(0).count;
            checkComplete();
          }
        );

        // Total principal disbursed
        tx.executeSql(
          'SELECT SUM(principal_amount) as total FROM loans',
          [],
          (_, { rows }) => {
            stats.total_principal_disbursed = rows.item(0).total || 0;
            checkComplete();
          }
        );

        // Total interest earned (from payments)
        tx.executeSql(
          'SELECT SUM(amount) as total FROM payments',
          [],
          (_, { rows }) => {
            const totalPayments = rows.item(0).total || 0;
            stats.total_interest_earned = Math.max(0, totalPayments - (stats.total_principal_disbursed || 0));
            checkComplete();
          }
        );
      });
    });
  }

  // Collection routes for collectors
  async getTodayCollectionRoute(collectorId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      this.db.transaction((tx) => {
        tx.executeSql(
          `SELECT c.*, l.daily_amount, l.id as loan_id, 
           COALESCE(SUM(p.amount), 0) as total_paid
           FROM customers c
           JOIN loans l ON c.id = l.customer_id
           LEFT JOIN payments p ON l.id = p.loan_id
           WHERE l.status = 'active' AND (l.collector_id = ? OR l.collector_id IS NULL)
           GROUP BY c.id, l.id
           ORDER BY c.name`,
          [collectorId],
          (_, { rows }) => {
            const customers = [];
            for (let i = 0; i < rows.length; i++) {
              customers.push(rows.item(i));
            }
            resolve(customers);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }
}

export default new DatabaseService();