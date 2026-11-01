import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { ListingCard } from '../components/listings/ListingCard';
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Textbooks & Study Material',
  'Electronics & Gadgets',
  'Clothing & Footwear',
  'Furniture & Home',
  'Kitchenware',
  'Sports & Fitness',
  'Other'
];

const CONDITIONS = [
  'All Conditions',
  'New',
  'Like New',
  'Gently Used',
  'Functional / Heavily Used'
];

export const ListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'All Conditions');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  // Data states
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  useEffect(() => {
    const fetchFilteredListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page);
        params.set('limit', 8);
        params.set('status', 'AVAILABLE');

        if (searchTerm.trim()) params.set('q', searchTerm.trim());
        if (selectedCategory && selectedCategory !== 'All Categories') {
          params.set('category', selectedCategory);
        }
        if (selectedCondition && selectedCondition !== 'All Conditions') {
          params.set('condition', selectedCondition);
        }
        if (city.trim()) params.set('city', city.trim());

        const res = await api.get(`/listings?${params.toString()}`);
        if (res.data.success) {
          setListings(res.data.data);
          setMeta(res.data.meta);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredListings();
  }, [page, selectedCategory, selectedCondition, city, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedCondition('All Conditions');
    setCity('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Available Items
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse textbooks, lab kits, calculators, and essentials offered for free by peers.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Keyword Search & City */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by keywords (e.g., Algorithms, Arduino, Casio, Table)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Filter by City (e.g. Bengaluru)..."
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Dropdown Filters & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              Filters:
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedCondition}
              onChange={(e) => {
                setSelectedCondition(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Found <strong className="text-slate-800">{meta.total}</strong> available item{meta.total !== 1 ? 's' : ''}
            </span>

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors py-1 px-2 rounded hover:bg-slate-50"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((item) => (
            <ListingCard key={item._id} listing={item} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
            <PackageSearch className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No matching items found</h3>
          <p className="text-sm text-slate-500 mt-1">
            Try adjusting your search query, city, or category filter to discover available items.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm font-medium text-slate-600 px-3">
            Page {meta.page} of {meta.totalPages}
          </span>

          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
