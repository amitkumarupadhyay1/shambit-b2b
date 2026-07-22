'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Shield, Key, AlertCircle, CheckCircle, CheckCircle2, Eye, EyeOff, Bell, User, Briefcase, Lock, CreditCard, Smartphone } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAgentProfile } from '@/hooks/useAgentProfile';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function ProfileSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 2FA State
  const [totpSetupUri, setTotpSetupUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  
  const { isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } = usePushNotifications();
  const { profile, loading: profileLoading, updateProfile, updating } = useAgentProfile();

  const handleGenerateTOTP = async () => {
    try {
      setTotpLoading(true);
      const res = await api.post('/users/totp/generate/');
      setTotpSetupUri(res.data.provisioning_uri);
      setShowTotpSetup(true);
    } catch {
      toast.error('Failed to generate 2FA setup');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTotpLoading(true);
      await api.post('/users/totp/verify/', { code: totpCode });
      toast.success('Two-Factor Authentication enabled successfully');
      setShowTotpSetup(false);
      setTotpCode('');
      updateProfile({ ...profile, is_totp_enabled: true } as Record<string, unknown>);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableTOTP = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) return;
    try {
      setTotpLoading(true);
      await api.post('/users/totp/disable/');
      toast.success('Two-Factor Authentication disabled');
      updateProfile({ ...profile, is_totp_enabled: false } as Record<string, unknown>);
    } catch {
      toast.error('Failed to disable 2FA');
    } finally {
      setTotpLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    agency_name: '',
    agency_website: '',
    year_established: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc_code: ''
  });

  const [editingBank, setEditingBank] = useState(false);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        agency_name: profile.agency_name || '',
        agency_website: profile.agency_website || '',
        year_established: profile.year_established?.toString() || '',
        bank_account_name: profile.bank_account_name || '',
        bank_account_number: profile.bank_account_number ? '••••••••' + profile.bank_account_number.slice(-4) : '',
        bank_ifsc_code: profile.bank_ifsc_code || ''
      });
    }
  }, [profile]);

  const handlePushToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
      } else {
        await subscribeToPush();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update push notification settings. Please check browser permissions.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully! A confirmation notification has been sent.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const err = error as { response?: { data?: { error?: string; current_password?: string[] } } };
      setPasswordError(
        err.response?.data?.error || 
        err.response?.data?.current_password?.[0] || 
        'Failed to change password. Please check your current password and try again.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToUpdate: Record<string, string | number | null> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      agency_name: formData.agency_name,
      agency_website: formData.agency_website,
      year_established: formData.year_established ? parseInt(formData.year_established, 10) : null,
    };
    
    if (editingBank) {
      dataToUpdate.bank_account_name = formData.bank_account_name;
      dataToUpdate.bank_account_number = formData.bank_account_number;
      dataToUpdate.bank_ifsc_code = formData.bank_ifsc_code;
    }

    const success = await updateProfile(dataToUpdate);
    if (success && editingBank) {
      setEditingBank(false);
    }
  };

  if (profileLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading profile...</div>;
  }

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-playfair font-bold text-slate-900 tracking-tight">
          Profile & Settings
        </h2>
        <p className="text-slate-500 mt-2">Manage your account, agency details, and security preferences.</p>
      </div>

      {/* Personal & Agency Information */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-playfair">Personal & Agency Information</h2>
            <p className="text-sm text-slate-500 mt-1">Update your basic information and operations details</p>
          </div>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/50 transition-all"
                />
              </div>
            </div>

            <hr className="border-slate-100 my-6" />

            <div className="flex items-center space-x-3 mb-6">
              <Briefcase className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-900">Agency Operations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Agency Name</label>
                <input
                  type="text"
                  value={formData.agency_name}
                  onChange={(e) => setFormData({...formData, agency_name: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Year Established</label>
                <input
                  type="number"
                  value={formData.year_established}
                  onChange={(e) => setFormData({...formData, year_established: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/50 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Agency Website</label>
                <input
                  type="url"
                  value={formData.agency_website}
                  onChange={(e) => setFormData({...formData, agency_website: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white/50 transition-all"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={updating && !editingBank}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50"
              >
                {updating && !editingBank ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* KYC Read Only Section */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 font-playfair">Verified KYC Details</h2>
              <p className="text-sm text-slate-500 mt-1">These details have been verified by ShamBit Admin</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
          </div>
        </div>
        
        <div className="p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Entity Type</label>
              <div className="text-sm font-medium text-slate-900">{profile?.business_entity_type || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">GST Number</label>
              <div className="text-sm font-medium text-slate-900">{profile?.gst_number || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">PAN Number</label>
              <div className="text-sm font-medium text-slate-900">{profile?.pan_number || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Aadhaar Number</label>
              <div className="text-sm font-medium text-slate-900">{profile?.aadhaar_number || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">IATA / TIDS Number</label>
              <div className="text-sm font-medium text-slate-900">{profile?.iata_tids_number || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Udyam Registration</label>
              <div className="text-sm font-medium text-slate-900">{profile?.udyam_registration_number || 'N/A'}</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Registered Address</label>
              <div className="text-sm font-medium text-slate-900">
                {[profile?.address_line_1, profile?.address_line_2, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              To update any of these verified details, please contact your account manager.
            </p>
          </div>
        </div>
      </div>

      {/* Secure Bank Details */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 font-playfair">Bank Account Details</h2>
              <p className="text-sm text-slate-500 mt-1">Securely stored for commission payouts</p>
            </div>
          </div>
          {!editingBank && (
            <button 
              onClick={() => {
                setEditingBank(true);
              }}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
            >
              Edit Details
            </button>
          )}
        </div>
        
        <div className="p-8">
          {editingBank ? (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.bank_account_name}
                    onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-white/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-white/50 transition-all"
                    placeholder="Enter full account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bank_ifsc_code}
                    onChange={(e) => setFormData({...formData, bank_ifsc_code: e.target.value.toUpperCase()})}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-white/50 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                    onClick={() => {
                      setEditingBank(false);
                      if (profile) {
                        setFormData({
                          first_name: profile.first_name || '',
                          last_name: profile.last_name || '',
                          phone: profile.phone || '',
                          agency_name: profile.agency_name || '',
                          agency_website: profile.agency_website || '',
                          year_established: profile.year_established?.toString() || '',
                          bank_account_name: profile.bank_account_name || '',
                          bank_account_number: profile.bank_account_number ? '••••••••' + profile.bank_account_number.slice(-4) : '',
                          bank_ifsc_code: profile.bank_ifsc_code || '',
                        });
                      }
                    }}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Holder</label>
                <div className="text-sm font-medium text-slate-900">{profile?.bank_account_name || 'Not provided'}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                <div className="text-sm font-medium text-slate-900 flex items-center">
                  {profile?.bank_account_number ? (
                    <>
                      <span className="tracking-wider mr-1">••••••••</span>
                      {profile.bank_account_number.slice(-4)}
                    </>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
                <div className="text-sm font-medium text-slate-900">{profile?.bank_ifsc_code || 'Not provided'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-playfair">Notification Settings</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your browser push notifications</p>
          </div>
        </div>
        <div className="p-8">
          {isSupported ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-slate-900">Push Notifications</h3>
                <p className="text-sm text-slate-500">Receive real-time alerts for booking and payment updates</p>
              </div>
              <button
                onClick={handlePushToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubscribed ? 'bg-blue-500' : 'bg-slate-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Push notifications are not supported in this browser.</p>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Smartphone className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-playfair">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-slate-500 mt-1">Add an extra layer of security to your account</p>
          </div>
        </div>
        <div className="p-8">
          {profile?.is_totp_enabled ? (
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="text-lg font-medium text-slate-900">2FA is Enabled</span>
              </div>
              <p className="text-slate-600 mb-6 text-sm">Your account is secured with Two-Factor Authentication using an authenticator app.</p>
              <button
                onClick={handleDisableTOTP}
                disabled={totpLoading}
                className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
              >
                Disable 2FA
              </button>
            </div>
          ) : (
            <div>
              <p className="text-slate-600 mb-6 text-sm">Protect your account from unauthorized access by requiring a second authentication step when you sign in.</p>
              
              {!showTotpSetup ? (
                <button
                  onClick={handleGenerateTOTP}
                  disabled={totpLoading}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                >
                  Enable 2FA
                </button>
              ) : (
                <div className="space-y-6 max-w-md">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-medium text-slate-900 mb-2">1. Scan QR Code</h3>
                    <p className="text-sm text-slate-600 mb-4">Use Google Authenticator, Authy, or any other TOTP app to scan this QR code.</p>
                    <div className="bg-white p-4 inline-block rounded-xl shadow-sm border border-slate-100">
                      {totpSetupUri ? <QRCodeSVG value={totpSetupUri} size={150} /> : <div className="w-[150px] h-[150px] bg-slate-100 animate-pulse rounded-lg" />}
                    </div>
                  </div>
                  
                  <form onSubmit={handleVerifyTOTP} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-medium text-slate-900 mb-2">2. Verify Code</h3>
                    <p className="text-sm text-slate-600 mb-4">Enter the 6-digit code generated by your authenticator app.</p>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={totpLoading || totpCode.length !== 6}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                      >
                        Verify & Enable
                      </button>
                    </div>
                  </form>
                  
                  <button
                    onClick={() => { setShowTotpSetup(false); setTotpSetupUri(''); setTotpCode(''); }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel Setup
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-playfair">Security Settings</h2>
            <p className="text-sm text-slate-500 mt-1">Update your password to keep your account secure</p>
          </div>
        </div>

        <div className="p-8">
          {passwordError && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start space-x-3 text-emerald-700 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="pl-10 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white/50"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white/50"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white/50"
                    placeholder="Match new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
