import React from 'react';
import { RefreshCcw, CreditCard, Clock } from 'lucide-react';
import PolicyPageShell from '@/components/layout/PolicyPageShell';

export default function CancellationPolicy() {
  return (
    <PolicyPageShell>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-2xl mb-4 shadow-sm">
          <RefreshCcw className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-4xl font-playfair font-bold text-slate-900 mb-4 tracking-tight">Cancellation & Refund Policy</h1>
        <p className="text-slate-600 font-medium">Effective Date: July 2026</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 p-8 md:p-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
                <RefreshCcw className="w-5 h-5 text-red-600" />
            </div>
            1. General Cancellation Guidelines
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
            <p>
              ShamBit Technologies acts as an intermediary B2B platform. The cancellation policies for 
              flights, hotels, and transfer services are strictly governed by the underlying Service 
              Providers (airlines, hotel chains, operators). As mandated by the Consumer Protection 
              (E-Commerce) Rules, we display the specific cancellation rules for every inventory item 
              prior to booking completion.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
            </div>
            2. Refund Processing Timelines
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-4 leading-relaxed">
            <p>
              In compliance with Government of India regulations and RBI guidelines on digital payments, 
              eligible refunds will be processed within the following strict SLAs:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-red-500">
              <li><strong>Agency Wallet:</strong> Instant processing upon receipt of refund from the supplier.</li>
              <li><strong>Credit/Debit Cards:</strong> 5-7 business days from the date of approval.</li>
              <li><strong>Net Banking/UPI:</strong> 3-5 business days from the date of approval.</li>
            </ul>
            <div className="bg-white border border-red-100 p-5 rounded-xl shadow-sm mt-6">
              <p className="text-sm text-slate-700 font-medium m-0">
                Note: ShamBit convenience fees and payment gateway charges are strictly non-refundable unless 
                the cancellation is initiated due to a service failure on our end.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            3. Force Majeure and Supplier Defaults
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
            <p>
              In the event of mass cancellations due to &quot;Force Majeure&quot; (Acts of God, government lockdowns, 
              natural disasters) or airline/hotel bankruptcy, ShamBit will advocate on behalf of the Agent 
              to recover funds from the supplier. However, under the E-Commerce marketplace rules, we are 
              not liable to issue refunds out of pocket if the supplier fails to honor the refund.
            </p>
          </div>
        </section>

        <section className="bg-gradient-to-br from-red-50 to-orange-50/50 p-6 rounded-2xl border border-red-100/50 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Escalation Matrix</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            If a refund is delayed beyond the statutory SLA timeline, Agents may escalate the matter directly 
            to our Nodal Officer via the Support portal. Our finance team operates Monday-Friday, 9:00 AM to 6:00 PM IST.
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
