"""Universo com vínculo econômico: pares só dentro do mesmo grupo + lista curada cruzada."""
G = {
 "Bancos BR": ("Ações Brasil", {"ITUB4.SA":"Itaú Unibanco PN","BBDC4.SA":"Bradesco PN","BBDC3.SA":"Bradesco ON","BBAS3.SA":"Banco do Brasil","SANB11.SA":"Santander Brasil","BPAC11.SA":"BTG Pactual","ITSA4.SA":"Itaúsa PN"}),
 "Seguros BR": ("Ações Brasil", {"BBSE3.SA":"BB Seguridade","PSSA3.SA":"Porto Seguro","CXSE3.SA":"Caixa Seguridade"}),
 "Petróleo e combustíveis BR": ("Ações Brasil", {"PETR4.SA":"Petrobras PN","PETR3.SA":"Petrobras ON","PRIO3.SA":"PRIO","RECV3.SA":"PetroRecôncavo","VBBR3.SA":"Vibra","UGPA3.SA":"Ultrapar","CSAN3.SA":"Cosan"}),
 "Mineração e siderurgia BR": ("Ações Brasil", {"VALE3.SA":"Vale","BRAP4.SA":"Bradespar PN","GGBR4.SA":"Gerdau PN","GOAU4.SA":"Metalúrgica Gerdau PN","USIM5.SA":"Usiminas PNA","CSNA3.SA":"CSN","CMIN3.SA":"CSN Mineração"}),
 "Papel e celulose BR": ("Ações Brasil", {"SUZB3.SA":"Suzano","KLBN11.SA":"Klabin"}),
 "Energia elétrica BR": ("Ações Brasil", {"EQTL3.SA":"Equatorial","ENGI11.SA":"Energisa","CPFE3.SA":"CPFL Energia","EGIE3.SA":"Engie Brasil","TAEE11.SA":"Taesa","ISAE4.SA":"ISA Energia","CMIG4.SA":"Cemig PN","CPLE3.SA":"Copel","SBSP3.SA":"Sabesp"}),
 "Varejo BR": ("Ações Brasil", {"LREN3.SA":"Lojas Renner","MGLU3.SA":"Magazine Luiza","AZZA3.SA":"Azzas 2154","VIVA3.SA":"Vivara","ASAI3.SA":"Assaí","RADL3.SA":"Raia Drogasil"}),
 "Construção e shoppings BR": ("Ações Brasil", {"CYRE3.SA":"Cyrela","DIRR3.SA":"Direcional","MRVE3.SA":"MRV","CURY3.SA":"Cury","MULT3.SA":"Multiplan","ALOS3.SA":"Allos","IGTI11.SA":"Iguatemi"}),
 "Saúde e educação BR": ("Ações Brasil", {"HAPV3.SA":"Hapvida","RDOR3.SA":"Rede D'Or","FLRY3.SA":"Fleury","COGN3.SA":"Cogna","YDUQ3.SA":"Yduqs"}),
 "Logística e locação BR": ("Ações Brasil", {"RENT3.SA":"Localiza","VAMO3.SA":"Vamos","RAIL3.SA":"Rumo","MOTV3.SA":"Motiva"}),
 "Telecom BR": ("Ações Brasil", {"VIVT3.SA":"Telefônica Brasil (Vivo)","TIMS3.SA":"TIM"}),
 "Tecnologia EUA": ("Ações EUA", {"AAPL":"Apple","MSFT":"Microsoft","GOOGL":"Alphabet A","GOOG":"Alphabet C","META":"Meta Platforms","AMZN":"Amazon","NVDA":"NVIDIA","AVGO":"Broadcom","AMD":"AMD","MU":"Micron"}),
 "Bancos e pagamentos EUA": ("Ações EUA", {"JPM":"JPMorgan Chase","BAC":"Bank of America","WFC":"Wells Fargo","C":"Citigroup","GS":"Goldman Sachs","MS":"Morgan Stanley","V":"Visa","MA":"Mastercard"}),
 "Energia EUA": ("Ações EUA", {"XOM":"ExxonMobil","CVX":"Chevron","COP":"ConocoPhillips"}),
 "Consumo básico EUA": ("Ações EUA", {"KO":"Coca-Cola","PEP":"PepsiCo","PG":"Procter & Gamble","WMT":"Walmart","COST":"Costco"}),
 "ETFs setoriais EUA": ("ETFs", {"XLK":"ETF Tecnologia (XLK)","XLF":"ETF Financeiro (XLF)","XLE":"ETF Energia (XLE)","XLV":"ETF Saúde (XLV)","XLI":"ETF Indústria (XLI)","XLP":"ETF Consumo básico (XLP)","XLY":"ETF Consumo discricionário (XLY)","XLU":"ETF Utilities (XLU)"}),
 "Treasuries": ("Juros", {"ZT=F":"Futuro Treasury 2 anos","ZF=F":"Futuro Treasury 5 anos","ZN=F":"Futuro Treasury 10 anos","TLT":"ETF Treasury 20+ anos (TLT)","IEF":"ETF Treasury 7-10 anos (IEF)"}),
 "Energia (commodities)": ("Commodities", {"CL=F":"Petróleo WTI","BZ=F":"Petróleo Brent","NG=F":"Gás natural"}),
 "Metais": ("Commodities", {"GC=F":"Ouro","SI=F":"Prata","HG=F":"Cobre"}),
 "Grãos": ("Commodities", {"ZC=F":"Milho","ZS=F":"Soja","ZW=F":"Trigo"}),
 "Cripto": ("Cripto", {"BTC-USD":"Bitcoin","ETH-USD":"Ethereum"}),
}
# Lista curada cruzada (vínculo direto). "@BRL" = convertido para reais com USDBRL.
EXTRA = {"^BVSP":"Ibovespa","BOVA11.SA":"ETF Ibovespa (BOVA11)","EWZ":"ETF MSCI Brasil (EWZ)","^GSPC":"S&P 500","SPY":"ETF S&P 500 (SPY)","ES=F":"Futuro E-mini S&P 500",
 "^NDX":"Nasdaq-100","QQQ":"ETF Nasdaq-100 (QQQ)","NQ=F":"Futuro E-mini Nasdaq-100","GLD":"ETF Ouro (GLD)","SLV":"ETF Prata (SLV)","AAPL34.SA":"Apple BDR","MSFT34.SA":"Microsoft BDR","AMZO34.SA":"Amazon BDR","PBR":"Petrobras ADR (NY)","VALE":"Vale ADR (NY)","ITUB":"Itaú ADR (NY)",
 "USDBRL=X":"Dólar/Real"}
