import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
 constructor(props) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error) {
 return { hasError: true, error };
 }

 componentDidCatch(error, info) {
 console.error('ErrorBoundary caught:', error, info);
 }

 render() {
 if (this.state.hasError) {
 if (this.props.fallback) {
 return this.props.fallback;
 }

 return (
 <div className="flex items-center justify-center min-h-[400px] p-8">
 <div className="text-center max-w-md">
 <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
 <AlertTriangle size={28} className="text-red-500" />
 </div>
 <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
 <p className="text-sm text-gray-500 mb-6">
 {this.props.message || 'An unexpected error occurred. Please try again.'}
 </p>
 <button
 onClick={() => {
 this.setState({ hasError: false, error: null });
 window.location.reload();
 }}
 className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
 >
 <RefreshCw size={14} />
 Reload page
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
