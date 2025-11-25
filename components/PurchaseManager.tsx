
import React, { useState, useEffect, useContext } from 'react';
import { api, SUPPLIERS } from '../services/mockService';
import { PurchaseOrder, Product, OrderStatus } from '../types';
import { Plus, Check, ShoppingBag, Eye, Trash2 } from 'lucide-react';
import { AuthContext } from '../App';

const PurchaseManager: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Create PO Form State
  const [selectedSupplier, setSelectedSupplier] = useState(SUPPLIERS[0].id);
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(10);
  const [currentCost, setCurrentCost] = useState(0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    const poData = await api.getPurchaseOrders();
    setOrders(poData);
    const prodData = await api.getProducts();
    setProducts(prodData);
    if (prodData.length > 0) {
        setCurrentProductId(prodData[0].id);
    }
  };

  const addItemToPO = () => {
    if (!currentProductId || currentQty <= 0) return;
    
    setCartItems(prev => {
      // Check if exists
      const exists = prev.find(i => i.productId === currentProductId);
      if (exists) return prev; // Simplify: prevent duplicates for demo
      return [...prev, { productId: currentProductId, quantity: currentQty, unitCost: currentCost }];
    });
  };

  const removeItem = (pid: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== pid));
  };

  const handleCreatePO = async () => {
    if (cartItems.length === 0 || !user) return;
    await api.createPurchaseOrder(selectedSupplier, cartItems, user.id);
    setCartItems([]);
    setActiveTab('list');
    loadData();
  };

  const handleReceivePO = async (id: string) => {
    if (window.confirm('Confirm receipt of goods? This will update inventory stock.')) {
      await api.receivePurchaseOrder(id);
      loadData();
    }
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  const totalPOAmount = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Purchase & Restocking</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
          >
            All Orders
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
          >
            <Plus size={16} className="inline mr-1" /> New Order
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No purchase orders found.</td></tr>
              ) : orders.map(po => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{po.poNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{po.supplierName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(po.orderDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      po.status === OrderStatus.RECEIVED ? 'bg-green-100 text-green-800' : 
                      po.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">₱{po.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {po.status === OrderStatus.PENDING && (
                      <button 
                        onClick={() => handleReceivePO(po.id)}
                        className="text-green-600 hover:text-green-900 flex items-center justify-end w-full"
                        title="Receive Stock"
                      >
                        <Check size={16} className="mr-1" /> Receive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Create Form */}
          <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create Purchase Order</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                {SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Items</h3>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <label className="block text-xs text-gray-500 mb-1">Product</label>
                  <select 
                    className="w-full p-2 border rounded-lg text-sm"
                    value={currentProductId}
                    onChange={(e) => setCurrentProductId(e.target.value)}
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-2 border rounded-lg text-sm"
                    value={currentQty} 
                    onChange={e => setCurrentQty(parseInt(e.target.value))} 
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Unit Cost</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-lg text-sm"
                    value={currentCost} 
                    onChange={e => setCurrentCost(parseFloat(e.target.value))} 
                  />
                </div>
                <div className="col-span-2">
                  <button 
                    onClick={addItemToPO}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Items</h3>
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No items added yet.</p>
              ) : (
                <div className="space-y-2">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{getProductName(item.productId)}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x ₱{item.unitCost.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-700">₱{(item.quantity * item.unitCost).toFixed(2)}</span>
                        <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-right">
                <span className="text-gray-500 text-sm">Total Amount:</span>
                <span className="block text-xl font-bold text-gray-900">₱{totalPOAmount.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCreatePO}
                disabled={cartItems.length === 0}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Submit Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseManager;
