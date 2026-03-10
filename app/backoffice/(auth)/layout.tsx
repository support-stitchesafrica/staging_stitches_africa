/**
 * Back Office Authentication Layout
 * 
 * This layout wraps authentication pages (login, accept-invitation)
 * and bypasses the main authentication check.
 * 
 * Requirements: 1.1, 1.2, 2.3
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
