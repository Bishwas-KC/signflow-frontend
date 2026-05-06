# SignFlow Project Context

## 1. Overview
SignFlow is a modern digital document signature platform built with React. It allows users to upload PDF documents, place signing fields, and send them to recipients for secure digital signing.

## 2. Tech Stack
- **Frontend Framework**: React 18 (Vite)
- **Styling**: TailwindCSS
- **State Management**: TanStack Query (v5)
- **Routing**: React Router v6
- **PDF Processing**: `react-pdf` (rendering), `pdfjs-dist`
- **Signatures**: `react-signature-canvas`
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 3. Core Workflow
1. **Authentication**: Users sign in via email/password or Google OAuth. Session state is managed via `AuthContext`.
2. **Dashboard**: A central hub showing document statistics and a searchable list of documents.
3. **Document Management**:
   - **Upload**: PDF files are uploaded and stored.
   - **Contacts/Companies**: Users can manage a directory of contacts and companies to quickly add signers.
4. **The Editor (Field Placement)**:
   - The document is rendered using `react-pdf`.
   - Users add "Signers" to the document.
   - Users drag and drop "Signature Fields" onto the PDF pages.
   - Each field is linked to a specific signer and contains coordinates (x, y) and page number.
5. **Signing Request**: Once configured, the document is "Sent". The backend generates unique signing links for each recipient.
6. **Signing Experience**:
   - Recipients access a public signing page (no login required for them if configured).
   - They see where they need to sign.
   - They can draw a signature or upload an image.
   - Upon submission, the signature is captured and the document status updates.
7. **Audit & Completion**:
   - Every action (viewed, signed, etc.) is recorded in an Audit Log.
   - Once all parties sign, the document is finalized.

## 4. File Structure
```text
.:
eslint.config.js
generate_context.sh
index.html
package.json
package-lock.json
postcss.config.js
PROJECT_CONTEXT.md
public
README.md
src
tailwind.config.js
vite.config.js

assets
favicon.svg
icons.svg
index.html

index-NOExmT9k.js
index-WV1RsKuR.css

@alloc
anymatch
any-promise
arg
asynckit
autoprefixer
axios
@babel
baseline-browser-mapping
binary-extensions
braces
browserslist
call-bind-apply-helpers
camelcase-css
caniuse-lite
chokidar
clsx
combined-stream
commander
convert-source-map
cssesc
csstype
debug
delayed-stream
dequal
didyoumean
dlv
dunder-proto
```

## 5. Source Code
Below is the complete source code for the project.

### File: package.json
```
{
  "name": "signflow-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@tanstack/react-query": "^5.28.0",
    "axios": "^1.6.8",
    "lucide-react": "^0.363.0",
    "pdfjs-dist": "^4.0.379",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-draggable": "^4.4.6",
    "react-hook-form": "^7.51.1",
    "react-hot-toast": "^2.4.1",
    "react-pdf": "^10.4.1",
    "react-router-dom": "^6.22.3",
    "react-signature-canvas": "^1.0.6",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.11",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.7.0",
    "autoprefixer": "^10.5.0",
    "postcss": "^8.4.38",
    "postcss-import": "^16.1.1",
    "tailwindcss": "^3.4.19",
    "vite": "^7.3.2"
  }
}
```

### File: vite.config.js
```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});```

### File: tailwind.config.js
```
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-right': 'slideRight 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
```

### File: eslint.config.js
```
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
```

### File: index.html
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Signflow — Secure Digital Document Signing" />
    <title>Signflow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>```

### File: postcss.config.js
```
export default {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### File: src/api/auth.api.js
```javascript
import api from './axios';

export const authApi = {
  register: (data) =>
    api.post('/auth/register', data).then(r => r.data),

  login: (data) =>
    api.post('/auth/login', data).then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data),

  me: () =>
    api.get('/auth/me').then(r => r.data),

  updateProfile: (data) =>
    api.put('/auth/profile', data).then(r => r.data),

  googleRedirect: () =>
    api.get('/auth/google/redirect').then(r => r.data),

  googleCallback: (code) =>
    api.get(`/auth/google/callback?code=${encodeURIComponent(code)}`).then(r => r.data),
};```

### File: src/api/axios.js
```javascript
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30000,
});

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle errors globally ────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status  = error.response?.status;
        const message = error.response?.data?.error?.message;

        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on auth pages
            if (!window.location.pathname.startsWith('/login')
                && !window.location.pathname.startsWith('/register')
                && !window.location.pathname.startsWith('/sign/')) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        if (status === 422) {
            // Validation errors — let the form handle, no toast
            return Promise.reject(error);
        }

        if (status === 409 || status === 403 || status === 404) {
            toast.error(message || 'An error occurred.');
            return Promise.reject(error);
        }

        if (status === 410) {
            // 410 Gone — document expired or link invalid (signing page)
            return Promise.reject(error);
        }

        if (status >= 500) {
            toast.error('Server error. Please try again later.');
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;```

### File: src/api/company.api.js
```javascript
import api from './axios';

export const companyApi = {
  list: (params = {}) =>
    api.get('/companies', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/companies/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/companies', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/companies/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/companies/${id}`).then(r => r.data),

  uploadLogo: (id, file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post(`/companies/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  uploadSeal: (id, file) => {
    const form = new FormData();
    form.append('seal', file);
    return api.post(`/companies/${id}/seal`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};```

### File: src/api/contact.api.js
```javascript
import api from './axios';

export const contactApi = {
  list: (params = {}) =>
    api.get('/contacts', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/contacts/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/contacts', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/contacts/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/contacts/${id}`).then(r => r.data),

  bulkDelete: (ids) =>
    api.delete('/contacts/bulk', { data: { ids } }).then(r => r.data),

  stats: () =>
    api.get('/contacts/stats').then(r => r.data),

  roles: () =>
    api.get('/contacts/roles').then(r => r.data),
};```

### File: src/api/document.api.js
```javascript
import api from './axios';

export const documentApi = {
  list: (params = {}) =>
    api.get('/documents', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/documents/${id}`).then(r => r.data),

  create: (data, file) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(k, v); });
    form.append('file', file);
    return api.post('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  deleteOriginalFile: (id) =>
    api.delete(`/documents/${id}/original-file`).then(r => r.data),

  update: (id, data) =>
    api.put(`/documents/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/documents/${id}`).then(r => r.data),

  stats: () =>
    api.get('/documents/stats').then(r => r.data),

  validate: (id) =>
    api.get(`/documents/${id}/validate`).then(r => r.data),

  send: (id, data = {}) =>
    api.post(`/documents/${id}/send`, data).then(r => r.data),

  cancel: (id) =>
    api.post(`/documents/${id}/cancel`).then(r => r.data),

  // Signers
  addSigner: (id, data) =>
    api.post(`/documents/${id}/signers`, data).then(r => r.data),

  removeSigner: (id, signerId) =>
    api.delete(`/documents/${id}/signers/${signerId}`).then(r => r.data),

  reorderSigners: (id, orderedIds) =>
    api.put(`/documents/${id}/signers/reorder`, { ordered_ids: orderedIds }).then(r => r.data),

  // Fields
  addField: (id, data) =>
    api.post(`/documents/${id}/fields`, data).then(r => r.data),

  bulkAddFields: (id, fields) =>
    api.post(`/documents/${id}/fields/bulk`, { fields }).then(r => r.data),

  updateField: (id, fieldId, data) =>
    api.put(`/documents/${id}/fields/${fieldId}`, data).then(r => r.data),

  removeField: (id, fieldId) =>
    api.delete(`/documents/${id}/fields/${fieldId}`).then(r => r.data),

  auditLog: (id) =>
    api.get(`/documents/${id}/audit-log`).then(r => r.data),
};```

### File: src/api/signing.api.js
```javascript
import api from './axios';

export const signingApi = {
  getByToken: (token) =>
    api.get(`/sign/${token}`).then(r => r.data),

  // Accepts FormData (supports file upload) or JSON
  submit: (token, formData) =>
    api.post(`/sign/${token}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  decline: (token, reason) =>
    api.post(`/sign/${token}/decline`, { reason }).then(r => r.data),
};```

### File: src/App.css
```css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}
```

### File: src/App.jsx
```jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout     from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoginPage      from '@/pages/auth/LoginPage';
import RegisterPage   from '@/pages/auth/RegisterPage';
import DashboardPage  from '@/pages/dashboard/DashboardPage';
import DocumentsPage  from '@/pages/documents/DocumentsPage';
import DocumentEditorPage  from '@/pages/documents/DocumentEditorPage';
import DocumentDetailPage  from '@/pages/documents/DocumentDetailPage';
import ContactsPage   from '@/pages/contacts/ContactsPage';
import CompaniesPage  from '@/pages/companies/CompaniesPage';
import SigningPage    from '@/pages/signing/SigningPage';
import { Spinner }   from '@/components/ui/Spinner';
import GoogleCallbackPage from '@/pages/auth/GoogleCallbackPage';
import NotFoundPage from '@/pages/NotFoundPage';



function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// Route guard — redirect authenticated users away from auth pages
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public signing page — no auth required */}
      <Route path="/sign/:token" element={<SigningPage />} />

      {/* Google OAuth callback — must be public */}
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth pages */}
      <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Dashboard pages */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard"                         element={<DashboardPage />} />
        <Route path="/dashboard/documents"               element={<DocumentsPage />} />
        <Route path="/dashboard/documents/:id"           element={<DocumentDetailPage />} />
        <Route path="/dashboard/documents/:id/editor"    element={<DocumentEditorPage />} />
        <Route path="/dashboard/contacts"                element={<ContactsPage />} />
        <Route path="/dashboard/companies"               element={<CompaniesPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*"   element={<NotFoundPage />} />
    </Routes>
  );
}```

### File: src/components/document/AuditLog.jsx
```jsx
import { formatDateTime, getInitials } from '@/utils/helpers';
import { FileText, CheckCircle, Send, XCircle, Eye, Clock, User } from 'lucide-react';

