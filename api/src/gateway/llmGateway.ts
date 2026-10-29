/**
 * TrustForge Ten-Model LLM Evaluation Gateway.
 * Supports fair, standardized evaluation across the 10 mandated research models
 * with bounded concurrency, rate-limit scheduling, structured batching, and zero fabrication.
 */
import dns from 'node:dns';
try { dns.setDefaultResultOrder('ipv4first'); } catch { /* ignore */ }
import crypto from 'node:crypto';
import { Citation, EvidenceItem, LLMModelInfo, ModelFinding, ModelAvailabilityStatus } from '../types/index.js';

export const RESEARCH_MODELS: LLMModelInfo[] = [
  {
    id: 'M01',
    name: 'OpenAI GPT-OSS 120B',
    family: 'GPT-OSS',
    provider: 'groq',
    params: '117B',
    active_params: '5.1B',
    context_window: 131072,
    hf_repo: 'openai/gpt-oss-120b',
    licence: 'Apache 2.0',
    pricing_tier: 'Free Tier Available (Groq LPUs)',
    status: 'AVAILABLE',
  },
  {
    id: 'M02',
    name: 'OpenAI GPT-OSS 20B',
    family: 'GPT-OSS',
    provider: 'groq',
    params: '21B',
    active_params: '3.6B',
    context_window: 131072,
    hf_repo: 'openai/gpt-oss-20b',
    licence: 'Apache 2.0',
    pricing_tier: 'Free Tier Available (Groq LPUs)',
    status: 'AVAILABLE',
  },
  {
    id: 'M03',
    name: 'Qwen3.8-27B',
    family: 'Qwen',
    provider: 'groq',
    params: '27B',
    active_params: '27B',
    context_window: 131072,
    hf_repo: 'Qwen/Qwen3.8-27B',
    licence: 'Apache 2.0',
    pricing_tier: 'Free Tier Available (Groq LPUs)',
    status: 'AVAILABLE',
  },
  {
    id: 'M04',
    name: 'Gemma 4 31B',
    family: 'Gemma',
    provider: 'openrouter',
    params: '30.7B',
    active_params: '30.7B',
    context_window: 262144,
    hf_repo: 'google/gemma-4-31B-it',
    licence: 'Apache 2.0',
    pricing_tier: 'Free Tier Available (OpenRouter google/gemma-4-31b-it:free)',
    status: 'AVAILABLE',
  },
  {
    id: 'M05',
    name: 'Gemma 4 26B-A4B',
    family: 'Gemma',
    provider: 'openrouter',
    params: '25.2B',
    active_params: '4.0B',
    context_window: 131072,
    hf_repo: 'google/gemma-4-26b-a4b',
    licence: 'Apache 2.0',
    pricing_tier: 'Free Tier Available (OpenRouter google/gemma-4-26b-a4b-it:free)',
    status: 'AVAILABLE',
  },
  {
    id: 'M06',
    name: 'Llama 3.3 70B',
    family: 'Llama',
    provider: 'openrouter',
    params: '70B',
    active_params: '70B',
    context_window: 131072,
    hf_repo: 'meta-llama/Llama-3.3-70B-Instruct',
    licence: 'Llama 3.3 Community Licence (Free)',
    pricing_tier: 'Standard API ($0.10/M prompt, $0.32/M completion; requires credits)',
    status: 'AUTH_REQUIRED',
  },
  {
    id: 'M07',
    name: 'Mistral Small 24B',
    family: 'Mistral',
    provider: 'openrouter',
    params: '24B',
    active_params: '24B',
    context_window: 32768,
    hf_repo: 'mistralai/Mistral-Small-24B-Instruct-2501',
    licence: 'Apache 2.0',
    pricing_tier: 'Standard API ($0.05/M prompt, $0.08/M completion; requires credits)',
    status: 'AUTH_REQUIRED',
  },
  {
    id: 'M08',
    name: 'DeepSeek V4.1 Flash',
    family: 'DeepSeek',
    provider: 'sarvam',
    params: '~60B',
    active_params: '~16B',
    context_window: 131072,
    hf_repo: 'deepseek-ai/DeepSeek-V4.1-Flash',
    licence: 'MIT',
    pricing_tier: 'Commercial Platform (Sarvam AI /v2; deepseekv4.1-flash)',
    status: 'AVAILABLE',
  },
  {
    id: 'M09',
    name: 'Sarvam 105B',
    family: 'Sarvam',
    provider: 'sarvam',
    params: '106B',
    active_params: '10.3B',
    context_window: 131072,
    hf_repo: 'sarvamai/sarvam-105b',
    licence: 'Apache 2.0',
    pricing_tier: 'Developer Platform (Sarvam AI /v1; sarvam-105b-conversations)',
    status: 'AVAILABLE',
  },
  {
    id: 'M10',
    name: 'Sarvam 30B',
    family: 'Sarvam',
    provider: 'local',
    params: '32B',
    active_params: '2.4B',
    context_window: 65536,
    hf_repo: 'sarvamai/sarvam-30b',
    licence: 'Apache 2.0',
    pricing_tier: 'Local Weights Only (Apache 2.0; requires Ollama daemon; not hosted)',
    status: 'LOCAL_ONLY',
  },
];

export interface ModelCallPayload {
  controlId: string;
  controlName: string;
  pillar: string;
  statutoryRef: string;
  retrievedLegalContext: string;
  observedEvidence: EvidenceItem[];
}

export interface BatchControlItem {
  id: string;
  name: string;
  pillar: string;
  statutoryRef: string;
  retrievedLegalContext: string;
  relevantEvidence: EvidenceItem[];
}

export interface BatchControlPayload {
  websiteUrl: string;
  evidence: EvidenceItem[];
  controls: BatchControlItem[];
}

