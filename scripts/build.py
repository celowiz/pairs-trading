"""Gera os JSON da página de Pairs Trading (offline). Uso: python build.py prices.pkl ../data"""
import itertools, json, os, sys, warnings, datetime as dt
import numpy as np, pandas as pd
from statsmodels.tsa.stattools import coint, adfuller
from statsmodels.tsa.vector_ar.vecm import coint_johansen
from universe import G, CURATED, assets
from pstats import bh_adjust, half_life, rolling_hedge, rolling_z, backtest
warnings.filterwarnings("ignore")
PK, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT+"/pair", exist_ok=True)
FORM, WIN, STEP, REB, ZW, COST = 756, 252, 21, 63, 60, 0.001
A = assets(); P = pd.read_pickle(PK)
fx = P["USDBRL=X"]
def series(t):
    if t.endswith("@BRL"):
        b=t[:-4]; s=(P[b]*fx.ffill()).dropna(); return s
    return P[t].dropna()
def name(t): return A[t[:-4]]["name"]+" em R$" if t.endswith("@BRL") else A[t]["name"]
def r(x,d=4): return None if x is None or not np.isfinite(x) else round(float(x),d)
def eg(y,x):
    try: return coint(y,x,maxlag=1,autolag=None)[1]
    except Exception: return 1.0

# ---------- lista de pares com vínculo econômico ----------
pairs=[]
for g,(cls,d) in G.items():
    for a,b in itertools.combinations(d,2): pairs.append((a,b,g,cls,"Mesmo setor/classe"))
seen={frozenset(p[:2]) for p in pairs}
for a,b,why in CURATED:
    if frozenset((a,b)) in seen: pairs=[(p[0],p[1],p[2],p[3],why) if frozenset(p[:2])=={a,b} else p for p in pairs]; continue
    pairs.append((a,b,"Curados",A[a]["cls"] if a in A else "",why))
def pid(a,b): return (a+"_"+b).replace("^","").replace("=","").replace("@","-").replace(".SA","")
def stage1(a,b,g,cls,why,prefilter=True):
    """Dados, correlação de retornos e Engle-Granger nos dois sentidos."""
    df=pd.concat([np.log(series(a)),np.log(series(b))],axis=1,keys=["a","b"]).dropna()
    df=df[df.index>=df.index[-1]-pd.Timedelta(days=365*6+30)]
    row=dict(id=pid(a,b),a=a,b=b,na=name(a),nb=name(b),group=g,cls=cls,link=why,n=len(df))
    if len(df)<FORM+WIN: row["stage"]="dados"; return row,df
    f=df.iloc[-FORM:]; row["rcorr"]=r(f.a.diff().corr(f.b.diff()),3); row["lcorr"]=r(np.exp(f.a).corr(np.exp(f.b)),3)
    if prefilter and row["rcorr"]<0.3: row["stage"]="corr"; return row,df
    p1,p2=eg(f.a,f.b),eg(f.b,f.a); y,x=("a","b") if p1<=p2 else ("b","a")
    row.update(y=row[y],x=row[x],ny=row["n"+y],nx=row["n"+x],p=r(min(p1,p2),5),_y=y,_x=x); row["stage"]="eg"; return row,df
