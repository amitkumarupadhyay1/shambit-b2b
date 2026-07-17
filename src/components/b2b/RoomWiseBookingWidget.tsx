import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface Room {
  id: number;
  name: string;
  description: string;
  max_adults: number;
  base_price_per_night: string;
  available_rooms: number;
  images: { image_url: string }[];
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
  onUpdateQuantity: (roomId: number, qty: number) => void;
}

export default function RoomWiseBookingWidget({ rooms, roomSelections, onUpdateQuantity }: Props) {
  return (
    <div className="space-y-4">
      {rooms.map(room => {
        const primaryRate = room.b2b_pricing_matrix?.[0];
        const selectedQuantity = roomSelections[room.id] || 0;
        return (
        <div key={room.id} className="bg-white rounded-2xl p-4 border border-slate-200 flex gap-4">
          <div className="w-32 h-32 relative rounded-lg overflow-hidden shrink-0 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {room.images[0]?.image_url && <img src={room.images[0].image_url} alt={room.name} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg">{room.name}</h3>
              <p className="text-xs text-slate-500 max-w-sm line-clamp-2">{room.description}</p>
            </div>
            {primaryRate ? (
              <div className="mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">B2B rate:</span> ₹{Number(primaryRate.final_b2b_selling || 0).toLocaleString()} / night
                </div>
                <div className="text-xs text-emerald-600 font-semibold">₹{Number(primaryRate.agent_tac || 0).toLocaleString()} agent TAC</div>
                <div className="text-xs text-slate-500 font-semibold">{room.available_rooms} room{room.available_rooms === 1 ? '' : 's'} available</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-red-500 font-semibold">Not included in contract</div>
            )}
          </div>
          <div className="w-32 flex flex-col items-center justify-center border-l pl-4">
            <label className="text-xs font-bold text-slate-500 mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button type="button" disabled={selectedQuantity === 0} onClick={() => onUpdateQuantity(room.id, selectedQuantity - 1)} className="p-1 border rounded hover:bg-slate-50 disabled:opacity-40"><Minus className="w-4 h-4"/></button>
              <span className="font-bold">{selectedQuantity}</span>
              <button type="button" disabled={!primaryRate || selectedQuantity >= room.available_rooms} onClick={() => onUpdateQuantity(room.id, selectedQuantity + 1)} className="p-1 border rounded hover:bg-slate-50 disabled:opacity-40"><Plus className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
