import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Database,
  FileSearch,
  Layers,
  RefreshCw,
  Cpu,
  ChevronDown,
  ChevronRight,
  Info,
  Hash,
  Scale,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import {
  getAssessmentRAGTrace,
  getAssessmentRetrievalExplorer,
  getAssessmentEvidenceTrace,
  getAssessmentModelExecutions,
} from "@/services/api";
import type {
  ApiRAGExecutionTrace,
  ApiLegalRetrievalExplorerRecord,
  ApiEvidenceToVerdictTraceItem,
  ApiModelExecutionTraceItem,
} from "@/services/api";

export function RAGMonitorPage() {
  const [activeTab, setActiveTab] = useState<"stages" | "explorer" | "trace" | "models">("stages");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Core research artifacts
  const [ragTrace, setRagTrace] = useState<ApiRAGExecutionTrace | null>(null);
  const [retrievalExplorer, setRetrievalExplorer] = useState<ApiLegalRetrievalExplorerRecord[]>([]);
  const [evidenceTrace, setEvidenceTrace] = useState<ApiEvidenceToVerdictTraceItem[]>([]);
  const [modelExecutions, setModelExecutions] = useState<ApiModelExecutionTraceItem[]>([]);

  // Explorer selection state
  const [selectedObligationId, setSelectedObligationId] = useState<string>("C1");
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);
  const [filterVerdict, setFilterVerdict] = useState<string>("ALL");

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setError(null);
    try {
      const [traceRes, explorerRes, evidenceRes, modelsRes] = await Promise.all([
        getAssessmentRAGTrace("latest"),
        getAssessmentRetrievalExplorer("latest"),
        getAssessmentEvidenceTrace("latest"),
        getAssessmentModelExecutions("latest"),
      ]);

      if (traceRes && traceRes.rag_execution_trace) {
        setRagTrace(traceRes.rag_execution_trace);
      }
      if (explorerRes && explorerRes.retrieval_explorer) {
        setRetrievalExplorer(explorerRes.retrieval_explorer);
        if (explorerRes.retrieval_explorer.length > 0 && !selectedObligationId) {
          setSelectedObligationId(explorerRes.retrieval_explorer[0].c10_obligation_id);
        }
      }
      if (evidenceRes && evidenceRes.evidence_to_verdict_trace) {
        setEvidenceTrace(evidenceRes.evidence_to_verdict_trace);
      }
      if (modelsRes && modelsRes.model_executions) {
        setModelExecutions(modelsRes.model_executions);
      }
    } catch (err: any) {
      console.error("Failed to load RAG Monitor artifacts:", err);
      setError(err?.detail || err?.message || "Failed to load RAG Framework trace data. Ensure the API backend is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedObligationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling hook
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const selectedExplorerItem =
    retrievalExplorer.find((item) => item.c10_obligation_id === selectedObligationId) ||
    retrievalExplorer[0];

  const filteredEvidence = evidenceTrace.filter((item) => {
    if (filterVerdict === "ALL") return true;
    if (filterVerdict === "GROUNDED") return item.is_grounded;
    if (filterVerdict === "UNGROUNDED") return !item.is_grounded;
    if (filterVerdict === "PASS") return item.effective_verdict === "SUPPORTED";
    if (filterVerdict === "FAIL") return item.effective_verdict === "NOT_SUPPORTED";
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="RAG Framework Monitor & Retrieval Explorer"
        subtitle="Live inspection of 10-stage hybrid retrieval, statutory RRF rankings, frozen context snapshots, and multi-model grounding"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "primary" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-1.5"
            >
              <Activity className={`h-4 w-4 ${autoRefresh ? "animate-pulse text-emerald-light" : ""}`} />
              {autoRefresh ? "Live Polling Active" : "Auto-Refresh Off"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              disabled={refreshing}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Trace
            </Button>
          </div>
        }
      />

      {/* Snapshot Provenance Banner */}
      {ragTrace && (
        <div className="rounded-xl border border-emerald-mid/60 bg-emerald-deep/5 px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-deep shrink-0" />
            <span className="font-semibold text-emerald-deep">Target URL:</span>
            <span className="font-mono text-ink-soft">{ragTrace.target_url || "https://technova.in"}</span>
            <span className="text-ink-muted">|</span>
            <span className="font-semibold text-emerald-deep">Assessment ID:</span>
            <span className="font-mono text-ink-soft">{ragTrace.assessment_id}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-ink-muted">
              <Hash className="h-3.5 w-3.5" />
              Corpus: <strong className="font-mono text-ink">{ragTrace.corpus_version}</strong>
            </span>
            <span className="flex items-center gap-1 text-ink-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Snapshot: <strong className="font-mono text-ink" title={ragTrace.frozen_snapshot_hash}>{ragTrace.frozen_snapshot_hash ? ragTrace.frozen_snapshot_hash.substring(0, 16) + "…" : "N/A"}</strong>
            </span>
            <Badge tone={ragTrace.status === "COMPLETED" ? "success" : "info"}>
              {ragTrace.status} ({ragTrace.total_duration_ms} ms)
            </Badge>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-danger/30 bg-danger/5 p-4 text-sm text-danger flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            Retry
          </Button>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-line gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("stages")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "stages"
              ? "border-emerald-deep text-emerald-deep font-semibold"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <Activity className="h-4 w-4" />
          Live 10-Stage Framework Monitor
        </button>
        <button
          onClick={() => setActiveTab("explorer")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "explorer"
              ? "border-emerald-deep text-emerald-deep font-semibold"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <FileSearch className="h-4 w-4" />
          Interactive Legal Retrieval Explorer (C1–C10)
        </button>
        <button
          onClick={() => setActiveTab("trace")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "trace"
              ? "border-emerald-deep text-emerald-deep font-semibold"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <Scale className="h-4 w-4" />
          Evidence-to-Verdict Traceability Matrix
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "models"
              ? "border-emerald-deep text-emerald-deep font-semibold"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <Cpu className="h-4 w-4" />
          10-Model Gateway Execution & Verification
        </button>
      </div>

      {loading && !ragTrace && (
        <Card className="p-12 text-center text-ink-muted">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-deep mb-3" />
          <p className="text-sm font-medium">Loading RAG Execution Telemetry & Artifacts…</p>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIVE 10-STAGE FRAMEWORK MONITOR */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "stages" && ragTrace && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {ragTrace.stages.map((stage) => {
              const isExpanded = expandedStageId === stage.stage_id;
              const isCompleted = stage.status === "COMPLETED";
              const isRunning = stage.status === "RUNNING";

              return (
                <div
                  key={stage.stage_id}
                  className={`rounded-xl border transition-all ${
                    isRunning
                      ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                      : isCompleted
                      ? "border-line bg-card hover:border-emerald-mid"
                      : "border-line/60 bg-canvas text-ink-muted"
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedStageId(isExpanded ? null : stage.stage_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                          isCompleted
                            ? "bg-emerald-deep text-bone"
                            : isRunning
                            ? "bg-accent text-bone animate-pulse"
                            : "bg-line text-ink-muted"
                        }`}
                      >
                        {stage.stage_id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-ink">{stage.stage_name}</h4>
                          <span className="font-mono text-[11px] text-ink-muted">[{stage.stage_key}]</span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Started: {stage.started_at ? new Date(stage.started_at).toLocaleTimeString() : "Pending"}
                          {stage.completed_at && ` · Completed: ${new Date(stage.completed_at).toLocaleTimeString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {stage.duration_ms} ms
                        </span>
                      </div>
                      <Badge
                        tone={
                          stage.status === "COMPLETED"
                            ? "success"
                            : stage.status === "RUNNING"
                            ? "warning"
                            : stage.status === "FAILED"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {stage.status}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-ink-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-ink-muted" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Stage Telemetry Inspector */}
                  {isExpanded && (
                    <div className="border-t border-line/60 bg-beige-light/30 p-4 rounded-b-xl text-xs space-y-3">
                      <div className="font-semibold text-ink-soft uppercase tracking-wider text-[11px]">
                        Telemetry & Audit Payload
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(stage.details || {}).map(([k, v]) => (
                          <div key={k} className="p-2 rounded bg-card border border-line/40">
                            <span className="font-mono text-ink-muted block text-[10px]">{k}</span>
                            <span className="font-mono font-medium text-ink truncate block" title={String(v)}>
                              {typeof v === "object" ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: INTERACTIVE LEGAL RETRIEVAL EXPLORER (C1–C10) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "explorer" && (
        <div className="space-y-6">
          {/* Obligation Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {retrievalExplorer.map((rec) => {
              const isSelected = rec.c10_obligation_id === selectedObligationId;
              return (
                <button
                  key={rec.control_id}
                  onClick={() => setSelectedObligationId(rec.c10_obligation_id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-deep text-bone border-emerald-deep shadow-sm"
                      : "bg-card text-ink-soft border-line hover:border-emerald-mid"
                  }`}
                >
                  <span className="font-bold mr-1.5">{rec.c10_obligation_id}:</span>
                  {rec.c10_obligation_name}
                </button>
              );
            })}
          </div>

          {selectedExplorerItem ? (
            <div className="space-y-6">
              {/* Query & Retrieval Metadata */}
              <Card className="p-5 border-emerald-mid/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{selectedExplorerItem.c10_obligation_id}</Badge>
                      <h3 className="font-display font-semibold text-lg text-ink">
                        {selectedExplorerItem.c10_obligation_name}
                      </h3>
                      <span className="text-xs font-mono bg-beige-light px-2 py-0.5 rounded text-ink-muted">
                        {selectedExplorerItem.statutory_ref}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      Candidate Generation: BM25 Lexical + 384-d pgvector Semantic Embeddings · Fusion Constant k={selectedExplorerItem.fusion_constant}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-ink-muted">
                      Latency: <strong className="text-ink">{selectedExplorerItem.retrieval_latency_ms.total} ms</strong> (BM25: {selectedExplorerItem.retrieval_latency_ms.bm25}ms, Vector: {selectedExplorerItem.retrieval_latency_ms.vector_rpc}ms)
                    </span>
                    <span className="font-mono text-ink-muted">
                      Hash: <strong className="text-ink font-mono">{selectedExplorerItem.context_hash.substring(0, 10)}…</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                    Canonical Legal Query Dispatched to Hybrid Retriever:
                  </span>
                  <div className="rounded-lg bg-canvas border border-line p-3 font-mono text-xs text-ink">
                    "{selectedExplorerItem.query}"
                  </div>
                </div>
              </Card>

              {/* Top 5 Statutory Passages Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-deep" />
                    Top-5 Statutory Passages Selected via Reciprocal Rank Fusion
                  </h4>
                  <span className="text-xs text-ink-muted">
                    Ranked by fused score: RRF = 1/(60 + r_BM25) + 1/(60 + r_Vector)
                  </span>
                </div>

                <div className="grid gap-4">
                  {selectedExplorerItem.retrieved_passages.map((p) => (
                    <Card key={p.chunk_id} className="p-4 border-line hover:border-emerald-mid transition-all space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-deep text-bone text-xs font-bold">
                            #{p.rank}
                          </span>
                          <span className="font-semibold text-sm text-ink">{p.section}</span>
                          <span className="text-xs text-ink-muted">— {p.heading}</span>
                          <span className="font-mono text-[11px] text-ink-muted">[{p.chunk_id}]</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <Badge tone="neutral">{p.source_document}</Badge>
                          <Badge tone={p.enforceability === "MANDATORY" ? "danger" : "info"}>
                            {p.enforceability}
                          </Badge>
                          <span className="font-mono font-semibold text-emerald-deep bg-emerald-deep/5 px-2 py-0.5 rounded">
                            RRF Score: {p.rrf_score.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Rank scores breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-canvas p-2.5 rounded-lg border border-line/40">
                        <div>
                          <span className="text-ink-muted block text-[10px]">BM25 Lexical Rank</span>
                          <span className="font-mono font-semibold text-ink">
                            {p.bm25_rank ? `#${p.bm25_rank} (${p.bm25_score?.toFixed(2)})` : "Unranked (>25)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-ink-muted block text-[10px]">Dense Vector Rank</span>
                          <span className="font-mono font-semibold text-ink">
                            {p.vector_rank ? `#${p.vector_rank} (cos: ${p.vector_similarity?.toFixed(3)})` : "Unranked (>83)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-ink-muted block text-[10px]">Effective Date</span>
                          <span className="font-mono text-ink">{p.effective_date}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted block text-[10px]">Statutory Penalty</span>
                          <span className="font-medium text-danger">{p.penalty_reference}</span>
                        </div>
                      </div>

                      {/* Verbatim passage snippet */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                          Verbatim Statutory Text:
                        </span>
                        <p className="text-xs leading-relaxed text-ink bg-card p-3 rounded-lg border border-line/60 font-serif italic">
                          "{p.text}"
                        </p>
                      </div>

                      {/* Academic Rationale */}
                      <div className="rounded-lg bg-emerald-deep/5 border border-emerald-mid/40 p-2.5 text-xs">
                        <span className="font-semibold text-emerald-deep block text-[11px] mb-0.5">
                          Academic Selection Rationale:
                        </span>
                        <p className="text-ink-soft leading-normal">{p.retrieval_rationale}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center text-ink-muted">
              <Info className="mx-auto h-6 w-6 mb-2 text-ink-muted" />
              <p>No retrieval explorer records found for this assessment.</p>
            </Card>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: EVIDENCE-TO-VERDICT TRACEABILITY MATRIX */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "trace" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                End-to-End Compliance Verification Audit Chain
              </h3>
              <p className="text-xs text-ink-muted">
                Observed Website Evidence → Statutory Provision → LLM Verdict → Grounding Check → Effective Score Contribution
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-ink-muted font-medium mr-1">Filter:</span>
              {["ALL", "GROUNDED", "UNGROUNDED", "PASS", "FAIL"].map((v) => (
                <button
                  key={v}
                  onClick={() => setFilterVerdict(v)}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                    filterVerdict === v
                      ? "bg-emerald-deep text-bone border-emerald-deep"
                      : "bg-card text-ink-soft border-line hover:border-emerald-mid"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredEvidence.map((item) => {
              const isPass = item.effective_verdict === "SUPPORTED";
              return (
                <Card
                  key={item.control_id}
                  className={`p-4 border transition-all ${
                    !item.is_grounded
                      ? "border-danger/40 bg-danger/5"
                      : isPass
                      ? "border-line bg-card hover:border-emerald-mid"
                      : "border-warning/30 bg-warning/5"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          isPass ? "bg-emerald-deep" : "bg-danger"
                        }`}
                      />
                      <Badge tone="brand">{item.c10_obligation_id}</Badge>
                      <span className="font-semibold text-sm text-ink">{item.control_name}</span>
                      <span className="text-xs font-mono text-ink-muted">[{item.control_id}]</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone={item.is_grounded ? "success" : "danger"}>
                        {item.is_grounded ? "Grounded in Context" : "UNGROUNDED (PENALIZED)"}
                      </Badge>
                      <Badge tone={isPass ? "success" : "danger"}>
                        {item.effective_verdict}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-ink bg-canvas px-2.5 py-1 rounded border border-line">
                        Weight: {item.control_weight} · Contrib: +{item.weighted_score_contribution.toFixed(1)} pts
                      </span>
                    </div>
                  </div>

                  {/* Traceability Grid */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Left: Website Observation */}
                    <div className="rounded-lg bg-canvas p-3 border border-line/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted uppercase">
                        <span>1. Observed Website Evidence</span>
                        <span className="font-mono">{item.evidence_ids.join(", ")}</span>
                      </div>
                      {item.evidence_snippets.length > 0 ? (
                        item.evidence_snippets.map((snip) => (
                          <div key={snip.id} className="space-y-1">
                            <p className="font-mono text-[11px] text-ink bg-card p-2 rounded border border-line/40">
                              "{snip.snippet}"
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-ink-muted">
                              <span>Source: {snip.source_type}</span>
                              <span>{snip.captured_at ? new Date(snip.captured_at).toLocaleTimeString() : "Captured"}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="font-mono text-[11px] text-ink-muted italic">No affirmative evidence captured.</p>
                      )}
                    </div>

                    {/* Right: Statutory Anchor & Model Verdict */}
                    <div className="rounded-lg bg-canvas p-3 border border-line/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted uppercase">
                        <span>2. Statutory Grounding Anchor</span>
                        <span className="font-mono text-emerald-deep font-bold">{item.statutory_ref}</span>
                      </div>
                      <div className="text-xs text-ink-soft space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Model ID:</span>
                          <span className="font-mono font-medium text-ink">{item.model_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Raw Model Verdict:</span>
                          <span className="font-semibold text-ink">{item.model_verdict} (conf: {(item.confidence * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Grounding Policy:</span>
                          <span className="font-mono text-emerald-deep">PENALIZE_AS_INCORRECT</span>
                        </div>
                        {item.grounding_reason && (
                          <p className="text-[11px] text-danger font-medium mt-1">
                            Grounding Note: {item.grounding_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remediation Advice */}
                  <div className="mt-2 text-xs flex items-center justify-between gap-2 text-ink-soft bg-beige-light/40 px-3 py-1.5 rounded">
                    <span className="font-medium text-emerald-deep shrink-0">Remediation Action:</span>
                    <span className="truncate">{item.remediation_advice}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: 10-MODEL GATEWAY EXECUTION & VERIFICATION */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "models" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                Faculty-Specified 10-Model Gateway Verification
              </h3>
              <p className="text-xs text-ink-muted">
                Real status of M01–M10 slots with measured latency, token usage, grounding compliance, and explicit blocker reasons
              </p>
            </div>
            <Badge tone="brand">
              {modelExecutions.filter((m) => m.is_verified_live).length} Verified Single-Run Live / 10 Total Slots
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelExecutions.map((m) => {
              const isVerified = m.is_verified_live;
              return (
                <Card
                  key={m.model_id}
                  className={`p-4 border transition-all ${
                    isVerified
                      ? "border-line bg-card hover:border-emerald-mid"
                      : "border-line/70 bg-canvas/60 opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-line/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone={isVerified ? "success" : "neutral"}>{m.model_id}</Badge>
                        <h4 className="font-semibold text-sm text-ink">{m.name}</h4>
                      </div>
                      <p className="text-xs font-mono text-ink-muted mt-0.5">
                        Provider: <strong>{m.provider}</strong> · ID: {m.actual_model_id || m.requested_model_id}
                      </p>
                    </div>

                    <Badge
                      tone={
                        m.status === "COMPLETED"
                          ? "success"
                          : m.status === "RATE_LIMITED"
                          ? "warning"
                          : m.status === "INSUFFICIENT_CREDITS"
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {m.status}
                    </Badge>
                  </div>

                  {/* Metrics Grid */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs bg-canvas p-2.5 rounded-lg border border-line/40">
                    <div>
                      <span className="text-ink-muted block text-[10px]">Latency</span>
                      <span className="font-mono font-semibold text-ink">
                        {m.latency_ms > 0 ? `${m.latency_ms} ms` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px]">Tokens (P/C)</span>
                      <span className="font-mono text-ink">
                        {m.total_tokens > 0 ? `${m.prompt_tokens}/${m.completion_tokens}` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px]">Grounding Rate</span>
                      <span className="font-mono font-semibold text-emerald-deep">
                        {isVerified ? `${m.grounding_rate_pct}%` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs pt-1">
                    <span className="text-ink-muted">
                      Trust Score: <strong className="text-ink">{m.trust_score != null ? `${m.trust_score}/100` : "N/A"}</strong> ({m.posture})
                    </span>
                    <span className="text-ink-muted">
                      Est. Cost: <strong className="font-mono text-ink">${m.estimated_cost_usd.toFixed(4)}</strong>
                    </span>
                  </div>

                  {/* Blocker Reason if Inactive */}
                  {m.blocker_reason && (
                    <div className="mt-3 rounded bg-beige-light p-2 text-[11px] text-ink-soft border border-line/60">
                      <strong className="text-ink font-semibold">Integrity Audit Note:</strong> {m.blocker_reason}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
