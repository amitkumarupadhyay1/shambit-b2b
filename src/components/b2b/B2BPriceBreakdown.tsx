import React from 'react';
import { Receipt, TrendingUp, Wallet } from 'lucide-react';

interface QuoteLine {
  room_type_name?: string;
  line_type?: string;
  quantity: number;
  billed_quantity?: number;
  foc_quantity?: number;
  foc_discount_total?: string;
  extra_guest_charges?: {
    extra_adults?: number;
    extra_children?: number;
    extra_beds?: number;
    extra_mattresses?: number;
    pay_at_hotel_total?: string;
  };
  pricing: {
    b2c_total?: string;
    extra_guest_b2b_selling_total?: string;
    extra_guest_pay_at_hotel_total?: string;
    foc_discount_total?: string;
    final_b2b_selling_total?: string;
  };
}

interface QuoteResult {
  booking_mode: string;
  summary: {
    b2c_total: string;
    agent_tac_total: string;
    b2b_selling_subtotal?: string;
    platform_fee_total?: string;
    coupon_discount_amount?: string;
    coupon_code?: string | null;
    foc_rooms_granted?: number;
    foc_discount_total?: string;
    final_b2b_selling_total?: string;
    b2b_selling_total: string;
  };
  lines: QuoteLine[];
}

interface Props {
  quoteResult: QuoteResult;
}

function money(value: string | number | null | undefined) {
  const amount = typeof value === 'number' ? value : parseFloat(value || '0');
  return Number.isFinite(amount) ? amount.toLocaleString() : '0';
}

export default function B2BPriceBreakdown({ quoteResult }: Props) {
  const summary = quoteResult.summary;
  const finalPayable = summary.final_b2b_selling_total || summary.b2b_selling_total;
  const platformFee = parseFloat(summary.platform_fee_total || '0');
  const couponDiscount = parseFloat(summary.coupon_discount_amount || '0');
  const focDiscount = parseFloat(summary.foc_discount_total || '0');
  const focRooms = Number(summary.foc_rooms_granted || 0);

  return (
    <div className="space-y-5 text-sm">
      {/* Line Items Section */}
      <div className="space-y-3 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Line Items</span>
        </div>

        <div className="space-y-1.5">
          {quoteResult.lines.map((line, idx) => (
            <div key={idx} className="rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50/80 group">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
                  {line.quantity}x {line.room_type_name || 'Global Allocation'}
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">₹{money(line.pricing.final_b2b_selling_total)}</span>
              </div>
              {(line.foc_quantity || line.billed_quantity != null || line.extra_guest_charges) && (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {line.billed_quantity != null && <span>Billed rooms: {line.billed_quantity}</span>}
                  {!!line.foc_quantity && <span className="text-emerald-700">FOC: {line.foc_quantity}</span>}
                  {!!line.extra_guest_charges?.extra_adults && <span>Extra adults: {line.extra_guest_charges.extra_adults}</span>}
                  {!!line.extra_guest_charges?.extra_children && <span>Extra children: {line.extra_guest_charges.extra_children}</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Gradient separator */}
        <div className="h-px bg-gradient-to-r from-orange-300 via-orange-200 to-transparent" />
      </div>
      
      {/* Summary Section */}
      <div className="space-y-3 pb-5">
        <div className="flex justify-between text-slate-500 px-3 py-1.5">
          <span>Public Selling Total (B2C)</span>
          <span className="tabular-nums">₹{money(summary.b2c_total)}</span>
        </div>
        <div className="flex justify-between text-slate-500 px-3 py-1.5">
          <span>B2B Subtotal</span>
          <span className="tabular-nums">₹{money(summary.b2b_selling_subtotal || finalPayable)}</span>
        </div>
        {focRooms > 0 && (
          <div className="flex justify-between text-emerald-700 px-3 py-1.5 font-semibold">
            <span>FOC Benefit ({focRooms} room{focRooms === 1 ? '' : 's'})</span>
            <span className="tabular-nums">- ₹{money(focDiscount)}</span>
          </div>
        )}
        {platformFee > 0 && (
          <div className="flex justify-between text-slate-500 px-3 py-1.5">
            <span>Platform Fee</span>
            <span className="tabular-nums">₹{money(platformFee)}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-700 px-3 py-1.5 font-semibold">
            <span>Coupon{summary.coupon_code ? ` (${summary.coupon_code})` : ''}</span>
            <span className="tabular-nums">- ₹{money(couponDiscount)}</span>
          </div>
        )}
        <div
          className="flex justify-between items-center text-emerald-700 font-bold rounded-xl px-4 py-3 shadow-sm border border-emerald-200/60"
          style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)' }}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Your TAC (Commission)
          </span>
          <span className="tabular-nums text-base">+ ₹{money(summary.agent_tac_total)}</span>
        </div>

        {/* Gradient separator */}
        <div className="h-px bg-gradient-to-r from-orange-300 via-orange-200 to-transparent mt-2" />
      </div>
      
      {/* Amount Payable Section */}
      <div className="pt-3 mt-auto">
        <div className="flex justify-between items-center">
          <span className="font-bold text-base flex items-center gap-2 text-slate-700">
            <Wallet className="w-5 h-5 text-orange-500" />
            Amount Payable
          </span>
          <span
            className="text-3xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ea580c, #f97316, #fb923c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ₹{money(finalPayable)}
          </span>
        </div>
      </div>
    </div>
  );
}
