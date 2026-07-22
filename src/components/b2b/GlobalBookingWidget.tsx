import React from 'react';
import { Plus, Minus, Globe, DoorOpen, Users } from 'lucide-react';

interface GlobalRatePlan {
  id: number;
  name: string;
  rate_per_room_per_night: string;
  min_rooms: number;
  max_rooms: number | null;
  allocation_mode: string;
  confirmation_sla_minutes: number;
  terms_and_conditions?: string;
  max_persons_per_room: number;
  max_extra_persons: number;
  extra_mattress_cost: number;
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
      {/* Gradient border wrapper */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-amber-300 to-orange-500 p-[1.5px] shadow-lg shadow-orange-100/60">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 space-y-6">
          {/* Card header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-200/50">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Global Rate Plans
            </h3>
          </div>

          {/* Plan select */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Global Rate Plan</label>
            <select 
              className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-800 font-medium appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-orange-400 hover:border-orange-300 hover:bg-white"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='%23f97316' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
              value={selectedPlanId || ''}
              onChange={e => onSelectPlan(Number(e.target.value))}
            >
              <option value="">-- Select a Plan --</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name} (Min {plan.min_rooms} rooms)</option>
              ))}
            </select>
          </div>

          {/* Allocation mode info box */}
          {selectedPlan && (
            <div className={`rounded-xl border p-4 text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${selectedPlan.allocation_mode === 'MANUAL_CONFIRMATION' ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50/80 text-purple-900' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/80 text-emerald-900'}`}>
              <p className="font-bold">
                {selectedPlan.allocation_mode === 'MANUAL_CONFIRMATION'
                  ? 'Hotel confirmation required'
                  : 'Instant allocation available'}
              </p>
              <p className="mt-1">
                {selectedPlan.allocation_mode === 'MANUAL_CONFIRMATION'
                  ? `Your ledger amount will be held while the hotel allocation is confirmed. The request expires after ${selectedPlan.confirmation_sla_minutes} minutes and the hold is then released automatically.`
                  : 'Room categories will be allocated automatically from the configured pool.'}
              </p>
              <p className="mt-2 text-xs">
                Allowed quantity: {selectedPlan.min_rooms}–{selectedPlan.max_rooms ?? 'unlimited'} rooms.
              </p>
              <div className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1">
                <span>Base Occupancy: {selectedPlan.max_persons_per_room} / room</span>
                {selectedPlan.max_extra_persons > 0 && (
                  <span>
                    Max Extra: {selectedPlan.max_extra_persons} / room 
                    (₹{selectedPlan.extra_mattress_cost}/person)
                  </span>
                )}
              </div>
              {selectedPlan.terms_and_conditions && <p className="mt-2 text-xs">{selectedPlan.terms_and_conditions}</p>}
            </div>
          )}
          
          {/* Quantity counters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <DoorOpen className="w-4 h-4 text-orange-500" />
                Total Rooms Needed
              </label>
              <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-2 w-fit bg-slate-50/50 transition-all duration-200 hover:border-orange-200">
                <button onClick={() => onUpdateTotalRooms(Math.max(selectedPlan?.min_rooms || 1, totalRooms - 1))} className="p-2 rounded-full border border-transparent transition-all duration-200 hover:bg-gradient-to-br hover:from-orange-500 hover:to-amber-500 hover:text-white hover:shadow-md hover:shadow-orange-200/50 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 active:scale-95"><Minus className="w-4 h-4"/></button>
                <span className="font-bold w-8 text-center text-slate-800">{totalRooms}</span>
                <button onClick={() => onUpdateTotalRooms(selectedPlan?.max_rooms ? Math.min(selectedPlan.max_rooms, totalRooms + 1) : totalRooms + 1)} className="p-2 rounded-full border border-transparent transition-all duration-200 hover:bg-gradient-to-br hover:from-orange-500 hover:to-amber-500 hover:text-white hover:shadow-md hover:shadow-orange-200/50 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 active:scale-95"><Plus className="w-4 h-4"/></button>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Users className="w-4 h-4 text-orange-500" />
                Total Guests
              </label>
              <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-2 w-fit bg-slate-50/50 transition-all duration-200 hover:border-orange-200">
                <button onClick={() => onUpdateTotalGuests(Math.max(totalRooms, totalGuests - 1))} className="p-2 rounded-full border border-transparent transition-all duration-200 hover:bg-gradient-to-br hover:from-orange-500 hover:to-amber-500 hover:text-white hover:shadow-md hover:shadow-orange-200/50 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 active:scale-95"><Minus className="w-4 h-4"/></button>
                <span className="font-bold w-8 text-center text-slate-800">{totalGuests}</span>
                <button onClick={() => onUpdateTotalGuests(totalGuests + 1)} className="p-2 rounded-full border border-transparent transition-all duration-200 hover:bg-gradient-to-br hover:from-orange-500 hover:to-amber-500 hover:text-white hover:shadow-md hover:shadow-orange-200/50 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 active:scale-95"><Plus className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
