import React from 'react';
import { Plus, Minus, Bed } from 'lucide-react';
import { normalizeMediaUrl } from '@/lib/media';
import type { RoomOccupancy } from '../AgentHotelDetails';

interface Room {
  id: number;
  name: string;
  description: string;
  max_adults: number;
  max_children: number;
  base_occupancy: number;
  max_occupancy: number;
  max_extra_beds: number;
  max_extra_mattresses: number;
  base_price_per_night: string;
  available_rooms: number;
  images: { image_url: string }[];
  extra_guest_rule: {
    extra_adult_fee: string;
    extra_child_fee: string;
    extra_bed_fee: string;
    extra_mattress_fee: string;
    child_age_min: number;
    child_age_max: number;
    charge_type: string;
  } | null;
  b2b_pricing_matrix: {
    id: string;
    room_type: string;
    meal_plan: string;
    is_sub_row: boolean;
    b2c_price: number;
    agent_tac: number;
    final_b2b_selling: number;
  }[];
}

interface Props {
  rooms: Room[];
  roomSelections: Record<number, number>;
  roomOccupancies: Record<number, RoomOccupancy[]>;
  onUpdateQuantity: (roomId: number, qty: number) => void;
  onUpdateOccupancy: (roomId: number, index: number, occupancy: RoomOccupancy) => void;
}

export default function RoomWiseBookingWidget({
  rooms,
  roomSelections,
  roomOccupancies,
  onUpdateQuantity,
  onUpdateOccupancy,
}: Props) {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const defaultOccupancy = (room: Room): RoomOccupancy => ({
    adults: Math.min(2, Math.max(1, room.max_adults)),
    children: 0,
    child_ages: [],
    extra_beds: 0,
    extra_mattresses: 0,
  });

  const updateOccupancy = (room: Room, index: number, patch: Partial<RoomOccupancy>) => {
    const current = roomOccupancies[room.id]?.[index] || defaultOccupancy(room);
    const nextChildren = clamp(patch.children ?? current.children, 0, room.max_children);
    const childAges = patch.child_ages ?? Array.from(
      { length: nextChildren },
      (_, ageIndex) => current.child_ages[ageIndex] || room.extra_guest_rule?.child_age_min || 3
    );

    onUpdateOccupancy(room.id, index, {
      ...current,
      ...patch,
      adults: clamp(patch.adults ?? current.adults, 1, room.max_adults),
      children: nextChildren,
      child_ages: childAges.slice(0, nextChildren),
      extra_beds: clamp(patch.extra_beds ?? current.extra_beds, 0, room.max_extra_beds),
      extra_mattresses: clamp(patch.extra_mattresses ?? current.extra_mattresses, 0, room.max_extra_mattresses),
    });
  };

  return (
    <div className="space-y-5">
      {rooms.map(room => {
        const primaryRate = room.b2b_pricing_matrix?.[0];
        const selectedQuantity = roomSelections[room.id] || 0;
        const occupancies = roomOccupancies[room.id] || [];

        return (
          <div
            key={room.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500" />

            <div className="flex gap-5">
              <div className="relative m-3 ml-5 h-36 w-36 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                {room.images[0]?.image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={normalizeMediaUrl(room.images[0].image_url)}
                      alt={room.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Bed className="h-10 w-10 text-slate-300" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between py-4 pr-2">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-800 transition-colors duration-200 group-hover:text-orange-600">
                    {room.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 max-w-sm text-xs leading-relaxed text-slate-400">
                    {room.description}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">
                    Capacity: {room.max_adults} adults, {room.max_children} children · max {room.max_occupancy} guests
                  </p>
                </div>
                {primaryRate ? (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">B2B rate</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{Number(primaryRate.final_b2b_selling || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-400">/ night</span>
                      {primaryRate.b2c_price > 0 && (
                        <span className="ml-1 text-xs text-slate-400 line-through">
                          ₹{Number(primaryRate.b2c_price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                        ₹{Number(primaryRate.agent_tac || 0).toLocaleString()} TAC
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          room.available_rooms > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {room.available_rooms > 0
                          ? `${room.available_rooms} room${room.available_rooms === 1 ? '' : 's'} available`
                          : 'Sold out'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500">
                    Not included in contract
                  </div>
                )}
              </div>

              <div className="flex w-36 flex-col items-center justify-center border-l border-slate-100 bg-slate-50/50 px-4">
                <label className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={selectedQuantity === 0}
                    onClick={() => onUpdateQuantity(room.id, selectedQuantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-150 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 active:scale-95 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:active:scale-100"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-lg font-extrabold tabular-nums text-slate-800">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    disabled={!primaryRate || selectedQuantity >= room.available_rooms}
                    onClick={() => onUpdateQuantity(room.id, selectedQuantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-150 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 active:scale-95 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:active:scale-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {selectedQuantity > 0 && (
              <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Per-room occupancy</p>
                  {room.extra_guest_rule ? (
                    <p className="text-[11px] font-semibold text-slate-500">
                      Extra adult ₹{Number(room.extra_guest_rule.extra_adult_fee || 0).toLocaleString()} · mattress ₹{Number(room.extra_guest_rule.extra_mattress_fee || 0).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold text-amber-700">No extra-guest rule configured</p>
                  )}
                </div>

                {Array.from({ length: selectedQuantity }, (_, index) => {
                  const occupancy = occupancies[index] || defaultOccupancy(room);
                  return (
                    <div key={`${room.id}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Room {index + 1} adults
                          <input
                            type="number"
                            min={1}
                            max={room.max_adults}
                            value={occupancy.adults}
                            onChange={event => updateOccupancy(room, index, { adults: Number(event.target.value) })}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
                          />
                        </label>
                        <label className="text-[11px] font-semibold text-slate-600">
                          Children
                          <input
                            type="number"
                            min={0}
                            max={room.max_children}
                            value={occupancy.children}
                            onChange={event => updateOccupancy(room, index, { children: Number(event.target.value) })}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
                          />
                        </label>
                        <label className="text-[11px] font-semibold text-slate-600">
                          Extra beds
                          <input
                            type="number"
                            min={0}
                            max={room.max_extra_beds}
                            value={occupancy.extra_beds}
                            onChange={event => updateOccupancy(room, index, { extra_beds: Number(event.target.value) })}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
                          />
                        </label>
                        <label className="text-[11px] font-semibold text-slate-600">
                          Mattresses
                          <input
                            type="number"
                            min={0}
                            max={room.max_extra_mattresses}
                            value={occupancy.extra_mattresses}
                            onChange={event => updateOccupancy(room, index, { extra_mattresses: Number(event.target.value) })}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
                          />
                        </label>
                      </div>
                      {occupancy.children > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Array.from({ length: occupancy.children }, (_, childIndex) => (
                            <label key={childIndex} className="text-[11px] font-semibold text-slate-600">
                              Child {childIndex + 1} age
                              <input
                                type="number"
                                min={room.extra_guest_rule?.child_age_min || 0}
                                max={room.extra_guest_rule?.child_age_max || 17}
                                value={occupancy.child_ages[childIndex] || room.extra_guest_rule?.child_age_min || 3}
                                onChange={event => {
                                  const childAges = [...occupancy.child_ages];
                                  childAges[childIndex] = Number(event.target.value);
                                  updateOccupancy(room, index, { child_ages: childAges });
                                }}
                                className="ml-2 w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