const eventConfig = {
  'document.created':   { icon: FileText,     color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',   label: 'Created' },
  'document.sent':      { icon: Send,          color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',   label: 'Sent' },
  'document.completed': { icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Completed' },
  'document.cancelled': { icon: XCircle,       color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',     label: 'Cancelled' },
  'document.expired':   { icon: Clock,         color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', label: 'Expired' },
  'signer.notified':    { icon: Send,          color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Notified' },
  'signer.viewed':      { icon: Eye,           color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Viewed' },
  'signer.signed':      { icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',   label: 'Signed' },
  'signer.approved':    { icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Approved' },
  'signer.declined':    { icon: XCircle,       color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',        label: 'Declined' },
};

export function AuditLogTimeline({ logs = [] }) {
  const logList = Array.isArray(logs) ? logs : [];

  if (logList.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-9 top-4 bottom-4 w-px bg-gray-100 dark:bg-slate-800" />

      <div className="space-y-0">
        {logList.map((log, idx) => {
          const config = eventConfig[log.event] || {
            icon: User, color: 'bg-gray-100 text-gray-500', label: log.event,
          };
          const Icon = config.icon;

          return (
            <div key={log.id} className="flex gap-4 px-5 py-3 relative">
              {/* Icon bubble */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                <Icon size={15} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{log.actor?.name}</span>
                      {log.ip_address && (
                        <>
                          <span className="text-gray-200 dark:text-slate-800">·</span>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">{log.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <time className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-tighter flex-shrink-0 whitespace-nowrap pt-0.5">
                    {formatDateTime(log.timestamp)}
                  </time>
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(log.metadata).map(([k, v]) => (
                      <span key={k} className="text-[9px] font-black uppercase tracking-widest bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-800">
                        {k.replace(/_/g, ' ')}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}```

### File: src/components/document/DocumentCard.jsx
```jsx
import { Link } from 'react-router-dom';
import { FileText, Eye, Edit3, Trash2, MoreVertical, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, classNames } from '@/utils/helpers';

export function DocumentCard({ doc, onDelete }) {
  const progress = doc.progress ?? 0;
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group animate-fade-in relative flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
          <FileText size={24} />
        </div>
        <Badge size="xs" className={classNames('font-black', STATUS_COLORS[doc.status])}>
          {STATUS_LABELS[doc.status]}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {doc.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-500 font-medium line-clamp-1 mb-4">
          {doc.description || 'No description provided.'}
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDate(doc.created_at)}
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              {doc.counts?.signed_count ?? 0}/{doc.counts?.total_signers ?? 0}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-slate-800">
        <Link to={`/dashboard/documents/${doc.id}`} className="flex-1">
          <button className="w-full py-2 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
            Details
          </button>
        </Link>
        <div className="flex gap-1">
          {['draft', 'pending'].includes(doc.status) && (
            <Link to={`/dashboard/documents/${doc.id}/editor`} title="Edit Fields">
              <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors">
                <Edit3 size={16} />
              </button>
            </Link>
          )}
          {doc.status !== 'in_progress' && (
            <button
              onClick={() => onDelete(doc)}
              title="Delete Document"
              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### File: src/components/document/FieldPlacer.jsx
```jsx
```

### File: src/components/document/SignerList.jsx
```jsx
import { Badge } from '@/components/ui/Badge';
import { SIGN_ROLES, SIGNER_STATUS_COLORS } from '@/utils/constants';
import { formatDateTime, getInitials } from '@/utils/helpers';
import { CheckCircle, Clock, Eye, XCircle } from 'lucide-react';

const statusIcons = {
  pending:  <Clock size={13} className="text-gray-400" />,
  notified: <Clock size={13} className="text-blue-400" />,
  viewed:   <Eye size={13} className="text-yellow-500" />,
  signed:   <CheckCircle size={13} className="text-green-500" />,
  approved: <CheckCircle size={13} className="text-emerald-500" />,
  declined: <XCircle size={13} className="text-red-500" />,
};

// Remove the roleConfig object and roleInfo references
// Remove the role Badge entirely from each signer row
// Keep only: name, email, status badge, signed_at

export function SignerList({ signers = [], signingMode }) {
  if (!signers.length) {
    return <p className="text-xs text-gray-400 text-center py-4">No signers added yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {signers.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3 px-5 py-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
            {s.name?.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {signingMode === 'sequential' && s.signing_order && (
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 rounded">
                  #{s.signing_order}
                </span>
              )}
              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
            </div>
            <p className="text-xs text-gray-500 truncate">{s.email}</p>
            {s.signed_at && (
              <p className="text-xs text-green-600 mt-0.5">Signed {formatDateTime(s.signed_at)}</p>
            )}
          </div>
          <Badge className={SIGNER_STATUS_COLORS[s.status]}>
            {s.status_label}
          </Badge>
        </div>
      ))}
    </div>
  );
}```

### File: src/components/shared/ConfirmDialog.jsx
```jsx
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="text-center pt-2">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100 dark:border-red-900/50">
          <AlertTriangle size={32} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">{title}</h3>
        {message && <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-8 max-w-[280px] mx-auto leading-relaxed">{message}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="secondary" className="rounded-xl flex-1 py-3 font-bold order-2 sm:order-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={variant} className="rounded-xl flex-1 py-3 font-bold order-1 sm:order-2 shadow-lg shadow-red-500/10" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}```

### File: src/components/shared/EmptyState.jsx
```jsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {Icon && (
        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-gray-100 dark:border-slate-700 transition-transform hover:scale-110 duration-500">
          <Icon size={32} className="text-gray-300 dark:text-slate-600" />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm font-medium text-gray-500 dark:text-slate-400 max-w-xs mb-8 mx-auto leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}```

### File: src/components/shared/FileUpload.jsx
```jsx
import { useState, useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { formatFileSize, classNames } from '@/utils/helpers';

export function FileUpload({ 
  value, 
  onChange, 
  accept = '.pdf', 
  maxSize = 20 * 1024 * 1024, // 20MB
  label = "Upload File",
  description = "PDF Only — max 20MB"
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (maxSize && file.size > maxSize) {
      alert(`File is too large. Max size is ${formatFileSize(maxSize)}`);
      return;
    }
    onChange(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
        {label} <span className="text-gray-400 font-normal">({description})</span>
      </label>
      
      <div
        className={classNames(
          'relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center cursor-pointer group',
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' 
            : 'border-gray-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900',
          value ? 'border-indigo-400 bg-indigo-50/30' : ''
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          ref={fileInputRef}
        />

        {value ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <FileText size={32} />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs">{value.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{formatFileSize(value.size)}</p>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="mt-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={18} />
              <span className="text-xs font-bold ml-1">Remove</span>
            </button>
          </div>
        ) : (
          <div className="py-4">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-slate-600 mx-auto mb-4 group-hover:scale-110 group-hover:text-indigo-500 transition-all">
              <Upload size={32} />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300">
              Click or drag to upload
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
              PDF documents are supported
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### File: src/components/shared/PageHeader.jsx
```jsx
export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}```

### File: src/components/shared/ProfileModal.jsx
```jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { Modal }  from '@/components/ui/Modal';
import { getInitials } from '@/utils/helpers';
import toast from 'react-hot-toast';

export function ProfileModal({ open, onClose }) {
  const { user, saveSession } = useAuth();
  const token = localStorage.getItem('token');

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const onSubmit = async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      saveSession(res.data.user, token);
      toast.success('Profile updated.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              : getInitials(user?.name)
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            {user?.has_google && (
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Google account
              </span>
            )}
          </div>
        </div>

        <Input
          label="Full Name"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
        />

        <Input
          label="Phone Number"
          placeholder="+977-98XXXXXXXX"
          hint="Used for Viber notifications"
          {...register('phone')}
        />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}```

### File: src/components/ui/Badge.jsx
```jsx
import { classNames } from '@/utils/helpers';

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({ children, className = '', size = 'md' }) {
  return (
    <span className={classNames(
      'inline-flex items-center rounded-full font-bold uppercase tracking-tighter transition-all',
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}```

### File: src/components/ui/Button.jsx
```jsx
import { classNames } from '@/utils/helpers';

const variants = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-200 dark:shadow-none',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-100 dark:shadow-none',
  ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  outline:   'bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500 dark:text-indigo-400 dark:border-indigo-500 dark:hover:bg-indigo-950/30',
  subtle:    'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={classNames(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}```

### File: src/components/ui/Input.jsx
```jsx
import { forwardRef } from 'react';
import { classNames } from '@/utils/helpers';

export const Input = forwardRef(function Input(
  { label, error, hint, className = '', ...props }, ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 ml-0.5">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={classNames(
          'block w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm',
          error
            ? 'border-red-400 focus:ring-red-400 dark:border-red-500/50'
            : 'border-gray-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:border-indigo-500/50',
          className
        )}
      />
      {error && <p className="text-xs font-medium text-red-500 mt-1 ml-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 ml-0.5">{hint}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, children, className = '', ...props }, ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 ml-0.5">{label}</label>
      )}
      <select
        ref={ref}
        {...props}
        className={classNames(
          'block w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 dark:text-slate-200 transition-all duration-200 shadow-sm',
          error 
            ? 'border-red-400 focus:ring-red-400 dark:border-red-500/50' 
            : 'border-gray-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:border-indigo-500/50',
          className
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs font-medium text-red-500 mt-1 ml-0.5">{error}</p>}
    </div>
  );
});```

### File: src/components/ui/Modal.jsx
```jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { classNames } from '@/utils/helpers';

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, children, size = 'md', className = '' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose} />
      <div className={classNames(
        'relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col border border-gray-100 dark:border-slate-800 animate-slide-up',
        widths[size], className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none">{title}</h2>
          <button 
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
}```

### File: src/components/ui/Skeleton.jsx
```jsx
import { classNames } from '@/utils/helpers';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={classNames('animate-pulse bg-gray-200 rounded-lg', className)}
      {...props}
    />
  );
}

export function DocumentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
      <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-48 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-3 w-16 rounded hidden lg:block" />
      <Skeleton className="h-7 w-16 rounded-lg" />
    </div>
  );
}

export function ContactCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-44 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 flex-1 rounded-lg" />
        <Skeleton className="h-7 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-10 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}```

### File: src/components/ui/Spinner.jsx
```jsx
import { classNames } from '@/utils/helpers';

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export function Spinner({ size = 'md', className = '' }) {
  return (
    <svg
      className={classNames('animate-spin text-indigo-600', sizes[size], className)}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}```

### File: src/components/ui/Toast.jsx
```jsx
```

### File: src/context/AuthContext.jsx
```jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    saveSession(res.data.user, res.data.token);
    toast.success('Welcome to Signflow!');
    return res;
  }, [saveSession]);

  const login = useCallback(async (data) => {
    const res = await authApi.login(data);
    saveSession(res.data.user, res.data.token);
    toast.success(`Welcome back, ${res.data.user.name}!`);
    return res;
  }, [saveSession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const res = await authApi.googleRedirect();
    window.location.href = res.data.redirect_url;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, loginWithGoogle, saveSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}```

### File: src/context/ThemeContext.jsx
```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = 
      theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (theme !== 'system') {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
  }, [theme]);

  // Listen for system theme changes if set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### File: src/hooks/useAuth.js
```javascript
// Re-export from AuthContext for consistent import paths
// Usage: import { useAuth } from '@/hooks/useAuth'
export { useAuth } from '@/context/AuthContext';```

### File: src/hooks/useCompanies.js
```javascript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/api/company.api';
import toast from 'react-hot-toast';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn:  () => companyApi.list({ per_page: 50 }),
  });
}

export function useCompany(id) {
  return useQuery({
    queryKey: ['company', id],
    queryFn:  () => companyApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => companyApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to create company.'),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => companyApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to update company.'),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted.');
    },
  });
}

export function useUploadCompanyLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => companyApi.uploadLogo(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Logo updated.');
    },
    onError: () => toast.error('Logo upload failed.'),
  });
}

export function useUploadCompanySeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => companyApi.uploadSeal(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Seal updated.');
    },
    onError: () => toast.error('Seal upload failed.'),
  });
}```

### File: src/hooks/useContacts.js
```javascript
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactApi } from '@/api/contact.api';
import toast from 'react-hot-toast';

export function useContacts(params = {}) {
  return useQuery({
    queryKey:        ['contacts', params],
    queryFn:         () => contactApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: ['contact-stats'],
    queryFn:  contactApi.stats,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => contactApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success('Contact added.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to add contact.'),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => contactApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to update contact.'),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => contactApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success('Contact deleted.');
    },
  });
}

export function useBulkDeleteContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => contactApi.bulkDelete(ids),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success(`${res.data.deleted_count} contact(s) deleted.`);
    },
  });
}```

### File: src/hooks/useDocuments.js
```javascript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import toast from 'react-hot-toast';

export function useDocuments(params = {}) {
  return useQuery({
    queryKey:        ['documents', params],
    queryFn:         () => documentApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDocument(id) {
  return useQuery({
    queryKey:    ['document', id],
    queryFn:     () => documentApi.get(id),
    enabled:     !!id,
    refetchInterval: 30_000, // live status updates
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['document-stats'],
    queryFn:  documentApi.stats,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, file }) => documentApi.create(data, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['document-stats'] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to create document.'),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => documentApi.delete(id),
    onSuccess: () => {
      // In useDeleteDocument, useCancelDocument, useAddSigner, useAddField:
qc.invalidateQueries({ queryKey: ['document', String(id)] });
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['document-stats'] });
      toast.success('Document deleted.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to delete.'),
  });
}
export function useSendDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => documentApi.send(id),
        onSuccess: (_, id) => {
            // id from mutate() is whatever was passed — could be number or string
            // queryKey uses ['document', id] where id comes from useParams() as string
            qc.invalidateQueries({ queryKey: ['document', String(id)] });
            qc.invalidateQueries({ queryKey: ['documents'] });
            qc.invalidateQueries({ queryKey: ['document-stats'] });
            toast.success('Document sent to signers!');
        },
        onError: (err) =>
            toast.error(err.response?.data?.error?.message || 'Failed to send.'),
    });
}

export function useCancelDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => documentApi.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['document', String(id)] });
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document cancelled.');
    },
  });
}

export function useAddSigner(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => documentApi.addSigner(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', String(id)] });
      toast.success('Signer added.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to add signer.'),
  });
}

