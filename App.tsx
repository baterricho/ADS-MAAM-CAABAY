
import React, { useState, useEffect, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Truck,
  Users
} from 'lucide-react';
import { User, RoleType } from './types';
import { api } from './services/mockService';

// --- Components Import ---
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import POS from './components/POS';
import Reports from './components/Reports';
import Login from './components/Login';
import PurchaseManager from './components/PurchaseManager';
import SupplierManager from './components/SupplierManager';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>(null!);

// --- Layout Component ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [RoleType.ADMIN, RoleType.CASHIER, RoleType.INVENTORY_CLERK] },
    { name: 'POS (Sales)', path: '/pos', icon: ShoppingCart, roles: [RoleType.ADMIN, RoleType.CASHIER] },
    { name: 'Inventory', path: '/products', icon: Package, roles: [RoleType.ADMIN, RoleType.INVENTORY_CLERK] },
    { name: 'Purchases', path: '/purchases', icon: Truck, roles: [RoleType.ADMIN, RoleType.INVENTORY_CLERK] },
    { name: 'Suppliers', path: '/suppliers', icon: Users, roles: [RoleType.ADMIN, RoleType.INVENTORY_CLERK] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: [RoleType.ADMIN] },
  ];

  const filteredNav = navigation.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-20 px-6 bg-slate-800 border-b border-slate-700 relative">
          <h1 className="text-white font-bold text-lg text-center leading-tight">Palawan State<br/>University</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute right-4 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-slate-800 rounded-lg">
            <div className="p-2 bg-blue-600 rounded-full">
              <UserIcon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 bg-slate-900 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg text-gray-800">Palawan State University</span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent session
    const storedUser = localStorage.getItem('psu_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string) => {
    const foundUser = await api.login(username);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('psu_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('psu_user');
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
          <Route path="/pos" element={user ? <Layout><POS /></Layout> : <Navigate to="/login" />} />
          <Route path="/products" element={user ? <Layout><ProductManager /></Layout> : <Navigate to="/login" />} />
          <Route path="/purchases" element={user ? <Layout><PurchaseManager /></Layout> : <Navigate to="/login" />} />
          <Route path="/suppliers" element={user ? <Layout><SupplierManager /></Layout> : <Navigate to="/login" />} />
          <Route path="/reports" element={user ? <Layout><Reports /></Layout> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
