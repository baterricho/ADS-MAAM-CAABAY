
import React, { useState, useEffect } from 'react';
import { api } from '../services/mockService';
import { SalesOrder, Product, PurchaseOrder, InventoryAdjustment } from '../types';
import { Download, TrendingUp, Package, Truck, AlertTriangle } from 'lucide-react';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'suppliers'>('sales');
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [fastMoving, setFastMoving] = useState<{product: string, sold: number}[]>([]);

  useEffect(() => {
    const load = async () => {
      const [sData, pData, poData, adjData, fmData] = await Promise.all([
        api.getRecentSales(),
        api.getProducts(),
        api.getPurchaseOrders(),
        api.getInventoryAdjustments(),
        api.getProductPerformance()
      ]);
      setSales(sData);
      setProducts(pData);
      setPurchases(poData);
      setAdjustments(adjData);
      setFastMoving(fmData);
    };
    load();
  }, []);

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.unitPrice), 0);
  const lowStockItems = products.filter(p => p.stock <= p.reorderLevel);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 bg-white">
          <Download size={18} className="mr-2" />
          Export PDF
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sales' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center"><TrendingUp size={18} className="mr-2" /> Sales</div>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'inventory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
           <div className="flex items-center"><Package size={18} className="mr-2" /> Inventory</div>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'suppliers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
           <div className="flex items-center"><Truck size={18} className="mr-2" /> Suppliers & PO</div>
        </button>
      </div>

      {/* Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-gray-900">₱{sales.length ? (totalRevenue / sales.length).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Fast Moving Products View */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-md font-bold text-gray-800 mb-4">Fast Moving Products (Top 5)</h3>
                <ul className="space-y-3">
                    {fastMoving.slice(0, 5).map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-sm text-gray-700">{item.product}</span>
                            <span className="text-sm font-bold text-blue-600">{item.sold} sold</span>
                        </li>
                    ))}
                    {fastMoving.length === 0 && <li className="text-sm text-gray-400">No sales data yet.</li>}
                </ul>
             </div>
             
             {/* Recent Transactions */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-4 bg-gray-50 border-b border-gray-100">
                     <h3 className="text-md font-bold text-gray-800">Recent Transactions</h3>
                 </div>
                 <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{sale.invoiceNumber}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">₱{sale.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Inventory Valuation</h3>
              <p className="text-3xl font-bold text-gray-900">₱{totalInventoryValue.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Total value of stock on hand</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <AlertTriangle size={20} className="text-red-500 mr-2" /> Low Stock Alerts
              </h3>
              <p className="text-3xl font-bold text-gray-900">{lowStockItems.length}</p>
              <p className="text-sm text-gray-500">Products below reorder level</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Recent Inventory Adjustments</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adjustments.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No adjustments recorded.</td></tr>
                ) : adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{adj.productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(adj.adjustmentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{adj.reason}</td>
                    <td className={`px-6 py-4 text-sm text-right font-bold ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Report */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Purchase Order History</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{po.poNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{po.supplierName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        po.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">₱{po.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
