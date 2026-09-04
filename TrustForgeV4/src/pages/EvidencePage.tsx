import React from 'react';
import { FileCheck, Upload, Trash2, CheckCircle2, Clock, FileText } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { FileUploader } from '../components/common/FileUploader';
import { useAssessment } from '../context/AssessmentContext';

export const EvidencePage: React.FC = () => {
  const { evidenceFiles, uploadEvidence, removeEvidence } = useAssessment();

  return (
    <AppLayout
      title="Evidence Verification Vault"
      subtitle="Cryptographic verification & repository of compliance documents"
    >
      <div className="space-y-6">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#0F2E22]/15">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F2E22] tracking-tight">
              Evidence Repository ({evidenceFiles.length} Documents)
            </h2>
            <p className="text-xs text-slate-600">
              Attach SOC 2 audits, Privacy Policy PDFs, and MCA certificates for baseline verification.
            </p>
          </div>
        </div>

        {/* File Uploader */}
        <Card className="p-6 bg-white border-2 border-[#0F2E22]/15">
          <FileUploader
            onUpload={uploadEvidence}
            files={evidenceFiles}
            onRemove={removeEvidence}
          />
        </Card>

        {/* Verification Status List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0F2E22]">
            Audit Evidence Log
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidenceFiles.map((file) => (
              <Card key={file.id} className="p-5 bg-white border border-[#0F2E22]/15 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F2EDE1] text-[#0F2E22] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#0F2E22] truncate max-w-[200px]">
                        {file.fileName}
                      </h4>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.category}
                      </div>
                    </div>
                  </div>

                  <Badge variant={file.status === 'verified' ? 'emerald' : 'amber'}>
                    {file.status}
                  </Badge>
                </div>

                {file.summary && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {file.summary}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
