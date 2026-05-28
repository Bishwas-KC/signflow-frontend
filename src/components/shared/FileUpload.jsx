import { useState, useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { formatFileSize, classNames } from '@/utils/helpers';
import toast from 'react-hot-toast';

export function FileUpload({ 
 value, 
 onChange, 
 accept = '.pdf', 
  maxSize = 10 * 1024 * 1024, // 10MB
  label = "Upload File",
  description = "PDF Only — max 10MB"
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
      toast.error(`File is too large. Max size is ${formatFileSize(maxSize)}`);
      return;
    }
    if (accept && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed.');
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
 <label className="block text-sm font-bold text-gray-700">
 {label} <span className="text-gray-400 font-normal">({description})</span>
 </label>
 
 <div
 className={classNames(
 'relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center cursor-pointer group',
 isDragging 
 ? 'border-indigo-500 bg-indigo-50' 
 : 'border-gray-200 hover:border-indigo-400 bg-white',
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
 <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
 <FileText size={32} />
 </div>
 <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{value.name}</p>
 <p className="text-xs text-gray-500 mt-1">{formatFileSize(value.size)}</p>
 
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onChange(null);
 }}
  className="mt-4 p-3 text-gray-400 hover:text-red-500 transition-colors min-h-[44px]"
 >
 <X size={18} />
  <span className="text-xs font-bold ml-1">Delete</span>
 </button>
 </div>
 ) : (
 <div className="py-4">
 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-4 group-hover:scale-110 group-hover:text-indigo-500 transition-all">
 <Upload size={32} />
 </div>
 <p className="text-sm font-bold text-gray-700">
 Click or drag to upload
 </p>
 <p className="text-xs text-gray-400 mt-2">
 PDF documents are supported
 </p>
 </div>
 )}
 </div>
 </div>
 );
}
