import React, { useState } from 'react';
import { UserService } from './api/apiClient';
import { GraduationCap, ArrowRight } from 'lucide-react';

export const AuthPage = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    passwordHash: 'dummy-hash',
    universityName: 'State University',
    hostelBlock: 'Block A'
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [devModeNotice, setDevModeNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    setDevModeNotice(null);
    try {
      const response = await UserService.register(formData);
      onLogin(response.data);
    } catch (error) {
      console.error('Registration failed:', error);

      if (import.meta.env.DEV) {
        setDevModeNotice('Backend is unavailable, continuing in offline dev mode.');
        onLogin({
          id: `dev-${Date.now()}`,
          fullName: formData.fullName,
          email: formData.email,
          hostelBlock: formData.hostelBlock,
          trustScore: 5,
          role: 'STUDENT'
        });
      } else {
        setSubmitError('Unable to connect to server. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 p-4">
      <div className="max-w-md w-full glass-card p-8 animate-fade-in shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-accent" />
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-100 p-3 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 text-center">Campus Lend</h2>
          <p className="text-sm text-gray-500 mt-2 text-center">Borrow and lend items on campus instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              placeholder="e.g. Alex Student"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University Email</label>
            <input
              required
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              placeholder="alex@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hostel / Location Block</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              value={formData.hostelBlock}
              onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
            >
              <option value="Block A">Block A</option>
              <option value="Block B">Block B</option>
              <option value="Library">Library</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Entering Campus...' : 'Enter Platform'} 
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
          {submitError && (
            <p className="text-sm text-red-700 bg-red-100 rounded-lg px-3 py-2">{submitError}</p>
          )}
          {devModeNotice && (
            <p className="text-sm text-orange-700 bg-orange-100 rounded-lg px-3 py-2">{devModeNotice}</p>
          )}
        </form>
      </div>
    </div>
  );
};
