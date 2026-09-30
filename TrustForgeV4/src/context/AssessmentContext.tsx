/**
 * TrustForge — Assessment Context (Research-Grade Implementation)
 *
 * MOCK DATA POLICY:
 *   - MOCK_TRUST_SCORE, MOCK_FINDINGS, MOCK_EVIDENCE_FILES, MOCK_PUBLIC_SCAN
 *     are retained ONLY as demo/fallback data.
 *   - The actual research workflow uses the real FastAPI backend.
 *   - When the backend is unavailable, the context falls back to demo data
 *     and clearly labels results as "DEMO".
 *
 * This separation ensures:
 *   - Research results come from real computations
 *   - Demo/UI testing still works without backend
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UploadedEvidence, WebsiteScanResult, TrustScoreBreakdown, Finding } from '../types';
import { MOCK_TRUST_SCORE, MOCK_FINDINGS, MOCK_EVIDENCE_FILES, MOCK_PUBLIC_SCAN } from '../data/dpdpFramework';
import { apiClient, adaptScanResult, type BackendScanResult, type BackendAssessmentResponse } from '../services/api';

interface AssessmentContextType {
  currentStep: number;
  answers: Record<string, any>;
  evidenceFiles: UploadedEvidence[];
  scanResult: WebsiteScanResult | null;
  trustScore: TrustScoreBreakdown;
  findings: Finding[];
  isAnalyzing: boolean;
  analysisStage: number;
  // Real backend state
  backendAvailable: boolean;
  assessmentId: string | null;
  frugalMetrics: FrugalMetrics | null;
  rawScanData: BackendScanResult | null;
  isDemoMode: boolean;
  // Actions
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

export interface FrugalMetrics {
  totalControls: number;
  deterministicResolved: number;
  ragResolved: number;
  aiResolved: number;
  unknownUnresolved: number;
  aiCallsMade: number;
  ruleResolutionRate: number;
  totalExecutionMs: number;
  scoringVersion: string;
  coveragePercentage: number;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

function adaptTrustScore(backend: BackendAssessmentResponse['trust_score']): TrustScoreBreakdown {
  return {
    overallScore: Math.round(backend.overall_score),
    statusLabel: backend.status_label as 'Strong Alignment' | 'Needs Attention' | 'Potential Gaps',
    pillars: backend.pillars.map(p => ({
      id: p.pillar_id,
      name: p.name,
      score: Math.round(p.raw_score),
      weight: p.weight,
      description: p.description || `${p.evaluated_controls} controls evaluated, ${p.unknown_controls} unknown.`,
      color: p.color,
    })),
  };
}

function adaptFindings(backendFindings: BackendAssessmentResponse['findings']): Finding[] {
  return backendFindings.map(f => ({
    id: f.finding_id,
    title: f.title,
    category: f.category as Finding['category'],
    severity: f.severity as Finding['severity'],
    scoreImpact: f.score_impact,
    whatIsWrong: f.what_is_wrong,
    whyItMatters: f.why_it_matters,
    whatShouldWeDo: f.what_should_we_do,
    howToImprove: f.how_to_improve,
    dpdpSection: f.dpdp_section,
    status: f.status as Finding['status'],
  }));
}

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
    },
    // Real data fields for backend
    dataRights: { access: true, correction: true, erasure: true },
    incidentResponseProcedure: true,
    dpaExecuted: true,
    processorInventory: true,
    automatedErasure: true,
    retentionDays: 180,
  });

  // Demo state (shown when backend unavailable)
  const [evidenceFiles, setEvidenceFiles] = useState<UploadedEvidence[]>(MOCK_EVIDENCE_FILES);
  const [scanResult, setScanResult] = useState<WebsiteScanResult | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScoreBreakdown>(MOCK_TRUST_SCORE);
  const [findings, setFindings] = useState<Finding[]>(MOCK_FINDINGS);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<number>(1);

  // Real backend state
  const [backendAvailable, setBackendAvailable] = useState<boolean>(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [frugalMetrics, setFrugalMetrics] = useState<FrugalMetrics | null>(null);
  const [rawScanData, setRawScanData] = useState<BackendScanResult | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const setAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 12));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 12) setCurrentStep(step);
  };

  const uploadEvidence = async (file: File, category: string = 'General Evidence'): Promise<void> => {
    // Try real backend upload first
    const isAvailable = await apiClient.checkAvailability();
    setBackendAvailable(isAvailable);

    if (isAvailable) {
      try {
        const result = await apiClient.uploadEvidence(file) as any;
        const newFile: UploadedEvidence = {
          id: result.evidence_id || `ev_${Date.now()}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          uploadDate: new Date().toISOString().split('T')[0],
          status: result.status === 'ANALYSED' ? 'verified' : 'pending',
          category,
          summary: result.summary || `Uploaded ${file.name}.`,
        };
        setEvidenceFiles(prev => [newFile, ...prev]);
        return;
      } catch {
        // Fall through to local-only
      }
    }

    // Fallback: local-only (no real parsing)
    const newFile: UploadedEvidence = {
      id: `ev_${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      category,
      summary: `[DEMO] Uploaded ${file.name} for ${category}. Connect backend for real analysis.`,
    };
    setEvidenceFiles(prev => [newFile, ...prev]);
  };

  const removeEvidence = (id: string) => {
    setEvidenceFiles(prev => prev.filter(f => f.id !== id));
  };

  const runAnalysisEngine = useCallback((onComplete?: () => void) => {
    setIsAnalyzing(true);
    setAnalysisStage(1);

    // Try to use real backend
    apiClient.checkAvailability().then(async (available) => {
      setBackendAvailable(available);

      if (available) {
        // Real backend assessment
        const stages = [1, 2, 3, 4, 5, 6, 7];
        let stageIdx = 0;

        const advanceStage = setInterval(() => {
          stageIdx++;
          setAnalysisStage(stages[stageIdx] || 7);
          if (stageIdx >= stages.length - 1) {
            clearInterval(advanceStage);
          }
        }, 600);

        try {
          const result = await apiClient.runAssessment(answers, rawScanData ?? undefined);

          clearInterval(advanceStage);
          setAnalysisStage(7);

          // Update state with real results
          setTrustScore(adaptTrustScore(result.trust_score));
          setFindings(adaptFindings(result.findings));
          setAssessmentId(result.assessment_id);
          setIsDemoMode(false);

          const fm = result.trust_score.frugal_ai_metrics;
          setFrugalMetrics({
            totalControls: fm.total_controls,
            deterministicResolved: fm.deterministic_resolved,
            ragResolved: fm.rag_resolved,
            aiResolved: fm.ai_resolved,
            unknownUnresolved: fm.unknown_unresolved,
            aiCallsMade: fm.ai_calls_made,
            ruleResolutionRate: fm.rule_resolution_rate,
            totalExecutionMs: fm.total_execution_ms,
            scoringVersion: result.trust_score.scoring_version,
            coveragePercentage: result.trust_score.coverage_percentage,
          });

        } catch (err) {
          clearInterval(advanceStage);
          // Fall back to demo
          setIsDemoMode(true);
          setTrustScore(MOCK_TRUST_SCORE);
          setFindings(MOCK_FINDINGS);
        }
      } else {
        // Demo mode — simulate timer-driven stages
        setIsDemoMode(true);
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
        return;
      }

      setTimeout(() => {
        setIsAnalyzing(false);
        if (onComplete) onComplete();
      }, 600);
    });
  }, [answers, rawScanData]);

  const runWebsiteScan = async (url: string): Promise<WebsiteScanResult> => {
    const available = await apiClient.checkAvailability();
    setBackendAvailable(available);

    if (available) {
      try {
        const backendResult = await apiClient.scanWebsite(url);
        setRawScanData(backendResult);
        const adapted = adaptScanResult(backendResult);
        const legacyResult: WebsiteScanResult = {
          url: adapted.url,
          scanDate: adapted.scanDate,
          trustScore: adapted.trustScore,
          status: adapted.status,
          sslStatus: adapted.sslStatus,
          privacyPolicy: adapted.privacyPolicy,
          cookieConsent: adapted.cookieConsent,
          observations: adapted.observations,
          recommendations: adapted.recommendations,
        };
        setScanResult(legacyResult);
        setIsDemoMode(false);
        return legacyResult;
      } catch {
        // Fall through to mock
      }
    }

    // Demo fallback
    setIsDemoMode(true);
    const result: WebsiteScanResult = {
      ...MOCK_PUBLIC_SCAN,
      url,
      scanDate: new Date().toISOString().split('T')[0],
      status: 'Needs Attention',
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
        backendAvailable,
        assessmentId,
        frugalMetrics,
        rawScanData,
        isDemoMode,
        setAnswer,
        nextStep,
        prevStep,
        goToStep,
        uploadEvidence,
        removeEvidence,
        runAnalysisEngine,
        runWebsiteScan,
        updateFindingStatus,
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
