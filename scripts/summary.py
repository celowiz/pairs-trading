"""Gera data/summary.json: resumo pequeno (~3 KB) lido pela página Mercado Hoje do portfólio
(celowiz.github.io/mercado-hoje/).

Funil de testes (pares testados, robustos, candidatos), todos os pares robustos com o z-score
atual do spread e os candidatos (nota A–C) mais afastados do equilíbrio (|z|). Só reorganiza
<out>/pairs.json e <out>/meta.json gravados por scripts/build.py; nenhum cálculo novo.
Determinístico (empates desempatados pelo id). Uso: python scripts/summary.py _site/data
"""
import json, os, sys

SCHEMA = 1
TOP_CAND = 5
KEYS = ("id", "y", "x", "ny", "nx", "group", "z", "hl", "score", "grade", "state", "tier")
FUNNEL = ("universe", "all_pairs", "econ", "fdr", "robust", "cand")


def slim(p):
    return {k: p.get(k) for k in KEYS}


def build_summary(pairs, meta):
    has_z = [p for p in pairs if p.get("z") is not None]
    robust = sorted((p for p in has_z if p.get("tier") == "robust"), key=lambda p: (-(p.get("score") or 0), p["id"]))
    cand = sorted((p for p in has_z if p.get("tier") == "cand"), key=lambda p: (-abs(p["z"]), p["id"]))[:TOP_CAND]
    f = meta.get("funnel", {})
    states = {s: sum(p.get("state") == s for p in pairs if p.get("tier") in ("robust", "cand")) for s in ("above", "below", "near", "neutral")}
    return {"schema": SCHEMA, "project": "pairs-trading", "url": "https://celowiz.github.io/pairs-trading/",
            "as_of": meta.get("asof"), "generated_at": meta.get("built"),
            "entry_z": (meta.get("params") or {}).get("entry", 2),
            "funnel": {k: f.get(k) for k in FUNNEL},
            "robust": [slim(p) for p in robust], "cand": [slim(p) for p in cand],
            "states": states, "robust_outside": sum(abs(p["z"]) >= 2 for p in robust)}


def main(out):
    pairs = json.load(open(os.path.join(out, "pairs.json")))
    meta = json.load(open(os.path.join(out, "meta.json")))
    s = build_summary(pairs, meta)
    path = os.path.join(out, "summary.json")
    json.dump(s, open(path, "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"summary.json: {os.path.getsize(path)} bytes, {len(s['robust'])} robustos, {len(s['cand'])} candidatos, fechamento {s['as_of']}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "data"))
