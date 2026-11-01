import React from 'react';
import { Package, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <span className="font-bold text-sm">RS</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                ReShare Platform
              </p>
              <p className="text-xs text-slate-500">
                Surplus Resource & Textbook Sharing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span>Production-Grade Architecture</span>
            <span>•</span>
            <span>MongoDB Atlas Focus</span>
            <span>•</span>
            <span>Dual Handover Verification</span>
          </div>

          <div className="text-xs text-slate-400 text-center md:text-right">
            <p>© {new Date().getFullYear()} ReShare. Academic Mini-Project.</p>
            <p className="mt-0.5">Built with React, Express, Mongoose & TailwindCSS</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
