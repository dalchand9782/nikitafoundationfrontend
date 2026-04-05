import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getLogo } from '../../lib/api';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

const DEFAULT_LOGO = "https://static.prod-images.emergentagent.com/jobs/04df6465-0ae2-4c67-a040-007b8dd7bc4b/images/5182ef1626dd29657c0bc411a5a888354abad8edd935a9fcca25f530b6c3042d.png";

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/loans', label: 'Loans', icon: FileText },
  { path: '/emi', label: 'EMI Collection', icon: CreditCard },
];

const adminNavItems = [
  { path: '/users', label: 'Users', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const mobileNavItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/loans', label: 'Loans', icon: FileText },
  { path: '/loans/create', label: 'New', icon: Plus, adminOnly: true },
  { path: '/emi', label: 'EMI', icon: CreditCard },
  { path: '/settings', label: 'More', icon: Menu, adminOnly: true },
];

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await getLogo();
        if (response.data.logo_url) {
          setLogo(response.data.logo_url);
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
      }
    };
    fetchLogo();
  }, []);

  const NavItem = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

    if (item.adminOnly && !isAdmin) return null;

    return (
      <NavLink
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
          ${mobile ? 'flex-col text-xs gap-1 px-2 py-2' : ''}
          ${isActive 
            ? 'bg-forest-500 text-white' 
            : 'text-stone-600 hover:bg-stone-100'
          }
        `}
        data-testid={`nav-${item.path.replace('/', '')}`}
      >
        <Icon className={mobile ? 'h-5 w-5' : 'h-5 w-5'} />
        <span className={`font-medium ${mobile ? 'text-[10px]' : ''}`}>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile and tablet */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-stone-200 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-200">
          <img src={logo} alt="Nikita Foundation" className="h-10 w-10 object-contain rounded-lg" />
          <div>
            <h1 className="font-heading font-bold text-forest-600 text-lg leading-tight">निकीता</h1>
            <p className="text-xs text-stone-500">फाउंडेशन</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
          
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">Admin</p>
              </div>
              {adminNavItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="px-4 py-4 border-t border-stone-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center">
              <span className="text-forest-600 font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{user?.name}</p>
              <p className="text-xs text-stone-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-stone-600 hover:text-red-600 hover:bg-red-50"
            onClick={logout}
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-8 object-contain rounded-lg" />
            <span className="font-heading font-bold text-forest-600">निकीता फाउंडेशन</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu-button">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="py-4">
                <div className="flex items-center gap-3 px-2 mb-6">
                  <div className="w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center">
                    <span className="text-forest-600 font-semibold text-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{user?.name}</p>
                    <p className="text-sm text-stone-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                  ))}
                  {isAdmin && adminNavItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                  ))}
                </nav>
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    data-testid="mobile-logout-button"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content - Full width on mobile, sidebar offset on desktop */}
      <main className="lg:pl-64 pb-24 lg:pb-6 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe z-40">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileNavItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center px-3 py-2 rounded-xl min-w-[60px]
                  ${isActive ? 'text-forest-600 bg-forest-50' : 'text-stone-500'}
                `}
                data-testid={`mobile-nav-${item.path.replace('/', '').replace('/', '-')}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
