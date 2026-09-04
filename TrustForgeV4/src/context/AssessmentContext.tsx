import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { UploadedEvidence, WebsiteScanResult, TrustScoreBreakdown, Finding } from '../types';
import { MOCK_TRUST_SCORE, MOCK_FINDINGS, MOCK_EVIDENCE_FILES, MOCK_PUBLIC_SCAN } from '../data/dpdpFramework';

interface AssessmentContextType {
  currentStep: number;
  answers: Record<string, any>;
  evidenceFiles: UploadedEvidence[];
  scanResult: WebsiteScanResult | null;
  trustScore: TrustScoreBreakdown;
  findings: Finding[];
  isAnalyzing: boolean;
  analysisStage: number;
  setAnswer: (questionId: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  uploadEvidence: (file: File, category?: string) => Promise<void>;
  removeEvidence: (id: string) => void;
  runAnalysisEngine: (onComplete?: () => void) => void;
  runWebsiteScan: (url: string) => Promise<WebsiteScanResult>;
  updateFindingStatus: (id: string, status: 'open' | 'in_progress' | 'resolved') => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, any>>({
    legalName: 'TechNova Solutions Pvt Ltd',
    cin: 'U72900MH2021PTC354912',
    gstin: '27AABCT3549R1ZM',
    grievanceOfficerName: 'Rohan Sharma',
    grievanceOfficerEmail: 'grievance@technova.in',
    dataCategories: ['cat_identifiers', 'cat_financial', 'cat_device'],
    languages: ['en', 'hi'],
    securityControls: {
      encryptionAtRest: 'AES-256 Verified',
      encryptionInTransit: 'TLS 1.3 Enforced',
      backupFrequency: 'Automated Daily Snapshot'
    }
  });

  const [evidenceFiles, setEvidenceFiles] = useState<UploadedEvidence[]>(MOCK_EVIDENCE_FILES);
  const [scanResult, setScanResult] = useState<WebsiteScanResult | null>(MOCK_PUBLIC_SCAN);
  const [trustScore] = useState<TrustScoreBreakdown>(MOCK_TRUST_SCORE);
  const [findings, setFindings] = useState<Finding[]>(MOCK_FINDINGS);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<number>(1);

  const setAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 12));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 12) {
      setCurrentStep(step);
    }
  };

  const uploadEvidence = async (file: File, category: string = 'General Evidence'): Promise<void> => {
    const newFile: UploadedEvidence = {
      id: `ev_${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      category,
      summary: `Uploaded ${file.name} for ${category} verification.`
    };
    setEvidenceFiles(prev => [newFile, ...prev]);
  };

  const removeEvidence = (id: string) => {
    setEvidenceFiles(prev => prev.filter(f => f.id !== id));
  };

  const runAnalysisEngine = (onComplete?: () => void) => {
    setIsAnalyzing(true);
    setAnalysisStage(1);

    const interval = setInterval(() => {
      setAnalysisStage(stage => {
        if (stage >= 7) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnalyzing(false);
            if (onComplete) onComplete();
          }, 600);
          return 7;
        }
        return stage + 1;
      });
    }, 800);
  };

  const runWebsiteScan = async (url: string): Promise<WebsiteScanResult> => {
    const result: WebsiteScanResult = {
      ...MOCK_PUBLIC_SCAN,
      url,
      scanDate: new Date().toISOString().split('T')[0]
    };
    setScanResult(result);
    return result;
  };

  const updateFindingStatus = (id: string, status: 'open' | 'in_progress' | 'resolved') => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  return (
    <AssessmentContext.Provider
      value={{
        currentStep,
        answers,
        evidenceFiles,
        scanResult,
        trustScore,
        findings,
        isAnalyzing,
        analysisStage,
        setAnswer,
        nextStep,
        prevStep,
        goToStep,
        uploadEvidence,
        removeEvidence,
        runAnalysisEngine,
        runWebsiteScan,
        updateFindingStatus
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
