import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import summary as S


def P(i, tier, z, score=50, state="neutral"):
    return {"id": f"P{i}", "y": f"Y{i}", "x": f"X{i}", "ny": f"Y {i}", "nx": f"X {i}", "group": "G", "z": z, "hl": 5.0,
            "score": score, "grade": "A", "state": state, "tier": tier, "oos_ret": 0.1, "dates": list(range(100))}


def test_summary_sorting_and_counts():
    pairs = [P(1, "robust", 0.5, 80), P(2, "robust", -2.3, 90, "below"), P(3, "cand", 1.0), P(4, "cand", -3.1, state="below"),
             P(5, "cand", 3.1, state="above"), P(6, "other", 5.0), P(7, "cand", None)]
    meta = {"asof": "2026-10-19", "built": "2026-10-20T04:31", "params": {"entry": 2},
            "funnel": {"universe": 10, "all_pairs": 45, "econ": 20, "fdr": 5, "robust": 2, "cand": 4, "grades": {}}}
    s = S.build_summary(pairs, meta)
    assert [p["id"] for p in s["robust"]] == ["P2", "P1"]  # nota desc
    assert [p["id"] for p in s["cand"]] == ["P4", "P5", "P3"]  # |z| desc, empate pelo id; z nulo fora
    assert s["robust_outside"] == 1 and s["states"]["below"] == 2 and s["states"]["above"] == 1
    assert s["funnel"] == {"universe": 10, "all_pairs": 45, "econ": 20, "fdr": 5, "robust": 2, "cand": 4}
    assert "dates" not in s["robust"][0] and s["as_of"] == "2026-10-19"
    assert len(json.dumps(s)) < 20_000 and S.build_summary(pairs, meta) == s
