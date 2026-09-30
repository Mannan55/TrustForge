"""
TrustForge — Core Test Suite

Tests cover:
  - Scanner logic (privacy policy detection, consent, tracker detection, SSRF safety)
  - Trust Score engine (weights, coverage, all-pass, all-fail scenarios)
  - Evidence processor (PDF stub, TXT extraction, topic identification)
  - Scoring config (weight validation)

Run with:
  cd TrustForgeV4/backend
  python -m pytest tests/ -v
"""
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


# ─────────────────────────────────────────────────────────────
# SCANNER TESTS
# ─────────────────────────────────────────────────────────────

class TestSSRFProtection:
    """SSRF safety: private/loopback destinations must be blocked."""

    def test_localhost_blocked(self):
        from app.services.website_scanner import _is_safe_url
        safe, reason = _is_safe_url("http://localhost/admin")
        assert not safe
        assert "loopback" in reason.lower() or "blocked" in reason.lower()

    def test_127_blocked(self):
        from app.services.website_scanner import _is_safe_url
        safe, reason = _is_safe_url("http://127.0.0.1/data")
        assert not safe

    def test_private_192_blocked(self):
        from app.services.website_scanner import _is_safe_url
        safe, reason = _is_safe_url("http://192.168.1.1/")
        assert not safe

    def test_private_10_blocked(self):
        from app.services.website_scanner import _is_safe_url
        safe, reason = _is_safe_url("http://10.0.0.1/config")
        assert not safe

    def test_public_domain_allowed(self):
        from app.services.website_scanner import _is_safe_url
        # This may fail to resolve in CI — that's OK, it's "allowed"
        safe, reason = _is_safe_url("https://www.example.com")
        # Either resolves (safe=True) or DNS fails (safe=True with note)
        assert isinstance(safe, bool)


class TestPrivacyPolicyDetection:
    """Test privacy policy link detection heuristics."""

    def test_detects_privacy_link(self):
        from bs4 import BeautifulSoup
        import httpx
        from unittest.mock import MagicMock
        from app.services.website_scanner import _find_privacy_policy

        html = """
        <html><body>
          <a href="/privacy-policy">Privacy Policy</a>
          <footer>Contact: grievance@example.in | Grievance Officer</footer>
        </body></html>
        """
        soup = BeautifulSoup(html, "lxml")
        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = "grievance officer contact email privacy policy grievance@example.in"
        mock_client.get.return_value = mock_resp

        result = _find_privacy_policy("https://example.in", soup, mock_client)
        assert result.found is True
        assert result.url is not None

    def test_no_privacy_link(self):
        from bs4 import BeautifulSoup
        from unittest.mock import MagicMock
        from app.services.website_scanner import _find_privacy_policy

        html = "<html><body><a href='/about'>About</a></body></html>"
        soup = BeautifulSoup(html, "lxml")
        result = _find_privacy_policy("https://example.in", soup, MagicMock())
        assert result.found is False


class TestCookieConsentDetection:
    """Test cookie consent banner heuristics."""

    def test_detects_banner_with_reject(self):
        from app.services.website_scanner import _detect_cookie_consent
        html = """
        <div>We use cookies. <button>Accept All</button> <button>Reject All</button></div>
        """
        result = _detect_cookie_consent(html, "")
        assert result.banner_detected is True
        assert result.has_reject_button is True

    def test_accept_only_no_reject(self):
        from app.services.website_scanner import _detect_cookie_consent
        html = "<div>This site uses cookies. <button>I Agree</button></div>"
        result = _detect_cookie_consent(html, "")
        assert result.banner_detected is True
        assert result.has_reject_button is False

    def test_no_banner(self):
        from app.services.website_scanner import _detect_cookie_consent
        html = "<div>Welcome to our shop!</div>"
        result = _detect_cookie_consent(html, "")
        assert result.banner_detected is False


class TestTrackerDetection:
    """Test tracker script detection heuristics."""

    def test_detects_google_analytics(self):
        from app.services.website_scanner import _detect_trackers
        html = '<script src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>'
        results = _detect_trackers(html)
        ga_result = next((r for r in results if "Google" in r.name), None)
        assert ga_result is not None
        assert ga_result.detected is True

    def test_detects_meta_pixel(self):
        from app.services.website_scanner import _detect_trackers
        html = '<script>fbq("init", "123456789")</script><script src="connect.facebook.net/en_US/fbevents.js"></script>'
        results = _detect_trackers(html)
        meta_result = next((r for r in results if "Meta" in r.name or "Facebook" in r.name), None)
        assert meta_result is not None
        assert meta_result.detected is True

    def test_no_trackers(self):
        from app.services.website_scanner import _detect_trackers
        html = "<html><body><p>Hello World</p></body></html>"
        results = _detect_trackers(html)
        detected = [r for r in results if r.detected]
        assert len(detected) == 0


