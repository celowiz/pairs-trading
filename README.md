# Pairs Trading · valor relativo entre ativos (mock)
Página estática (GitHub Pages). `scripts/fetch.py` baixa fechamentos (Yahoo), `scripts/build.py` gera `data/` (pairs.json, meta.json, pair/*.json).
Metodologia: vínculo econômico → corr. de retornos ≥0,3 → Engle-Granger (2 sentidos) + Johansen → Benjamini-Hochberg 5% → meia-vida 2–60d → estabilidade ≥60% de janelas 252d → drift do hedge <35% → backtest walk-forward OOS com custos.
GA4 G-QCBFGR39WG, content_group `pairs_trading`; eventos pairs_select(asset, source), pairs_filter/pairs_sort(control,value), filter_tier(control,value), toggle_econ_filter(control=econ_filter, value on/off), pairs_lang(value), pairs_sim(value), pairs_section(section).
Faixas: robust / cand (nota A–C sem passar nos 4 testes) / other; `data/unlinked.json` (carregado sob demanda) traz os pares sem vínculo (resumo) e o FDR recalculado sobre todos os testes.
Favicon: opção A (design/favicons/pairs-trading/option_A.svg) + favicon-32.png, favicon.ico, apple-touch-icon.png.

Resumo: `scripts/summary.py` grava `data/summary.json` (~3 KB: funil, pares robustos com z-score atual e candidatos mais afastados), lido pela página [Mercado Hoje](https://celowiz.github.io/mercado-hoje/) do portfólio.

Dados: `data/` não é versionado; o workflow `.github/workflows/deploy.yml` baixa os fechamentos e gera os JSON a cada push, manualmente e de segunda a sexta às 19:30 (Brasília).
