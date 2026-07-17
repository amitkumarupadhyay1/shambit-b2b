import React from 'react';

interface OrderLine {
  id: number;
  quantity: number;
  room_type_name: string;
  line_type: string;
  total_amount: string;
}

interface OrderData {
  hotel_name: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  total_rooms: number;
  booking_mode: string;
  lines: OrderLine[];
}

interface Props {
  orderData: OrderData | null;
}

export default function B2BBookingSummary({ orderData }: Props) {
  if (!orderData) return null;
  
  return (
    <>
      <h3 className="font-semibold text-slate-900 mb-4 text-lg border-b border-slate-100 pb-2">Booking Summary</h3>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Hotel</span>
          <strong className="text-slate-800">{orderData.hotel_name}</strong>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Check In</span>
          <strong className="text-slate-800">{orderData.check_in}</strong>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Check Out</span>
          <strong className="text-slate-800">{orderData.check_out}</strong>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Guests & Rooms</span>
          <strong className="text-slate-800">{orderData.total_guests} Guests, {orderData.total_rooms} Rooms</strong>
        </div>
        
        {orderData.lines.map((line) => (
          <div key={line.id} className="flex justify-between items-center text-xs text-slate-600 pl-2 border-l-2 border-slate-200">
            <span>{line.quantity}x {line.room_type_name || (line.line_type === 'GLOBAL' ? 'Global Plan' : 'Allocation')}</span>
            <span>₹{parseFloat(line.total_amount).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}
