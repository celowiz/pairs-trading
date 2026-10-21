import datetime as dt, os, sys, time, pandas as pd, yfinance as yf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from universe import assets
from net import retry

def download(t):
    d=yf.download(t,start="2020-01-01",auto_adjust=True,progress=False,threads=True)
    if d is None or d.empty: raise RuntimeError("Yahoo Finance devolveu vazio")   # vale nova tentativa
    return d["Close"]

def closes_only(df,now):
    """Só fechamentos: tira datas futuras no fuso de Brasília (o Yahoo data câmbio e futuros pela sessão
    asiática, já com o dia seguinte depois das 21h BRT) e o dia de hoje antes das 18:30 BRT."""
    df=df[df.index.date<=now.date()]
    if (now.hour,now.minute)<(18,30): df=df[df.index.date<now.date()]
    return df

tk=list(assets())
if __name__=="__main__":
  df=retry(lambda: download(tk),what=f"Yahoo ({len(tk)} símbolos)")
  df.index=pd.to_datetime(df.index).tz_localize(None)
  for t in [t for t in tk if t not in df or df[t].notna().sum()<500]:   # nova tentativa individual, com espera
      for i in range(3):
          s=yf.download(t,start="2020-01-01",auto_adjust=True,progress=False)["Close"].squeeze()
          if len(s.dropna())>=500: s.index=pd.to_datetime(s.index).tz_localize(None); df[t]=s; break
          if i<2: time.sleep(3*3**i)
  assert "USDBRL=X" in df and df["USDBRL=X"].notna().sum()>500, "sem câmbio"
  df=closes_only(df,dt.datetime.now(dt.timezone(dt.timedelta(hours=-3))))
  df.to_pickle(sys.argv[1] if len(sys.argv)>1 else "/workspace/pairs-mock/prices.pkl")
  print(df.shape, df.index[-1], df.columns[df.notna().sum()<500].tolist())
