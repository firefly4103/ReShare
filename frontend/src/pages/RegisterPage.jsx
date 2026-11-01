import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, MapPin, AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    area: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        ...(form.phone && { phone: form.phone }),
        location: {
          city: form.city,
          area: form.area,
        },
      };
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) {
        // Validation field errors array from express-validator
        const mapped = {};
        data.errors.forEach((e) => {
          mapped[e.path || e.param] = e.msg;
        });
        setFieldErrors(mapped);
      } else {
        setError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors';
  const errorInputClass = 'border-rose-300 focus:ring-rose-400';
  const normalInputClass = 'border-slate-200';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
              <UserPlus className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">
              Join the ReShare campus community — free forever
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Rahul Sharma"
                  className={`pl-10 ${inputClass} ${fieldErrors.name ? errorInputClass : normalInputClass}`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@college.edu"
                  className={`pl-10 ${inputClass} ${fieldErrors.email ? errorInputClass : normalInputClass}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="At least 6 characters"
                  className={`pl-10 ${inputClass} ${fieldErrors.password ? errorInputClass : normalInputClass}`}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone{' '}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={`${inputClass} ${fieldErrors.phone ? errorInputClass : normalInputClass}`}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  City <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    placeholder="Bengaluru"
                    className={`pl-10 ${inputClass} ${fieldErrors['location.city'] ? errorInputClass : normalInputClass}`}
                  />
                </div>
                {fieldErrors['location.city'] && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors['location.city']}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Area / Campus
                </label>
                <input
                  type="text"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="Koramangala"
                  className={`${inputClass} ${fieldErrors['location.area'] ? errorInputClass : normalInputClass}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
