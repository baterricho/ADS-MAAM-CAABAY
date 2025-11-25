
// Enums
export enum RoleType {
  ADMIN = 'Administrator',
  CASHIER = 'Cashier',
  INVENTORY_CLERK = 'Inventory Clerk'
}

export enum OrderStatus {
  PENDING = 'Pending',
  RECEIVED = 'Received',
  CANCELLED = 'Cancelled'
}

// Entities
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: RoleType;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  supplierId: string;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
  isActive: boolean;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  adjustmentDate: string;
  quantityChange: number; // positive = add, negative = subtract
  reason: string;
  userId: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string; // Denormalized for display ease
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  invoiceNumber: string;
  dateTime: string;
  cashierId: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  items: SalesOrderItem[];
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  receivedDate?: string;
  status: OrderStatus;
  createdById: string;
  totalAmount: number;
  items: PurchaseOrderItem[];
}

export interface DashboardStats {
  todaySales: number;
  totalProducts: number;
  lowStockCount: number;
  pendingPO: number;
  revenue: number;
}
