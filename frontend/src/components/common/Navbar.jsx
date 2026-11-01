import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, 
  PlusCircle, 
  LayoutDashboard, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  Search
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-100">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Re<span className="text-emerald-600">Share</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Campus Surplus
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/listings"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Explore Items
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/create-listing"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Donate Item
                </Link>

                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold border border-emerald-300">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    title="Log out"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors px-3 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-200 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <Link
            to="/listings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-700 hover:text-emerald-600"
          >
            Explore Items
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/create-listing"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-emerald-700 hover:text-emerald-800"
              >
                + Donate an Item
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700 hover:text-emerald-600"
              >
                My Dashboard
              </Link>
              <Link
                to={`/profile/${user.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700 hover:text-emerald-600"
              >
                My Public Profile
              </Link>
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-base font-medium text-rose-600 hover:text-rose-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user.name})
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-base font-medium text-slate-700 bg-slate-50 rounded-lg border border-slate-200"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 text-center text-base font-medium text-white bg-emerald-600 rounded-lg shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
