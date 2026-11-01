import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Layout
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';

// Simple 404 page
const NotFoundPage = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <p className="text-6xl font-extrabold text-slate-200 select-none">404</p>
    <h1 className="text-xl font-bold text-slate-700 mt-4">Page not found</h1>
    <p className="text-sm text-slate-500 mt-2">
      The page you are looking for doesn&apos;t exist or has been moved.
    </p>
    <a
      href="/"
      className="mt-6 inline-block px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-colors"
    >
      Go Home
    </a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/listings" element={<ListingsPage />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />

              {/* Protected routes (require login) */}
              <Route
                path="/create-listing"
                element={
                  <ProtectedRoute>
                    <CreateListingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