def stage2(row,df):
    """Johansen, meia-vida, drift, estabilidade e backtest walk-forward."""
    y,x=row.pop("_y"),row.pop("_x"); f=df.iloc[-FORM:]
    jo=coint_johansen(f[[y,x]].values,0,1); row["joh"]=bool(jo.lr1[0]>jo.cvt[0,1])
    X=np.c_[np.ones(FORM),f[x].values]; beta=np.linalg.lstsq(X,f[y].values,rcond=None)[0]
    spr=f[y].values-X@beta; row["hl"]=r(half_life(spr),1); row["beta"]=r(beta[1],3)
    h=FORM//2; b1=np.polyfit(f[x].values[:h],f[y].values[:h],1)[0]; b2=np.polyfit(f[x].values[h:],f[y].values[h:],1)[0]
    row["drift"]=r(abs(b2-b1)/max(abs(beta[1]),1e-6),3)
    Y,Xs=df[y].values,df[x].values; idx=list(range(WIN,len(df)+1,STEP))
    rp=[eg(Y[i-WIN:i],Xs[i-WIN:i]) for i in idx]; row["stab"]=r(np.mean(np.array(rp)<0.05),3)
    # walk-forward: elegibilidade revista a cada 63 pregões só com os 756 anteriores
    al,bt=rolling_hedge(df[y],df[x],WIN); s=df[y]-al-bt*df[x]; z=rolling_z(s,ZW).values
    elig=np.zeros(len(df),bool); hls=np.full(len(df),np.nan)
    for t0 in range(FORM,len(df),REB):
        ff=df.iloc[t0-FORM:t0]; pp=eg(ff[y],ff[x]); XX=np.c_[np.ones(FORM),ff[x].values]
        hh=half_life(ff[y].values-XX@np.linalg.lstsq(XX,ff[y].values,rcond=None)[0])
        elig[t0:t0+REB]= pp<0.05 and 2<=hh<=60; hls[t0:t0+REB]=hh
    ry=np.exp(df[y]).pct_change().fillna(0).values; rx=np.exp(df[x]).pct_change().fillna(0).values
    eq,ret,tr=backtest(ry,rx,z,bt.values,elig,hls,cost=COST)
    o=slice(FORM,None); er=ret[o]; e=eq[o]/eq[FORM-1]; yrs=len(er)/252
    dd=float(np.min(e/np.maximum.accumulate(e)-1))
    tr=[t for t in tr if t["entry"]>=FORM]
    row.update(oos_ret=r(e[-1]-1),oos_sh=r(er.mean()/er.std()*np.sqrt(252) if er.std()>0 else 0,2),oos_dd=r(dd),trades=len(tr),
      hit=r(np.mean([t["pnl"]>0 for t in tr]) if tr else None,2),days_in=r(np.mean(elig[o]),2),oos_from=str(df.index[FORM].date()))
    row["z"]=r(z[-1],2); row["stage"]="eg"
    return dict(df=df,y=y,x=x,z=z,beta=bt.values,eq=eq,elig=elig,tr=tr,rp=rp,idx=idx)

def score(w,qq):
    hl=w["hl"] if w["hl"] is not None else np.inf; o=dict(q=r(qq,5),pass_fdr=bool(qq<0.05),pass_hl=bool(2<=hl<=60),pass_stab=bool(w["stab"]>=0.6),pass_break=bool(w["drift"]<0.35))
    sc=(25 if qq<0.01 else 18 if qq<0.05 else 8 if w["p"]<0.05 else 0)+(10 if w["joh"] else 0)
    sc+=25*min(1,max(0,(w["stab"]-0.3)/0.6))+(10 if 5<=hl<=30 else 6 if 2<=hl<=60 else 0)+(10 if o["pass_break"] else 3 if w["drift"]<0.6 else 0)
    sh=w["oos_sh"] or 0; sc+=20 if sh>=0.75 else 13 if sh>=0.3 else 6 if sh>0 else 0
    o["score"]=int(round(sc)); o["grade"]="A" if sc>=80 else "B" if sc>=65 else "C" if sc>=50 else "D"
    o["robust"]=o["pass_fdr"] and o["pass_hl"] and o["pass_stab"] and o["pass_break"]
    o["tier"]="robust" if o["robust"] else "cand" if o["grade"] in "ABC" else "other"; return o

rows=[]; detail={}
for a,b,g,cls,why in pairs:
    row,df=stage1(a,b,g,cls,why); rows.append(row)
    if row["stage"]=="eg": detail[row["id"]]=stage2(row,df)
T=[w for w in rows if w["stage"]=="eg"]
for w,qq in zip(T,bh_adjust([w["p"] for w in T])):
    w.update(score(w,qq)); z=w["z"]; w["state"]="nd" if z is None else "above" if z>=2 else "below" if z<=-2 else "near" if abs(z)>=1.5 else "neutral"
T.sort(key=lambda w:-w["score"])

def export(w):
    d=detail[w["id"]]; df=d["df"]; k=max(0,len(df)-FORM-260); D=df.iloc[k:]
    ny=np.exp(D[d["y"]]-D[d["y"]].iloc[0]); nx=np.exp(D[d["x"]]-D[d["x"]].iloc[0])
    rp=[[str(df.index[i-1].date()),r(p,4)] for i,p in zip(d["idx"],d["rp"]) if i-1>=k]
    tr=[dict(i=t["entry"]-k,o=t["exit"]-k,s=t["side"],pnl=r(t["pnl"]),why=t["why"]) for t in d["tr"]]
    out=dict(dates=[str(x.date()) for x in D.index],py=[r(v,4) for v in ny],px=[r(v,4) for v in nx],z=[r(v,3) for v in d["z"][k:]],
      beta=[r(v,4) for v in d["beta"][k:]],eq=[r(v,4) for v in d["eq"][k:]/d["eq"][FORM-1]],elig=[int(v) for v in d["elig"][k:]],oos=FORM-k,rp=rp,trades=tr)
    json.dump(out,open(f"{OUT}/pair/{w['id']}.json","w"),separators=(",",":"))
