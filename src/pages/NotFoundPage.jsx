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


