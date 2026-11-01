import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analyticsApi';
import api from '../api/client';
import {
  User as UserIcon,
  MapPin,
  Package,
  ArrowUpRight,
  Repeat,
  Star,
  Calendar,
  Trophy,
  AlertCircle,
} from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900">{value ?? '—'}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

export const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, impactRes] = await Promise.all([
          api.get(`/users/profile/${id}`),
          analyticsApi.userImpact(id).catch(() => null),
        ]);

        if (profileRes.data.success) setProfile(profileRes.data.data);
        else setError('User not found.');

        if (impactRes?.data?.success) setImpact(impactRes.data.data);
      } catch (err) {
        setError(
          err?.response?.status === 404
            ? 'This user profile does not exist.'
            : 'Failed to load profile.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700">{error || 'Profile not found'}</h2>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && (currentUser.id === id || currentUser._id === id);
  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-10 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-extrabold text-emerald-700 bg-emerald-100">
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-extrabold text-slate-900">{profile.name}</h1>
              {(profile.location?.city || profile.location?.area) && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[profile.location.area, profile.location.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Joined {joinDate}
            </span>
            {isOwnProfile && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                You
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Impact Stats Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Impact Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Items Donated"
            value={impact?.donated ?? profile.stats?.donated ?? 0}
            icon={Package}
            color="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            label="Items Received"
            value={impact?.received ?? profile.stats?.received ?? 0}
            icon={ArrowUpRight}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            label="Exchanges Completed"
            value={impact?.exchangesCompleted ?? 0}
            icon={Repeat}
            color="bg-purple-100 text-purple-700"
          />
          <StatCard
            label="Avg Rating"
            value={
              impact?.averageRating
                ? `${impact.averageRating.toFixed(1)} ★`
                : '—'
            }
            icon={Star}
            color="bg-amber-100 text-amber-700"
          />
        </div>
      </div>

      {/* Impact text */}
      {impact && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
          <h3 className="text-sm font-bold text-emerald-800 mb-1">Community Contribution</h3>
          <p className="text-sm text-emerald-700">
            {profile.name} has donated{' '}
            <strong>{impact.donated ?? 0} item{(impact.donated ?? 0) !== 1 ? 's' : ''}</strong>,
            completed <strong>{impact.exchangesCompleted ?? 0} exchange{(impact.exchangesCompleted ?? 0) !== 1 ? 's' : ''}</strong>,
            and helped fellow students save resources.
          </p>
        </div>
      )}

      {/* CTA for own profile */}
      {isOwnProfile && (
        <div className="flex flex-wrap gap-3">
          <Link
            to="/create-listing"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100 transition-colors"
          >
            <Package className="w-4 h-4" />
            Donate an Item
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};
