/**
 * Back Office Accept Invitation Page
 * 
 * Page for accepting back office invitations and creating user accounts.
 * Validates invitation tokens and provides account setup interface.
 * 
 * Requirements: 2.3, 2.4, 2.5
 */

import { Metadata } from 'next';
import AcceptInvitationForm from '@/components/backoffice/auth/AcceptInvitationForm';

export const metadata: Metadata = {
  title: 'Accept Invitation | Back Office',
  description: 'Accept your invitation to join the Stitches Africa Back Office',
};

interface AcceptInvitationPageProps {
  params: {
    token: string;
  };
}

/**
 * Accept Invitation Page
 * Displays the invitation acceptance form with token validation
 */
export default function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const { token } = params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        {/* Form container */}
        <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <AcceptInvitationForm token={token} />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Stitches Africa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