export function useAddField(documentId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => documentApi.addField(documentId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document', String(documentId)] }),
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to add field.'),
  });
}```

### File: src/index.css
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *, *::before, *::after { 
    box-sizing: border-box;
    @apply transition-colors duration-300;
  }

  body {
    @apply font-sans text-gray-900 dark:text-slate-200 antialiased;
    background-color: #f9fafb;
  }

  .dark body {
    background-color: #020617;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-slate-800 rounded-full; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-slate-700; }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
}```

### File: src/layouts/AuthLayout.jsx
```jsx
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-400 dark:bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-400 dark:bg-purple-600 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-2xl leading-none">S</span>
            </div>
            <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Signflow</span>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Digital signatures made simple and secure.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900/80 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-800 p-8 backdrop-blur-xl">
          <Outlet />
        </div>
        
        <p className="text-center mt-8 text-xs text-gray-400 dark:text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Signflow Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
}```

### File: src/layouts/DashboardLayout.jsx
```jsx
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { getInitials } from '@/utils/helpers';
import { ProfileModal } from '@/components/shared/ProfileModal';

const navItems = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/dashboard/documents',    icon: FileText,         label: 'Documents'  },
  { to: '/dashboard/contacts',     icon: Users,            label: 'Contacts'   },
  { to: '/dashboard/companies',    icon: Building2,        label: 'Companies'  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <button
      onClick={cycleTheme}
      className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90"
      title={`Theme: ${theme}`}
    >
      <Icon size={18} className="animate-fade-in" />
    </button>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition-all duration-500 ${mobile ? 'w-72' : 'w-72'}`}>
      {/* Logo */}
      <div className="flex items-center gap-4 px-8 py-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-black text-xl">S</span>
        </div>
        <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Signflow</span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-4 text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm shadow-indigo-500/5'
                  : 'text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon size={20} className="transition-transform group-hover:scale-110" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-6 py-6 border-t border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setProfileOpen(true)}
            className="w-12 h-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[1.25rem] flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-sm flex-shrink-0 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm group"
            title="Edit profile"
          >
            <span className="group-hover:scale-110 transition-transform">{getInitials(user?.name)}</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight tracking-tight">{user?.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate mt-1 font-bold uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
          </div>
          <div className="flex flex-col gap-1">
            <ThemeToggle />
            <button onClick={handleLogout} title="Logout"
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all active:scale-90">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50 animate-slide-right">
            <Sidebar mobile />
          </div>
        </div>
      )}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 transition-colors duration-500">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <Menu size={24} />
          </button>
          <span className="font-black text-xl text-gray-900 dark:text-white tracking-tighter">Signflow</span>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          <div className="min-h-full animate-fade-in pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
```

### File: src/layouts/PublicLayout.jsx
```jsx
import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}```

### File: src/main.jsx
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { fontSize: '14px', maxWidth: '380px' },
                success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);```

### File: src/pages/auth/GoogleCallbackPage.jsx
```jsx
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const [searchParams]    = useSearchParams();
  const { saveSession }   = useAuth();
  const navigate          = useNavigate();
  const handledRef        = useRef(false); // prevent double-call in StrictMode

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      toast.error('Google sign-in was cancelled or failed.');
      navigate('/login', { replace: true });
      return;
    }

    // Exchange code for token via Laravel backend
    import('@/api/auth.api').then(({ authApi }) => {
      authApi.googleCallback(code)
        .then(res => {
          saveSession(res.data.user, res.data.token);
          toast.success(`Welcome, ${res.data.user.name}!`);
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          toast.error('Google authentication failed. Please try again.');
          navigate('/login', { replace: true });
        });
    });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">Completing Google sign-in…</p>
    </div>
  );
}```

### File: src/pages/auth/LoginPage.jsx
```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Login failed. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 font-medium">Please enter your details to sign in.</p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={loginWithGoogle}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98]"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" size="xs" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {serverError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={14} />
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full rounded-xl shadow-lg shadow-indigo-500/20" loading={isSubmitting} size="lg">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-slate-500 font-medium">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}```

### File: src/pages/auth/RegisterPage.jsx
```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';

const schema = z.object({
  name:                 z.string().min(2, 'Name must be at least 2 characters'),
  email:                z.string().email('Enter a valid email'),
  password:             z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

export default function RegisterPage() {
  const { register: signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState({});

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerErrors({});
    try {
      await signup(data);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.error?.errors || {};
      setServerErrors(errs);
    }
  };

  const fieldError = (field) =>
    errors[field]?.message || serverErrors[field]?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 font-medium">Join Signflow and start signing today.</p>
      </div>

      <button
        onClick={loginWithGoogle}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.98]"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        Sign up with Google
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" placeholder="John Doe" error={fieldError('name')} {...register('name')} />
        <Input label="Email Address" type="email" placeholder="you@example.com" error={fieldError('email')} {...register('email')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Password" type="password" placeholder="••••••••" error={fieldError('password')} {...register('password')} />
          <Input label="Confirm" type="password" placeholder="••••••••" error={fieldError('password_confirmation')} {...register('password_confirmation')} />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full rounded-xl shadow-lg shadow-indigo-500/20" loading={isSubmitting} size="lg">
            Create Free Account
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-slate-500 font-medium">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}```

### File: src/pages/companies/CompaniesPage.jsx
```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { companyApi } from '@/api/company.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Building2, Plus, Edit3, Trash2, Globe, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Info', 'Contact', 'Address', 'Branding'];

function CompanyForm({ company, onSuccess, onClose }) {
  const [tab, setTab] = useState('Info');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: company ? {
      name: company.info?.name, registration_number: company.info?.registration_number,
      pan_number: company.info?.pan_number, industry: company.info?.industry,
      established_date: company.info?.established_date,
      phone: company.contact?.phone, email: company.contact?.email, website: company.contact?.website,
      street_address: company.address?.street_address, city: company.address?.city,
      district: company.address?.district, province: company.address?.province,
      country: company.address?.country,
    } : { country: 'Nepal' },
  });

  const save = async (data) => {
    try {
      if (company) await companyApi.update(company.id, data);
      else         await companyApi.create(data);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save company.');
    }
  };

  return (
    <form onSubmit={handleSubmit(save)} className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 -mx-6 px-6 mb-4">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === 'Info' && (
        <div className="space-y-4">
          <Input label="Company Name *" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Registration Number" {...register('registration_number')} />
            <Input label="PAN Number" {...register('pan_number')} />
            <Input label="Industry" placeholder="Technology" {...register('industry')} />
            <Input label="Established Date" type="date" {...register('established_date')} />
          </div>
        </div>
      )}

      {tab === 'Contact' && (
        <div className="space-y-4">
          <Input label="Phone" placeholder="+977-1-..." {...register('phone')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Website" placeholder="https://..." {...register('website')} />
        </div>
      )}

      {tab === 'Address' && (
        <div className="space-y-4">
          <Input label="Street Address" {...register('street_address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...register('city')} />
            <Input label="District" {...register('district')} />
            <Input label="Province" {...register('province')} />
            <Input label="Country" {...register('country')} />
          </div>
        </div>
      )}

      {tab === 'Branding' && (
        <div className="space-y-4">
          {company && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Company Logo</p>
                <div className="flex items-center gap-3">
                  {company.branding?.logo_url && (
                    <img src={company.branding.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border" />
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files[0];
                        if (!f) return;
                        try { await companyApi.uploadLogo(company.id, f); toast.success('Logo updated.'); onSuccess(); }
                        catch { toast.error('Logo upload failed.'); }
                      }} />
                    <span className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                      Upload Logo
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Company Seal</p>
                <div className="flex items-center gap-3">
                  {company.branding?.seal_url && (
                    <img src={company.branding.seal_url} alt="Seal" className="w-16 h-16 object-contain rounded-lg border" />
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files[0];
                        if (!f) return;
                        try { await companyApi.uploadSeal(company.id, f); toast.success('Seal updated.'); onSuccess(); }
                        catch { toast.error('Seal upload failed.'); }
                      }} />
                    <span className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                      Upload Seal
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}
          {!company && <p className="text-sm text-gray-500">Save the company first, then upload logo and seal.</p>}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          {company ? 'Save Changes' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
}

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal]     = useState(null);
  const [deleteTarget, setDel] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn:  () => companyApi.list({ per_page: 50 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company profile removed.');
      setDel(null);
    },
  });

  const companies = data?.data || [];

  const onFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toast.success(modal?.id ? 'Company updated.' : 'Company created.');
    setModal(null);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
      <PageHeader
        title="Business Profiles"
        description="Manage your business profiles, branding assets, and corporate signature settings."
        action={<Button size="lg" className="rounded-2xl shadow-xl shadow-indigo-500/20 px-8" onClick={() => setModal('create')}><Plus size={20} />Add Company</Button>}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading profiles...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-800">
          <EmptyState
            icon={Building2} title="No companies yet"
            description="Register your company to enable custom branding on your signed documents and manage team workflows."
            action={<Button variant="subtle" className="rounded-2xl px-10" onClick={() => setModal('create')}><Plus size={16} />Create Company Profile</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {companies.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative">
              <div className="flex items-start gap-5 mb-8">
                {c.branding?.logo_url ? (
                  <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 p-2 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <img src={c.branding.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-indigo-500">
                    <Building2 size={32} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 dark:text-white text-xl truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">{c.info?.name}</p>
                  {c.info?.industry && <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5">{c.info.industry}</p>}
                  {c.user_role && (
                    <Badge size="xs" variant="indigo" className="mt-3 px-3 py-0.5">
                      {c.user_role}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-8 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-gray-50 dark:border-slate-800/50">
                {c.contact?.phone && (
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-slate-400">
                    <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm"><Phone size={14} className="text-gray-400" /></div>
                    {c.contact.phone}
                  </div>
                )}
                {c.contact?.email && (
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-slate-400">
                    <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm"><Mail size={14} className="text-gray-400" /></div>
                    {c.contact.email}
                  </div>
                )}
                {c.contact?.website && (
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-slate-400">
                    <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm"><Globe size={14} className="text-gray-400" /></div>
                    <span className="truncate">{c.contact.website.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}
                {c.address?.city && (
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest text-center">
                      {[c.address.city, c.address.province, c.address.country].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-6 border-t border-gray-50 dark:border-slate-800">
                <button onClick={() => setModal(c)}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all">
                  <Edit3 size={14} />Settings
                </button>
                <button onClick={() => setDel(c)}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-slate-800 transition-all">
                  <Trash2 size={14} />Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

     <Modal
    open={!!modal}
    onClose={() => setModal(null)}
    title={modal?.id ? 'Company Settings' : 'Register New Company'}
    size="lg"
>
    <CompanyForm
        key={modal?.id ?? 'new'}    
        company={modal?.id ? modal : null}
        onSuccess={onFormSuccess}
        onClose={() => setModal(null)}
    />
</Modal>
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDel(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Remove Company Profile?"
        message={`This will permanently remove "${deleteTarget?.info?.name}" and all associated branding assets. This action is not reversible.`}
        confirmLabel="Remove Profile"
      />
    </div>
  );
}```

