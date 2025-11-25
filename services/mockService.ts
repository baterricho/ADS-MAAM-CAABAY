
import { 
  User, 
  RoleType, 
  Product, 
  SalesOrder, 
  SalesOrderItem, 
  PurchaseOrder,
  PurchaseOrderItem,
  OrderStatus,
  DashboardStats,
  Supplier,
  Category,
  InventoryAdjustment
} from '../types';

// --- Initial Data ---

const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', fullName: 'Kirk John Gabo', role: RoleType.ADMIN },
  { id: 'u2', username: 'cashier', fullName: 'Owen Sanchez', role: RoleType.CASHIER },
  { id: 'u3', username: 'clerk', fullName: 'Jovi Leo Pacto', role: RoleType.INVENTORY_CLERK },
];

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Electronics' },
  { id: 'c2', name: 'Groceries' },
  { id: 'c3', name: 'Apparel' },
];

export const SUPPLIERS: Supplier[] = [
  { 
    id: 's1', 
    companyName: 'Palawan Tech Solutions', 
    contactPerson: 'Marco Dela Serna', 
    phone: '0917 123 4567', 
    email: 'marco@palawantech.ph', 
    address: 'Unit 4, North Road, Brgy. San Pedro, Puerto Princesa City, Palawan' 
  },
  { 
    id: 's2', 
    companyName: 'Puerto Princesa Trading', 
    contactPerson: 'Richo Baterzal', 
    phone: '0918 987 6543', 
    email: 'richo@puertotrading.ph', 
    address: 'Rizal Avenue, Brgy. San Miguel, Puerto Princesa City, Palawan' 
  },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', code: 'E001', name: 'Wireless Mouse', categoryId: 'c1', supplierId: 's1', unitPrice: 250.00, stock: 50, reorderLevel: 10, isActive: true },
  { id: 'p2', code: 'E002', name: 'Mechanical Keyboard', categoryId: 'c1', supplierId: 's1', unitPrice: 1850.00, stock: 5, reorderLevel: 15, isActive: true },
  { id: 'p3', code: 'G001', name: 'Organic Coffee Beans', categoryId: 'c2', supplierId: 's2', unitPrice: 450.00, stock: 100, reorderLevel: 20, isActive: true },
  { id: 'p4', code: 'A001', name: 'Cotton T-Shirt', categoryId: 'c3', supplierId: 's2', unitPrice: 350.00, stock: 30, reorderLevel: 10, isActive: true },
  { id: 'p5', code: 'E003', name: 'USB-C Cable', categoryId: 'c1', supplierId: 's1', unitPrice: 150.00, stock: 200, reorderLevel: 50, isActive: true },
];

const INITIAL_SALES: SalesOrder[] = [
  {
    id: 'so1',
    invoiceNumber: 'INV-1001',
    dateTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    cashierId: 'u2',
    subtotal: 500.00,
    tax: 60.00,
    total: 560.00,
    amountPaid: 600.00,
    change: 40.00,
    items: [{ productId: 'p1', productName: 'Wireless Mouse', quantity: 2, unitPrice: 250.00, lineTotal: 500.00 }]
  }
];

const INITIAL_PURCHASES: PurchaseOrder[] = [];
const INITIAL_ADJUSTMENTS: InventoryAdjustment[] = [];

// --- Service Class ---

class MockBackendService {
  private users: User[] = MOCK_USERS;
  private categories: Category[] = CATEGORIES;
  private suppliers: Supplier[] = SUPPLIERS;
  private products: Product[] = INITIAL_PRODUCTS;
  private sales: SalesOrder[] = INITIAL_SALES;
  private purchases: PurchaseOrder[] = INITIAL_PURCHASES;
  private adjustments: InventoryAdjustment[] = INITIAL_ADJUSTMENTS;

