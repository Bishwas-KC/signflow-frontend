import { Button } from '@/components/ui/Button';
import { ExternalLink, FileText } from 'lucide-react';

export function DocumentPreview({ doc }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <h2 className="text-sm font-bold text-gray-900">Document Preview</h2>
        </div>
        <div className="flex gap-1.5">
          {doc.file?.preview_url && (
            <a href={doc.file.preview_url} target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm" className="rounded-lg">
                <ExternalLink size={13} /> Full Screen
              </Button>
            </a>
          )}
        </div>
      </div>
      {doc.file?.preview_url ? (
        <iframe
          src={doc.file.preview_url}
          className="w-full h-[350px] sm:h-[450px] md:h-[550px] xl:h-[650px] bg-gray-50"
          title="Document Preview"
        />
      ) : (
        <div className="w-full h-[350px] flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-3">
          <FileText size={40} className="text-gray-200" />
          <p className="text-sm font-medium">No preview available</p>
        </div>
      )}
    </section>
  );
}
