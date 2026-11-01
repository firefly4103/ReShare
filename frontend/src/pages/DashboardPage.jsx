import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsApi } from '../api/listingsApi';
import { requestsApi } from '../api/requestsApi';
import { exchangesApi } from '../api/exchangesApi';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  LayoutDashboard,
  Package,
  Inbox,
  Send,
  Repeat,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

const TABS = [
  { key: 'my-listings', label: 'My Listings', icon: Package },
  { key: 'incoming', label: 'Incoming Requests', icon: Inbox },
  { key: 'outgoing', label: 'My Requests', icon: Send },
  { key: 'exchanges', label: 'Exchanges', icon: Repeat },
];

// ─── Small helper components ─────────────────────────────────────────────────

const Spinner = () => (
  <div className="py-16 flex justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
  </div>
);

const EmptyState = ({ icon: Icon, message, action }) => (
  <div className="py-14 text-center space-y-3">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-2">
      <Icon className="w-7 h-7" />
    </div>
    <p className="text-slate-500 text-sm">{message}</p>
    {action && action}
  </div>
);

const ActionBtn = ({ onClick, disabled, variant, children }) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant || 'ghost']}`}>
      {children}
    </button>
  );
};

// ─── My Listings Tab ─────────────────────────────────────────────────────────

const MyListingsTab = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      const res = await listingsApi.getMyListings({ limit: 50 });
      if (res.data.success) setListings(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  if (loading) return <Spinner />;
  if (!listings.length)
    return (
      <EmptyState
        icon={Package}
        message="You haven't listed any items yet."
        action={
          <Link
            to="/create-listing"
            className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg"
          >
            Donate an Item
          </Link>
        }
      />
    );

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <div key={listing._id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
            {listing.images?.[0]?.url ? (
              <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/listings/${listing._id}`} className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors truncate">
                {listing.title}
              </Link>
              <StatusBadge status={listing.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {listing.category} · {listing.condition}
            </p>
          </div>
          <Link
            to={`/listings/${listing._id}`}
            className="shrink-0 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
};

// ─── Incoming Requests Tab ────────────────────────────────────────────────────

const IncomingRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    try {
      const res = await requestsApi.getIncoming({ limit: 50 });
      if (res.data.success) setRequests(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAction = async (requestId, action) => {
    setActionLoading(requestId + action);
    setError('');
    try {
      if (action === 'accept') await requestsApi.accept(requestId);
      else if (action === 'reject') await requestsApi.reject(requestId);
      await fetch();
    } catch (e) {
      setError(e?.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Spinner />;
  if (!requests.length)
    return <EmptyState icon={Inbox} message="No incoming requests yet. Share your listings and requests will appear here." />;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {requests.map((req) => (
        <div key={req._id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <Link
                to={`/listings/${req.listingId?._id}`}
                className="text-sm font-semibold text-slate-800 hover:text-emerald-600"
              >
                {req.listingId?.title || 'Unknown listing'}
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">
                From: <span className="font-medium text-slate-700">{req.requesterId?.name || 'User'}</span>
              </p>
            </div>
            <StatusBadge status={req.status} size="sm" />
          </div>

          {req.message && (
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-3 italic">
              "{req.message}"
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {req.status === 'PENDING' && (
              <>
                <ActionBtn
                  variant="primary"
                  disabled={actionLoading === req._id + 'accept'}
                  onClick={() => handleAction(req._id, 'accept')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {actionLoading === req._id + 'accept' ? 'Accepting...' : 'Accept'}
                </ActionBtn>
                <ActionBtn
                  variant="danger"
                  disabled={actionLoading === req._id + 'reject'}
                  onClick={() => handleAction(req._id, 'reject')}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {actionLoading === req._id + 'reject' ? 'Rejecting...' : 'Reject'}
                </ActionBtn>
              </>
            )}
            <span className="text-xs text-slate-400">
              {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── My Outgoing Requests Tab ─────────────────────────────────────────────────

const OutgoingRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    try {
      const res = await requestsApi.getOutgoing({ limit: 50 });
      if (res.data.success) setRequests(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCancel = async (requestId) => {
    setActionLoading(requestId);
    setError('');
    try {
      await requestsApi.cancel(requestId);
      await fetch();
    } catch (e) {
      setError(e?.response?.data?.message || 'Cancel failed.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Spinner />;
  if (!requests.length)
    return (
      <EmptyState
        icon={Send}
        message="You haven't made any requests yet."
        action={
          <Link to="/listings" className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg">
            Browse Available Items
          </Link>
        }
      />
    );

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {requests.map((req) => (
        <div key={req._id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <Link to={`/listings/${req.listingId?._id}`} className="text-sm font-semibold text-slate-800 hover:text-emerald-600">
                {req.listingId?.title || 'Unknown listing'}
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">
                Donor: <span className="font-medium text-slate-700">
                  {req.listingId?.donorId?.name || 'Unknown'}
                </span>
              </p>
            </div>
            <StatusBadge status={req.status} size="sm" />
          </div>

          {req.message && (
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-3 italic">
              "{req.message}"
            </p>
          )}

          <div className="flex items-center gap-3">
            {req.status === 'PENDING' && (
              <ActionBtn
                variant="danger"
                disabled={actionLoading === req._id}
                onClick={() => handleCancel(req._id)}
              >
                <XCircle className="w-3.5 h-3.5" />
                {actionLoading === req._id ? 'Cancelling...' : 'Cancel Request'}
              </ActionBtn>
            )}
            {req.status === 'ACCEPTED' && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accepted — check Exchanges tab
              </span>
            )}
            <span className="text-xs text-slate-400">
              {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Exchanges Tab ────────────────────────────────────────────────────────────

const ExchangesTab = ({ currentUserId }) => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [feedbackMap, setFeedbackMap] = useState({});

  const fetch = useCallback(async () => {
    try {
      const res = await exchangesApi.getMyExchanges({ limit: 50 });
      if (res.data.success) setExchanges(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleConfirm = async (exchangeId) => {
    setActionLoading(exchangeId + 'confirm');
    setError('');
    try {
      await exchangesApi.confirm(exchangeId);
      await fetch();
    } catch (e) {
      setError(e?.response?.data?.message || 'Confirmation failed.');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async (exchangeId) => {
    if (!window.confirm('Cancel this exchange? The listing may become available again.')) return;
    setActionLoading(exchangeId + 'cancel');
    setError('');
    try {
      await exchangesApi.cancel(exchangeId);
      await fetch();
    } catch (e) {
      setError(e?.response?.data?.message || 'Cancel failed.');
    } finally {
      setActionLoading('');
    }
  };

  const handleFeedback = async (exchangeId) => {
    const fb = feedbackMap[exchangeId];
    if (!fb?.rating) { setError('Please select a rating before submitting.'); return; }
    setActionLoading(exchangeId + 'feedback');
    setError('');
    try {
      await exchangesApi.feedback(exchangeId, { rating: parseInt(fb.rating), comment: fb.comment || '' });
      await fetch();
    } catch (e) {
      setError(e?.response?.data?.message || 'Feedback failed.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Spinner />;
  if (!exchanges.length)
    return <EmptyState icon={Repeat} message="No exchanges yet. Accept a request to start an exchange." />;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {exchanges.map((ex) => {
        const isDonor = ex.donorId?._id === currentUserId || ex.donorId === currentUserId;
        const hasConfirmed = isDonor
          ? !!ex.donorConfirmedAt
          : !!ex.recipientConfirmedAt;
        const otherConfirmed = isDonor
          ? !!ex.recipientConfirmedAt
          : !!ex.donorConfirmedAt;
        const canConfirm = ex.status === 'SCHEDULED' && !hasConfirmed;
        const hasFeedback = ex.feedback?.some(
          (f) => (f.by?._id || f.by) === currentUserId
        );

        return (
          <div key={ex._id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to={`/listings/${ex.listingId?._id}`} className="text-sm font-semibold text-slate-800 hover:text-emerald-600">
                  {ex.listingId?.title || 'Item'}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isDonor
                    ? `Recipient: ${ex.recipientId?.name || 'Unknown'}`
                    : `Donor: ${ex.donorId?.name || 'Unknown'}`}
                </p>
              </div>
              <StatusBadge status={ex.status} size="sm" />
            </div>

            {/* Confirmation progress */}
            {ex.status === 'SCHEDULED' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-2.5 rounded-lg flex items-center gap-2 ${ex.donorConfirmedAt ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                  {ex.donorConfirmedAt ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Donor confirmed
                </div>
                <div className={`p-2.5 rounded-lg flex items-center gap-2 ${ex.recipientConfirmedAt ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                  {ex.recipientConfirmedAt ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Recipient confirmed
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {canConfirm && (
                <ActionBtn
                  variant="primary"
                  disabled={!!actionLoading}
                  onClick={() => handleConfirm(ex._id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {actionLoading === ex._id + 'confirm' ? 'Confirming...' : 'Confirm Handover'}
                </ActionBtn>
              )}
              {hasConfirmed && ex.status === 'SCHEDULED' && !otherConfirmed && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Waiting for {isDonor ? 'recipient' : 'donor'} to confirm
                </span>
              )}
              {ex.status === 'SCHEDULED' && (
                <ActionBtn
                  variant="danger"
                  disabled={!!actionLoading}
                  onClick={() => handleCancel(ex._id)}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {actionLoading === ex._id + 'cancel' ? 'Cancelling...' : 'Cancel'}
                </ActionBtn>
              )}
            </div>

            {/* Feedback for completed */}
            {ex.status === 'COMPLETED' && !hasFeedback && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-600">Leave feedback (optional)</p>
                <div className="flex items-center gap-3">
                  <select
                    value={feedbackMap[ex._id]?.rating || ''}
                    onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [ex._id]: { ...prev[ex._id], rating: e.target.value } }))}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">Rating…</option>
                    {[1,2,3,4,5].map((r) => <option key={r} value={r}>{r} ★</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Comment (optional)"
                    value={feedbackMap[ex._id]?.comment || ''}
                    onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [ex._id]: { ...prev[ex._id], comment: e.target.value } }))}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <ActionBtn
                    variant="primary"
                    disabled={actionLoading === ex._id + 'feedback'}
                    onClick={() => handleFeedback(ex._id)}
                  >
                    {actionLoading === ex._id + 'feedback' ? 'Saving...' : 'Submit'}
                  </ActionBtn>
                </div>
              </div>
            )}

            {ex.status === 'COMPLETED' && hasFeedback && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Feedback submitted
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-listings');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <LayoutDashboard className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-extrabold text-slate-900">My Dashboard</h1>
        </div>
        <p className="text-sm text-slate-500">
          Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-7 bg-slate-100 p-1 rounded-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'my-listings' && <MyListingsTab />}
      {activeTab === 'incoming' && <IncomingRequestsTab />}
      {activeTab === 'outgoing' && <OutgoingRequestsTab />}
      {activeTab === 'exchanges' && <ExchangesTab currentUserId={user?.id} />}
    </div>
  );
};
