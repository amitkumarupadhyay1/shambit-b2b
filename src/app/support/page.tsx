import React from 'react';
import { Headset, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import PolicyPageShell from '@/components/layout/PolicyPageShell';

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@shambit.com';
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919005457111';
  const grievanceEmail = process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL || supportEmail;
  const grievanceOfficerName = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME || 'Sumit Upadhyay';

  return (
    <PolicyPageShell>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4 shadow-sm">
          <Headset className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-playfair font-bold text-slate-900 mb-4 tracking-tight">Agent Support & Grievance Redressal</h1>
        <p className="text-slate-600 font-medium">24/7 Assistance for Registered Travel Agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* General Support */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">General Support</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Email Assistance</p>
                <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline text-sm">{supportEmail}</a>
                <p className="text-xs text-slate-500 mt-1">Average response time: 2 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Agent Helpline / WhatsApp</p>
                <p className="text-slate-600 text-sm">+{whatsappNumber}</p>
                <p className="text-xs text-slate-500 mt-1">Available 24/7 for Registered Agents</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Corporate Headquarters</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  ShamBit Technologies Pvt. Ltd.<br />
                  Shakti Nagar Ayodhya,<br />
                  Uttar Pradesh, India 224001
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grievance Officer */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-bl-full -z-10" />
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            Grievance Redressal
          </h2>
          
          <div className="prose prose-slate text-sm text-slate-600 mb-6 leading-relaxed">
            <p>
              In accordance with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong> and the 
              <strong> Information Technology Rules, 2021</strong>, the contact details of the Grievance 
              Officer are published below. 
            </p>
          </div>

          <div className="bg-white border border-orange-100 shadow-sm rounded-xl p-5 space-y-3 relative z-10">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Nodal Grievance Officer</p>
              <p className="font-semibold text-slate-900 text-lg">{grievanceOfficerName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Contact</p>
              <a href={`mailto:${grievanceEmail}`} className="text-orange-600 hover:underline font-medium block">{grievanceEmail}</a>
              <p className="text-slate-600 text-sm mt-1">+{whatsappNumber} (Mon-Fri, 9AM-6PM)</p>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <strong>Statutory SLA:</strong> We will acknowledge your grievance within <strong>48 hours</strong> of 
            receipt and resolve it within <strong>30 days</strong> as mandated by GOI regulations.
          </div>
        </div>
      </div>
    </PolicyPageShell>
  );
}
