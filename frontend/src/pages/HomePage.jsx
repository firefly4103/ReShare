import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { ListingCard } from '../components/listings/ListingCard';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Cpu, 
  Shirt, 
  Sofa, 
  Dumbbell, 
  CheckCircle2, 
  ShieldCheck, 
  Repeat, 
  Users
} from 'lucide-react';

export const HomePage = () => {
  const [summary, setSummary] = useState(null);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, listingsRes] = await Promise.all([
          api.get('/analytics/platform-summary').catch(() => null),
          api.get('/listings?limit=4&status=AVAILABLE').catch(() => null)
        ]);

        if (statsRes?.data?.success) {
          setSummary(statsRes.data.data);
        }
        if (listingsRes?.data?.success) {
          setFeaturedListings(listingsRes.data.data);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const categories = [
    { name: 'Textbooks & Study Material', icon: BookOpen, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Electronics & Gadgets', icon: Cpu, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Furniture & Home', icon: Sofa, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Clothing & Footwear', icon: Shirt, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Sports & Fitness', icon: Dumbbell, color: 'bg-rose-50 text-rose-700 border-rose-200' }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-6 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Empowering Campus Circular Sharing
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Share Surplus Goods. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Support Your Campus Peers.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Give textbooks, electronics, and study gear a second life. List items in seconds, connect safely with fellow students, and complete handovers with dual verification.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/listings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 transition-all"
            >
              Browse Available Items
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/create-listing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all"
            >
              List an Item to Donate
            </Link>
          </div>

          {/* Live Impact Counter Cards */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items Diverted</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {summary?.completedExchanges ?? 12}+
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Saved from landfills</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Listings</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {summary?.availableListings ?? 8}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Ready for pickup</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Community Members</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {summary?.totalUsers ?? 25}+
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Students & staff</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification Rate</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-600 mt-1">
                100%
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Dual-confirmed handovers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Explore by Category</h2>
          <p className="text-sm text-slate-500 mt-1">Find the essential resources you need for your courses and dorm</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/listings?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Listings Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recently Donated Items</h2>
            <p className="text-sm text-slate-500 mt-1">Free usable resources listed by fellow students</p>
          </div>
          <Link
            to="/listings"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : featuredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map((item) => (
              <ListingCard key={item._id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">No items currently available. Be the first to donate!</p>
            <Link
              to="/create-listing"
              className="mt-4 inline-block text-xs font-semibold text-emerald-600 underline"
            >
              Donate an item now
            </Link>
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight">How ReShare Works</h2>
            <p className="text-slate-400 text-base mt-2">
              A transparent, zero-cost, four-step lifecycle designed for college campus communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-3 p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
                1
              </div>
              <h3 className="text-lg font-bold">List Surplus Resources</h3>
              <p className="text-sm text-slate-400">
                Upload photos and add item details. Choose your preferred campus pickup window and location note.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/30">
                2
              </div>
              <h3 className="text-lg font-bold">Request & Review</h3>
              <p className="text-sm text-slate-400">
                Recipients request items with custom notes. Donors review requests and approve one candidate atomically.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-500/30">
                3
              </div>
              <h3 className="text-lg font-bold">Dual Handover Confirmation</h3>
              <p className="text-sm text-slate-400">
                Meet on campus for pickup. Both donor and recipient confirm receipt in their dashboard to complete the exchange.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
