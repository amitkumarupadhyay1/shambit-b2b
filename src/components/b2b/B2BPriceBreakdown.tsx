import React from 'react';

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
    <div className="space-y-4 text-sm">
      <div className="space-y-2 border-b pb-4">
        {quoteResult.lines.map((line, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-slate-600">{line.quantity}x {line.room_type_name || 'Global Allocation'}</span>
            <span className="font-semibold">₹{parseFloat(line.pricing.b2c_total || line.pricing.final_b2b_selling_total || '0').toLocaleString()}</span>
          </div>
        ))}
      </div>
      
      <div className="space-y-2 pb-4">
        <div className="flex justify-between text-slate-600">
          <span>Public Selling Total (B2C)</span>
          <span>₹{parseFloat(quoteResult.summary.b2c_total).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-2 rounded">
          <span>Your TAC (Commission)</span>
          <span>+ ₹{parseFloat(quoteResult.summary.agent_tac_total).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-dashed mt-auto">
        <div className="flex justify-between items-end">
          <span className="font-bold text-lg">Amount Payable</span>
          <span className="text-2xl font-black text-slate-900">₹{parseFloat(quoteResult.summary.b2b_selling_total).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