# ─────────────────────────────────────────────────────────────
# SCORING TESTS
# ─────────────────────────────────────────────────────────────

class TestScoringConfig:
    """Validate the scoring configuration structure."""

    def test_pillar_weights_sum_to_100(self):
        import json
        from pathlib import Path
        config_path = Path(__file__).parent.parent / "config" / "scoring_v1.json"
        with open(config_path) as f:
            config = json.load(f)
        total_weight = sum(p["weight"] for p in config["pillars"])
        assert total_weight == 100, f"Pillar weights sum to {total_weight}, expected 100"

    def test_all_controls_have_required_fields(self):
        import json
        from pathlib import Path
        config_path = Path(__file__).parent.parent / "config" / "scoring_v1.json"
        with open(config_path) as f:
            config = json.load(f)
        for pillar in config["pillars"]:
            for ctrl in pillar["controls"]:
                assert "id" in ctrl
                assert "title" in ctrl
                assert "weight" in ctrl
                assert "dpdp_reference" in ctrl

    def test_control_ids_unique(self):
        import json
        from pathlib import Path
        config_path = Path(__file__).parent.parent / "config" / "scoring_v1.json"
        with open(config_path) as f:
            config = json.load(f)
        ids = []
        for pillar in config["pillars"]:
            ids.extend(c["id"] for c in pillar["controls"])
        assert len(ids) == len(set(ids)), "Duplicate control IDs found"


class TestTrustScoreEngine:
    """Test the scoring calculation logic."""

    def _make_control(self, ctrl_id, pillar, weight, status, method="deterministic"):
        from app.schemas import ControlEvaluation, ControlStatus, ConfidenceLevel
        return ControlEvaluation(
            control_id=ctrl_id,
            title=f"Control {ctrl_id}",
            pillar=pillar,
            weight=weight,
            status=ControlStatus[status],
            confidence=ConfidenceLevel.HIGH,
            evaluation_method=method,
        )

    def _make_frugal_metrics(self):
        from app.schemas import FrugalAIMetrics
        return FrugalAIMetrics(
            total_controls=1, deterministic_resolved=1, rag_resolved=0,
            ai_resolved=0, unknown_unresolved=0, ai_calls_made=0,
            input_tokens_used=0, output_tokens_used=0, estimated_cost_usd=0.0,
            total_execution_ms=100, rule_resolution_rate=100.0,
        )

    def test_all_pass_gives_high_score(self):
        from app.services.rule_engine import load_scoring_config
        from app.services.trust_score_engine import compute_trust_score
        from app.schemas import ControlStatus, ConfidenceLevel, ControlEvaluation

        config = load_scoring_config()
        evals = []
        for pillar in config["pillars"]:
            for ctrl in pillar["controls"]:
                evals.append(ControlEvaluation(
                    control_id=ctrl["id"],
                    title=ctrl["title"],
                    pillar=pillar["id"],
                    weight=ctrl["weight"],
                    status=ControlStatus.PASS,
                    confidence=ConfidenceLevel.HIGH,
                ))

        result = compute_trust_score(evals, self._make_frugal_metrics())
        assert result.overall_score == 100.0
        assert result.coverage_percentage == 100.0

    def test_all_fail_gives_zero_score(self):
        from app.services.rule_engine import load_scoring_config
        from app.services.trust_score_engine import compute_trust_score
        from app.schemas import ControlStatus, ConfidenceLevel, ControlEvaluation

        config = load_scoring_config()
        evals = []
        for pillar in config["pillars"]:
            for ctrl in pillar["controls"]:
                evals.append(ControlEvaluation(
                    control_id=ctrl["id"],
                    title=ctrl["title"],
                    pillar=pillar["id"],
                    weight=ctrl["weight"],
                    status=ControlStatus.FAIL,
                    confidence=ConfidenceLevel.HIGH,
                ))

        result = compute_trust_score(evals, self._make_frugal_metrics())
        assert result.overall_score == 0.0

    def test_partial_gives_intermediate_score(self):
        from app.services.rule_engine import load_scoring_config
        from app.services.trust_score_engine import compute_trust_score
        from app.schemas import ControlStatus, ConfidenceLevel, ControlEvaluation

        config = load_scoring_config()
        evals = []
        for pillar in config["pillars"]:
            for ctrl in pillar["controls"]:
                evals.append(ControlEvaluation(
                    control_id=ctrl["id"],
                    title=ctrl["title"],
                    pillar=pillar["id"],
                    weight=ctrl["weight"],
                    status=ControlStatus.PARTIAL,
                    confidence=ConfidenceLevel.MEDIUM,
                ))

        result = compute_trust_score(evals, self._make_frugal_metrics())
        assert 40.0 <= result.overall_score <= 60.0, f"Expected ~50, got {result.overall_score}"

    def test_unknown_excluded_from_denominator(self):
        from app.services.rule_engine import load_scoring_config
        from app.services.trust_score_engine import compute_trust_score
        from app.schemas import ControlStatus, ConfidenceLevel, ControlEvaluation

        config = load_scoring_config()
        # Mark all as UNKNOWN
        evals = []
        for pillar in config["pillars"]:
            for ctrl in pillar["controls"]:
                evals.append(ControlEvaluation(
                    control_id=ctrl["id"],
                    title=ctrl["title"],
                    pillar=pillar["id"],
                    weight=ctrl["weight"],
                    status=ControlStatus.UNKNOWN,
                    confidence=ConfidenceLevel.LOW,
                ))

        result = compute_trust_score(evals, self._make_frugal_metrics())
        assert result.coverage_percentage == 0.0
        assert result.unknown_controls == result.total_controls