### File: src/pages/contacts/ContactsPage.jsx
```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { contactApi } from '@/api/contact.api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SIGN_ROLES } from '@/utils/constants';
import { getInitials, classNames } from '@/utils/helpers';
import { UserPlus, Users, Search, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { keepPreviousData } from '@tanstack/react-query';


function ContactForm({ contact, onSuccess, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: contact || { sign_role: 'signer' },
  });

  const save = async (data) => {
    try {
      if (contact) await contactApi.update(contact.id, data);
      else         await contactApi.create(data);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save contact.');
    }
  };

  return (
    <form onSubmit={handleSubmit(save)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Full Name *" placeholder="John Doe"
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Name is required' })} />
        </div>
        <Input label="Email" type="email" placeholder="john@example.com" {...register('email')} />
        <Input label="Phone" placeholder="+977-98..." {...register('phone')} />
        <Input label="Company" placeholder="TechCorp Nepal" {...register('company_name')} />
        <Input label="Designation" placeholder="CEO" {...register('designation')} />
        <Input label="PAN Number" placeholder="600123456" {...register('pan_number')} />
        <Select label="Sign Role *" {...register('sign_role', { required: true })}>
          {SIGN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          {contact ? 'Save Changes' : 'Add Contact'}
        </Button>
      </div>
    </form>
  );
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [modal, setModal]       = useState(null); // null | 'create' | contact
  const [deleteTarget, setDelete] = useState(null);
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('');
  const [page, setPage]         = useState(1);

  const { data: statsData } = useQuery({
    queryKey: ['contact-stats'],
    queryFn:  contactApi.stats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, role, page }],
    queryFn:  () => contactApi.list({ search, role, page, per_page: 12 }),
    placeholderData: keepPreviousData,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => contactApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success('Contact deleted.');
      setDelete(null);
    },
  });

  const onFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['contact-stats'] });
    toast.success(modal?.id ? 'Contact updated.' : 'Contact added.');
    setModal(null);
  };

  const stats = statsData?.data?.stats || {};
  const contacts = data?.data || [];
  const meta = data?.meta || {};

  const roleColor = (role) => SIGN_ROLES.find(r => r.value === role)?.color || '';

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
      <PageHeader
        title="Contacts"
        description="Maintain a directory of your frequent signers and partners."
        action={
          <Button size="lg" className="rounded-2xl shadow-xl shadow-indigo-500/20 px-8" onClick={() => setModal('create')}>
            <UserPlus size={18} />Add Contact
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {SIGN_ROLES.map(r => (
          <div key={r.value} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-8 shadow-sm flex flex-col items-center justify-center group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 group-hover:scale-110 transition-transform">{stats[r.value] ?? 0}</p>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">{r.label}s</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search contacts by name or email…"
            className="w-full pl-11 pr-4 py-3.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 text-gray-900 dark:text-slate-200 shadow-sm transition-all"
          />
        </div>
        <select
          value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-slate-800 rounded-[1.25rem] px-6 py-3.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all appearance-none cursor-pointer"
        >
          <option value="">All Signing Roles</option>
          {SIGN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading contacts...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-800">
          <EmptyState
            icon={Users}
            title="No contacts found"
            description={search || role ? 'Try adjusting your search criteria.' : 'Add your first contact to streamline your signing workflow.'}
            action={!search && !role && (
              <Button variant="subtle" className="rounded-2xl px-8" onClick={() => setModal('create')}><UserPlus size={16} />Add Contact</Button>
            )}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {contacts.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-2xl flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm mb-6">
                  {c.initials}
                </div>
                <div className="w-full min-w-0">
                  <Badge size="xs" className={classNames('px-3 mb-3', roleColor(c.sign_role))}>{c.role_label}</Badge>
                  <p className="font-black text-gray-900 dark:text-white text-lg truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight mb-1">{c.full_name}</p>
                  {c.email && <p className="text-sm text-gray-400 dark:text-slate-500 truncate font-medium">{c.email}</p>}
                  {c.company_name && <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-2 font-black uppercase tracking-widest truncate">{c.company_name}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-8 pt-6 border-t border-gray-50 dark:border-slate-800">
                <button
                  onClick={() => setModal(c)}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Edit3 size={14} />Edit
                </button>
                <button
                  onClick={() => setDelete(c)}
                  className="flex-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Trash2 size={14} />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between px-10 py-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Page {meta.current_page} of {meta.last_page} · {meta.total} Total</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="rounded-xl px-6" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" className="rounded-xl px-6" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Contact' : 'Add Contact'} size="lg">
        <ContactForm contact={modal?.id ? modal : null} onSuccess={onFormSuccess} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDelete(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Delete Contact?"
        message={`Are you sure you want to remove "${deleteTarget?.full_name}"? This will remove them from your directory but won't affect past documents.`}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}```

### File: src/pages/dashboard/DashboardPage.jsx
```jsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { documentApi } from '@/api/document.api';
import { useAuth } from '@/hooks/useAuth';
import { Badge }  from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCardSkeleton, DocumentRowSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, classNames } from '@/utils/helpers';
import { FileText, FilePlus, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';

function StatCard({ label, value, icon: Icon, colorClass, loading }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-8 flex items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1.5 tracking-tight">{value ?? 0}</p>
        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Stats
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn:  documentApi.stats,
  });

  // Recent docs
  const { data: docsRes, isLoading: docsLoading } = useQuery({
    queryKey: ['recent-documents'],
    queryFn:  () => documentApi.list({ per_page: 6, sort_by: 'created_at', sort_dir: 'desc' }),
  });

  const stats    = statsRes?.data?.stats   || {};
  const recentDocs = docsRes?.data         || [];

  const statCards = [
    { label: 'Total Docs',  value: stats.total,       icon: FileText,    colorClass: 'bg-indigo-500'   },
    { label: 'In Progress', value: stats.in_progress, icon: Clock,       colorClass: 'bg-amber-500' },
    { label: 'Completed',   value: stats.completed,   icon: CheckCircle, colorClass: 'bg-emerald-500'  },
    { label: 'Drafts',      value: stats.draft,       icon: Send,        colorClass: 'bg-slate-500' },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        description="Here's a snapshot of your document activities and signature requests."
        action={
          <Link to="/dashboard/documents">
            <Button size="lg" className="rounded-2xl shadow-xl shadow-indigo-500/20 px-8"><FilePlus size={18} />New Document</Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Recent Documents */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20">
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recent Documents</h2>
          <Link to="/dashboard/documents" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl transition-colors">
            View all documents
          </Link>
        </div>

        {docsLoading ? (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {[...Array(4)].map((_, i) => <DocumentRowSkeleton key={i} />)}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 transition-transform hover:scale-110">
              <FileText size={48} className="text-gray-200 dark:text-slate-700" />
            </div>
            <p className="text-gray-900 dark:text-white font-black text-xl tracking-tight">No documents yet</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2 mb-10 max-w-xs mx-auto font-medium">Upload your first document to start the automated signing process</p>
            <Link to="/dashboard/documents">
              <Button variant="subtle" className="rounded-2xl px-10"><FilePlus size={16} />Upload Document</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {recentDocs.map(doc => (
              <Link
                key={doc.id}
                to={`/dashboard/documents/${doc.id}`}
                className="flex items-center gap-6 px-10 py-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-indigo-500">
                  <FileText size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">{doc.title}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-black uppercase tracking-widest">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  {doc.counts?.total_signers > 0 && (
                    <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 hidden sm:block uppercase tracking-widest">
                      {doc.counts.signed_count}/{doc.counts.total_signers} signed
                    </span>
                  )}
                  <Badge size="xs" className={classNames('px-3', STATUS_COLORS[doc.status])}>
                    {STATUS_LABELS[doc.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}```

### File: src/pages/documents/DocumentDetailPage.jsx
```jsx
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { AuditLogTimeline as AuditLog } from '@/components/document/AuditLog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate, getInitials, classNames } from '@/utils/helpers';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { 
  FileText, Edit3, XCircle, Download, CheckCircle, 
  History, Clock, User, Building, Calendar, DownloadCloud, Eye, Trash2, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelModal, setCancelModal] = useState(false);
  const [deleteFileModal, setDeleteFileModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn:  () => documentApi.get(id),
  });

  const { data: logData, isLoading: logsLoading } = useQuery({
    queryKey: ['document-logs', id],
    queryFn:  () => documentApi.auditLog(id),
  });

  const cancelMut = useMutation({
    mutationFn: () => documentApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Document cancelled.');
      setCancelModal(false);
    },
  });

  const deleteFileMut = useMutation({
    mutationFn: () => documentApi.deleteOriginalFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success('Original file deleted.');
      setDeleteFileModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete file.');
    }
  });

  const doc = data?.data?.document;
  const logs = logData?.data?.logs || logData?.data || [];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Loading document...</p>
    </div>
  );
  
  if (!doc) return (
    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-200 dark:border-slate-800 my-20 mx-auto max-w-lg shadow-xl shadow-indigo-500/5">
      <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform hover:scale-110">
        <FileText size={48} className="text-gray-200 dark:text-slate-700" />
      </div>
      <p className="text-gray-900 dark:text-white font-black text-2xl tracking-tight">Document not found</p>
      <p className="text-gray-500 dark:text-slate-400 text-sm mt-3 font-medium px-8">This document may have been deleted or moved to another workspace.</p>
      <Button variant="subtle" className="mt-10 rounded-2xl px-8" onClick={() => navigate('/dashboard/documents')}>Back to Documents</Button>
    </div>
  );

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <Badge size="sm" className={classNames('px-4 py-1', STATUS_COLORS[doc.status])}>{STATUS_LABELS[doc.status]}</Badge>
            <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.2em]">Ref: {doc.id}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white truncate tracking-tight mb-4">{doc.title}</h1>
          <p className="text-base text-gray-500 dark:text-slate-400 font-medium max-w-3xl leading-relaxed">
            {doc.description || 'No additional description provided for this document.'}
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {doc.is_editable && (
            <Link to={`/dashboard/documents/${id}/editor`}>
              <Button size="lg" className="rounded-2xl shadow-xl shadow-indigo-500/20 px-10"><Edit3 size={20} />Editor</Button>
            </Link>
          )}
          {doc.status === 'in_progress' && (
            <Button variant="danger" size="lg" className="rounded-2xl shadow-xl shadow-red-500/10 px-10" onClick={() => setCancelModal(true)}><XCircle size={20} />Cancel</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Signers & Assets */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Signers Section */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/20">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-indigo-500" />
                <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Signing Workflow</h2>
              </div>
              <Badge size="xs" variant="gray" className="font-black px-3">{doc.signing_mode} mode</Badge>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {doc.signers?.map(s => (
                <div key={s.id} className="px-10 py-8 flex items-center gap-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-base flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 dark:text-white truncate tracking-tight">{s.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-1 font-medium italic">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.signed_at ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="emerald" size="xs" className="px-3">Verified Signed</Badge>
                        <span className="text-[10px] text-gray-300 dark:text-slate-600 font-black uppercase tracking-widest">{formatDate(s.signed_at)}</span>
                      </div>
                    ) : (
                      <Badge variant="gray" size="xs" className="px-3">Waiting Action</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Asset Management Section */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm p-10">
            <div className="flex items-center gap-3 mb-10">
              <DownloadCloud size={18} className="text-indigo-500" />
              <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Document Assets</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original File */}
              <div className="p-8 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl border border-gray-100 dark:border-slate-800/50 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center border border-gray-100 dark:border-slate-700 text-gray-300 group-hover:text-indigo-500 transition-colors mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Original Draft</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">{doc.file?.size_formatted || 'N/A'}</p>
                
                {doc.file?.original_url ? (
                  <div className="flex gap-2 w-full mt-auto">
                    <a href={doc.file.original_url} target="_blank" rel="noreferrer" className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full rounded-xl"><Download size={14} />Download</Button>
                    </a>
                    {['draft', 'pending', 'cancelled', 'expired'].includes(doc.status) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-all px-3"
                        onClick={() => setDeleteFileModal(true)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="w-full py-2 px-4 bg-gray-100 dark:bg-slate-900/50 rounded-xl">
                    <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest">Asset Removed</span>
                  </div>
                )}
              </div>

              {/* Signed File (Conditional) */}
              <div className={classNames(
                'p-8 rounded-3xl border transition-all flex flex-col items-center text-center group',
                doc.status === 'completed' && doc.file?.signed_url
                  ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-800/30 hover:shadow-xl hover:shadow-emerald-500/5'
                  : 'bg-gray-50/20 dark:bg-slate-800/10 border-dashed border-gray-200 dark:border-slate-800 opacity-50'
              )}>
                <div className={classNames(
                  'w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm transition-all',
                  doc.status === 'completed' ? 'bg-white dark:bg-slate-900 text-emerald-500 group-hover:scale-110' : 'bg-gray-100 dark:bg-slate-800 text-gray-300'
                )}>
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Final Version</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">
                  {doc.status === 'completed' ? 'Verified & Sealed' : 'Pending Completion'}
                </p>

                {doc.status === 'completed' && doc.file?.signed_url && (
                  <a href={doc.file.signed_url} target="_blank" rel="noreferrer" className="w-full mt-auto">
                    <Button variant="primary" size="sm" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 border-none"><Download size={14} />Download Final</Button>
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* History Section (Moved here) */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm p-10 flex flex-col min-h-[500px]">
            <div className="flex items-center gap-3 mb-10">
              <History size={16} className="text-indigo-500" />
              <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Activity Log</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-slate-800">
              {logsLoading ? (
                <div className="flex justify-center py-10"><Spinner size="sm" /></div>
              ) : (
                <AuditLog logs={logs} />
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Information */}
        <div className="lg:col-span-4 space-y-10">
          {/* Metadata Card */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm p-10">
            <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Metadata</h2>
            <div className="space-y-6">
              {[
                { label: 'Created On', value: formatDate(doc.created_at), icon: Calendar },
                { label: 'Owner',      value: doc.user?.name,           icon: User },
                { label: 'Company',    value: doc.company?.name || 'Personal', icon: Building, isIndigo: !!doc.company },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.15em]">
                  <div className="flex items-center gap-3 text-gray-300 dark:text-slate-600">
                    <item.icon size={14} className="text-indigo-400/50" /> {item.label}
                  </div>
                  <span className={classNames(item.isIndigo ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-slate-400')}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={cancelModal} onClose={() => setCancelModal(false)}
        onConfirm={() => cancelMut.mutate()}
        loading={cancelMut.isPending}
        title="Cancel Signing Request?"
        message="This will invalidate all current signing links and prevent further actions on this document. This cannot be undone."
        confirmLabel="Cancel Request"
      />

      <ConfirmDialog
        open={deleteFileModal} onClose={() => setDeleteFileModal(false)}
        onConfirm={() => deleteFileMut.mutate()}
        loading={deleteFileMut.isPending}
        title="Permanently Delete Original?"
        message="You are about to remove the original PDF draft from our secure storage. Ensure you have a local backup if needed. This action is permanent."
        confirmLabel="Delete Asset"
      />
    </div>
  );
}
```