for w in T: export(w)

# ---------- pares SEM vínculo econômico (exploratório, arquivo separado) ----------
U0=[t for t in A if t!="USDBRL=X"]; linked={frozenset((w["a"],w["b"])) for w in rows}
fam=[]                                   # família de testes = todos os EG realizados
for w in rows:                           # pares com vínculo barrados só pela correlação também são testados
    if w["stage"]=="eg": fam.append(("L",w["id"],w["p"]))
    elif w["stage"]=="corr":
        rw,_=stage1(w["a"],w["b"],w["group"],w["cls"],w["link"],prefilter=False); fam.append(("Lc",w["id"],rw["p"]))
UN=[]; dfs={}
for a,b in itertools.combinations(U0,2):
    if frozenset((a,b)) in linked: continue
    rw,df=stage1(a,b,"Sem vínculo","Sem vínculo",A[a]["group"]+" × "+A[b]["group"],prefilter=False)
    if rw["stage"]!="eg": continue
    rw["id"]=pid(rw["y"],rw["x"]); UN.append(rw); dfs[rw["id"]]=df; fam.append(("U",rw["id"],rw["p"]))
qa=bh_adjust([f[2] for f in fam]); QA={(f[0][0],f[1]):q for f,q in zip(fam,qa)}
print("familia",len(fam),"sem vinculo",len(UN),flush=True)
over={}
for w in T: over[w["id"]]=score(w,QA[("L",w["id"])])
full=[]; slim=[]
for w in UN:
    q=QA[("U",w["id"])]
    if w["p"]<0.05:
        stage2(w,dfs[w["id"]]); w.update(score(w,q)); w["tier"]="explore"; w["grade"]=None; w["score"]=None   # sem nota: só exploratório
        w.update(unlinked=True,state="nd" if w["z"] is None else "above" if w["z"]>=2 else "below" if w["z"]<=-2 else "near" if abs(w["z"])>=1.5 else "neutral")
        for k in ("lcorr","n","beta","oos_from","stage","_y","_x"): w.pop(k,None)
        full.append(w)
    else: slim.append([w["y"],w["x"],w["p"],r(q,4),w["rcorr"]])
full.sort(key=lambda w:w["q"])
fu=dict(family=len(fam),linked_tested=sum(f[0]!="U" for f in fam),un_tested=len(UN),un_corr=sum((w["rcorr"] or 0)>=0.3 for w in UN),
  un_raw05=len(full),un_fdr=sum(w["pass_fdr"] for w in full),un_all=sum(w["robust"] for w in full),un_expected_false=r(0.05*len(UN),0),
  lk_fdr=sum(o["pass_fdr"] for o in over.values()),lk_robust=sum(o["robust"] for o in over.values()),lk_cand=sum(o["tier"]=="cand" for o in over.values()))
names={t:A[t]["name"] for t in U0}; groups={t:A[t]["group"] for t in U0}
json.dump(dict(funnel=fu,linked_over=over,pairs=full,slim=slim,names=names,groups=groups),open(f"{OUT}/unlinked.json","w"),ensure_ascii=False,separators=(",",":"))
print(json.dumps(fu),flush=True)

# ---------- método antigo (para comparar falsos positivos) ----------
U=[t for t in A if t!="USDBRL=X"]; L=P[U].iloc[-400:]; old=[]; ntest=0
def hurst(s):
    lags=range(2,40); tau=[np.std(s[l:]-s[:-l]) for l in lags]; return np.polyfit(np.log(list(lags)),np.log(tau),1)[0]