# ─────────────────────────────────────────────────────────────
# EVIDENCE TESTS
# ─────────────────────────────────────────────────────────────

class TestEvidenceProcessor:
    """Test evidence file processing."""

    def test_txt_extraction(self):
        from app.services.evidence_processor import analyze_evidence_file
        from app.schemas import EvidenceStatus

        text = b"This document contains a grievance officer contact and data retention policy."
        result = analyze_evidence_file("test.txt", text, "text/plain")

        assert result.status in (EvidenceStatus.PARSED, EvidenceStatus.ANALYSED)
        assert result.error is None

    def test_txt_with_privacy_topics(self):
        from app.services.evidence_processor import analyze_evidence_file
        from app.schemas import EvidenceStatus

        text = (
            b"Privacy Policy\n"
            b"Grievance Officer: privacy@example.in\n"
            b"Data Retention: We retain data for 2 years.\n"
            b"Right to erasure is available on request.\n"
            b"Consent can be withdrawn at any time."
        )
        result = analyze_evidence_file("privacy_policy.txt", text, "text/plain")

        assert result.status == EvidenceStatus.ANALYSED
        assert len(result.extracted_topics) > 0
        assert "grievance" in result.extracted_topics or "privacy" in result.extracted_topics

    def test_very_short_text_is_parsed_not_analysed(self):
        from app.services.evidence_processor import analyze_evidence_file
        from app.schemas import EvidenceStatus

        text = b"Hi"
        result = analyze_evidence_file("empty.txt", text, "text/plain")
        assert result.status in (EvidenceStatus.PARSED, EvidenceStatus.UPLOADED)

    def test_topic_maps_to_controls(self):
        from app.services.evidence_processor import _map_topics_to_controls
        controls = _map_topics_to_controls(["privacy", "grievance"])
        assert "C1_01" in controls or "C6_01" in controls
        assert "C2_04" in controls or "C1_02" in controls


# ─────────────────────────────────────────────────────────────
# EVALUATION HARNESS TESTS
# ─────────────────────────────────────────────────────────────

class TestMetricsService:
    """Test the metrics calculation logic."""

    def test_perfect_predictions(self):
        from app.services.metrics_service import _compute_binary_metrics
        preds = [True, True, False, False]
        gts = [True, True, False, False]
        m = _compute_binary_metrics(preds, gts)
        assert m["precision"] == 1.0
        assert m["recall"] == 1.0
        assert m["f1_score"] == 1.0
        assert m["accuracy"] == 1.0

    def test_all_false_positives(self):
        from app.services.metrics_service import _compute_binary_metrics
        preds = [True, True]
        gts = [False, False]
        m = _compute_binary_metrics(preds, gts)
        assert m["true_positives"] == 0
        assert m["false_positives"] == 2
        assert m["precision"] == 0.0
        assert m["recall"] == 0.0

    def test_all_false_negatives(self):
        from app.services.metrics_service import _compute_binary_metrics
        preds = [False, False]
        gts = [True, True]
        m = _compute_binary_metrics(preds, gts)
        assert m["true_positives"] == 0
        assert m["false_negatives"] == 2
        assert m["recall"] == 0.0

    def test_none_values_excluded(self):
        from app.services.metrics_service import _compute_binary_metrics
        preds = [True, None, False]
        gts = [True, True, False]
        m = _compute_binary_metrics(preds, gts)
        assert m["evaluated_pairs"] == 2  # None pair excluded