### File: src/pages/documents/DocumentEditorPage.jsx
```jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Draggable from 'react-draggable';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { documentApi } from '@/api/document.api';
import { contactApi } from '@/api/contact.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { SIGNATURE_FIELD } from '@/utils/constants';
import { getInitials, classNames } from '@/utils/helpers';
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  PenLine,
  FileText,
  Layers,
  LayoutGrid,
  Trash2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DEFAULT_PAGE_W = 794;
const DEFAULT_PAGE_H = 1123;
const PAGE_GAP = 8; // visual gap between pages in the canvas (pixels)
const SCREEN_DPI = 96;
const PDF_POINTS_INCH = 72;

const SIGNER_COLORS = [
  { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-800', dot: 'bg-indigo-600 dark:bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', dot: 'bg-emerald-600 dark:bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800', dot: 'bg-purple-600 dark:bg-purple-500', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800', dot: 'bg-orange-600 dark:bg-orange-500', border: 'border-orange-200 dark:border-orange-800' },
  { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', ring: 'ring-sky-200 dark:ring-sky-800', dot: 'bg-sky-600 dark:bg-sky-500', border: 'border-sky-200 dark:border-sky-800' },
  { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-400', ring: 'ring-pink-200 dark:ring-pink-800', dot: 'bg-pink-600 dark:bg-pink-500', border: 'border-pink-200 dark:border-pink-800' },
];

// ─── FieldOverlay ──────────────────────────────────────────────────────────────
function FieldOverlay({ field, pageRelX, pageRelY, pageW, pageH, signerName, signerColor, onRemove, onMoved }) {
  const nodeRef = useRef(null);
  const [pos, setPos] = useState({ x: pageRelX, y: pageRelY });
  const w = field.position?.width ?? field.width ?? SIGNATURE_FIELD.width;
  const h = field.position?.height ?? field.height ?? SIGNATURE_FIELD.height;

  useEffect(() => {
    setPos({ x: pageRelX, y: pageRelY });
  }, [pageRelX, pageRelY]);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={pos}
      bounds="parent"
      onStop={(_, d) => {
        const newX = Math.round(d.x);
        const newY = Math.round(d.y);
        setPos({ x: newX, y: newY });
        onMoved(field.id, newX, newY);
      }}
    >
      <div
        ref={nodeRef}
        className="absolute group cursor-move select-none"
        style={{ width: w, zIndex: 20 }}
      >
        <div
          className={classNames(
            'w-full flex items-center justify-center gap-1.5 text-xs font-black rounded-xl border-2 transition-all shadow-lg hover:scale-105 active:scale-95',
            signerColor.bg, signerColor.text
          )}
          style={{
            height: h,
            borderColor: 'currentColor',
          }}
        >
          <PenLine size={13} className="flex-shrink-0" />
          <span className="truncate max-w-[100px] uppercase tracking-tighter">Sign — P{field.page}</span>
        </div>
        <div className={classNames('text-center truncate px-2 text-[10px] font-black leading-tight mt-1.5 uppercase tracking-wide', signerColor.text)}>
          {signerName}
        </div>
        <button
          onMouseDown={e => { e.stopPropagation(); onRemove(field.id); }}
          className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow-xl z-30 hover:bg-red-600 transition-all hover:scale-110 active:scale-90"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
    </Draggable>
  );
}

// ─── PageSelector ──────────────────────────────────────────────────────────────
function PageSelector({ signer, signerColor, documentId, totalPages, existingFields, pageW, pageH, onApplied }) {
  const [mode, setMode] = useState('custom');
  const [singlePage, setSinglePage] = useState(1);
  const [customPages, setCustomPages] = useState(new Set([1]));
  const [applying, setApplying] = useState(false);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const existingCount = existingFields.length;

  const toggleCustom = (p) => {
    setCustomPages(prev => {
      const next = new Set(prev);
      if (next.has(p)) { if (next.size > 1) next.delete(p); }
      else next.add(p);
      return next;
    });
  };

  const selectedPages = mode === 'single' ? [singlePage]
    : mode === 'all' ? pages
    : [...customPages].sort((a, b) => a - b);

  const handleApply = async () => {
    if (!selectedPages.length) {
      toast('Please select at least one page.', { icon: 'ℹ️' });
      return;
    }
    setApplying(true);
    try {
      const fieldsToCreate = selectedPages.map(page => {
        const pos_x = Math.round((pageW - SIGNATURE_FIELD.width) / 2);
        const relPosY = pageH - SIGNATURE_FIELD.height - 100;

        return {
          page,
          pos_x,
          pos_y: relPosY,
          width: SIGNATURE_FIELD.width,
          height: SIGNATURE_FIELD.height,
          document_signer_id: signer.id,
          required: true,
        };
      });

      if (fieldsToCreate.length === 1) {
        await documentApi.addField(documentId, fieldsToCreate[0]);
      } else {
        await documentApi.bulkAddFields(documentId, fieldsToCreate);
      }

      toast.success(`${selectedPages.length} field${selectedPages.length > 1 ? 's' : ''} added for ${signer.name}.`);
      onApplied();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to apply fields.');
    } finally {
      setApplying(false);
    }
  };

  const modeTabs = [
    { key: 'single', label: 'Single', icon: FileText },
    { key: 'all', label: 'All pages', icon: Layers },
    { key: 'custom', label: 'Custom', icon: LayoutGrid },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 border-t border-gray-100 dark:border-slate-800">
      <div className="p-5 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Placement Strategy</p>

        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
          {modeTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={classNames(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all',
                mode === key
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              )}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {mode === 'single' && (
          <div className="grid grid-cols-6 gap-1.5">
            {pages.map(p => (
              <button
                key={p} onClick={() => setSinglePage(p)}
                className={classNames(
                  'rounded-lg text-xs font-bold transition-all h-8',
                  singlePage === p
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {mode === 'custom' && (
          <div className="grid grid-cols-6 gap-1.5">
            {pages.map(p => (
              <button
                key={p} onClick={() => toggleCustom(p)}
                className={classNames(
                  'rounded-lg text-xs font-bold transition-all h-8 border-2',
                  customPages.has(p)
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-700 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-100 dark:border-slate-700 hover:border-indigo-200'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleApply}
          disabled={applying || selectedPages.length === 0}
          className="w-full rounded-xl shadow-lg shadow-indigo-500/10 py-3"
          size="sm"
        >
          {applying ? <Spinner size="xs" /> : <Plus size={14} />}
          {selectedPages.length === 0 ? 'Select Pages' : `Place ${selectedPages.length} Fields`}
        </Button>
      </div>
    </div>
  );
}

// ─── SignerCard ────────────────────────────────────────────────────────────────
function SignerCard({ signer, signerIndex, signingMode, documentId, totalPages, signerFields, pageW, pageH, onRemove, onApplied }) {
  const color = SIGNER_COLORS[signerIndex % SIGNER_COLORS.length];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={classNames(
      'rounded-2xl overflow-hidden border transition-all duration-300',
      signerFields.length > 0 
        ? 'border-indigo-200 dark:border-indigo-500/30 shadow-md shadow-indigo-500/5' 
        : 'border-gray-200 dark:border-slate-800 shadow-sm'
    )}>
      <div className={classNames('flex items-center gap-3 px-5 py-4', signerFields.length > 0 ? color.bg : 'bg-white dark:bg-slate-900')}>
        <div className={classNames('w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md', color.dot)}>
          {getInitials(signer.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {signingMode === 'sequential' && (
              <span className="text-[10px] font-black bg-white dark:bg-slate-800 text-gray-400 border border-gray-100 dark:border-slate-700 px-1.5 py-0.5 rounded-md shadow-xs">
                #{signer.signing_order}
              </span>
            )}
            <p className={classNames('text-sm font-bold truncate leading-none', signerFields.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white')}>
              {signer.name}
            </p>
          </div>
          <p className="text-[10px] truncate text-gray-500 dark:text-slate-500 mt-1.5 font-medium">{signer.email}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
        >
          <ChevronDown size={14} className={classNames('transition-transform duration-300', expanded && 'rotate-180')} />
        </button>
        <button
          onClick={() => onRemove(signer.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <PageSelector
          signer={signer}
          signerColor={color}
          documentId={documentId}
          totalPages={totalPages}
          existingFields={signerFields}
          pageW={pageW}
          pageH={pageH}
          onApplied={onApplied}
        />
      )}
    </div>
  );
}

// ─── AddSignerModal ────────────────────────────────────────────────────────────
function AddSignerModal({ open, onClose, documentId, onAdded }) {
  const [tab, setTab] = useState('manual');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: contactsData, isLoading: contactsLoading, isError: contactsError } = useQuery({
    queryKey: ['contacts-picker'],
    queryFn: () => contactApi.list({ per_page: 100 }),
    enabled: open && tab === 'contacts',
  });

  const reset = () => { setName(''); setEmail(''); };

  const add = async (payload) => {
    setSaving(true);
    try {
      await documentApi.addSigner(documentId, payload);
      toast.success(`${payload.name} added.`);
      onAdded(); onClose(); reset();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to add signer.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Add Signer" size="sm">
      <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-6">
        <button
          onClick={() => setTab('manual')}
          className={classNames(
            'flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
            tab === 'manual' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'
          )}
        >
          Manual
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={classNames(
            'flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
            tab === 'contacts' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'
          )}
        >
          Directory
        </button>
      </div>

      {tab === 'manual' ? (
        <div className="space-y-5">
          <Input label="Signer Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" autoFocus />
          <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
          <Button className="w-full rounded-xl py-3" loading={saving} disabled={!name.trim() || !email.trim()} onClick={() => add({ name: name.trim(), email: email.trim() })}>
            <Plus size={14} /> Add Signer
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {contactsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : contactsError ? (
            <p className="text-xs font-bold text-red-500 text-center py-8">Failed to load directory.</p>
          ) : !contactsData?.data?.length ? (
            <div className="text-center py-12">
              <UserPlus size={32} className="mx-auto text-gray-200 dark:text-slate-800 mb-3" />
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500">Your directory is empty</p>
            </div>
          ) : (
            contactsData.data.map(c => (
              <button
                key={c.id}
                onClick={() => add({ name: c.full_name, email: c.email, contact_id: c.id })}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shadow-sm border border-gray-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{c.full_name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate mt-0.5">{c.email}</p>
                </div>
                <Plus size={14} className="text-gray-300 dark:text-slate-700 group-hover:text-indigo-500" />
              </button>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── SendPanel ─────────────────────────────────────────────────────────────────
function SendPanel({ documentId, onSent }) {
  const [result, setResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [sending, setSending] = useState(false);

  const runValidate = async () => {
    setValidating(true);
    try {
      const res = await documentApi.validate(documentId);
      setResult(res.data);
    } catch {
      toast.error('Validation failed.');
    } finally {
      setValidating(false);
    }
  };

  const runSend = async () => {
    setSending(true);
    try {
      await documentApi.send(documentId);
      toast.success('Document sent successfully!');
      onSent();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to send document.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="secondary" className="w-full rounded-xl py-3 border-gray-200 dark:border-slate-800 shadow-sm" loading={validating} onClick={runValidate}>
        <CheckCircle size={16} /> Run Validation
      </Button>
      {result && (
        <div className={classNames(
          'rounded-2xl p-5 border animate-fade-in',
          result.valid 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-400' 
            : 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-900 dark:text-red-400'
        )}>
          {result.valid ? (
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-500" />
              <p className="text-xs font-black uppercase tracking-widest leading-none">Ready to Publish</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500" />
                <p className="text-xs font-black uppercase tracking-widest leading-none">Issues Found</p>
              </div>
              <ul className="space-y-1.5 pl-8 list-disc text-[10px] font-bold opacity-80 uppercase tracking-tight">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      <Button size="lg" className="w-full rounded-xl py-4 shadow-xl shadow-indigo-500/20" disabled={!result?.valid} loading={sending} onClick={runSend}>
        <Send size={18} /> Send to Signers
      </Button>
    </div>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────────
function guessSizeLabel(w, h) {
  const near = (a, b) => Math.abs(a - b) <= 4;
  if (near(w, 794) && near(h, 1123)) return 'A4';
  if (near(w, 559) && near(h, 794)) return 'A5';
  if (near(w, 1123) && near(h, 1587)) return 'A3';
  if (near(w, 816) && near(h, 1056)) return 'Letter';
  if (near(w, 816) && near(h, 1344)) return 'Legal';
  return `${w}×${h}px`;
}

// ─── DocumentEditorPage ────────────────────────────────────────────────────────
export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [signerModal, setSignerModal] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [pageW, setPageW] = useState(DEFAULT_PAGE_W);
  const [pageH, setPageH] = useState(DEFAULT_PAGE_H);
  const [pageSizeLabel, setPageSizeLabel] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentApi.get(id),
  });

  const doc = data?.data?.document;

  useEffect(() => {
    if (!isLoading && doc && !doc.is_editable)
      navigate(`/dashboard/documents/${id}`, { replace: true });
  }, [isLoading, doc, id, navigate]);

  const onDocumentLoadSuccess = useCallback(async (pdfProxy) => {
    const { numPages } = pdfProxy;
    setTotalPages(numPages);

    try {
      const page = await pdfProxy.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale = SCREEN_DPI / PDF_POINTS_INCH;

      const detectedW = Math.round(viewport.width * scale);
      const detectedH = Math.round(viewport.height * scale);

      setPageW(detectedW);
      setPageH(detectedH);
      setPageSizeLabel(guessSizeLabel(detectedW, detectedH));
    } catch (e) {
      console.warn('Could not detect PDF page size:', e);
    }
  }, []);

  const handleFieldMoved = useCallback(async (fieldId, pageRelX, pageRelY, pageIdx) => {
    const page = pageIdx + 1;

    try {
      await documentApi.updateField(id, fieldId, { 
        pos_x: pageRelX, 
        pos_y: pageRelY,
        page
      });
      refetch();
    } catch {
      toast.error('Failed to save position.');
    }
  }, [id, refetch]);

  const handleRemoveField = useCallback(async (fieldId) => {
    try {
      await documentApi.removeField(id, fieldId);
      refetch();
      toast.success('Field removed.');
    } catch {
      toast.error('Failed to remove field.');
    }
  }, [id, refetch]);

  const handleRemoveSigner = useCallback(async (signerId) => {
    try {
      await documentApi.removeSigner(id, signerId);
      refetch();
      toast.success('Signer removed.');
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to remove signer.');
    }
  }, [id, refetch]);

  if (isLoading) return <div className="flex flex-col items-center justify-center h-screen gap-4 dark:bg-slate-950"><Spinner size="lg" /><p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Launching Editor...</p></div>;
  if (!doc) return <div className="flex items-center justify-center h-screen dark:bg-slate-950 text-gray-500 font-bold uppercase tracking-widest">Document not found.</div>;

  const signers = doc.signers || [];
  const fields = doc.fields || [];
  const fieldsBySigner = signers.reduce((acc, s) => {
    acc[s.id] = fields.filter(f => f.document_signer_id === s.id);
    return acc;
  }, {});

  const pdfUrl = doc.file?.pdf_url ?? doc.file?.original_url;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-sm z-20">
        <div className="px-8 py-8 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-900 dark:to-slate-800/50">
          <button onClick={() => navigate(`/dashboard/documents/${id}`)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mb-6 uppercase tracking-widest group">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to details
          </button>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white truncate leading-none tracking-tight" title={doc.title}>{doc.title}</h1>
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="indigo" size="xs" className="font-black uppercase tracking-tighter shadow-sm">{doc.signing_mode}</Badge>
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{doc.status_label}</span>
          </div>
        </div>

        <div className="px-8 py-4 flex items-center gap-3 border-b border-gray-50 dark:border-slate-800/50 bg-gray-50/20 dark:bg-slate-900/50">
          <FileText size={14} className="text-gray-400 dark:text-slate-600" />
          <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            {totalPages} Pages · {pageSizeLabel}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-600">Assign Signers</p>
            <button onClick={() => setSignerModal(true)} className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all">
              <UserPlus size={14} /> Add Signer
            </button>
          </div>

          {signers.length === 0 ? (
            <div className="py-12 px-6 text-center bg-gray-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-800">
              <UserPlus size={32} className="mx-auto mb-4 text-gray-200 dark:text-slate-800" />
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 max-w-[140px] mx-auto">Add at least one signer to start placing fields</p>
              <Button size="sm" variant="secondary" className="mt-6 rounded-xl" onClick={() => setSignerModal(true)}>Add Signer</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {signers.map((signer, i) => (
                <SignerCard key={signer.id} signer={signer} signerIndex={i} signingMode={doc.signing_mode} documentId={id} totalPages={totalPages} signerFields={fieldsBySigner[signer.id] || []} pageW={pageW} pageH={pageH} onRemove={handleRemoveSigner} onApplied={refetch} />
              ))}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <SendPanel documentId={id} onSent={() => { queryClient.invalidateQueries(['documents']); navigate(`/dashboard/documents/${id}`); }} />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex justify-center py-12 px-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
        <div style={{ width: pageW }} className="animate-fade-in relative z-10">
          <div className="flex items-center justify-between px-8 py-4 rounded-3xl mb-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <p className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest">DRAG FIELDS TO REPOSITION · CLICK SIGNERS TO ASSIGN</p>
            {fields.length > 0 && <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">{fields.length} Field{fields.length > 1 ? 's' : ''} Placed</span>}
          </div>

          <div className="relative group">
            {pdfUrl ? (
              <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800" style={{ height: pageH }}><Spinner size="lg" /><p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest animate-pulse">Rendering PDF...</p></div>}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <div key={i} className="relative mb-4 group/page">
                    <div className="shadow-2xl shadow-slate-300/50 dark:shadow-none transition-shadow duration-500 group-hover/page:shadow-indigo-500/10">
                      <Page pageNumber={i + 1} width={pageW} renderAnnotationLayer={false} renderTextLayer={false} className="rounded-xl overflow-hidden" />
                    </div>
                    {/* Field overlays for this page */}
                    {fields.filter(f => Number(f.page) === i + 1).map(field => {
                      const signerIdx = signers.findIndex(s => s.id === field.document_signer_id);
                      const color = SIGNER_COLORS[Math.max(0, signerIdx) % SIGNER_COLORS.length];
                      const signer = signers[signerIdx];
                      const absX = field.pos_x ?? 0;
                      const pageRelY = field.pos_y ?? 0;

                      return (
                        <div key={field.id} className="absolute inset-0 pointer-events-none z-30">
                          <div style={{ pointerEvents: 'auto', position: 'relative', width: '100%', height: '100%' }}>
                            <FieldOverlay field={field} pageRelX={absX} pageRelY={pageRelY} pageW={pageW} pageH={pageH} signerName={signer?.name ?? 'Signer'} signerColor={color} onRemove={handleRemoveField} onMoved={(fId, x, y) => handleFieldMoved(fId, x, y, i)} />
                          </div>
                        </div>
                      );
                    })}
                    {i < totalPages - 1 && (
                      <div className="absolute left-0 right-0 h-[8px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center pointer-events-none" style={{ top: pageH }}>
                        <span className="text-[8px] font-black text-gray-400 dark:text-slate-600 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-full uppercase">Page {i + 2}</span>
                      </div>
                    )}
                  </div>
                ))}
              </Document>
            ) : (
              <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800" style={{ height: pageH }}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Document Preview Available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 0.4px, transparent 0.4px)', backgroundSize: '40px 40px', opacity: 0.05 }} />
      </div>

      <AddSignerModal open={signerModal} onClose={() => setSignerModal(false)} documentId={id} onAdded={refetch} />
    </div>
  );
}
```

