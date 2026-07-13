import useSWR from 'swr';
import api from '../lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useState } from 'react';

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
  const { data: profile, error: swrError, mutate, isLoading } = useSWR<AgentProfileData>('/agent/dashboard/summary/');
  const [updating, setUpdating] = useState(false);

  // Parse error safely
  let errorMsg: string | null = null;
  if (swrError) {
    if (axios.isAxiosError(swrError)) {
      errorMsg = swrError.response?.data?.error || 'Failed to load profile';
    } else {
      errorMsg = (swrError as Error).message || 'Failed to load profile';
    }
  }

  const updateProfile = async (data: Partial<AgentProfileData>) => {
    try {
      setUpdating(true);
      const response = await api.patch('/agent/dashboard/update_profile/', data);
      mutate({ ...profile, ...response.data }, false); // Optimistic update
      toast.success('Profile updated successfully');
      return true;
    } catch (err: unknown) {
      console.error('Error updating agent profile:', err);
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || 'Failed to update profile');
      } else {
        toast.error('An unexpected error occurred while updating the profile');
      }
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile: profile || null,
    loading: isLoading,
    error: errorMsg,
    updating,
    updateProfile,
    refreshProfile: () => mutate(),
  };
}
