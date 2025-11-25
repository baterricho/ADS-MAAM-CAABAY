
import React, { useState, useEffect, useContext } from 'react';
import { api, CATEGORIES } from '../services/mockService';
import { Product } from '../types';
import { Search, Plus, Minus, Trash2, Printer, CheckCircle, ShoppingCart } from 'lucide-react';
import { AuthContext } from '../App';

interface CartItem {
  product: Product;
  quantity: number;
}

const POS: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await api.getProducts();
      setProducts(data);
    };
    load();
  }, [isSuccess]); // Reload products to get updated stock after sale

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item; // Don't remove here, use delete button
          if (newQty > item.product.stock) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.unitPrice * item.quantity), 0);
  const tax = subtotal * 0.12; // 12% VAT
  // Fix: Round total to 2 decimals to match display and avoid floating point issues (e.g. 100.0000001 > 100)
  const total = parseFloat((subtotal + tax).toFixed(2));
  const change = amountPaid ? parseFloat(amountPaid) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    
    setIsProcessing(true);
    try {
        const order = await api.processSale(cart, user.id, parseFloat(amountPaid));
        setLastInvoice(order.invoiceNumber);
        setIsSuccess(true);
        setCart([]);
        setAmountPaid('');
    } catch (error) {
        alert("Transaction failed. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sale Completed!</h2>
        <p className="text-gray-500 mb-6">Invoice #{lastInvoice} has been generated.</p>
        <div className="flex gap-4">
          <button 
            onClick={() => window.print()} 
            className="flex items-center px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer size={20} className="mr-2" />
            Print Receipt
          </button>
          <button 
            onClick={() => setIsSuccess(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6">
      {/* Left Pane: Product Browser */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search & Filter */}
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Scan barcode or search product..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Items
            </button>
            {CATEGORIES.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${selectedCategory === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className={`flex flex-col p-4 bg-white rounded-lg shadow-sm border border-gray-100 transition-all ${
                  product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-blue-300 active:scale-95'
                }`}
              >
                <div className="flex-1 mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 text-left">{product.name}</h3>
                  <p className="text-xs text-gray-500 text-left">{product.code}</p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-blue-600 font-bold">₱{product.unitPrice.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {product.stock} left
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane: Cart & Checkout */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-800">Current Order</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">{item.product.name}</h4>
                  <p className="text-xs text-blue-600">₱{item.product.unitPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 hover:bg-gray-100 text-gray-600"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 hover:bg-gray-100 text-gray-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3 rounded-b-xl">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>VAT (12%)</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount Paid (PESO)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₱</span>
              </div>
              <input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            {parseFloat(amountPaid) >= total && (
               <div className="flex justify-between text-green-600 font-bold mt-2 px-1">
                 <span>Change:</span>
                 <span>₱{change.toFixed(2)}</span>
               </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || !amountPaid || parseFloat(amountPaid) < total || isProcessing}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
