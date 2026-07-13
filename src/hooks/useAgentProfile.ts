import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface AgentProfileData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  agency_name: string;
  gst_number: string;
  pan_number: string;
  aadhaar_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  business_entity_type: string;
  iata_status: boolean;
  iata_tids_number: string;
  udyam_registration_number: string;
  agency_website: string;
  year_established: number | null;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  credit_limit: string;
  current_outstanding: string;
  is_approved: boolean;
}

export function useAgentProfile() {
  const [profile, setProfile] = useState<AgentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      // We use the summary endpoint which returns the profile + recent_transactions
      const response = await api.get('/agent/dashboard/summary/');
      setProfile(response.data);
    } catch (err: unknown) {
      console.error('Error fetching agent profile:', err);
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<AgentProfileData>) => {
    try {
      setUpdating(true);
      const response = await api.patch('/agent/dashboard/update_profile/', data);
      setProfile((prev) => (prev ? { ...prev, ...response.data } : response.data));
      toast.success('Profile updated successfully');
      return true;
    } catch (err: unknown) {
      console.error('Error updating agent profile:', err);
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to update profile');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    updating,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}
