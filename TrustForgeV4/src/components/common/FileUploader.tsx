import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Trash2 } from 'lucide-react';
import type { UploadedEvidence } from '../../types';

interface FileUploaderProps {
  onUpload: (file: File, category?: string) => void;
  files: UploadedEvidence[];
  onRemove?: (id: string) => void;
  category?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  files,
  onRemove,
  category = 'General Evidence',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMsg(null);

    const file = incomingFiles[0];
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (file.size > maxSize) {
      setErrorMsg('File size exceeds the 25MB limit.');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
      setErrorMsg('Supported file formats: PDF, DOCX, PNG, JPG.');
      return;
    }

    onUpload(file, category);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#0F2E22] bg-[#E6F4EE]'
            : 'border-[#0F2E22]/20 hover:border-[#0F2E22]/50 bg-[#F2EDE1]/30 hover:bg-[#F2EDE1]/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-12 h-12 rounded-xl bg-[#0F2E22]/10 text-[#0F2E22] flex items-center justify-center mx-auto mb-3">
          <Upload className="w-6 h-6" />
        </div>

        <h4 className="text-sm font-bold text-[#0F2E22]">
          Upload Compliance Evidence & Policies
        </h4>
        <p className="text-xs text-slate-600 mt-1">
          Drag & drop your files here, or <span className="text-[#0F2E22] font-semibold underline">browse</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Supports PDF, DOCX, PNG, JPG (Maximum size: 25MB)
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#0F2E22]">
            Uploaded Documents ({files.length})
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-3.5 rounded-xl bg-white border border-[#0F2E22]/10 flex items-center justify-between shadow-xs hover:border-[#0F2E22]/30 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-lg bg-[#F2EDE1] text-[#0F2E22] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0F2E22] truncate">
                      {file.fileName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span>{formatSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{file.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {file.status === 'verified' ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Pending Verification</span>
                    </span>
                  )}

                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(file.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