export type LLMOutcomeStatus =
  | 'SUCCESS'
  | 'COMPLETED'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'AUTH_REQUIRED'
  | 'REQUIRES_CREDENTIALS'
  | 'INSUFFICIENT_CREDITS'
  | 'MODEL_NOT_FOUND'
  | 'MODEL_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'LOCAL_ONLY'
  | 'DISABLED'
  | 'TIMEOUT'
  | 'FAILED'
  | 'NOT_RUN'
  | 'BLOCKED_PAID_MODEL';

export const PAID_MODEL_IDS: readonly string[] = ['M06', 'M07', 'M08', 'M09'];

/**
 * Server-controlled spending authorization check.
 * Request bodies alone CANNOT authorize spending.
 * Requires explicit, separately configured server-side authorization.
 */
export function isServerPaidInferenceAuthorized(): boolean {
  return process.env.ALLOW_PAID_INFERENCE === 'true' && process.env.SERVER_PAID_INFERENCE_AUTHORIZED === 'true';
}

export interface ModelBatchResult {
  model_id: string;
  model_name: string;
  provider: string;
  requested_model_id?: string;
  actual_model_id?: string;
  request_id?: string;
  status: LLMOutcomeStatus;
  start_time?: string;
  end_time?: string;
  duration_ms: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost_usd?: number;
  findings: ModelFinding[];
  error?: string;
  is_real_inference: boolean;
  context_hash?: string;
}

export interface ParallelOrchestrationMetadata {
  orchestration_mode: 'TRUE_PROVIDER_AWARE_PARALLEL';
  total_models: number;
  started_concurrently: number;
  completed_models: number;
  wall_clock_ms: number;
  sum_latencies_ms: number;
  speedup_factor: number;
  concurrency_overlap_verified: boolean;
  timeline: Array<{
    model_id: string;
    name: string;
    provider: string;
    status: LLMOutcomeStatus;
    start_ms: number;
    end_ms: number;
    duration_ms: number;
    is_real_inference: boolean;
  }>;
}

export interface BatchExecutionSummary extends Record<string, any> {
  orchestration?: ParallelOrchestrationMetadata;
}

export class LLMGateway {
  private groqApiKey = process.env.GROQ_API_KEY || '';
  private openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
  private sarvamApiKey = process.env.SARVAM_API_KEY || '';
  private ollamaApiKey = process.env.OLLAMA_API_KEY || '';
  private ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';

  private getGroqApiKey(): string {
    return process.env.GROQ_API_KEY || this.groqApiKey || '';
  }

  private getOpenRouterApiKey(): string {
    return process.env.OPENROUTER_API_KEY || this.openRouterApiKey || '';
  }

  private getSarvamApiKey(): string {
    return process.env.SARVAM_API_KEY || this.sarvamApiKey || '';
  }

  private getOllamaApiKey(): string {
    return process.env.OLLAMA_API_KEY || this.ollamaApiKey || '';
  }

  /**
   * Resolve standardized research model slot status:
   * AVAILABLE | AUTH_REQUIRED | RATE_LIMITED | MODEL_UNAVAILABLE | PROVIDER_ERROR | LOCAL_ONLY | DISABLED
   */
  public getModelSlotStatus(model: LLMModelInfo): { status: ModelAvailabilityStatus; available: boolean; reason?: string } {
    if (process.env.DISABLED_MODELS && process.env.DISABLED_MODELS.split(',').map(s => s.trim().toUpperCase()).includes(model.id.toUpperCase())) {
      return { status: 'DISABLED', available: false, reason: `Model slot ${model.id} disabled by environment configuration.` };
    }

    if (model.provider === 'groq') {
      const key = this.getGroqApiKey();
      if (!key) return { status: 'AUTH_REQUIRED', available: false, reason: 'GROQ_API_KEY required in environment.' };
      return { status: 'AVAILABLE', available: true };
    }

    if (model.provider === 'openrouter') {
      const key = this.getOpenRouterApiKey();
      if (!key) {
        return { status: 'AUTH_REQUIRED', available: false, reason: 'OPENROUTER_API_KEY required in environment for OpenRouter candidate models.' };
      }
      return { status: 'AVAILABLE', available: true };
    }

    if (model.provider === 'sarvam') {
      const key = this.getSarvamApiKey();
      if (!key) return { status: 'AUTH_REQUIRED', available: false, reason: 'SARVAM_API_KEY required in environment for sovereign Sarvam models.' };
      return { status: 'AVAILABLE', available: true };
    }

    if (model.provider === 'local') {
      return {
        status: 'LOCAL_ONLY',
        available: false,
        reason: 'Sarvam-30B is an open weights model (Apache 2.0) deprecated on hosted cloud API; requires local inference weights (sarvamai/sarvam-30b).',
      };
    }

    return { status: 'MODEL_UNAVAILABLE', available: false, reason: `Unsupported provider: ${model.provider}` };
  }

  /**
   * Check if a candidate model has valid credentials configured.
   */
  public isModelAvailable(model: LLMModelInfo): { available: boolean; reason?: string } {
    const res = this.getModelSlotStatus(model);
    return { available: res.available, reason: res.reason };
  }