### File: src/pages/documents/DocumentsPage.jsx
```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import { companyApi } from '@/api/company.api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FileUpload } from '@/components/shared/FileUpload';
import { DocumentCard } from '@/components/document/DocumentCard';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { formatDate, formatFileSize, classNames } from '@/utils/helpers';
import { FilePlus, FileText, Trash2, Eye, Edit3, Search, LayoutGrid, List } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { keepPreviousData } from '@tanstack/react-query';


// ── New Document Modal ────────────────────────────────────────────────────────
function NewDocumentModal({ open, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: { title: '', signing_mode: 'sequential', description: '', expires_at: '', file: null },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => companyApi.list({ per_page: 100 }),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: ({ data, file }) => documentApi.create(data, file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded! Now add signers and place fields.');
      onClose();
      reset();
      navigate(`/dashboard/documents/${res.data.document.id}/editor`);
    },
    onError: (err) => {
      const errorData = err.response?.data;
      const fileError = errorData?.error?.errors?.file?.[0];
      toast.error(fileError || errorData?.error?.message || 'Upload failed.');
    },
  });

  const onSubmit = (data) => {
    if (!data.file) { toast.error('Please select a file.'); return; }

    const payload = {
      ...data,
      expires_at: data.expires_at ? data.expires_at.replace('T', ' ') + ':00' : undefined,
    };
    const file = data.file;
    delete payload.file;

    create.mutate({ data: payload, file });
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload New Document" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input label="Document Title *" placeholder="e.g. Partnership Agreement 2024"
              error={errors.title?.message} {...register('title', { required: 'Title is required' })} />

            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Signing Mode *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'sequential', label: 'Sequential', desc: 'Sign in order' },
                  { value: 'bulk',       label: 'Bulk',       desc: 'Any order' },
                ].map(m => (
                  <label key={m.value} className="relative cursor-pointer">
                    <input type="radio" value={m.value} {...register('signing_mode')} className="sr-only peer" />
                    <div className="border-2 rounded-2xl p-3 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-900/10 border-gray-100 dark:border-slate-800 transition-all">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{m.label}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {companies?.data?.length > 0 && (
              <Select label="Company (optional)" {...register('company_id')}>
                <option value="">No company</option>
                {companies.data.map(c => (
                  <option key={c.id} value={c.id}>{c.info.name}</option>
                ))}
              </Select>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">
                Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                {...register('expires_at')}
                min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Description (optional)" placeholder="Brief description..." {...register('description')} />
            
            <Controller
              name="file"
              control={control}
              render={({ field }) => (
                <FileUpload 
                  value={field.value} 
                  onChange={field.onChange} 
                  label="Document File *"
                />
              )}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button type="submit" loading={create.isPending} className="flex-1 rounded-xl">Upload & Continue</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [newModal, setNewModal]     = useState(false);
  const [deleteDoc, setDeleteDoc]   = useState(null);
  const [search, setSearch]         = useState('');
  const [status, setStatus]         = useState('');
  const [page, setPage]             = useState(1);
  const [view, setView]             = useState('grid'); // 'grid' or 'list'

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, status, page }],
    queryFn:  () => documentApi.list({ search, status, page, per_page: 12 }),
    placeholderData: keepPreviousData,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted.');
      setDeleteDoc(null);
    },
  });

  const docs = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Documents"
        description="Manage and track your signature requests."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-1 shadow-sm">
              <button 
                onClick={() => setView('grid')}
                className={classNames('p-2 rounded-lg transition-all', view === 'grid' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600')}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={classNames('p-2 rounded-lg transition-all', view === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600')}
              >
                <List size={18} />
              </button>
            </div>
            <Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20" onClick={() => setNewModal(true)}>
              <FilePlus size={18} />New Document
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents by title or description…"
            className="w-full pl-11 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 text-gray-900 dark:text-slate-200 shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-gray-200 dark:border-slate-800 rounded-2xl px-6 py-3 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all appearance-none cursor-pointer"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading documents...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <EmptyState
            icon={FileText}
            title="No documents found"
            description={search || status ? 'Try adjusting your filters to find what you are looking for.' : 'Upload your first document to start the signing process.'}
            action={!search && !status && <Button variant="subtle" className="rounded-xl" onClick={() => setNewModal(true)}><FilePlus size={16} />Create Document</Button>}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {docs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={setDeleteDoc} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800">
                    <tr>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-8 py-5">Document</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5 hidden sm:table-cell">Mode</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5 hidden md:table-cell">Progress</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5">Status</th>
                      <th className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4 py-5 hidden lg:table-cell">Created</th>
                      <th className="px-8 py-5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {docs.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 text-indigo-500">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[240px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.title}</p>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-black uppercase tracking-wider">{doc.file?.size_formatted}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6 hidden sm:table-cell">
                          <Badge size="xs" variant="gray" className="font-black">{doc.signing_mode}</Badge>
                        </td>
                        <td className="px-4 py-6 hidden md:table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-700"
                                style={{ width: `${doc.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500">
                              {doc.counts?.signed_count ?? 0}/{doc.counts?.total_signers ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <Badge size="xs" className={STATUS_COLORS[doc.status]}>{STATUS_LABELS[doc.status]}</Badge>
                        </td>
                        <td className="px-4 py-6 hidden lg:table-cell text-xs font-bold text-gray-400">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/dashboard/documents/${doc.id}`} title="View Details">
                              <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
                                <Eye size={16} />
                              </button>
                            </Link>
                            {['draft', 'pending'].includes(doc.status) && (
                              <Link to={`/dashboard/documents/${doc.id}/editor`} title="Open Editor">
                                <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
                                  <Edit3 size={16} />
                                </button>
                              </Link>
                            )}
                            {doc.status !== 'in_progress' && (
                              <button
                                onClick={() => setDeleteDoc(doc)}
                                title="Delete Document"
                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                Page {meta.current_page} of {meta.last_page} · {meta.total} Total
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="secondary" size="sm" className="rounded-xl" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <NewDocumentModal open={newModal} onClose={() => setNewModal(false)} />
      <ConfirmDialog
        open={!!deleteDoc} onClose={() => setDeleteDoc(null)}
        onConfirm={() => deleteMut.mutate(deleteDoc.id)}
        loading={deleteMut.isPending}
        title="Delete Document?"
        message={`This action cannot be undone. "${deleteDoc?.title}" and its signature data will be permanently removed.`}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}```

### File: src/pages/NotFoundPage.jsx
```jsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion size={36} className="text-indigo-500" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Page not found</h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}


```

### File: src/pages/signing/SigningPage.jsx
```jsx
import { useEffect, useRef, useState } from 'react';
import { useParams }            from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import SignatureCanvas           from 'react-signature-canvas';
import { signingApi }           from '@/api/signing.api';
import { Button }               from '@/components/ui/Button';
import { Spinner }              from '@/components/ui/Spinner';
import { formatDateTime }       from '@/utils/helpers';
import {
  CheckCircle, XCircle, RotateCcw, PenLine,
  AlertCircle, Upload, Clock, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATE = {
  LOADING: 'loading', READY: 'ready',
  SIGNED:  'signed',  DECLINED: 'declined', ERROR: 'error',
};

// ── Error screen ──────────────────────────────────────────────────────────────
function ErrorScreen({ title, message, icon: Icon = AlertCircle, iconClass = 'text-red-500', bgClass = 'bg-red-100' }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
        <div className={`w-16 h-16 ${bgClass} rounded-full flex items-center justify-center mx-auto mb-5`}>
          <Icon size={28} className={iconClass} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

// ── Expiry countdown ──────────────────────────────────────────────────────────
function ExpiryBadge({ expiresAt }) {
  if (!expiresAt) return null;
  const expires = new Date(expiresAt);
  const now     = new Date();
  const diffMs  = expires - now;
  const diffH   = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD   = Math.floor(diffH / 24);

  const isExpiringSoon = diffH < 24 && diffH >= 0;
  const isExpired      = diffMs <= 0;

  if (isExpired) return null; // handled by backend

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
      isExpiringSoon
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-gray-100 text-gray-500'
    }`}>
      <Clock size={12} />
      {isExpiringSoon
        ? `Expires in ${diffH}h ${Math.floor((diffMs % (1000*60*60)) / (1000*60))}m`
        : diffD > 0
          ? `Expires ${diffD}d ${diffH % 24}h`
          : `Expires ${formatDateTime(expiresAt)}`
      }
    </div>
  );
}

