import sys, os, numpy as np, pandas as pd
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from pstats import bh_adjust, half_life, rolling_hedge, rolling_z, backtest
from statsmodels.stats.multitest import multipletests
rng = np.random.default_rng(0)

def test_z_no_lookahead():
    s = pd.Series(rng.normal(size=500).cumsum())
    full = rolling_z(s, 60).values
    for t in (100, 250, 499):
        part = rolling_z(s.iloc[:t+1], 60).values
        assert np.allclose(full[:t+1], part, equal_nan=True)
    s2 = s.copy(); s2.iloc[300:] += 1000          # mudar o futuro não altera o passado
    assert np.allclose(rolling_z(s2, 60).values[:300], full[:300], equal_nan=True)

def test_hedge_no_lookahead():
    x = pd.Series(rng.normal(size=600).cumsum()); y = 2*x + rng.normal(size=600)
    a, b = rolling_hedge(y, x, 252); y2 = y.copy(); y2.iloc[400:] *= -5
    a2, b2 = rolling_hedge(y2, x, 252)
    assert np.allclose(b[:401], b2[:401], equal_nan=True)   # beta_t usa só até t-1
    assert abs(b.iloc[-1] - 2) < 0.1

def test_bh_matches_statsmodels():
    p = rng.uniform(size=300)**3
    assert np.allclose(bh_adjust(p), multipletests(p, method="fdr_bh")[1])

def test_bh_controls_false_discoveries():
    fp = []
    for _ in range(200):
        p = np.r_[rng.uniform(size=900), rng.uniform(0, 1e-4, size=100)]
        rej = bh_adjust(p) < 0.05
        fp.append(rej[:900].sum() / max(rej.sum(), 1))
    assert np.mean(fp) <= 0.06
    assert (rng.uniform(size=1000) < 0.05).sum() > 20 and (bh_adjust(rng.uniform(size=1000)) < 0.05).sum() <= 3

def test_half_life_ar1():
    phi = 0.9; e = np.zeros(20000)
    for t in range(1, len(e)): e[t] = phi*e[t-1] + rng.normal()
    assert abs(half_life(e) - np.log(2)/-np.log(phi)) < 0.6
    assert half_life(rng.normal(size=3000).cumsum()) > 100 or not np.isfinite(half_life(rng.normal(size=3000).cumsum()))

def test_backtest_lag_and_costs():
    n = 50; z = np.zeros(n); z[10] = 2.5; z[11:20] = 1.0; z[20] = 0.2
    ry = np.zeros(n); ry[10] = 0.5                    # retorno no dia do sinal não pode entrar
    eq, ret, tr = backtest(ry, np.zeros(n), z, np.ones(n), np.ones(n, bool), np.full(n, 10.0), cost=0.001)
    assert ret[10] == -0.001 and len(tr) == 1 and tr[0]["why"] == "alvo"
    assert abs(eq[-1] - (0.999*0.999)) < 1e-9

def test_fdr_family_counts_all_tests():
    # acrescentar testes com p=1 multiplica os q-valores por (n+m)/n: a correção conta TODOS os testes
    p = rng.uniform(0, 0.02, size=300); m = 7200
    q_sub = bh_adjust(p); q_all = bh_adjust(np.r_[p, np.ones(m)])[:300]
    assert np.allclose(q_all, np.minimum(1, q_sub * (300 + m) / 300))

def test_fdr_family_matches_statsmodels_on_union():
    lk = rng.uniform(size=301)**4; un = rng.uniform(size=7209)
    fam = np.r_[lk, un]; q = bh_adjust(fam)
    assert len(q) == 7510 and np.allclose(q, multipletests(fam, method="fdr_bh")[1])
    assert (q[:301] < 0.05).sum() <= (bh_adjust(lk) < 0.05).sum()   # mais testes nulos: régua mais exigente

def test_fdr_global_null_7500():
    p = rng.uniform(size=7500)
    assert 300 < (p < 0.05).sum() < 450          # ~375 "descobertas" só por acaso sem correção
    assert (bh_adjust(p) < 0.05).sum() <= 2      # BH praticamente zera os falsos positivos
