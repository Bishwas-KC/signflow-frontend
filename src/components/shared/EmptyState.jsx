export function EmptyState({ icon: Icon, title, description, action }) {
 return (
 <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
 {Icon && (
 <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-gray-100 transition-transform hover:scale-110 duration-500">
 <Icon size={32} className="text-gray-300" />
 </div>
 )}
 <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
 {description && <p className="text-sm font-medium text-gray-500 max-w-xs mb-8 mx-auto leading-relaxed">{description}</p>}
 {action}
 </div>
 );
}