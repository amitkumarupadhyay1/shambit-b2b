import React from 'react';
import { Scale, BookOpen, AlertCircle } from 'lucide-react';
import PolicyPageShell from '@/components/layout/PolicyPageShell';

export default function TermsAndConditions() {
  return (
    <PolicyPageShell>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4 shadow-sm">
          <Scale className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-playfair font-bold text-slate-900 mb-4 tracking-tight">Terms & Conditions</h1>
        <p className="text-slate-600 font-medium">Effective Date: July 2026</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 p-8 md:p-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            1. Applicability & E-Commerce Rules
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
            <p>
              These Terms and Conditions constitute a legally binding agreement between ShamBit Technologies 
              (&quot;ShamBit&quot;, &quot;Marketplace&quot;) and the registered B2B Travel Agency (&quot;Agent&quot;, &quot;You&quot;). By registering 
              on the ShamBit B2B portal, you agree to comply with these terms, which are formulated in accordance 
              with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong> and the <strong>Information 
              Technology (Intermediaries Guidelines) Rules, 2021</strong>.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
                <Scale className="w-5 h-5 text-indigo-600" />
            </div>
            2. Marketplace Role and Fallback Liability
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-4 leading-relaxed">
            <p>
              ShamBit operates strictly as a B2B travel marketplace intermediary. We facilitate inventory 
              distribution from third-party Service Providers (hotels, airlines, transfer companies) to you, 
              the Agent. 
            </p>
            <div className="bg-white border border-indigo-100 p-5 rounded-xl shadow-sm mt-6">
              <p className="text-sm text-slate-700 font-medium m-0">
                <strong>Fallback Liability:</strong> Under the Consumer Protection E-commerce Rules, ShamBit 
                assumes fallback liability only in instances where a registered Service Provider fails to deliver 
                the promised inventory to your end-client due to negligence or systemic failure on our platform&apos;s 
                end, provided such failure causes direct financial loss.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
            </div>
            3. Unfair Trade Practices
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
            <p>
              As an Agent using our platform, you are strictly prohibited from engaging in any &quot;unfair trade 
              practices&quot; as defined under the Consumer Protection Act, 2019. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-indigo-500">
              <li>Misrepresenting ShamBit inventory pricing to end consumers.</li>
              <li>Publishing fake reviews or misleading advertisements using our API data.</li>
              <li>Failing to disclose statutory taxes, convenience fees, or hidden charges to your clients.</li>
            </ul>
          </div>
        </section>

        <section className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-6 rounded-2xl border border-indigo-100/50 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Governing Law and Jurisdiction</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            These terms shall be governed by and constructed in accordance with the laws of India. Any disputes 
            arising in relation hereto shall be subject to the exclusive jurisdiction of the courts at New Delhi, India.
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
