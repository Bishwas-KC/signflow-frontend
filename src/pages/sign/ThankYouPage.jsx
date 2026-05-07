import { useSearchParams, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, ShieldCheck } from 'lucide-react';

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const { token } = useParams();
  const declined = searchParams.get('declined') === '1';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: '#0f172a',
        border: `1px solid ${declined ? '#dc2626' : '#10b981'}`,
        borderRadius: 20,
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: declined ? 'rgba(220,38,38,0.1)' : 'rgba(16,185,129,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          {declined ? (
            <XCircle size={28} style={{ color: '#ef4444' }} />
          ) : (
            <CheckCircle size={28} style={{ color: '#10b981' }} />
          )}
        </div>

        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#f1f5f9',
          marginBottom: 8,
        }}>
          {declined ? 'Signature Declined' : 'Document Signed Successfully!'}
        </h2>

        <p style={{
          fontSize: 13,
          color: '#64748b',
          lineHeight: 1.7,
          marginBottom: 28,
        }}>
          {declined
            ? 'The document owner has been notified of your decision. If you changed your mind, please contact them directly.'
            : 'Thank you for signing! The document owner will be notified automatically. You may now close this page.'
          }
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 10,
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.15)',
          marginBottom: 24,
        }}>
          <ShieldCheck size={14} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>
            Secured by Signflow · E-signature legally binding
          </span>
        </div>

        <button
          onClick={() => window.close()}
          style={{
            padding: '10px 32px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: '#94a3b8',
            background: '#1e293b',
            border: '1px solid #334155',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Close this page
        </button>
      </div>
    </div>
  );
}