grp={t:A[t]["group"] for t in U}
for a,b in itertools.combinations(U,2):
    d2=L[[a,b]].dropna()
    d2=d2.iloc[-275:]
    if len(d2)<252: continue
    ntest+=1
    if abs(d2[a].corr(d2[b]))<=0.6: continue
    ok=False
    for y,x in ((a,b),(b,a)):
        yy,xx=d2[y].values,d2[x].values; Xm=np.c_[np.ones(len(xx)),xx]; res=yy-Xm@np.linalg.lstsq(Xm,yy,rcond=None)[0]
        hl=half_life(res)
        if not (0<hl<50): continue
        ad=adfuller(res,maxlag=1,autolag=None)
        if ad[0]>=ad[4]["5%"]: continue
        if eg(yy,xx)>=0.05: continue
        if hurst(res)>=0.5: continue
        ok=True; break
    if ok: old.append((a,b,grp[a]==grp[b] or (a,b) in [(c[0],c[1]) for c in CURATED]))
print("old",ntest,len(old))
# exemplo espúrio: maior correlação de nível sem vínculo econômico, entre os aceitos pelo método antigo
cand=[]
for a,b,link in old:
    if link or A[a]["cls"]==A[b]["cls"]: continue
    d2=P[[a,b]].dropna().iloc[-FORM:]; la=np.log(d2[a]); lb=np.log(d2[b])
    rc=la.diff().corr(lb.diff()); lc=d2[a].iloc[-275:].corr(d2[b].iloc[-275:])
    pl=min(eg(la,lb),eg(lb,la))
    if pl>0.2: cand.append((abs(lc)-abs(rc),a,b,lc,rc))
cand.sort(reverse=True); _,sa,sb,lc,rc=cand[0]
d2=P[[sa,sb]].dropna(); la=np.log(d2[sa]); lb=np.log(d2[sb])
p_short=eg(la.iloc[-275:],lb.iloc[-275:]); p_long=min(eg(la.iloc[-FORM:],lb.iloc[-FORM:]),eg(lb.iloc[-FORM:],la.iloc[-FORM:]))
D=d2.iloc[-FORM:]; rpS=[[str(D.index[i-1].date()),r(eg(np.log(D[sa].values[i-WIN:i]),np.log(D[sb].values[i-WIN:i])),4)] for i in range(WIN,len(D)+1,STEP)]
spur=dict(a=sa,b=sb,na=name(sa),nb=name(sb),ga=A[sa]["group"],gb=A[sb]["group"],lcorr=r(lc,3),rcorr=r(rc,3),p_short=r(p_short,4),p_long=r(p_long,4),
  stab=r(np.mean(np.array([p for _,p in rpS])<0.05),3),dates=[str(x.date()) for x in D.index],pa=[r(v,4) for v in D[sa]/D[sa].iloc[0]],pb=[r(v,4) for v in D[sb]/D[sb].iloc[0]],rp=rpS)
funnel=dict(universe=len(U),all_pairs=len(U)*(len(U)-1)//2,econ=len(pairs),data=sum(w["stage"]!="dados" for w in rows),
  corr=len(T),raw05=sum(w["p"]<0.05 for w in T),fdr=sum(w["pass_fdr"] for w in T),fdr_hl=sum(w["pass_fdr"] and w["pass_hl"] for w in T),
  fdr_hl_stab=sum(w["pass_fdr"] and w["pass_hl"] and w["pass_stab"] for w in T),robust=sum(w["robust"] for w in T),cand=sum(w["tier"]=="cand" for w in T),grades={g:sum(w["grade"]==g for w in T) for g in "ABCD"},
  expected_false_raw=r(0.05*len(T),1),old_tested=ntest,old_accepted=len(old),old_no_link=sum(not l for *_,l in old),old_expected_false=r(0.05*ntest,0),
  old_in_robust=sum(1 for a,b,_ in old if any(w["robust"] and {w["a"],w["b"]}=={a,b} for w in T)))
meta=dict(asof=str(P.index[-1].date()),built=dt.datetime.now().isoformat(timespec="minutes"),params=dict(form=FORM,win=WIN,step=STEP,reb=REB,zwin=ZW,cost=COST,entry=2,exit=0.5,stop=4),
  funnel=funnel,spurious=spur,rejected=[{k:w.get(k) for k in ("a","b","na","nb","group","stage","rcorr")} for w in rows if w["stage"]!="eg"])
json.dump(meta,open(f"{OUT}/meta.json","w"),ensure_ascii=False,separators=(",",":"))
json.dump(T,open(f"{OUT}/pairs.json","w"),ensure_ascii=False,separators=(",",":"))
print(json.dumps(funnel,indent=1)); print("spurious",sa,sb,lc,rc,p_short,p_long)
