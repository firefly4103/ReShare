import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { MapPin, User as UserIcon, Calendar, ArrowRight } from 'lucide-react';

export const ListingCard = ({ listing }) => {
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0].url
    : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Image Container with Badges */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <StatusBadge status={listing.status} size="sm" />
        </div>
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-xs font-medium">
          {listing.category}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            {listing.condition}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(listing.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 mb-1.5">
          {listing.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
          {listing.description}
        </p>

        {/* Location & Donor info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[180px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {listing.pickupLocation?.area}, {listing.pickupLocation?.city}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-600 font-medium">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold">
              {listing.donorId?.name ? listing.donorId.name.charAt(0) : 'U'}
            </div>
            <span className="truncate max-w-[80px]">
              {listing.donorId?.name?.split(' ')[0] || 'Donor'}
            </span>
          </div>
        </div>

        {/* Action Link */}
        <Link
          to={`/listings/${listing._id}`}
          className="mt-4 w-full py-2 px-3 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          View Item Details
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
