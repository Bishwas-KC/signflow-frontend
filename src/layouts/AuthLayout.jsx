export default function AuthLayout({ children }) {
  return (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
  {/* Abstract background shapes */}
  <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
  <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px] animate-pulse" />
  <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-400 rounded-full blur-[120px] animate-pulse delay-700" />
  </div>

  <div className="w-full max-w-md relative z-10 animate-fade-in">
  <div className="text-center mb-6">
  <div className="inline-flex items-center gap-3 mb-4">
  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
  <span className="text-white font-black text-xl leading-none">S</span>
  </div>
  <span className="text-2xl font-black text-gray-900 tracking-tight">Signflow</span>
  </div>
  <p className="text-gray-500 font-medium">Digital signatures made simple and secure.</p>
  </div>
  
  <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-white p-6 backdrop-blur-xl">
  {children}
  </div>
  
  <p className="text-center mt-6 text-xs text-gray-400 font-medium">
  &copy; {new Date().getFullYear()} Signflow Technologies. All rights reserved.
  </p>
  </div>
  </div>
  );
}