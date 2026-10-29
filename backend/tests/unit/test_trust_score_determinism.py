"""
TrustForge Trust Score Determinism Test Suite.
Validates the canonical deterministic formula across all required test suites:
  A. all PASS
  B. all FAIL
  C. all POTENTIAL_GAP
  D. all INSUFFICIENT_EVIDENCE
  E. mixed outcomes
  F. NOT_APPLICABLE cases
  G. pillar boundary cases
  H. posture boundary cases
  I. repeated identical input
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from core.models import (
    ControlStatus,
    EvaluationMethod,
    Severity,
    TIEResult,
    TrustScoreResult,
)
from compliance.controls import CONTROLS
from compliance.trust_score import compute_trust_score, posture_for_score


def _make_results(status_dict_or_default):
    results = []
    for c in CONTROLS:
        if isinstance(status_dict_or_default, dict):
            st = status_dict_or_default.get(c.control_id, ControlStatus.INSUFFICIENT_EVIDENCE)
        else:
            st = status_dict_or_default
        results.append(TIEResult(
            control_id=c.control_id,
            status=st,
            severity=c.severity,
            finding=f"Test finding for {c.control_id}",
            explanation="Test explanation",
            recommendation="Test recommendation",
            evidence_ids=[],
            citations=[],
            confidence=0.9 if st == ControlStatus.PASS else 0.2,
            evaluation_method=EvaluationMethod.DETERMINISTIC,
        ))
    return results


def test_suite_a_all_pass():
    results = _make_results(ControlStatus.PASS)
    res = compute_trust_score("test-a", results)
    assert res.trust_score == 100.0, f"Expected 100.0, got {res.trust_score}"
    assert res.posture == "Strong Alignment"
    assert res.pass_count == 20
    assert res.fail_count == 0
    for ps in res.pillar_scores:
        assert ps.score == 100.0


def test_suite_b_all_fail():
    results = _make_results(ControlStatus.FAIL)
    res = compute_trust_score("test-b", results)
    assert res.trust_score == 0.0, f"Expected 0.0, got {res.trust_score}"
    assert res.posture == "Critical"
    assert res.fail_count == 20
    for ps in res.pillar_scores:
        assert ps.score == 0.0


def test_suite_c_all_potential_gap():
    results = _make_results(ControlStatus.POTENTIAL_GAP)
    res = compute_trust_score("test-c", results)
    assert res.trust_score == 50.0, f"Expected 50.0, got {res.trust_score}"
    assert res.posture == "Potential Gaps"
    assert res.potential_gap_count == 20
    for ps in res.pillar_scores:
        assert ps.score == 50.0


def test_suite_d_all_insufficient_evidence():
    results = _make_results(ControlStatus.INSUFFICIENT_EVIDENCE)
    res = compute_trust_score("test-d", results)
    assert res.trust_score == 30.0, f"Expected 30.0, got {res.trust_score}"
    assert res.posture == "Critical"
    assert res.insufficient_evidence_count == 20
    for ps in res.pillar_scores:
        assert ps.score == 30.0


def test_suite_e_mixed_outcomes():
    # 5 PASS, 5 POTENTIAL_GAP, 5 FAIL, 5 INSUFFICIENT_EVIDENCE
    st_map = {}
    for i, c in enumerate(CONTROLS):
        if i < 5:
            st_map[c.control_id] = ControlStatus.PASS
        elif i < 10:
            st_map[c.control_id] = ControlStatus.POTENTIAL_GAP
        elif i < 15:
            st_map[c.control_id] = ControlStatus.FAIL
        else:
            st_map[c.control_id] = ControlStatus.INSUFFICIENT_EVIDENCE

    results = _make_results(st_map)
    res = compute_trust_score("test-e", results)
    assert 0.0 <= res.trust_score <= 100.0
    assert res.pass_count == 5
    assert res.potential_gap_count == 5
    assert res.fail_count == 5
    assert res.insufficient_evidence_count == 5


def test_suite_f_not_applicable():
    # Set first control of Privacy (TF-PRIV-001) to NOT_APPLICABLE
    st_map = {c.control_id: ControlStatus.PASS for c in CONTROLS}
    st_map["TF-PRIV-001"] = ControlStatus.NOT_APPLICABLE
    results = _make_results(st_map)
    res = compute_trust_score("test-f", results)
    # Remaining controls in Privacy are all PASS, so Privacy pillar score should still be 100.0!
    privacy_ps = next(ps for ps in res.pillar_scores if ps.pillar.value == "Privacy")
    assert privacy_ps.score == 100.0
    assert privacy_ps.applicable_control_count == 4
    assert res.trust_score == 100.0


def test_suite_g_pillar_boundaries():
    # Only Privacy passes, all other pillars fail
    st_map = {c.control_id: (ControlStatus.PASS if c.pillar.value == "Privacy" else ControlStatus.FAIL) for c in CONTROLS}
    results = _make_results(st_map)
    res = compute_trust_score("test-g", results)
    # Privacy has weight 20% = 0.20 * 100.0 = 20.0
    assert res.trust_score == 20.0
    assert res.posture == "Critical"


def test_suite_h_posture_boundaries():
    assert posture_for_score(80.0) == "Strong Alignment"
    assert posture_for_score(79.9) == "Needs Attention"
    assert posture_for_score(65.0) == "Needs Attention"
    assert posture_for_score(64.9) == "Potential Gaps"
    assert posture_for_score(50.0) == "Potential Gaps"
    assert posture_for_score(49.9) == "Critical"
    assert posture_for_score(0.0) == "Critical"


def test_suite_i_repeated_identical_input():
    st_map = {c.control_id: (ControlStatus.PASS if i % 2 == 0 else ControlStatus.POTENTIAL_GAP) for i, c in enumerate(CONTROLS)}
    results = _make_results(st_map)
    scores = [compute_trust_score(f"test-i-{run}", results).trust_score for run in range(100)]
    assert len(set(scores)) == 1, "Non-deterministic score detected across identical runs!"


if __name__ == "__main__":
    test_suite_a_all_pass()
    test_suite_b_all_fail()
    test_suite_c_all_potential_gap()
    test_suite_d_all_insufficient_evidence()
    test_suite_e_mixed_outcomes()
    test_suite_f_not_applicable()
    test_suite_g_pillar_boundaries()
    test_suite_h_posture_boundaries()
    test_suite_i_repeated_identical_input()
    print("ALL 9 TEST SUITES (A-I) PASSED WITH 100% DETERMINISM!")


# ── P0.2 New Regression Tests ─────────────────────────────────────────────────

def test_suite_j_entire_pillar_not_applicable():
    """P0.2: Entire Privacy pillar NOT_APPLICABLE — must exclude from denominator and renormalize."""
    # Set ALL Privacy controls to NOT_APPLICABLE, all others to PASS
    privacy_ids = {c.control_id for c in CONTROLS if c.pillar.value == "Privacy"}
    st_map = {}
    for c in CONTROLS:
        if c.control_id in privacy_ids:
            st_map[c.control_id] = ControlStatus.NOT_APPLICABLE
        else:
            st_map[c.control_id] = ControlStatus.PASS

    results = _make_results(st_map)
    res = compute_trust_score("test-j", results)

    # Privacy pillar must be marked is_not_applicable
    privacy_ps = next(ps for ps in res.pillar_scores if ps.pillar.value == "Privacy")
    assert privacy_ps.is_not_applicable is True, "Privacy pillar must be is_not_applicable"
    assert privacy_ps.applicable_control_count == 0

    # Score must NOT be 100 * 0.20 + 0 * 0.80 = 20 (old wrong behavior)
    # It must be 100.0 (only remaining PASS pillars, renormalized over remaining weight)
    assert res.trust_score == 100.0, (
        f"With Privacy NA and all others PASS, renormalized score must be 100.0, got {res.trust_score}"
    )
    assert res.all_not_applicable is False
    assert res.posture == "Strong Alignment"


def test_suite_k_multiple_pillars_not_applicable():
    """P0.2: Privacy + Security both entirely NOT_APPLICABLE, rest PASS — renormalize over 60% weight."""
    privacy_ids = {c.control_id for c in CONTROLS if c.pillar.value == "Privacy"}
    security_ids = {c.control_id for c in CONTROLS if c.pillar.value == "Security"}
    na_ids = privacy_ids | security_ids

    st_map = {}
    for c in CONTROLS:
        st_map[c.control_id] = ControlStatus.NOT_APPLICABLE if c.control_id in na_ids else ControlStatus.PASS

    results = _make_results(st_map)
    res = compute_trust_score("test-k", results)

    # Both NA pillars flagged
    for ps in res.pillar_scores:
        if ps.pillar.value in ("Privacy", "Security"):
            assert ps.is_not_applicable is True
        else:
            assert ps.is_not_applicable is False

    # Remaining pillars: Transparency(0.15) + Governance(0.15) + DataLifecycle(0.15) + UserRights(0.15)
    # All PASS → renormalized score = 100.0
    assert res.trust_score == 100.0, f"Expected 100.0 after renorm, got {res.trust_score}"
    assert res.all_not_applicable is False


def test_suite_l_all_controls_not_applicable():
    """P0.2: Every single control NOT_APPLICABLE → score undefined, posture 'Not Scorable'."""
    results = _make_results(ControlStatus.NOT_APPLICABLE)
    res = compute_trust_score("test-l", results)

    assert res.all_not_applicable is True, "Expected all_not_applicable=True"
    assert res.trust_score is None, "trust_score must be None when all NA"
    assert res.posture == "Not Scorable", f"Expected 'Not Scorable', got '{res.posture}'"
    for ps in res.pillar_scores:
        assert ps.is_not_applicable is True


def test_suite_m_missing_evaluations_treated_as_unknown():
    """P0.2: Missing TIEResults (no entry) must be UNKNOWN (weight 0.3), NOT NOT_APPLICABLE."""
    # Provide results for only 10 controls (first half); remaining 10 have no entry
    partial = [
        TIEResult(
            control_id=c.control_id,
            status=ControlStatus.PASS,
            severity=c.severity,
            finding="",
            explanation="",
            recommendation="",
            evidence_ids=[],
            citations=[],
            confidence=0.9,
            evaluation_method=EvaluationMethod.DETERMINISTIC,
        )
        for c in CONTROLS[:10]
    ]
    res = compute_trust_score("test-m", partial)

    # No pillar should be fully NA since missing = UNKNOWN
    for ps in res.pillar_scores:
        assert ps.is_not_applicable is False, (
            f"Pillar {ps.pillar.value} should NOT be is_not_applicable due to missing evals"
        )
    assert res.all_not_applicable is False
    # Score must be between 30 (all UNKNOWN) and 100 (all PASS)
    assert 30.0 <= res.trust_score <= 100.0


def test_suite_n_partial_pillar_na_rest_pass():
    """P0.2: One control in Privacy is NA, rest are PASS — pillar remains applicable."""
    st_map = {c.control_id: ControlStatus.PASS for c in CONTROLS}
    # Make TF-PRIV-001 and TF-PRIV-002 NOT_APPLICABLE
    st_map["TF-PRIV-001"] = ControlStatus.NOT_APPLICABLE
    st_map["TF-PRIV-002"] = ControlStatus.NOT_APPLICABLE
    results = _make_results(st_map)
    res = compute_trust_score("test-n", results)

    privacy_ps = next(ps for ps in res.pillar_scores if ps.pillar.value == "Privacy")
    # Pillar still has 3 applicable controls (PRIV-003, 004, 005) — not fully NA
    assert privacy_ps.is_not_applicable is False
    assert privacy_ps.applicable_control_count == 3
    assert privacy_ps.score == 100.0  # remaining 3 are PASS

    # Overall score should still be 100 (all applicable controls PASS)
    assert res.trust_score == 100.0
    assert res.all_not_applicable is False


def test_suite_o_scoring_version_is_1_1():
    """P0.2: Verify scoring_version is '1.1' after P0.2 change."""
    results = _make_results(ControlStatus.PASS)
    res = compute_trust_score("test-o", results)
    assert res.scoring_version == "1.1", f"Expected scoring_version '1.1', got '{res.scoring_version}'"