// ── Signature input (draw or upload) ──────────────────────────────────────────
function SignatureInput({ method, setMethod, sigPadRef, uploadFile, setUploadFile, uploadPreview, setUploadPreview }) {

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Only PNG or JPG images are accepted.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB.');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
    toast.success('Signature image selected.');
  };

  const clearUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
  };

  return (
    <div className="space-y-4">
      {/* Method switcher */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
        <button
          onClick={() => setMethod('draw')}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: method === 'draw' ? 'white' : 'transparent',
            color:      method === 'draw' ? '#1e1b4b' : '#6b7280',
            boxShadow:  method === 'draw' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <PenLine size={14} />
          Draw signature
        </button>
        <button
          onClick={() => setMethod('upload')}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: method === 'upload' ? 'white' : 'transparent',
            color:      method === 'upload' ? '#1e1b4b' : '#6b7280',
            boxShadow:  method === 'upload' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <Upload size={14} />
          Upload image
        </button>
      </div>

      {/* Draw mode */}
      {method === 'draw' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Draw your signature <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => sigPadRef.current?.clear()}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Clear
            </button>
          </div>
          <div
            className="rounded-xl overflow-hidden transition-colors"
            style={{
              border: '2px dashed #c7d2fe',
              background: '#fafafa',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#818cf8'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#c7d2fe'}
          >
            <SignatureCanvas
              ref={sigPadRef}
              penColor="#1e1b4b"
              canvasProps={{
                className: 'w-full',
                style: { display: 'block', width: '100%', height: 160 },
              }}
              backgroundColor="rgba(250,250,250,1)"
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Use mouse, finger, or stylus to sign
          </p>
        </div>
      )}

      {/* Upload mode */}
      {method === 'upload' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Upload signature image <span className="text-red-500">*</span>
          </label>

          {!uploadPreview ? (
            <label
              className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all"
              style={{
                height:     160,
                border:     '2px dashed #c7d2fe',
                background: '#fafafa',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#818cf8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#c7d2fe'}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Upload size={22} className="text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG or JPG · max 2MB</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border-2 border-indigo-300 bg-gray-50"
              style={{ height: 160 }}>
              <img
                src={uploadPreview}
                alt="Signature preview"
                className="w-full h-full object-contain p-3"
              />
              <button
                onClick={clearUpload}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
              >
                <X size={13} />
              </button>
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  ✓ Ready to use
                </span>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="rounded-xl px-4 py-3 bg-amber-50 border border-amber-100 space-y-1">
            <p className="text-xs font-semibold text-amber-800">Image requirements</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc pl-4">
              <li>PNG or JPG format only</li>
              <li>Maximum 2MB file size</li>
              <li>Use a white or transparent background for best results</li>
              <li>Minimum 200×60px recommended</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ signerName, documentTitle, pagesSignedOn, signaturePreview }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-lg w-full overflow-hidden">
        <div className="px-8 py-7 text-center" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Document Signed!</h2>
          <p className="text-green-100 text-sm mt-1">Thank you, {signerName}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-500">You have successfully signed</p>
            <p className="text-base font-semibold text-gray-900 mt-1">"{documentTitle}"</p>
          </div>

          {pagesSignedOn?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Pages you signed
              </p>
              <div className="flex flex-wrap gap-2">
                {pagesSignedOn.map(p => (
                  <div key={p}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
                    <CheckCircle size={12} className="text-green-500" />
                    Page {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {signaturePreview && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your signature
              </p>
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-center"
                style={{ minHeight: 80 }}>
                <img src={signaturePreview} alt="Your signature"
                  className="max-h-16 object-contain" />
              </div>
            </div>
          )}

          {/* Stamp preview info */}
          <div className="rounded-xl px-4 py-3 bg-indigo-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-800 mb-1">What appears on the document</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Your signature image is stamped at the designated position, along with your
              name, email, and the date and time of signing.
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
            The document owner has been notified. You can safely close this window.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main signing page ─────────────────────────────────────────────────────────
export default function SigningPage() {
  const { token }  = useParams();
  const sigPadRef  = useRef(null);

  const [state, setState]                   = useState(STATE.LOADING);
  const [signingData, setSigningData]       = useState(null);
  const [method, setMethod]                 = useState('draw');   // 'draw' | 'upload'
  const [uploadFile, setUploadFile]         = useState(null);
  const [uploadPreview, setUploadPreview]   = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [declineMode, setDeclineMode]       = useState(false);
  const [declineReason, setDeclineReason]   = useState('');

  const { isError, error, isSuccess, data: tokenData } = useQuery({
    queryKey: ['signing', token],
    queryFn:  () => signingApi.getByToken(token),
    retry:    false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isSuccess && tokenData) {
      setSigningData(tokenData.data);
      setState(STATE.READY);
    }
  }, [isSuccess, tokenData]);

  useEffect(() => {
    if (isError) setState(STATE.ERROR);
  }, [isError]);

  const submitMut = useMutation({
    mutationFn: (formData) => signingApi.submit(token, formData),
    onSuccess:  () => setState(STATE.SIGNED),
    onError:    (err) => {
      const errData = err.response?.data?.error;
      if (errData?.errors) {
        const msgs = Object.values(errData.errors).flat();
        msgs.forEach(m => toast.error(m));
      } else {
        toast.error(errData?.message || 'Submission failed.');
      }
    },
  });

  const declineMut = useMutation({
    mutationFn: () => signingApi.decline(token, declineReason),
    onSuccess:  () => setState(STATE.DECLINED),
    onError:    (err) => toast.error(err.response?.data?.error?.message || 'Failed.'),
  });

  const handleSubmit = () => {
    if (method === 'draw') {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        toast.error('Please draw your signature before submitting.');
        return;
      }
      const dataUri = sigPadRef.current.toDataURL('image/png');
      setSignaturePreview(dataUri);

      const form = new FormData();
      form.append('method', 'draw');
      form.append('signature_data', dataUri);
      submitMut.mutate(form);

    } else {
      if (!uploadFile) {
        toast.error('Please upload a signature image first.');
        return;
      }
      setSignaturePreview(uploadPreview);

      const form = new FormData();
      form.append('method', 'upload');
      form.append('signature_file', uploadFile);
      submitMut.mutate(form);
    }
  };

  if (state === STATE.LOADING) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <Spinner size="lg" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Initializing Secure Portal...</p>
      </div>
    );
  }

  if (state === STATE.ERROR) {
    const code = error?.response?.data?.error?.code;
    const map = {
      'DOCUMENT_EXPIRED': {
        title:     'Document Expired',
        message:   'The signing window for this document has closed. Please contact the sender for a new link.',
        icon:      Clock,
        iconClass: 'text-amber-500',
        bgClass:   'bg-amber-50',
      },
      'DOCUMENT_NOT_ACTIVE': {
        title:     'Document Unavailable',
        message:   'This document is no longer active. It may have been completed, cancelled, or permanently archived.',
        icon:      XCircle,
        iconClass: 'text-gray-400',
        bgClass:   'bg-gray-50',
      },
      'ALREADY_SIGNED': {
        title:     'Already Signed',
        message:   'You have already completed your portion of this document. No further action is required.',
        icon:      CheckCircle,
        iconClass: 'text-emerald-500',
        bgClass:   'bg-emerald-50',
      },
      'NOT_YOUR_TURN': {
        title:     'Waiting for Sequence',
        message:   'This document follows a sequential signing order. You will be notified automatically when it is your turn.',
        icon:      PenLine,
        iconClass: 'text-indigo-500',
        bgClass:   'bg-indigo-50',
      },
    };
    const screen = map[code] ?? {
      title:   'Link Unavailable',
      message: 'This secure signing link is invalid or has expired. For security, please request a fresh link from the document owner.',
    };
    return <ErrorScreen {...screen} />;
  }

  if (state === STATE.SIGNED) {
    return (
      <SuccessScreen
        signerName={signingData?.signer?.name}
        documentTitle={signingData?.document?.title}
        pagesSignedOn={signingData?.pages_to_sign}
        signaturePreview={signaturePreview}
      />
    );
  }

  if (state === STATE.DECLINED) {
    return (
      <ErrorScreen
        title="Signing Declined"
        message="You have chosen not to sign this document. The document owner has been notified of your decision."
        icon={XCircle}
        iconClass="text-red-500"
        bgClass="bg-red-50"
      />
    );
  }

  const { signer, document: doc, fields = [], pages_to_sign: pagesToSign = [], total_fields } = signingData;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-gray-900 truncate tracking-tight">{doc.title}</p>
              {doc.company && <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">{doc.company.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <ExpiryBadge expiresAt={doc.expires_at} />
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-100 uppercase">
                {getInitials(signer.name)}
              </div>
              <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{signer.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10 w-full animate-fade-in pb-24">
        
        {/* Signer Task Summary */}
        <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
          <div className="relative z-10 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
            <PenLine size={32} />
          </div>
          <div className="relative z-10 flex-1 text-center md:text-left">
            <h2 className="text-xl font-black tracking-tight mb-1">Signature Required</h2>
            <p className="text-indigo-100 text-sm font-medium">Please review the document and apply your signature to <span className="font-black text-white">{total_fields} designated field{total_fields > 1 ? 's' : ''}</span> across {pagesToSign.length} page{pagesToSign.length > 1 ? 's' : ''}.</p>
          </div>
          <div className="relative z-10 flex flex-wrap justify-center gap-2">
            {pagesToSign.map(p => (
              <span key={p} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md">P{p}</span>
            ))}
          </div>
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50 -mr-32 -mt-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Document Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm flex flex-col group">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-gray-400" />
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Preview</p>
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Verify Content</p>
              </div>
              <div className="relative aspect-[1/1.414] overflow-hidden">
                <iframe
                  src={`${doc.pdf_url ?? doc.file_url}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none pointer-events-none"
                  title="Document Content"
                />
                <div className="absolute inset-0 bg-transparent cursor-zoom-in" onClick={() => window.open(doc.pdf_url ?? doc.file_url, '_blank')} />
              </div>
              <div className="p-4 bg-white border-t border-gray-50 text-center">
                 <button onClick={() => window.open(doc.pdf_url ?? doc.file_url, '_blank')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors underline underline-offset-4">Open full preview in new tab</button>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-5 space-y-10">
            {!declineMode ? (
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="px-8 py-8 border-b border-gray-100 bg-gradient-to-br from-indigo-50/30 to-white">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Apply Signature</h2>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    Choose your signing method. Your signature will be automatically stamped at designated locations.
                  </p>
                </div>

                <div className="p-8 space-y-8">
                  <SignatureInput
                    method={method}
                    setMethod={setMethod}
                    sigPadRef={sigPadRef}
                    uploadFile={uploadFile}
                    setUploadFile={setUploadFile}
                    uploadPreview={uploadPreview}
                    setUploadPreview={setUploadPreview}
                  />

                  {/* Stamp Preview Card */}
                  <div className="rounded-3xl border-2 border-gray-100 overflow-hidden bg-gray-50/50">
                    <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Stamp Sample</p>
                      <Badge variant="indigo" size="xs" className="px-2">Auto-Generated</Badge>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="h-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-3">
                        {method === 'upload' && uploadPreview ? (
                          <img src={uploadPreview} alt="Preview" className="max-h-full object-contain" />
                        ) : (
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic opacity-60">
                            {method === 'draw' ? 'Your Drawn Signature' : 'Upload Image First'}
                          </p>
                        )}
                      </div>
                      <div className="pt-4 border-t border-gray-100 flex flex-col gap-1.5">
                        <p className="text-[10px] font-black text-gray-900 tracking-tight uppercase leading-none">{signer.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 leading-none">{signer.email}</p>
                        <div className="flex justify-between items-center pt-2">
                           <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                           <p className="text-[8px] font-black text-indigo-400/50 uppercase tracking-widest">Digital Stamp</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Button
                      size="lg"
                      className="w-full rounded-2xl py-6 shadow-2xl shadow-indigo-500/30 text-base"
                      onClick={handleSubmit}
                      loading={submitMut.isPending}
                    >
                      <CheckCircle size={20} /> Complete Signing
                    </Button>

                    <button
                      onClick={() => setDeclineMode(true)}
                      className="w-full text-[10px] font-black text-gray-300 hover:text-red-400 uppercase tracking-widest py-3 transition-colors text-center"
                    >
                      I Decline to sign this document
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-red-100 overflow-hidden shadow-xl shadow-red-500/5 animate-slide-up">
                <div className="px-8 py-8 border-b border-red-50 bg-red-50/50">
                  <h2 className="text-xl font-black text-red-900 tracking-tight mb-2">Decline Document</h2>
                  <p className="text-sm text-red-700/70 font-medium">
                    Please provide a reason for declining. This will notify the document owner and end the signing process.
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-900 uppercase tracking-widest ml-1">Decline Reason *</label>
                    <textarea
                      rows={5}
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      placeholder="e.g. Terms need further clarification, Incorrect data..."
                      className="w-full border-2 border-red-100 focus:border-red-300 rounded-3xl p-5 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-red-500/5 resize-none transition-all placeholder:text-red-200"
                    />
                    <p className="text-[10px] font-bold text-red-300 italic text-right px-2">Min. 5 characters required</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button variant="secondary" className="rounded-2xl py-4 font-black uppercase text-xs tracking-widest"
                      onClick={() => { setDeclineMode(false); setDeclineReason(''); }}>
                      Go Back
                    </Button>
                    <Button variant="danger" className="rounded-2xl py-4 font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20"
                      disabled={declineReason.trim().length < 5}
                      loading={declineMut.isPending}
                      onClick={() => declineMut.mutate()}>
                      Confirm Decline
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle size={14} className="text-emerald-500/50" />
                <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Secure Signing</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs font-medium">By signing, you agree that your electronic signature is as legally binding as a handwritten one.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Footer */}
      <footer className="mt-auto py-8 text-center bg-white border-t border-gray-100">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Powered by Signflow Secure</p>
      </footer>
    </div>
  );
}```

### File: src/utils/constants.js
```javascript
export const SIGNING_MODES = {
  SEQUENTIAL: 'sequential',
  BULK:       'bulk',
};

export const DOCUMENT_STATUSES = {
  DRAFT:       'draft',
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
  EXPIRED:     'expired',
};

export const STATUS_LABELS = {
  draft:       'Draft',
  pending:     'Ready to Send',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  expired:     'Expired',
};

export const STATUS_COLORS = {
  draft:       'bg-gray-100 text-gray-600',
  pending:     'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-600',
  expired:     'bg-orange-100 text-orange-600',
};

export const SIGNER_STATUS_COLORS = {
  pending:  'bg-gray-100 text-gray-500',
  notified: 'bg-blue-100 text-blue-600',
  viewed:   'bg-yellow-100 text-yellow-600',
  signed:   'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
};

// Single field type
export const SIGNATURE_FIELD = {
  value:  'signature',
  label:  'Signature',
  color:  '#4f46e5',
  width:  200,
  height: 60,
};
export const SIGN_ROLES = [
    {
        value:       'signer',
        label:       'Signer',
        description: 'Must fill and sign fields. Required for completion.',
        color:       'bg-indigo-100 text-indigo-700',
    },
    {
        value:       'approver',
        label:       'Approver',
        description: 'Reviews and approves or rejects the document. No fields assigned.',
        color:       'bg-purple-100 text-purple-700',
    },
    {
        value:       'cc',
        label:       'CC',
        description: 'Receives a copy for information only. No action required.',
        color:       'bg-gray-100 text-gray-600',
    },
];```

### File: src/utils/helpers.js
```javascript
export const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes, i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${Math.round(size * 10) / 10} ${units[i]}`;
};

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

export const truncate = (str, n = 40) =>
  str?.length > n ? str.slice(0, n) + '…' : str;

export const classNames = (...classes) => classes.filter(Boolean).join(' ');```

