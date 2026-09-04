import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, Trash2, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'Verified' | 'Analyzing' | 'Pending';
}

export const EvidenceUploader: React.FC<{
  files: UploadedFile[];
  onUpload: (file: UploadedFile) => void;
  onRemove: (id: string) => void;
}> = ({ files, onUpload, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleSimulatedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const newFile: UploadedFile = {
      id: 'file_' + Date.now(),
      name: 'TechNova_DPDP_Audit_Evidence_' + Math.floor(Math.random() * 100) + '.pdf',
      size: '2.8 MB',
      status: 'Verified'
    };
    onUpload(newFile);
  };

  return (
    <div className="space-y-4 text-xs">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleSimulatedDrop}
        onClick={() => {
          const newFile: UploadedFile = {
            id: 'file_' + Date.now(),
            name: 'TechNova_DPDP_Governance_SOP.pdf',
            size: '3.1 MB',
            status: 'Verified'
          };
          onUpload(newFile);
        }}
        className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#0F2E22] bg-[#FAF8F5]'
            : 'border-[#CFC7B7] hover:border-[#0F2E22] bg-[#FAF8F5]'
        }`}
      >
        <Upload className="w-8 h-8 text-[#0F2E22] mx-auto mb-2" />
        <div className="font-bold text-[#0F2E22]">Drag & drop compliance evidence files here</div>
        <p className="text-[#7A8981] text-[11px] mt-1">
          Supports PDF, DOCX, scanned policy documents (max 25MB per file)
        </p>
      </div>

      {/* Uploaded Evidence Files List */}
      <div className="space-y-2">
        <div className="font-semibold text-[#0F2E22] flex items-center justify-between">
          <span>Uploaded Evidence Files ({files.length})</span>
          <span className="text-[11px] text-[#7A8981]">Encrypted at rest</span>
        </div>

        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3.5 bg-white border border-[#E3DDD0] rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FAF8F5] text-[#0F2E22]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#0F2E22]">{file.name}</div>
                <div className="text-[10px] text-[#7A8981]">{file.size}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="success">✓ {file.status}</Badge>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}
                className="text-[#7A8981] hover:text-[#991B1B] p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