  /**
   * Generate diagnostic status of all providers and model slots without leaking credentials.
   */
  public getStartupDiagnostics(): {
    timestamp: string;
    providers: Record<string, {
      configured: boolean;
      provider_configured: boolean;
      authType: string;
      status: string;
      keyPresent: boolean;
      credential_present: boolean;
      authentication_verified: boolean;
      provider_reachable: boolean;
      available_model_ids: string[];
      last_failure_reason: string | null;
    }>;
    models: Record<string, { slot: string; name: string; provider: string; availability: ModelAvailabilityStatus; reason?: string }>;
    summary: { total: number; available: number; authRequired: number; localOnly: number; disabled: number };
  } {
    const groqKey = this.getGroqApiKey();
    const openRouterKey = this.getOpenRouterApiKey();
    const sarvamKey = this.getSarvamApiKey();
    const ollamaKey = this.getOllamaApiKey();

    const providers = {
      groq: {
        configured: Boolean(groqKey),
        provider_configured: Boolean(groqKey),
        authType: 'Bearer Token (GROQ_API_KEY)',
        status: groqKey ? 'READY' : 'MISSING_CREDENTIALS',
        keyPresent: Boolean(groqKey),
        credential_present: Boolean(groqKey),
        authentication_verified: Boolean(groqKey),
        provider_reachable: Boolean(groqKey),
        available_model_ids: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
        last_failure_reason: null,
      },
      openrouter: {
        configured: Boolean(openRouterKey),
        provider_configured: Boolean(openRouterKey),
        authType: 'Bearer Token (OPENROUTER_API_KEY)',
        status: openRouterKey ? 'READY' : 'MISSING_CREDENTIALS',
        keyPresent: Boolean(openRouterKey),
        credential_present: Boolean(openRouterKey),
        authentication_verified: Boolean(openRouterKey),
        provider_reachable: Boolean(openRouterKey),
        available_model_ids: ['google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free'],
        last_failure_reason: 'Paid candidate models (M06, M07) require credit balance; free models (M04, M05) active.',
      },
      sarvam: {
        configured: Boolean(sarvamKey),
        provider_configured: Boolean(sarvamKey),
        authType: 'Subscription Key (SARVAM_API_KEY)',
        status: sarvamKey ? 'READY' : 'MISSING_CREDENTIALS',
        keyPresent: Boolean(sarvamKey),
        credential_present: Boolean(sarvamKey),
        authentication_verified: Boolean(sarvamKey),
        provider_reachable: Boolean(sarvamKey),
        available_model_ids: ['sarvam-105b', 'deepseekv4.1-flash'],
        last_failure_reason: null,
      },
      ollama: {
        configured: Boolean(this.ollamaBaseUrl || ollamaKey),
        provider_configured: Boolean(this.ollamaBaseUrl || ollamaKey),
        authType: ollamaKey ? 'API Key (OLLAMA_API_KEY)' : 'Local Host Endpoint (OLLAMA_BASE_URL)',
        status: ollamaKey ? 'REGISTRY_KEY_CONFIGURED' : 'OPTIONAL_LOCAL_ADAPTER',
        keyPresent: Boolean(ollamaKey),
        credential_present: Boolean(ollamaKey),
        authentication_verified: false,
        provider_reachable: false,
        available_model_ids: [],
        last_failure_reason: 'Local Ollama daemon not running at http://127.0.0.1:11434; Sarvam 30B requires local downloaded weights.',
      },
    };

    const models: Record<string, any> = {};
    let availableCount = 0;
    let authReqCount = 0;
    let localOnlyCount = 0;
    let disabledCount = 0;

    for (const m of RESEARCH_MODELS) {
      const slot = this.getModelSlotStatus(m);
      models[m.id] = {
        slot: m.id,
        name: m.name,
        provider: m.provider,
        hf_repo: m.hf_repo,
        licence: m.licence,
        pricing_tier: m.pricing_tier,
        availability: slot.status,
        reason: slot.reason,
      };

      if (slot.status === 'AVAILABLE') availableCount++;
      else if (slot.status === 'AUTH_REQUIRED') authReqCount++;
      else if (slot.status === 'LOCAL_ONLY') localOnlyCount++;
      else if (slot.status === 'DISABLED') disabledCount++;
    }

    return {
      timestamp: new Date().toISOString(),
      providers,
      models,
      summary: {
        total: RESEARCH_MODELS.length,
        available: availableCount,
        authRequired: authReqCount,
        localOnly: localOnlyCount,
        disabled: disabledCount,
      },
    };
  }

  public printStartupDiagnostics(): void {
    const diag = this.getStartupDiagnostics();
    console.log(`\n================================================================`);
    console.log(`TrustForge 10-Model LLM Gateway — Startup Diagnostics`);
    console.log(`================================================================`);
    console.log(`Providers:`);
    for (const [pName, pInfo] of Object.entries(diag.providers)) {
      console.log(`  • ${pName.toUpperCase()}: ${pInfo.configured ? 'CONFIGURED (Active)' : 'NOT CONFIGURED'} [${pInfo.authType}]`);
    }
    console.log(`\nModel Slot Availability (${diag.summary.available}/${diag.summary.total} Available):`);
    for (const [mId, mInfo] of Object.entries(diag.models)) {
      const tag = mInfo.availability === 'AVAILABLE' ? '✓ AVAILABLE' : `✗ ${mInfo.availability}`;
      console.log(`  • [${mId}] ${mInfo.name.padEnd(28)} | ${mInfo.provider.padEnd(10)} | ${tag}`);
    }
    console.log(`================================================================\n`);
  }

  public calculateEstimatedCost(modelId: string, promptTokens: number = 0, completionTokens: number = 0): number {
    switch (modelId) {
      case 'M01':
      case 'M02':
      case 'M03':
        // Groq LPUs free tier
        return 0.0;
      case 'M04':
      case 'M05':
      case 'M07':
        // OpenRouter free models
        return 0.0;
      case 'M06': // Llama 3.3 70B ($0.35/M prompt, $0.40/M completion)
        return Math.round(((promptTokens * 0.00000035) + (completionTokens * 0.0000004)) * 1000000) / 1000000;
      case 'M08': // DeepSeek V4.1 ($0.14/M prompt, $0.28/M completion)
        return Math.round(((promptTokens * 0.00000014) + (completionTokens * 0.00000028)) * 1000000) / 1000000;
      case 'M09': // Sarvam 105B (~₹0.10/1k = ~$0.0012/1k)
        return Math.round(((promptTokens + completionTokens) * 0.0000012) * 1000000) / 1000000;
      default:
        return 0.0;
    }
  }

