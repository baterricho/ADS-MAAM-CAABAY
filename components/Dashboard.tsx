
import React, { useEffect, useState, useContext } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DollarSign, Package, AlertTriangle, FileText } from 'lucide-react';
import { api } from '../services/mockService';
import { DashboardStats, RoleType } from '../types';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await api.getStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  const data = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  const pieData = [
    { name: 'Electronics', value: 400 },
    { name: 'Groceries', value: 300 },
    { name: 'Apparel', value: 300 },
    { name: 'Home', value: 200 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (!stats) return <div className="p-8">Loading dashboard...</div>;

  const isAdmin = user?.role === RoleType.ADMIN;
  const isCashier = user?.role === RoleType.CASHIER;
  const isClerk = user?.role === RoleType.INVENTORY_CLERK;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.fullName}</h1>
        <p className="text-gray-500">Here's what's happening with your store today.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(isAdmin || isCashier) && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                <span className="text-xl font-bold">₱</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Today's Revenue</p>
                <h3 className="text-2xl font-bold text-gray-800">₱{stats.revenue.toFixed(2)}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Sales Count</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.todaySales}</h3>
              </div>
            </div>
          </>
        )}

        {(isAdmin || isClerk) && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mr-4">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Products</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalProducts}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-red-100 text-red-600 rounded-full mr-4">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Low Stock Items</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.lowStockCount}</h3>
              </div>
            </div>
          </>
        )}
        
         {(isAdmin || isClerk) && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full mr-4">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending POs</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingPO}</h3>
              </div>
            </div>
         )}
      </div>

      {/* Charts Row - Admin Only */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Sales</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(value: number) => [`₱${value}`, 'Sales']} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales by Category</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions for Clerk */}
      {isClerk && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Tasks</h3>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/purchases')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Purchase Orders
            </button>
            <button 
               onClick={() => navigate('/products')}
               className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Check Inventory Levels
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
