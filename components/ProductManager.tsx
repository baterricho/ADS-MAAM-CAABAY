
import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/mockService';
import { Product, Category, Supplier } from '../types';
import { Search, Plus, Settings, Filter } from 'lucide-react';
import { AuthContext } from '../App';

const ProductManager: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  
  // Data for Modals
  const [adjustData, setAdjustData] = useState({ productId: '', productName: '', quantityChange: 0, reason: '' });
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    code: '', name: '', categoryId: '', supplierId: '', unitPrice: 0, stock: 0, reorderLevel: 10, isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [pData, cData, sData] = await Promise.all([
      api.getProducts(),
      api.getCategories(),
      api.getSuppliers()
    ]);
    setProducts(pData);
    setCategories(cData);
    setSuppliers(sData);
    
    // Set defaults for form if data exists
    if (cData.length > 0 && sData.length > 0) {
      setNewProduct(prev => ({ ...prev, categoryId: cData[0].id, supplierId: sData[0].id }));
    }
  };

  const handleCreateNew = () => {
    setNewProduct({
      code: '', name: '', categoryId: categories[0]?.id, supplierId: suppliers[0]?.id, unitPrice: 0, stock: 0, reorderLevel: 10, isActive: true
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.code && newProduct.name) {
      await api.addProduct(newProduct as Omit<Product, 'id'>);
      setIsProductModalOpen(false);
      loadData();
      // Reset
      setNewProduct({
        code: '', name: '', categoryId: categories[0]?.id, supplierId: suppliers[0]?.id, unitPrice: 0, stock: 0, reorderLevel: 10, isActive: true
      });
    }
  };

  const openAdjustModal = (product: Product) => {
    setAdjustData({ productId: product.id, productName: product.name, quantityChange: 0, reason: '' });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.adjustInventory(adjustData.productId, adjustData.quantityChange, adjustData.reason, user.id);
      setIsAdjustModalOpen(false);
      loadData();
    } catch (error) {
      alert("Failed to adjust stock");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <button 
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or code..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
            <Filter size={18} className="mr-2" />
            Category
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₱)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(c => c.id === product.categoryId)?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">₱{product.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock <= product.reorderLevel 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                    <button 
                      onClick={() => openAdjustModal(product)} 
                      className="text-gray-600 hover:text-blue-600"
                      title="Adjust Stock"
                    >
                      <Settings size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Product</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" value={newProduct.code} onChange={e => setNewProduct({...newProduct, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full p-2 border rounded-lg" value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                  <input required type="number" min="0" step="0.01" className="w-full p-2 border rounded-lg" value={newProduct.unitPrice} onChange={e => setNewProduct({...newProduct, unitPrice: parseFloat(e.target.value)})} />
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select className="w-full p-2 border rounded-lg" value={newProduct.supplierId} onChange={e => setNewProduct({...newProduct, supplierId: e.target.value})}>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                  </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input required type="number" min="0" className="w-full p-2 border rounded-lg" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input required type="number" min="0" className="w-full p-2 border rounded-lg" value={newProduct.reorderLevel} onChange={e => setNewProduct({...newProduct, reorderLevel: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Adjust Inventory</h2>
            <p className="text-sm text-gray-500 mb-6">Recording adjustment for: <strong>{adjustData.productName}</strong></p>
            
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Change</label>
                <p className="text-xs text-gray-500 mb-1">Use negative values for damage/loss, positive for found items.</p>
                <input 
                  required 
                  type="number" 
                  className="w-full p-2 border rounded-lg" 
                  value={adjustData.quantityChange} 
                  onChange={e => setAdjustData({...adjustData, quantityChange: parseInt(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea 
                  required 
                  className="w-full p-2 border rounded-lg" 
                  rows={3}
                  placeholder="e.g., Damaged during shipping, Counting error..."
                  value={adjustData.reason} 
                  onChange={e => setAdjustData({...adjustData, reason: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
