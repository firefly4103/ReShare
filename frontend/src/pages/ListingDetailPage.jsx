import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsApi } from '../api/listingsApi';
import { requestsApi } from '../api/requestsApi';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  MapPin,
  User as UserIcon,
  Calendar,
  Tag,
  Package,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  Edit,
} from 'lucide-react';

export const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Request state
  const [requestNote, setRequestNote] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  // Delete state (donor only)
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await listingsApi.getById(id);
        if (res.data.success) setListing(res.data.data);
        else setError('Listing not found.');
      } catch (err) {
        setError(
          err?.response?.status === 404
            ? 'This listing no longer exists or has been removed.'
            : 'Failed to load listing. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess('');
    setRequesting(true);
    try {
      await requestsApi.create({ listingId: id, message: requestNote });
      setRequestSuccess('Your request has been sent! The donor will review it shortly.');
      setRequestNote('');
    } catch (err) {
      const data = err?.response?.data;
      setRequestError(data?.message || 'Failed to send request.');
    } finally {
      setRequesting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await listingsApi.remove(id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete listing.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700">
            {error || 'Listing not found'}
          </h2>
          <Link to="/listings" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">
            ← Back to listings
          </Link>
        </div>
      </div>
    );
  }

  const isDonor = user && listing.donorId?._id === user.id;
  const isAvailable = listing.status === 'AVAILABLE';
  const imageUrl =
    listing.images?.length > 0
      ? listing.images[0].url
      : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: image + details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image */}
          <div className="aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=900&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Title & Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                {listing.title}
              </h1>
              <StatusBadge status={listing.status} />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                {listing.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {listing.condition}
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{listing.description}</p>

            {listing.tags?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700">
                    {listing.pickupLocation?.area}, {listing.pickupLocation?.city}
                  </p>
                  {listing.pickupLocation?.note && (
                    <p className="text-xs text-slate-400">{listing.pickupLocation.note}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400" />
                <p className="font-medium text-slate-700">
                  Listed {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Donor info + Request panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Donor card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Donated by
            </p>
            <Link to={`/profile/${listing.donorId?._id}`} className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base border border-emerald-300 shrink-0">
                {listing.donorId?.name?.charAt(0)?.toUpperCase() || 'D'}
              </div>
              <div>
                <p className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  {listing.donorId?.name || 'Anonymous'}
                </p>
                <p className="text-xs text-slate-500">
                  {listing.donorId?.location?.city || 'Unknown location'}
                </p>
              </div>
            </Link>
          </div>

          {/* Request panel for non-donors */}
          {isAuthenticated && !isDonor && isAvailable && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Request this Item</h3>
              <p className="text-xs text-slate-500 mb-4">
                Tell the donor why you need this. Your message is visible only to them.
              </p>

              {requestSuccess ? (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{requestSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleRequest} className="space-y-4">
                  {requestError && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {requestError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Your message
                    </label>
                    <textarea
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      rows={3}
                      placeholder="I need this for my Data Structures course..."
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={requesting}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {requesting ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Not available notice */}
          {!isAvailable && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <p className="font-semibold">Item not available</p>
              <p className="text-xs mt-1 text-amber-700">
                This listing is currently {listing.status.toLowerCase()}. Check back later or explore other items.
              </p>
            </div>
          )}

          {/* Login prompt */}
          {!isAuthenticated && isAvailable && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
              <p className="text-sm text-slate-600 font-medium">
                Sign in to request this item
              </p>
              <Link
                to="/login"
                className="mt-3 inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg"
              >
                Log In / Register
              </Link>
            </div>
          )}

          {/* Donor actions */}
          {isDonor && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Your Listing
              </p>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Manage in Dashboard
              </Link>
              {isAvailable && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete Listing'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
