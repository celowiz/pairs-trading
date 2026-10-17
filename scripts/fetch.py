import datetime as dt, sys, pandas as pd, yfinance as yf
from universe import assets
tk=list(assets())
df=yf.download(tk,start="2020-01-01",auto_adjust=True,progress=False,threads=True)["Close"]
df.index=pd.to_datetime(df.index).tz_localize(None)
for t in [t for t in tk if t not in df or df[t].notna().sum()<500]:   # nova tentativa individual
    for _ in range(3):
        s=yf.download(t,start="2020-01-01",auto_adjust=True,progress=False)["Close"].squeeze()
        if len(s.dropna())>=500: s.index=pd.to_datetime(s.index).tz_localize(None); df[t]=s; break
assert "USDBRL=X" in df and df["USDBRL=X"].notna().sum()>500, "sem câmbio"
now=dt.datetime.now(dt.timezone(dt.timedelta(hours=-3)))
if (now.hour,now.minute)<(18,30): df=df[df.index.date<now.date()]   # só fechamentos
df.to_pickle(sys.argv[1] if len(sys.argv)>1 else "/workspace/pairs-mock/prices.pkl")
print(df.shape, df.index[-1], df.columns[df.notna().sum()<500].tolist())
