"""Funções estatísticas do Pairs Trading. Tudo que vira sinal usa só dados até t."""
import numpy as np, pandas as pd

def bh_adjust(p):
    """Benjamini-Hochberg: p-valores ajustados (q-valores), na ordem original."""
    p=np.asarray(p,float); n=len(p)
    if n==0: return p
    o=np.argsort(p); r=p[o]*n/np.arange(1,n+1)
    q=np.minimum.accumulate(r[::-1])[::-1]
    out=np.empty(n); out[o]=np.minimum(q,1); return out

def half_life(s):
    s=np.asarray(s,float); s=s[~np.isnan(s)]
    if len(s)<30: return np.nan
    lag=s[:-1]; d=np.diff(s); X=np.c_[np.ones_like(lag),lag]
    b=np.linalg.lstsq(X,d,rcond=None)[0][1]
    return -np.log(2)/np.log(1+b) if -1<b<0 else np.inf

def rolling_hedge(y,x,win=252):
    """Alpha/beta OLS móveis estimados com a janela [t-win, t-1] (estritamente passado)."""
    y=pd.Series(y); x=pd.Series(x)
    mx=x.rolling(win).mean(); my=y.rolling(win).mean()
    cov=(x*y).rolling(win).mean()-mx*my; var=(x*x).rolling(win).mean()-mx*mx
    b=(cov/var).shift(1); a=(my-(cov/var)*mx).shift(1)
    return a,b

def rolling_z(spread,win=60):
    """z_t = (s_t - média(s_{t-win..t-1})) / dp(s_{t-win..t-1}). Não usa nada após t."""
    s=pd.Series(spread); m=s.shift(1).rolling(win).mean(); sd=s.shift(1).rolling(win).std()
    return (s-m)/sd

def backtest(y_ret,x_ret,z,beta,elig,hl,entry=2.0,exit=0.5,stop=4.0,cost=0.001):
    """Backtest em retornos de preço. Sinal no fechamento de t, posição vale a partir de t+1.
    Pesos fixados na entrada: +w_y em y, -beta*w_y em x (bruto=1). Custo por perna por lado."""
    n=len(z); pos=0; wy=wx=0.0; held=0; eq=np.ones(n); ret=np.zeros(n); trades=[]; cur=None
    for t in range(1,n):
        r=pos*(wy*y_ret[t]+wx*x_ret[t]) if pos else 0.0
        if pos: held+=1
        zt=z[t]; tstop=max(5,int(round(3*hl[t]))) if np.isfinite(hl[t]) else 60
        if pos and (np.isnan(zt) or abs(zt)<=exit or abs(zt)>=stop or held>=tstop):
            r-=cost; cur['exit']=t; cur['why']='alvo' if (not np.isnan(zt) and abs(zt)<=exit) else ('stop' if (not np.isnan(zt) and abs(zt)>=stop) else 'tempo')
            cur['days']=held; trades.append(cur); pos=0; held=0
        elif not pos and elig[t] and not np.isnan(zt) and entry<=abs(zt)<stop and np.isfinite(beta[t]):
            pos=-1 if zt>0 else 1; b=beta[t]; wy=1/(1+abs(b)); wx=-b*wy; r-=cost; held=0
            cur=dict(entry=t,side=pos,eq0=None)
        ret[t]=r; eq[t]=eq[t-1]*(1+r)
        if cur is not None and cur.get('eq0') is None: cur['eq0']=eq[t-1]
    for tr in trades: tr['pnl']=eq[tr['exit']]/tr['eq0']-1
    return eq,ret,trades
