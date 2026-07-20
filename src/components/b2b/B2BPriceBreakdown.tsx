import React from 'react';
import { Receipt, TrendingUp, Wallet } from 'lucide-react';

interface QuoteLine {
  room_type_name?: string;
  line_type?: string;
  quantity: number;
  pricing: {
    b2c_total?: string;
    final_b2b_selling_total?: string;
  };
}

interface QuoteResult {
  booking_mode: string;
  summary: {
    b2c_total: string;
    agent_tac_total: string;
    b2b_selling_total: string;
  };
  lines: QuoteLine[];
}

interface Props {
  quoteResult: QuoteResult;
}

export default function B2BPriceBreakdown({ quoteResult }: Props) {
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
            <div key={idx} className="flex justify-between items-center px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-slate-50/80 group">
              <span className="text-slate-600 group-hover:text-slate-800 transition-colors duration-200">{line.quantity}x {line.room_type_name || 'Global Allocation'}</span>
              <span className="font-semibold text-slate-800 tabular-nums">₹{parseFloat(line.pricing.final_b2b_selling_total || '0').toLocaleString()}</span>
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
          <span className="tabular-nums">₹{parseFloat(quoteResult.summary.b2c_total).toLocaleString()}</span>
        </div>
        <div
          className="flex justify-between items-center text-emerald-700 font-bold rounded-xl px-4 py-3 shadow-sm border border-emerald-200/60"
          style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)' }}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Your TAC (Commission)
          </span>
          <span className="tabular-nums text-base">+ ₹{parseFloat(quoteResult.summary.agent_tac_total).toLocaleString()}</span>
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
            ₹{parseFloat(quoteResult.summary.b2b_selling_total).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
