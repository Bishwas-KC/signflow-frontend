import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldCheck, LogOut, LayoutDashboard, X } from 'lucide-react';

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const { token } = useParams();
  const navigate = useNavigate();
  const declined = searchParams.get('declined') === '1';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/70 shadow-sm p-10 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
          declined ? 'bg-red-50' : 'bg-emerald-50'
        }`}>
          {declined ? (
            <XCircle size={28} className="text-red-500" />
          ) : (
            <CheckCircle size={28} className="text-emerald-500" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {declined ? 'Signature Declined' : 'Document Signed Successfully!'}
        </h2>

        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {declined
            ? 'The document owner has been notified of your decision. If you changed your mind, please contact them directly.'
            : 'Thank you for signing! The document owner will be notified automatically.'
          }
        </p>

        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-8">
          <ShieldCheck size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-600">
            Secured by Signflow &middot; E-signature legally binding
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer font-inherit"
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button
              onClick={() => window.close()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer font-inherit"
            >
              <X size={16} /> Close
            </button>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer font-inherit"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
