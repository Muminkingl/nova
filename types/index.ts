export type Item = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  buy_price: number;
  sell_price: number;
  stock_qty: number;
  expiry_date: string | null;
  min_stock_alert: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ItemFormData = Omit<Item, 'id' | 'is_active' | 'created_at' | 'updated_at'>;

export type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Purchase = {
  id: string;
  supplier_id: string;
  purchase_date: string;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
};

export type PurchaseItem = {
  id: string;
  purchase_id: string;
  item_id: string;
  quantity: number;
  buy_price: number;
  expiry_date: string | null;
  subtotal: number;
};

export type SupplierPayment = {
  id: string;
  supplier_id: string;
  purchase_id: string | null;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'other';
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  amount_paid: number;
  notes: string | null;
  status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  item_id: string;
  quantity: number;
  sell_price: number;
  discount_percent: number;
  subtotal: number;
};

export type CustomerPayment = {
  id: string;
  customer_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

export type Damage = {
  id: string;
  item_id: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'lost' | 'other';
  notes: string | null;
  cost: number;
  damage_date: string;
  created_at: string;
};

export type DamageFormData = {
  item_id: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'lost' | 'other';
  damage_date: string;
  notes: string | null;
};

export type FinancialOverview = {
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  customer_debt: number;
  supplier_debt: number;
  stock_value: number;
  damage_losses: number;
  net_position: number;
};

export type ProfitByItem = {
  item_id: string;
  name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  discount: number;
  profit: number;
  margin: number;
};

export type StatementEntry = {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'purchase' | 'supplier_payment';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  notes: string | null;
};

export type ExpiryAlert = {
  item_id: string;
  name: string;
  stock_qty: number;
  expiry_date: string | null;
  days_until_expiry: number;
  value_at_risk: number;
  status: 'expired' | 'critical' | 'warning' | 'caution' | 'ok';
};

export type UserProfile = {
  id: string;
  full_name: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  entity_type: 'invoice' | 'purchase' | 'item' | 'customer' | 'supplier' | 'damage' | 'payment' | 'user';
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, any> | null;
  created_at: string;
};

export type Settings = {
  id: number;
  company_name: string;
  address: string | null;
  phone: string | null;
  currency: string;
  updated_at: string;
};