CURATED = [("PETR3.SA","PETR4.SA","ON × PN"),("BBDC3.SA","BBDC4.SA","ON × PN"),("GGBR4.SA","GOAU4.SA","Controlada × holding"),("ITUB4.SA","ITSA4.SA","Controlada × holding"),("VALE3.SA","BRAP4.SA","Controlada × holding"),
 ("GOOGL","GOOG","Classes A × C"),("^BVSP","BOVA11.SA","Índice × ETF"),("^GSPC","SPY","Índice × ETF"),("^GSPC","ES=F","Índice × futuro"),("^NDX","QQQ","Índice × ETF"),("ES=F","SPY","Futuro × ETF"),("^NDX","NQ=F","Índice × futuro"),("NQ=F","QQQ","Futuro × ETF"),("GC=F","GLD","Futuro × ETF"),("SI=F","SLV","Futuro × ETF"),("TLT","ZN=F","ETF × futuro de Treasury"),("BOVA11.SA","EWZ@BRL","ETF local × ETF em NY"),
 ("AAPL34.SA","AAPL@BRL","BDR × ação nos EUA"),("MSFT34.SA","MSFT@BRL","BDR × ação nos EUA"),("AMZO34.SA","AMZN@BRL","BDR × ação nos EUA"),("PETR4.SA","PBR@BRL","Ação × ADR"),("VALE3.SA","VALE@BRL","Ação × ADR"),("ITUB4.SA","ITUB@BRL","Ação × ADR")]
def assets():
    out={}
    for g,(cls,d) in G.items():
        for t,n in d.items(): out[t]=dict(name=n,group=g,cls=cls)
    for t,n in EXTRA.items(): out.setdefault(t,dict(name=n,group="Curados",cls="Índices/ETFs/ADRs"))
    return out