  // Auth
  async login(username: string): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = this.users.find(u => u.username === username);
    return user || null;
  }

  // Master Data (Categories & Suppliers)
  async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  async getSuppliers(): Promise<Supplier[]> {
    return [...this.suppliers];
  }

  async addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const newSupplier = { ...supplier, id: Math.random().toString(36).substr(2, 9) };
    this.suppliers.push(newSupplier);
    return newSupplier;
  }

  async updateSupplier(supplier: Supplier): Promise<void> {
    const idx = this.suppliers.findIndex(s => s.id === supplier.id);
    if (idx !== -1) {
      this.suppliers[idx] = supplier;
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(product: Product): Promise<void> {
    const idx = this.products.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      this.products[idx] = product;
    }
  }

  // Inventory Adjustments
  async adjustInventory(productId: string, quantityChange: number, reason: string, userId: string): Promise<InventoryAdjustment> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate Transaction
    try {
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex === -1) throw new Error("Product not found");

        // Update Stock
        this.products[productIndex].stock += quantityChange;

        // Create Log
        const adjustment: InventoryAdjustment = {
          id: Math.random().toString(36).substr(2, 9),
          productId,
          productName: this.products[productIndex].name,
          adjustmentDate: new Date().toISOString(),
          quantityChange,
          reason,
          userId
        };
        this.adjustments.unshift(adjustment);
        return adjustment;
    } catch (e) {
        throw e; // Rollback simulation
    }
  }

  async getInventoryAdjustments(): Promise<InventoryAdjustment[]> {
    return [...this.adjustments];
  }

  // Sales (Simulates Stored Procedure sp_process_sale)
  async processSale(items: { product: Product; quantity: number }[], cashierId: string, amountPaid: number): Promise<SalesOrder> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulate Transaction Block
    const subtotal = items.reduce((sum, item) => sum + (item.product.unitPrice * item.quantity), 0);
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + tax;
    const change = amountPaid - total;

    const orderItems: SalesOrderItem[] = items.map(i => ({
      productId: i.product.id,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: i.product.unitPrice,
      lineTotal: i.product.unitPrice * i.quantity
    }));

    const newOrder: SalesOrder = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `INV-${1000 + this.sales.length + 1}`,
      dateTime: new Date().toISOString(),
      cashierId,
      subtotal,
      tax,
      total,
      amountPaid,
      change,
      items: orderItems
    };

    // Simulate Trigger: After Sale Update Stock
    items.forEach(item => {
      const prodIndex = this.products.findIndex(p => p.id === item.product.id);
      if (prodIndex !== -1) {
        this.products[prodIndex].stock -= item.quantity;
      }
    });

    this.sales.unshift(newOrder); 
    return newOrder;
  }

  async getRecentSales(): Promise<SalesOrder[]> {
    return [...this.sales];
  }

  // Simulate View: Fast Moving Products
  async getProductPerformance(): Promise<{product: string, sold: number}[]> {
    const counts: {[key: string]: number} = {};
    
    this.sales.forEach(sale => {
        sale.items.forEach(item => {
            counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
        });
    });

    return Object.entries(counts)
        .map(([product, sold]) => ({ product, sold }))
        .sort((a, b) => b.sold - a.sold);
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return [...this.purchases];
  }

  async createPurchaseOrder(
    supplierId: string, 
    items: { productId: string; quantity: number; unitCost: number }[], 
    userId: string
  ): Promise<PurchaseOrder> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const supplier = this.suppliers.find(s => s.id === supplierId);
    
    const poItems: PurchaseOrderItem[] = items.map(item => {
      const product = this.products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        quantity: item.quantity,
        unitCost: item.unitCost,
        lineTotal: item.quantity * item.unitCost
      };
    });

    const totalAmount = poItems.reduce((acc, item) => acc + item.lineTotal, 0);

    const newPO: PurchaseOrder = {
      id: Math.random().toString(36).substr(2, 9),
      poNumber: `PO-${2000 + this.purchases.length + 1}`,
      supplierId,
      supplierName: supplier?.companyName || 'Unknown',
      orderDate: new Date().toISOString(),
      status: OrderStatus.PENDING,
      createdById: userId,
      totalAmount,
      items: poItems
    };

    this.purchases.unshift(newPO);
    return newPO;
  }

  // Simulate Trigger: Update Stock on Receive
  async receivePurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const poIndex = this.purchases.findIndex(p => p.id === poId);
    if (poIndex === -1) return null;

    const po = this.purchases[poIndex];
    if (po.status === OrderStatus.RECEIVED) return po;

    // Update PO Status
    const updatedPO = {
      ...po,
      status: OrderStatus.RECEIVED,
      receivedDate: new Date().toISOString()
    };
    this.purchases[poIndex] = updatedPO;

    // Increment Inventory (Trigger simulation)
    updatedPO.items.forEach(item => {
      const prodIndex = this.products.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        this.products[prodIndex].stock += item.quantity;
      }
    });

    return updatedPO;
  }

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = this.sales.filter(s => s.dateTime.startsWith(today));
    
    return {
      todaySales: todaySales.length,
      revenue: todaySales.reduce((sum, s) => sum + s.total, 0),
      totalProducts: this.products.length,
      lowStockCount: this.products.filter(p => p.stock <= p.reorderLevel).length,
      pendingPO: this.purchases.filter(p => p.status === OrderStatus.PENDING).length
    };
  }
}

export const api = new MockBackendService();
