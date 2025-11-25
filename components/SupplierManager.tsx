
import React, { useState, useEffect } from 'react';
import { api } from '../services/mockService';
import { Supplier } from '../types';
import { Plus, Edit2, Phone, Mail, MapPin, Search, Save, X } from 'lucide-react';

const SupplierManager: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const data = await api.getSuppliers();
    setSuppliers(data);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address
    });
    setEditingId(supplier.id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateSupplier({ ...formData, id: editingId });
    } else {
      await api.addSupplier(formData);
    }
    setIsModalOpen(false);
    loadSuppliers();
  };

  const filtered = suppliers.filter(s => 
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Supplier Management</h1>
        <button 
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search suppliers..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(supplier => (
          <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{supplier.companyName}</h3>
                <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
              </div>
              <button 
                onClick={() => handleEdit(supplier)} 
                className="text-blue-600 hover:text-blue-800"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-gray-400" />
                {supplier.phone || 'N/A'}
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-gray-400" />
                {supplier.email || 'N/A'}
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-gray-400" />
                <span className="truncate">{supplier.address || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Supplier' : 'New Supplier'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input required type="text" className="w-full p-2 border rounded-lg" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input required type="text" className="w-full p-2 border rounded-lg" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" className="w-full p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full p-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <Save size={18} className="mr-2" /> {editingId ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManager;