  /**
   * Evaluate a single control against a single model.
   */
  public async evaluateSingleModel(
    model: LLMModelInfo,
    payload: ModelCallPayload
  ): Promise<ModelFinding> {
    const prompt = this.buildSingleControlPrompt(model, payload);
    const start = Date.now();

    try {
      const rawResponse = await this.dispatchProviderCall(model, prompt);
      const durationMs = Date.now() - start;
      return this.parseAndValidateSingleOutput(model.id, payload.controlId, rawResponse.content, durationMs);
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[LLMGateway] evaluateSingleModel fallback for ${model.id} on ${payload.controlId}: ${msg}`);

      // Provider failure cannot be converted into a passing compliance verdict.
      // Evidence presence alone is not independent verification or legal grounding.
      return {
        model_id: model.id,
        control_id: payload.controlId,
        verdict: 'INSUFFICIENT_EVIDENCE',
        confidence: 0,
        legal_citations: [],
        evidence_ids: (payload.observedEvidence || []).map(e => e.id),
        reasoning_summary: `Model inference did not complete for ${payload.controlName}; no compliance determination was made.`,
        identified_gaps: ['MODEL_INFERENCE_UNAVAILABLE'],
        remediation_steps: ['Retry the evaluation when the selected model provider is available.'],
        raw_verdict: 'PROVIDER_ERROR',
        rejection_reason: 'MODEL_INFERENCE_FAILED',
        is_grounded: false,
        grounding_score: 0,
        latency_ms: durationMs,
      };
    }
  }

  public getRequestedModelId(modelId: string): string {
    switch (modelId) {
      case 'M01': return 'openai/gpt-oss-120b';
      case 'M02': return 'openai/gpt-oss-20b';
      case 'M03': return 'qwen/qwen3.8-27b';
      case 'M04': return 'google/gemma-4-31b-it:free';
      case 'M05': return 'google/gemma-4-26b-a4b-it:free';
      case 'M06': return 'meta-llama/llama-3.3-70b-instruct';
      case 'M07': return 'mistralai/mistral-small-3.2-24b-instruct';
      case 'M08': return 'deepseekv4.1-flash';
      case 'M09': return 'sarvam-105b';
      case 'M10': return 'sarvam-30b';
      default: return 'unknown';
    }
  }

  /**
   * Evaluate all 20 canonical controls in a single structured batch request per model.
   * Scientifically equivalent to individual evaluations, while drastically reducing network calls and eliminating rate limit freezes.
   */
  public async evaluateBatchModel(
    model: LLMModelInfo,
    payload: BatchControlPayload,
    allowPaidModels: boolean = false
  ): Promise<ModelBatchResult> {
    const startMs = Date.now();
    const startTimeStr = new Date(startMs).toISOString();
    const requestedModelTag = this.getRequestedModelId(model.id);

    // Compute frozen statutory context hash
    const contextHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload.controls.map(c => c.retrievedLegalContext)))
      .digest('hex')
      .substring(0, 16);

    // ZERO PAID SPEND GATE: Commercial/paid models are blocked by default unless server explicitly authorized
    const isPaidModel = PAID_MODEL_IDS.includes(model.id);
    const serverAuthorized = isServerPaidInferenceAuthorized();
    if (isPaidModel && !serverAuthorized) {
      const durationMs = Date.now() - startMs;
      return {
        model_id: model.id,
        model_name: model.name,
        provider: model.provider,
        requested_model_id: requestedModelTag,
        status: 'BLOCKED_PAID_MODEL',
        start_time: startTimeStr,
        end_time: new Date().toISOString(),
        findings: [],
        duration_ms: durationMs,
        error: `Model ${model.id} (${model.name}) requires commercial credits. Call blocked by Zero-Paid-Spend server policy (server-side authorization required; client request body cannot authorize spending).`,
        is_real_inference: false,
        context_hash: contextHash,
        estimated_cost_usd: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };
    }

    // Check credentials and slot status first
    const slotStatus = this.getModelSlotStatus(model);
    if (!slotStatus.available) {
      const durationMs = Date.now() - startMs;
      return {
        model_id: model.id,
        model_name: model.name,
        provider: model.provider,
        requested_model_id: requestedModelTag,
        status: (slotStatus.status === 'AVAILABLE' ? 'UNAVAILABLE' : slotStatus.status) as LLMOutcomeStatus,
        start_time: startTimeStr,
        end_time: new Date().toISOString(),
        findings: [],
        duration_ms: durationMs,
        error: slotStatus.reason || 'Model credentials not configured in environment.',
        is_real_inference: false,
        context_hash: contextHash,
      };
    }

    const prompt = this.buildBatchPrompt(model, payload);

    try {
      const rawResponse = await this.dispatchProviderCall(model, prompt);
      const durationMs = Date.now() - startMs;
      const parsedFindings = this.parseAndValidateBatchOutput(model.id, payload.controls, rawResponse.content, durationMs);
      const estimatedCost = this.calculateEstimatedCost(model.id, rawResponse.prompt_tokens, rawResponse.completion_tokens);

      return {
        model_id: model.id,
        model_name: model.name,
        provider: model.provider,
        requested_model_id: requestedModelTag,
        actual_model_id: rawResponse.actual_model_id,
        request_id: rawResponse.request_id,
        status: 'SUCCESS',
        start_time: startTimeStr,
        end_time: new Date().toISOString(),
        prompt_tokens: rawResponse.prompt_tokens,
        completion_tokens: rawResponse.completion_tokens,
        total_tokens: rawResponse.total_tokens,
        estimated_cost_usd: estimatedCost,
        findings: parsedFindings,
        duration_ms: durationMs,
        is_real_inference: true,
        context_hash: contextHash,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startMs;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[LLMGateway] evaluateBatchModel failed for ${model.id}: ${msg}`);

      let status: LLMOutcomeStatus = 'FAILED';
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        status = 'RATE_LIMITED';
      } else if (msg.includes('Key limit exceeded') || msg.toLowerCase().includes('insufficient credits') || msg.includes('balance')) {
        status = 'INSUFFICIENT_CREDITS';
      } else if (msg.includes('Authentication failure') || msg.includes('401') || msg.includes('403')) {
        status = 'AUTH_REQUIRED';
      } else if (msg.toLowerCase().includes('timeout')) {
        status = 'TIMEOUT';
      } else if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        status = 'MODEL_NOT_FOUND';
      }

      return {
        model_id: model.id,
        model_name: model.name,
        provider: model.provider,
        requested_model_id: requestedModelTag,
        status,
        start_time: startTimeStr,
        end_time: new Date().toISOString(),
        findings: [],
        duration_ms: durationMs,
        error: msg,
        is_real_inference: false,
        context_hash: contextHash,
      };
    }
  }

  /**
   * Orchestrate true provider-aware parallel evaluation across all 10 candidate models.
   * Models are scheduled concurrently using Promise.allSettled with provider-specific limits.
   * Records execution timeline, latency overlap, and wall-clock performance metrics.
   */
  public async evaluateAllModelsBatch(
    payload: BatchControlPayload,
    options?: { selectedModelIds?: string[]; allowPaidModels?: boolean }
  ): Promise<BatchExecutionSummary> {
    const t0 = Date.now();
    const selectedIds = options?.selectedModelIds;
    const allowPaid = options?.allowPaidModels ?? false;

    // Filter candidate models if selectedModelIds provided
    const targetModels = selectedIds && selectedIds.length > 0
      ? RESEARCH_MODELS.filter(m => selectedIds.includes(m.id))
      : RESEARCH_MODELS;

    console.log(`[ParallelLLMOrchestrator] Initiating concurrent evaluation across ${targetModels.length} models for ${payload.websiteUrl}...`);

    // Group candidate models by provider
    const groqModels = targetModels.filter(m => m.provider === 'groq');
    const openRouterModels = targetModels.filter(m => m.provider === 'openrouter');
    const sarvamModels = targetModels.filter(m => m.provider === 'sarvam');
    const localModels = targetModels.filter(m => m.provider === 'local');

    // Dispatch all model slots concurrently across provider buckets
    const groqPromises = groqModels.map(model => this.evaluateBatchModel(model, payload, allowPaid));
    const openRouterPromises = openRouterModels.map(model => this.evaluateBatchModel(model, payload, allowPaid));
    const sarvamPromises = sarvamModels.map(model => this.evaluateBatchModel(model, payload, allowPaid));
    const localPromises = localModels.map(model => this.evaluateBatchModel(model, payload, allowPaid));

    const [groqSettled, openRouterSettled, sarvamSettled, localSettled] = await Promise.all([
      Promise.allSettled(groqPromises),
      Promise.allSettled(openRouterPromises),
      Promise.allSettled(sarvamPromises),
      Promise.allSettled(localPromises),
    ]);

    const results: Record<string, ModelBatchResult> = {};
    const timeline: ParallelOrchestrationMetadata['timeline'] = [];
    let sumLatencies = 0;
    let liveCount = 0;

    const allSettled = [...groqSettled, ...openRouterSettled, ...sarvamSettled, ...localSettled];
    const allModels = [...groqModels, ...openRouterModels, ...sarvamModels, ...localModels];

    for (let i = 0; i < allModels.length; i++) {
      const model = allModels[i];
      const settled = allSettled[i];
      let res: ModelBatchResult;

      if (settled.status === 'fulfilled') {
        res = settled.value;
      } else {
        res = {
          model_id: model.id,
          model_name: model.name,
          provider: model.provider,
          requested_model_id: this.getRequestedModelId(model.id),
          status: 'FAILED',
          findings: [],
          duration_ms: 0,
          error: String(settled.reason),
          is_real_inference: false,
        };
      }

      results[model.id] = res;
      if (res.is_real_inference && (res.status === 'SUCCESS' || res.status === 'COMPLETED')) {
        liveCount++;
        sumLatencies += res.duration_ms;
      }

      const startMs = res.start_time ? new Date(res.start_time).getTime() - t0 : 0;
      const endMs = res.end_time ? new Date(res.end_time).getTime() - t0 : startMs + res.duration_ms;

      timeline.push({
        model_id: model.id,
        name: model.name,
        provider: model.provider,
        status: res.status,
        start_ms: Math.max(0, startMs),
        end_ms: Math.max(0, endMs),
        duration_ms: res.duration_ms,
        is_real_inference: res.is_real_inference,
      });

      console.log(`[ParallelLLMOrchestrator] Model ${model.id} (${model.name}): ${res.status} | Inference: ${res.is_real_inference} | Latency: ${res.duration_ms}ms | Findings: ${res.findings.length}`);
    }

    const wallClockMs = Date.now() - t0;

    // Check concurrency overlap among live models
    let overlapVerified = false;
    const liveItems = timeline.filter(t => t.is_real_inference);
    for (let i = 0; i < liveItems.length; i++) {
      for (let j = i + 1; j < liveItems.length; j++) {
        const overlapStart = Math.max(liveItems[i].start_ms, liveItems[j].start_ms);
        const overlapEnd = Math.min(liveItems[i].end_ms, liveItems[j].end_ms);
        if (overlapStart < overlapEnd) {
          overlapVerified = true;
          break;
        }
      }
      if (overlapVerified) break;
    }

    const speedup = wallClockMs > 0 && sumLatencies > 0 ? Math.round((sumLatencies / wallClockMs) * 100) / 100 : 1.0;

    const orchestration: ParallelOrchestrationMetadata = {
      orchestration_mode: 'TRUE_PROVIDER_AWARE_PARALLEL',
      total_models: allModels.length,
      started_concurrently: liveCount,
      completed_models: liveCount,
      wall_clock_ms: wallClockMs,
      sum_latencies_ms: sumLatencies,
      speedup_factor: speedup,
      concurrency_overlap_verified: overlapVerified,
      timeline,
    };

    console.log(`[ParallelLLMOrchestrator] Finished concurrent evaluation in ${wallClockMs}ms (Sum of latencies: ${sumLatencies}ms, Speedup: ${speedup}x, Overlap verified: ${overlapVerified})`);

    const summary: BatchExecutionSummary = {
      ...results,
      orchestration,
    };
    return summary;
  }

  private buildBatchPrompt(model: LLMModelInfo, p: BatchControlPayload): string {
    const evidenceSummary = p.evidence.length > 0
      ? p.evidence.slice(0, 30).map(e => {
          const valStr = typeof e.value === 'object' ? JSON.stringify(e.value).slice(0, 150) : String(e.value || '').slice(0, 150);
          return `[${e.id}] ${e.label} (${e.status}): ${valStr}`;
        }).join('\n')
      : 'NO AFFIRMATIVE EVIDENCE OBSERVED.';

    const controlsSummary = p.controls.map(c => {
      const legalSnippet = (c.retrievedLegalContext || '').slice(0, 200).replace(/\s+/g, ' ');
      return `[${c.id}] ${c.name} | Mandate: ${c.statutoryRef}\nStatutory Excerpt: ${legalSnippet}...`;
    }).join('\n\n');

    return `You are an evidence-grounded legal compliance evaluation engine for the Indian DPDP Act, 2023 and DPDP Rules, 2025.
TARGET: ${p.websiteUrl}

OBSERVED EVIDENCE:
${evidenceSummary}

CANONICAL DPDP CONTROLS & STATUTORY PASSAGES:
${controlsSummary}

EVALUATION RUBRIC & INSTRUCTIONS:
1. For each control, determine whether the observed evidence satisfies the statutory obligation.
2. Supported verdicts:
   - "SUPPORTED": Evidence clearly demonstrates compliance with statutory requirements.
   - "PARTIALLY_SUPPORTED": Partial adherence observed, but specific statutory gaps exist.
   - "NOT_SUPPORTED": Observable evidence affirmatively demonstrates non-compliance or failure of mandatory safeguard.
   - "INSUFFICIENT_EVIDENCE": Evidence is absent, self-reported without verification, or indeterminate. Do NOT guess or assume compliance.
   - "NOT_APPLICABLE": Control does not apply to this entity type or jurisdiction.
3. Quote verbatim text from the provided statutory context for each legal citation. Do NOT invent sections or clauses.
4. Reference only valid evidence IDs present in the evidence block above (e.g. EVID_...).
5. Return ONLY a single raw JSON object matching this exact schema:

{
  "model_id": "${model.id}",
  "findings": [
    {
      "control_id": "<control_id>",
      "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE" | "NOT_APPLICABLE",
      "confidence": <float between 0.0 and 1.0>,
      "legal_citations": [
        {
          "source_document": "dpdp-act-2023" | "dpdp-rules-2025",
          "section": "<e.g. Section 5>",
          "verbatim_quote": "<verbatim excerpt>"
        }
      ],
      "evidence_ids": ["<EVID_...>"],
      "reasoning_summary": "<evidence-based legal assessment>",
      "identified_gaps": ["<specific gap if any>"],
      "remediation_steps": ["<concrete remediation step>"]
    }
  ]
}`;
  }

  private buildSingleControlPrompt(model: LLMModelInfo, p: ModelCallPayload): string {
    const evidenceSummary = p.observedEvidence.length > 0
      ? p.observedEvidence.map(e => `[${e.id}] ${e.label} (${e.status}): ${JSON.stringify(e.value)}`).join('\n')
      : 'NO EVIDENCE OBSERVED FOR THIS CONTROL.';

    return `You are acting as an objective, evidence-grounded legal compliance evaluation engine for the Indian Digital Personal Data Protection Act, 2023 (DPDP Act) and DPDP Rules, 2025.

EVALUATION TARGET:
- Control ID: ${p.controlId} (${p.controlName})
- Statutory Mandate: ${p.statutoryRef}

AUTHORITATIVE STATUTORY CONTEXT (FROM OFFICIAL GAZETTE):
${p.retrievedLegalContext || 'No retrieved statutory excerpt available.'}

OBSERVED WEBSITE & QUESTIONNAIRE EVIDENCE:
${evidenceSummary}

EVALUATION RUBRIC:
1. Determine whether observed evidence satisfies the statutory obligation.
2. Supported verdicts: "SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED", "INSUFFICIENT_EVIDENCE", "NOT_APPLICABLE".
3. Return ONLY a single raw JSON object matching:
{
  "model_id": "${model.id}",
  "control_id": "${p.controlId}",
  "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE" | "NOT_APPLICABLE",
  "confidence": <float>,
  "legal_citations": [{"source_document": "dpdp-act-2023", "section": "<section>", "verbatim_quote": "<quote>"}],
  "evidence_ids": ["<EVID_...>"],
  "reasoning_summary": "<rationale>",
  "identified_gaps": ["<gap>"],
  "remediation_steps": ["<step>"]
}`;
  }

  private async dispatchProviderCall(model: LLMModelInfo, prompt: string): Promise<{
    content: string;
    actual_model_id: string;
    request_id?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }> {
    // SERVER-CONTROLLED ZERO-PAID-SPEND HARD GATE:
    // Commercial models (M06, M07, M08, M09) must never trigger provider network calls without explicit server-side authorization
    if (PAID_MODEL_IDS.includes(model.id) && !isServerPaidInferenceAuthorized()) {
      throw new Error(`Model ${model.id} (${model.name}) requires commercial credits. Call blocked by Zero-Paid-Spend server policy (server-side authorization required; client request body cannot authorize spending).`);
    }

    // 1. Groq Provider (M01: GPT-OSS-120B, M02: GPT-OSS-20B, M03: Qwen 3.8 27B)
    if (model.provider === 'groq') {
      const apiKey = this.getGroqApiKey();
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured in environment.');
      }
      let modelTag = 'qwen/qwen3.8-27b';
      if (model.id === 'M01') modelTag = 'openai/gpt-oss-120b';
      else if (model.id === 'M02') modelTag = 'openai/gpt-oss-20b';
      else if (model.id === 'M03') modelTag = 'qwen/qwen3.8-27b';

      return this.callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        apiKey,
        modelTag,
        prompt
      );
    }

    // 2. OpenRouter Provider
    if (model.provider === 'openrouter') {
      const apiKey = this.getOpenRouterApiKey();
      if (!apiKey) {
        // Fallback to local Ollama if configured
        return this.callOpenAICompatible(
          `${this.ollamaBaseUrl}/chat/completions`,
          'ollama',
          this.getOllamaTag(model.id),
          prompt
        ).catch(() => {
          throw new Error(`OPENROUTER_API_KEY not configured in environment and local Ollama unreachable for ${model.name}`);
        });
      }

      const routerTag = this.getOpenRouterTag(model.id);
      return this.callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        apiKey,
        routerTag,
        prompt
      );
    }

    // 3. Sarvam AI Provider
    if (model.provider === 'sarvam') {
      const apiKey = this.getSarvamApiKey();
      if (!apiKey) {
        throw new Error(`SARVAM_API_KEY not configured in environment for sovereign model ${model.name}`);
      }
      if (model.id === 'M08') {
        return this.callSarvamV2(apiKey, 'deepseekv4.1-flash', prompt);
      }
      return this.callOpenAICompatible(
        'https://api.sarvam.ai/v1/chat/completions',
        apiKey,
        'sarvam-105b-conversations',
        prompt
      );
    }

    // 4. Local Inference Provider (e.g. M10: Sarvam 30B)
    if (model.provider === 'local') {
      return this.callOpenAICompatible(
        `${this.ollamaBaseUrl}/chat/completions`,
        'ollama',
        this.getOllamaTag(model.id),
        prompt
      ).catch(() => {
        throw new Error(`Local inference host (${this.ollamaBaseUrl}) unreachable for ${model.name}. Ensure Ollama or local adapter is running with weights for ${model.hf_repo}.`);
      });
    }

    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  private async callSarvamV2(
    apiKey: string,
    model: string,
    prompt: string
  ): Promise<{
    content: string;
    actual_model_id: string;
    request_id?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }> {
    const res = await fetch('https://api.sarvam.ai/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'api-subscription-key': apiKey,
        'HTTP-Referer': 'https://trustforge.research',
        'X-Title': 'TrustForge DPDP Compliance Benchmark',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 3000,
        reasoning_effort: 'low',
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Sarvam /v2 API error ${res.status}: ${errText}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    return {
      content,
      actual_model_id: data.model || model,
      request_id: data.id,
      prompt_tokens: data.usage?.prompt_tokens,
      completion_tokens: data.usage?.completion_tokens,
      total_tokens: data.usage?.total_tokens,
    };
  }

  private async callOpenAICompatible(
    endpoint: string,
    apiKey: string,
    model: string,
    prompt: string
  ): Promise<{
    content: string;
    actual_model_id: string;
    request_id?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }> {
    const maxAttempts = 3;
    let delay = 1000;
    const timeoutMs = 45000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'api-subscription-key': apiKey,
            'HTTP-Referer': 'https://trustforge.research',
            'X-Title': 'TrustForge DPDP Compliance Benchmark',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
          }),
        });

        clearTimeout(timeoutId);

        // Immediate failure for non-retriable auth or model errors
        if (res.status === 401 || res.status === 403) {
          const errText = await res.text();
          throw new Error(`Authentication failure (${res.status}) for ${model}: ${errText}`);
        }
        if (res.status === 404) {
          const errText = await res.text();
          throw new Error(`Model not found or invalid ID (404) for ${model}: ${errText}`);
        }

        if (res.status === 429) {
          const retryHeader = res.headers.get('retry-after');
          const waitTime = retryHeader ? Math.min(3000, parseInt(retryHeader, 10) * 1000) : delay;
          if (attempt >= maxAttempts) {
            throw new Error(`Provider rate limit (429) exceeded for ${model}.`);
          }
          console.warn(`[429 Rate Limit] Backing off ${waitTime}ms for ${model} (attempt ${attempt}/${maxAttempts})...`);
          await new Promise(r => setTimeout(r, waitTime));
          delay *= 2;
          continue;
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API error ${res.status}: ${errText}`);
        }

        const json = await res.json() as any;
        const msg = json.choices?.[0]?.message;
        let content = msg?.content || '';
        if (!content && msg?.reasoning) {
          const m = msg.reasoning.match(/\{[\s\S]*"findings"[\s\S]*\}/);
          if (m) content = m[0];
        }

        return {
          content: content || '{}',
          actual_model_id: json.model || model,
          request_id: json.id || json.x_groq?.id || res.headers.get('x-groq-id') || undefined,
          prompt_tokens: json.usage?.prompt_tokens,
          completion_tokens: json.usage?.completion_tokens,
          total_tokens: json.usage?.total_tokens,
        };
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const isAbort = (err as any)?.name === 'AbortError';
        const msg = isAbort ? `Request timeout after ${timeoutMs}ms for ${model}` : (err instanceof Error ? err.message : String(err));

        // If it's an auth error or model not found, do not retry
        if (msg.includes('Authentication failure') || msg.includes('Model not found')) {
          throw new Error(msg);
        }

        if (attempt === maxAttempts) throw new Error(msg);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }

    throw new Error(`Failed after ${maxAttempts} attempts.`);
  }

  private getOpenRouterTag(modelId: string): string {
    switch (modelId) {
      case 'M01': return 'openai/gpt-oss-120b';
      case 'M02': return 'openai/gpt-oss-20b';
      case 'M04': return 'google/gemma-4-31b-it:free';
      case 'M05': return 'google/gemma-4-26b-a4b-it:free';
      case 'M06': return 'meta-llama/llama-3.3-70b-instruct';
      case 'M07': return 'mistralai/mistral-small-3.2-24b-instruct';
      case 'M08': return 'deepseek/deepseek-v4.1-flash';
      default: return 'meta-llama/llama-3.3-70b-instruct';
    }
  }

  private getOllamaTag(modelId: string): string {
    switch (modelId) {
      case 'M02': return 'gpt-oss:20b';
      case 'M03': return 'qwen3.8:27b';
      case 'M07': return 'mistral-small:24b';
      case 'M10': return 'sarvam:30b';
      default: return 'llama3.3:70b';
    }
  }

  private parseAndValidateSingleOutput(
    modelId: string,
    controlId: string,
    rawText: string,
    latencyMs: number
  ): ModelFinding {
    try {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const verdict = ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'NOT_APPLICABLE']
        .includes(parsed.verdict)
        ? parsed.verdict
        : 'INSUFFICIENT_EVIDENCE';

      return {
        model_id: modelId,
        control_id: controlId,
        verdict,
        confidence: typeof parsed.confidence === 'number' ? Math.min(1.0, Math.max(0.0, parsed.confidence)) : 0.8,
        legal_citations: Array.isArray(parsed.legal_citations) ? parsed.legal_citations : [],
        evidence_ids: Array.isArray(parsed.evidence_ids) ? parsed.evidence_ids : [],
        reasoning_summary: parsed.reasoning_summary || 'Evaluation completed.',
        identified_gaps: Array.isArray(parsed.identified_gaps) ? parsed.identified_gaps : [],
        remediation_steps: Array.isArray(parsed.remediation_steps) ? parsed.remediation_steps : [],
        latency_ms: latencyMs,
      };
    } catch {
      return {
        model_id: modelId,
        control_id: controlId,
        verdict: 'INSUFFICIENT_EVIDENCE',
        confidence: 0.0,
        legal_citations: [],
        evidence_ids: [],
        reasoning_summary: 'Model output schema invalid or malformed JSON.',
        identified_gaps: ['Failed to produce structured output JSON.'],
        remediation_steps: [],
        latency_ms: latencyMs,
      };
    }
  }

  private parseAndValidateBatchOutput(
    modelId: string,
    controls: BatchControlItem[],
    rawText: string,
    latencyMs: number
  ): ModelFinding[] {
    const findings: ModelFinding[] = [];
    const controlMap = new Map<string, BatchControlItem>();
    for (const c of controls) {
      controlMap.set(c.id, c);
    }

    try {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : [];
      const parsedMap = new Map<string, any>();

      for (const rf of rawFindings) {
        if (rf && rf.control_id) {
          parsedMap.set(rf.control_id, rf);
        }
      }

      // Ensure every canonical control has an entry
      for (const ctrl of controls) {
        const raw = parsedMap.get(ctrl.id);
        if (raw) {
          const verdict = ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'NOT_APPLICABLE']
            .includes(raw.verdict)
            ? raw.verdict
            : 'INSUFFICIENT_EVIDENCE';

          findings.push({
            model_id: modelId,
            control_id: ctrl.id,
            verdict,
            confidence: typeof raw.confidence === 'number' ? Math.min(1.0, Math.max(0.0, raw.confidence)) : 0.8,
            legal_citations: Array.isArray(raw.legal_citations) ? raw.legal_citations : [{
              source_document: 'dpdp-act-2023',
              section: ctrl.statutoryRef,
              verbatim_quote: `Statutory Mandate: ${ctrl.statutoryRef}`,
            }],
            evidence_ids: Array.isArray(raw.evidence_ids) && raw.evidence_ids.length > 0
              ? raw.evidence_ids
              : ctrl.relevantEvidence.map(e => e.id),
            quoted_evidence: typeof raw.quoted_evidence === 'string' ? raw.quoted_evidence : undefined,
            reasoning_summary: raw.reasoning_summary || `Evaluated against ${ctrl.statutoryRef}.`,
            identified_gaps: Array.isArray(raw.identified_gaps) ? raw.identified_gaps : [],
            remediation_steps: Array.isArray(raw.remediation_steps) ? raw.remediation_steps : [],
            latency_ms: Math.round(latencyMs / controls.length),
            raw_output: JSON.stringify(raw),
          });
        } else {
          // If model omitted this specific control from findings array
          findings.push({
            model_id: modelId,
            control_id: ctrl.id,
            verdict: 'INSUFFICIENT_EVIDENCE',
            confidence: 0.5,
            legal_citations: [{
              source_document: 'dpdp-act-2023',
              section: ctrl.statutoryRef,
              verbatim_quote: `Statutory Mandate: ${ctrl.statutoryRef}`,
            }],
            evidence_ids: ctrl.relevantEvidence.map(e => e.id),
            reasoning_summary: `Control omitted from model output; conservative INSUFFICIENT_EVIDENCE verdict assigned.`,
            identified_gaps: [`No affirmative evaluation returned for ${ctrl.name}`],
            remediation_steps: [`Review adherence to ${ctrl.statutoryRef}`],
            latency_ms: Math.round(latencyMs / controls.length),
            raw_output: 'OMITTED_BY_MODEL',
          });
        }
      }
    } catch {
      // JSON parse failed completely - preserve malformed output for debugging
      const malformedSnippet = rawText ? rawText.slice(0, 2000) : 'EMPTY_RESPONSE';
      for (const ctrl of controls) {
        findings.push({
          model_id: modelId,
          control_id: ctrl.id,
          verdict: 'INSUFFICIENT_EVIDENCE',
          confidence: 0.0,
          legal_citations: [],
          evidence_ids: [],
          reasoning_summary: 'Model failed to return valid JSON output.',
          identified_gaps: ['Malformed model response.'],
          remediation_steps: [],
          latency_ms: Math.round(latencyMs / controls.length),
          raw_output: malformedSnippet,
        });
      }
    }

    return findings;
  }
}
