import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsApi } from '../api/listingsApi';
import {
  PlusCircle,
  Upload,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  X,
} from 'lucide-react';

const CATEGORIES = [
  'Textbooks & Study Material',
  'Electronics & Gadgets',
  'Clothing & Footwear',
  'Furniture & Home',
  'Kitchenware',
  'Sports & Fitness',
  'Other',
];

const CONDITIONS = ['New', 'Like New', 'Gently Used', 'Functional / Heavily Used'];

export const CreateListingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    condition: CONDITIONS[0],
    pickupCity: '',
    pickupArea: '',
    pickupNote: '',
    tags: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (jpg, png, webp).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('condition', form.condition);
      fd.append('pickupLocation[city]', form.pickupCity || user?.location?.city || '');
      fd.append('pickupLocation[area]', form.pickupArea || user?.location?.area || '');
      if (form.pickupNote) fd.append('pickupLocation[note]', form.pickupNote);
      if (form.tags.trim()) {
        const tagsArr = form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        tagsArr.forEach((t) => fd.append('tags[]', t));
      }
      if (imageFile) {
        fd.append('images', imageFile);
      }

      const res = await listingsApi.create(fd);
      if (res.data.success) {
        setSuccess('Listing created successfully!');
        const newId = res.data.data._id;
        setTimeout(() => navigate(`/listings/${newId}`), 1200);
      }
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) {
        const mapped = {};
        data.errors.forEach((e) => {
          mapped[e.path || e.param] = e.msg;
        });
        setFieldErrors(mapped);
      } else {
        setError(data?.message || 'Failed to create listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors border-slate-200';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <PlusCircle className="w-7 h-7 text-emerald-600" />
          Donate an Item
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          List something you no longer need. It&apos;s free and helps a fellow student.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Item Details</h2>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="e.g., Introduction to Algorithms (CLRS) 3rd Edition"
              className={`${inputClass} ${fieldErrors.title ? 'border-rose-300' : ''}`}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              maxLength={1000}
              placeholder="Describe the item's condition, any wear, included accessories, edition, etc."
              className={`${inputClass} resize-none ${fieldErrors.description ? 'border-rose-300' : ''}`}
            />
            <p className="mt-1 text-xs text-slate-400 text-right">
              {form.description.length}/1000
            </p>
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Condition <span className="text-rose-500">*</span>
              </label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleChange}
                required
                className={inputClass}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tags{' '}
              <span className="text-slate-400 font-normal">(comma-separated, optional)</span>
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g., algorithms, programming, CLRS"
              className={inputClass}
            />
          </div>
        </div>

        {/* Image upload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Photo{' '}
            <span className="text-slate-400 font-normal">(optional — max 5 MB)</span>
          </h2>

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-60 object-contain rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors group">
              <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 mb-2 transition-colors" />
              <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600">
                Click to upload image
              </span>
              <span className="text-xs text-slate-400 mt-1">JPG, PNG, WebP up to 5 MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Pickup Location */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Pickup Location
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="pickupCity"
                value={form.pickupCity || user?.location?.city || ''}
                onChange={handleChange}
                required
                placeholder="Bengaluru"
                className={`${inputClass} ${fieldErrors['pickupLocation.city'] ? 'border-rose-300' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Area / Campus
              </label>
              <input
                type="text"
                name="pickupArea"
                value={form.pickupArea || user?.location?.area || ''}
                onChange={handleChange}
                placeholder="Koramangala"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pickup note{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="pickupNote"
              value={form.pickupNote}
              onChange={handleChange}
              placeholder="e.g., Near block C entrance, available weekdays after 5 PM"
              className={inputClass}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {loading ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
};
