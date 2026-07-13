import React from 'react';
import { ShieldCheck, Database, Lock, UserCheck } from 'lucide-react';
import PolicyPageShell from '@/components/layout/PolicyPageShell';

export default function PrivacyPolicy() {
  return (
    <PolicyPageShell>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-playfair font-bold text-slate-900 mb-4 tracking-tight">Privacy & Data Protection Policy</h1>
        <p className="text-slate-600 font-medium">Effective Date: July 2026</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 p-8 md:p-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
                <Database className="w-5 h-5 text-emerald-600" />
            </div>
            1. Data Fiduciary Status
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
            <p>
              ShamBit Technologies (&quot;ShamBit&quot;, &quot;We&quot;, &quot;Us&quot;) acts as a Data Fiduciary under the 
              <strong> Digital Personal Data Protection Act, 2023 (DPDPA)</strong>. We are committed to 
              protecting the personal and corporate data of our B2B Travel Agents (&quot;You&quot;, &quot;Agent&quot;).
              This policy outlines the purpose and means of processing your data in a transparent, 
              lawful, and secure manner.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
                <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            2. Data Collection and Consent
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-4 leading-relaxed">
            <p>
              We only collect data that is strictly necessary for providing our B2B travel inventory 
              services, establishing commercial credit, and meeting Government of India (GOI) KYC norms.
            </p>
            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
              <li><strong>Identity & KYC Data:</strong> PAN, Aadhaar Number, GSTIN.</li>
              <li><strong>Contact Data:</strong> Name, Email, Phone Number, Business Address.</li>
              <li><strong>Financial Data:</strong> Bank account details for payouts and settlements.</li>
              <li><strong>Log Data:</strong> IP address, device telemetry, and booking API usage (for security).</li>
            </ul>
            <div className="bg-white border border-emerald-100 p-5 rounded-xl shadow-sm mt-6">
              <p className="text-sm text-slate-700 font-medium m-0">
                By submitting your data during registration, you provide free, specific, and unambiguous consent 
                to process this data exclusively for B2B portal access. You may withdraw this consent at any time 
                via your Agent Dashboard, though it may result in termination of platform access.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
                <Lock className="w-5 h-5 text-emerald-600" />
            </div>
            3. Data Retention and Deletion
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
            <p>
              As a Data Principal, you have the right to access, correct, and erase your personal data. 
              We retain your KYC and financial transaction records for a maximum of <strong>eight (8) years</strong> 
              as mandated by the Companies Act, 2013 and the Income Tax Act, 1961. Once the statutory 
              period expires, your personal data is permanently deleted from our primary servers and backups 
              in accordance with DPDPA 2026 limits.
            </p>
          </div>
        </section>

        <section className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-2xl border border-emerald-100/50 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Contacting the Data Protection Officer</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            If you wish to exercise your rights under the DPDP Act or report a privacy concern, please contact 
            our Data Protection Officer at <a href="mailto:dpo@shambit.com" className="font-semibold text-emerald-700 hover:underline">dpo@shambit.com</a>. We will acknowledge your request 
            within 48 hours and resolve it within 30 days.
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
