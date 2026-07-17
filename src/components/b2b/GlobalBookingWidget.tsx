import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface GlobalRatePlan {
  id: number;
  name: string;
  rate_per_room_per_night: string;
  min_rooms: number;
  max_rooms: number | null;
  allocation_mode: string;
  terms_and_conditions?: string;
}

interface Props {
  plans: GlobalRatePlan[];
  selectedPlanId: number | null;
  onSelectPlan: (planId: number | null) => void;
  totalRooms: number;
  onUpdateTotalRooms: (qty: number) => void;
  totalGuests: number;
  onUpdateTotalGuests: (qty: number) => void;
}

export default function GlobalBookingWidget({
  plans,
  selectedPlanId,
  onSelectPlan,
  totalRooms,
  onUpdateTotalRooms,
  totalGuests,
  onUpdateTotalGuests
}: Props) {
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Global Rate Plan</label>
          <select 
            className="w-full p-3 border rounded-xl"
            value={selectedPlanId || ''}
            onChange={e => onSelectPlan(Number(e.target.value))}
          >
            <option value="">-- Select a Plan --</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name} (Min {plan.min_rooms} rooms)</option>
            ))}
          </select>
        </div>

        {selectedPlan && (
          <div className={`rounded-xl border p-4 text-sm ${selectedPlan.allocation_mode === 'MANUAL_CONFIRMATION' ? 'border-purple-200 bg-purple-50 text-purple-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
            <p className="font-bold">
              {selectedPlan.allocation_mode === 'MANUAL_CONFIRMATION'
                ? 'Hotel confirmation required'
                : 'Instant allocation available'}
            </p>
            <p className="mt-1">
              {selectedPlan.allocation_mode === 'MANUAL_CONFIRMATION'
                ? 'Your ledger amount will be held while an administrator assigns eligible room categories. It will be released automatically if the request is rejected.'
                : 'Room categories will be allocated automatically from the configured pool.'}
            </p>
            <p className="mt-2 text-xs">
              Allowed quantity: {selectedPlan.min_rooms}–{selectedPlan.max_rooms ?? 'unlimited'} rooms.
            </p>
            {selectedPlan.terms_and_conditions && <p className="mt-2 text-xs">{selectedPlan.terms_and_conditions}</p>}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Total Rooms Needed</label>
            <div className="flex items-center gap-3 border rounded-xl p-2 w-fit">
              <button onClick={() => onUpdateTotalRooms(Math.max(1, totalRooms - 1))} className="p-2 hover:bg-slate-50 rounded"><Minus className="w-4 h-4"/></button>
              <span className="font-bold w-8 text-center">{totalRooms}</span>
              <button onClick={() => onUpdateTotalRooms(selectedPlan?.max_rooms ? Math.min(selectedPlan.max_rooms, totalRooms + 1) : totalRooms + 1)} className="p-2 hover:bg-slate-50 rounded"><Plus className="w-4 h-4"/></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Total Guests</label>
            <div className="flex items-center gap-3 border rounded-xl p-2 w-fit">
              <button onClick={() => onUpdateTotalGuests(Math.max(1, totalGuests - 1))} className="p-2 hover:bg-slate-50 rounded"><Minus className="w-4 h-4"/></button>
              <span className="font-bold w-8 text-center">{totalGuests}</span>
              <button onClick={() => onUpdateTotalGuests(totalGuests + 1)} className="p-2 hover:bg-slate-50 rounded"><Plus className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
