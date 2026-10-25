(()=>{
const $=id=>document.getElementById(id);
const EN={nav_proj:'Projects',eyebrow:'Project · Relative value between assets',h1:'Pairs that move together — for real',
lead:'Pairs trading bets that the gap between two linked assets reverts to normal. The hard part is telling <em>cointegrated</em> pairs from pairs that only looked related by chance. Here every pair goes through tests against <em>spurious correlation</em>, a multiple‑testing correction, stability over time and an out‑of‑sample backtest. Educational tool — not investment advice.',
t_rank:'Pair ranking',f_class:'CLASS',f_group:'GROUP',f_search:'Search asset',f_rob:'robust only',f_sig:'stretched spread only (|z| ≥ 2)',
legend_chk:'The 4 squares of the badge: FDR · half‑life 2–60 days · stability ≥ 60% · no hedge‑ratio break. “Robust” = all four.',
c_px:'Normalized prices',c_px_n:'base 1 at start · last ~4 years',c_z:'Spread as z‑score',c_z_n:'past data only · bands ±2 (entry) and ±0.5 (exit)',c_b:'Rolling hedge ratio',c_p:'Rolling cointegration p‑value',c_p_n:'252d windows · line = 5%',c_e:'Out‑of‑sample backtest',
t_cmp:'How many pairs each method accepts',cmp_n:'The old method tested every combination of ~120 assets, with 1 year of data and an uncorrected 5% p‑value. With thousands of tests, chance alone approves dozens of pairs. The new method starts only from pairs with an economic link and corrects p‑values for multiple testing.',
old:'OLD METHOD',new:'NEW METHOD',t_sp:'Correlation is not cointegration',sp_px:'Prices (base 1)',sp_p:'p‑value over 1‑year windows',rw_t:'Try it: two independent random walks',rw_b:'Generate another pair',
rw_n:'Two series with no link at all, each with a slight trend. Click several times: price correlation is often high, while return correlation stays near zero.',t_how:'How it works',t_lim:'Limits — read before using',
t_band:'Robust pairs and candidates',band_n:'Robust pairs pass all four tests. Candidates have an A, B or C grade but fail at least one — each card says why. None of this is a recommendation: they are examples to study.',b_rob:'ROBUST',b_cand:'CANDIDATES',b_exp:'NO ECONOMIC LINK · EXPLORATORY (PASS FDR)',f_tier:'TIER',f_econ:'Include pairs with no economic link',new_all:'NEW METHOD · INCLUDING PAIRS WITH NO LINK (SWITCH ON)',
disc:'Educational content. Not a recommendation to buy or sell any asset. Past performance does not guarantee future results.'};
const PT={};document.querySelectorAll('[data-i18n]').forEach(e=>PT[e.dataset.i18n]=e.innerHTML);PT.f_search='Buscar ativo';
const D2={pt:{pair:'Par',grp:'Grupo',z:'z hoje',hl:'Meia‑vida',q:'p ajust.',stab:'Estabil.',grade:'Selo',sig:'Spread',all:'Todos',more:n=>`Mostrar todos (${n})`,less:'Mostrar menos',days:'dias',
 st:{above:'esticado ↑',below:'esticado ↓',near:'perto da banda',neutral:'neutro',nd:'—'},asof:d=>`fechamentos até ${d} · ${'$n'} pares testados`,
 tiles:['z hoje','Meia‑vida','p (Engle‑Granger)','p ajustado (FDR)','Johansen','Estabilidade','Drift do hedge'],yes:'confirma',no:'não confirma',
 oos:['Retorno OOS','Sharpe OOS','Pior queda','Operações','Acerto','Tempo elegível'],eNote:d=>`desde ${d} · custo 0,10% por perna · regras fixas`,
 lgA:(a,b)=>[a,b],lgZ:['z‑score','entrada','saída','fora da amostra'],noTr:'sem operações',
 why:w=>whyPt(w)},
 en:{pair:'Pair',grp:'Group',z:'z now',hl:'Half‑life',q:'adj. p',stab:'Stability',grade:'Badge',sig:'Spread',all:'All',more:n=>`Show all (${n})`,less:'Show less',days:'days',
 st:{above:'stretched ↑',below:'stretched ↓',near:'near band',neutral:'neutral',nd:'—'},asof:d=>`closes through ${d} · ${'$n'} pairs tested`,
 tiles:['z now','Half‑life','p (Engle‑Granger)','adjusted p (FDR)','Johansen','Stability','Hedge drift'],yes:'confirms',no:'does not confirm',
 oos:['OOS return','OOS Sharpe','Max drawdown','Trades','Hit rate','Time eligible'],eNote:d=>`since ${d} · 0.10% cost per leg · fixed rules`,
 lgZ:['z‑score','entry','exit','out of sample'],noTr:'no trades',why:w=>whyEn(w)}};
const GEN={'Ações Brasil':'Brazil stocks','Ações EUA':'US stocks','ETFs':'ETFs','Juros':'Rates','Commodities':'Commodities','Cripto':'Crypto','Índices/ETFs/ADRs':'Indices/ETFs/ADRs','Curados':'Curated cross pairs','Sem vínculo':'No economic link'};
let P0=[],U=null,econ=false;const TIER={pt:{robust:'robusto',cand:'candidato',other:'demais',explore:'sem vínculo · exploratório'},en:{robust:'robust',cand:'candidate',other:'others',explore:'no link · exploratory'}};
const nT=()=>econ&&U?U.funnel.family:M.funnel.corr,tagH=w=>`<span class="tag ${w.tier}">${TIER[lang][w.tier]}</span>`;
let lang=localStorage.getItem('pairs_lang')||'pt',P=[],M,sel=null,sortK='score',sortD=-1,showAll=false;const cache={};
const L=()=>D2[lang],gl=s=>lang==='en'?(GEN[s]||s.replace(' BR',' (BR)').replace(' EUA',' (US)')):s;
const tk=t=>t.replace('.SA','').replace('@BRL',' (R$)').replace('^','');
const num=(x,d=2)=>x==null?'—':(lang==='pt'?x.toFixed(d).replace('.',','):x.toFixed(d));
const pct=(x,d=0)=>x==null?'—':num(x*100,d)+'%';
const fp=p=>p==null?'—':p<0.0001?'<0,0001'.replace(',',lang==='pt'?',':'.'):num(p,p<0.01?4:3);
const ga=(e,p)=>{try{gtag('event',e,Object.assign({content_group:'pairs_trading',lang},p))}catch(_){}};
async function get(u){return cache[u]||(cache[u]=await (await fetch(u)).json())}
function i18n(){document.documentElement.lang=lang==='en'?'en':'pt-BR';$('lng').textContent=lang==='en'?'PT':'EN';
 document.querySelectorAll('[data-i18n]').forEach(e=>e.innerHTML=(lang==='en'?EN:PT)[e.dataset.i18n]);
 document.querySelectorAll('[data-i18n-ph]').forEach(e=>e.placeholder=lang==='en'?EN.f_search:PT.f_search)}
$('lng').onclick=()=>{lang=lang==='en'?'pt':'en';localStorage.setItem('pairs_lang',lang);ga('pairs_lang',{value:lang});i18n();all()};

/* ---------- gráfico genérico em canvas ---------- */
function chart(cv,o){const dpr=devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;const g=cv.getContext('2d');g.scale(dpr,dpr);
 const pl=44,pr=10,pt=8,pb=20,n=o.n;let lo=Infinity,hi=-Infinity;
 o.s.forEach(s=>s.v.forEach(v=>{if(v!=null&&isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v)}}));(o.h||[]).forEach(h=>{lo=Math.min(lo,h.y);hi=Math.max(hi,h.y)});
 if(o.lo!=null)lo=o.lo;if(o.hi!=null)hi=o.hi;const pad=(hi-lo)*.06||1;lo-=o.lo!=null?0:pad;hi+=o.hi!=null?0:pad;
 const X=i=>pl+(W-pl-pr)*i/Math.max(1,n-1),Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
 g.font='10px ui-monospace,Menlo,monospace';g.fillStyle='#8a8a93';g.strokeStyle='#1c1c1f';g.lineWidth=1;
 for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4,y=Y(v);g.beginPath();g.moveTo(pl,y);g.lineTo(W-pr,y);g.stroke();g.fillText(o.fmt?o.fmt(v):num(v,(hi-lo)<.08?3:(hi-lo)<2?2:1),2,y+3)}
 if(o.dates){const step=Math.ceil(n/(W<500?4:7));for(let i=0;i<n;i+=step){g.fillText(o.dates[i].slice(0,7),X(i)-18,H-5)}}
 if(o.shadeFrom!=null){g.fillStyle='rgba(45,212,191,.05)';g.fillRect(X(o.shadeFrom),pt,W-pr-X(o.shadeFrom),H-pt-pb)}
 (o.shade||[]).forEach(([a,b])=>{g.fillStyle='rgba(45,212,191,.09)';g.fillRect(X(a),pt,X(b)-X(a),H-pt-pb)});
 (o.h||[]).forEach(h=>{g.strokeStyle=h.c;g.setLineDash(h.d||[4,4]);g.beginPath();g.moveTo(pl,Y(h.y));g.lineTo(W-pr,Y(h.y));g.stroke();g.setLineDash([])});
 o.s.forEach(s=>{g.strokeStyle=s.c;g.lineWidth=s.w||1.5;g.beginPath();let up=false;s.v.forEach((v,i)=>{const xi=s.x?s.x[i]:i;if(v==null||!isFinite(v)){up=false;return}const yy=Y(Math.max(lo,Math.min(hi,v)));up?g.lineTo(X(xi),yy):g.moveTo(X(xi),yy);up=true});g.stroke();
  if(s.dots){g.fillStyle=s.c;s.v.forEach((v,i)=>{if(v!=null){g.beginPath();g.arc(X(s.x[i]),Y(Math.min(hi,v)),2.2,0,7);g.fill()}})}});
 (o.mk||[]).forEach(m=>{const x=X(m.i),y=Y(Math.max(lo,Math.min(hi,m.y)));g.fillStyle=m.c;g.beginPath();if(m.t==='up'){g.moveTo(x,y-1);g.lineTo(x-5,y+8);g.lineTo(x+5,y+8)}else if(m.t==='dn'){g.moveTo(x,y+1);g.lineTo(x-5,y-8);g.lineTo(x+5,y-8)}else g.arc(x,y,3,0,7);g.fill()});
 const tip=cv.parentNode.querySelector('.tip');if(!tip||!o.dates)return;
 cv.onmousemove=e=>{const r=cv.getBoundingClientRect(),i=Math.round((e.clientX-r.left-pl)/(W-pl-pr)*(n-1));if(i<0||i>=n){tip.hidden=true;return}
  tip.hidden=false;tip.innerHTML=o.dates[i]+'<br>'+o.s.filter(s=>!s.x).map(s=>`<span style="color:${s.c}">■</span> ${s.n||''} ${s.v[i]==null?'—':(o.fmt?o.fmt(s.v[i]):num(s.v[i],3))}`).join('<br>');
  tip.style.left=Math.min(e.clientX-r.left+12,W-170)+'px';tip.style.top='8px'};cv.onmouseleave=()=>tip.hidden=true}

/* ---------- tabela ---------- */
function opts(){const cls=[...new Set(P.map(w=>w.group==='Curados'?'Curados':w.cls))],grp=[...new Set(P.map(w=>w.group))];
 const c=$('fCls').value,g=$('fGrp').value;
 $('fCls').innerHTML=`<option value="">${L().all}</option>`+cls.map(x=>`<option value="${x}">${gl(x)}</option>`).join('');
 $('fGrp').innerHTML=`<option value="">${L().all}</option>`+grp.filter(x=>!c||P.some(w=>w.group===x&&(w.group==='Curados'?'Curados':w.cls)===c)).map(x=>`<option value="${x}">${gl(x)}</option>`).join('');$('fCls').value=c;$('fGrp').value=g;
 const tv=$('fTier').value;$('fTier').innerHTML=`<option value="">${L().all}</option>`+['robust','cand','other'].concat(econ?['explore']:[]).map(k=>`<option value="${k}">${TIER[lang][k]}</option>`).join('');$('fTier').value=econ||tv!=='explore'?tv:''}
function rows(){const c=$('fCls').value,g=$('fGrp').value,q=$('fQ').value.toLowerCase();
 let r=P.filter(w=>(!c||(w.group==='Curados'?'Curados':w.cls)===c)&&(!g||w.group===g)&&(!$('fTier').value||w.tier===$('fTier').value)&&(!$('fSig').checked||Math.abs(w.z||0)>=2)
  &&(!q||(w.ny+w.nx+w.y+w.x).toLowerCase().includes(q)));
 const key={score:w=>w.score??(w.unlinked?-1-(w.q??1):-1),z:w=>Math.abs(w.z||0),hl:w=>w.hl??1e9,q:w=>w.q,stab:w=>w.stab,pair:w=>w.ny,grp:w=>w.group}[sortK];
 return r.sort((a,b)=>{const A=key(a),B=key(b);return(A>B?1:A<B?-1:0)*sortD})}
function table(){const r=rows(),l=L(),cols=[['pair',l.pair],['grp',l.grp],['z',l.z],['hl',l.hl],['q',l.q],['stab',l.stab],['score',l.grade],['tier',lang==='pt'?'Faixa':'Tier'],['sig',l.sig]];
 const show=showAll?r:r.slice(0,25);
 $('tbl').innerHTML='<tr>'+cols.map(([k,t])=>`<th data-k="${k}" class="${k===sortK?'on':''}">${t}${k===sortK?(sortD<0?' ↓':' ↑'):''}</th>`).join('')+'</tr>'+
 show.map(w=>`<tr class="row ${sel&&sel.id===w.id?'sel':''}" data-id="${w.id}"><td class="pn">${w.ny} × ${w.nx}<small>${tk(w.y)} / ${tk(w.x)}</small></td><td style="font-family:Inter;color:var(--mut);font-size:12px">${gl(w.group)}</td>
 <td>${num(w.z)}</td><td>${w.hl==null||!isFinite(w.hl)?'—':num(w.hl,1)}</td><td class="${w.pass_fdr?'ok':''}">${fp(w.q)}</td><td class="${w.pass_stab?'ok':''}">${pct(w.stab)}</td>
 <td><div style="display:flex;gap:8px;align-items:center;justify-content:flex-end"><span class="chk">${[w.pass_fdr,w.pass_hl,w.pass_stab,w.pass_break].map(v=>`<i class="${v?'y':''}"></i>`).join('')}</span>${w.grade?`<span class="gr g${w.grade}">${w.grade}</span>`:''}</div></td>
 <td>${tagH(w)}</td><td><span class="st ${w.state}">${l.st[w.state]}</span></td></tr>`).join('');
 $('more').hidden=r.length<=25;$('more').textContent=showAll?l.less:l.more(r.length)}
$('tbl').onclick=e=>{const th=e.target.closest('th');if(th){const k=th.dataset.k;if(k==='sig'||k==='tier')return;sortD=k===sortK?-sortD:(k==='pair'||k==='grp'||k==='q'||k==='hl'?1:-1);sortK=k;ga('pairs_sort',{control:'sort',value:k});return table()}
 const tr=e.target.closest('tr.row');if(tr){pick(tr.dataset.id,true)}};
$('fEcon').onchange=async e=>{econ=e.target.checked;ga('toggle_econ_filter',{control:'econ_filter',value:econ?'on':'off'});
 if(econ&&!U){$('econLoad').textContent=lang==='pt'?'carregando…':'loading…';U=await get('data/unlinked.json');$('econLoad').textContent=''}
 build();all()};
function build(){if(!econ){P=P0;return}const o=U.linked_over,nm=U.names,gr=U.groups;
 P=P0.map(w=>o[w.id]?Object.assign({},w,o[w.id]):w).concat(U.pairs,U.slim.map(([y,x,p,q,rc])=>({id:'s_'+y+'_'+x,y,x,ny:nm[y],nx:nm[x],a:y,b:x,group:'Sem vínculo',cls:'Sem vínculo',link:gr[y]+' × '+gr[x],p,q,rcorr:rc,pass_fdr:q<.05,grade:null,score:null,tier:'explore',unlinked:true,slim:true,state:'nd',z:null,hl:null,stab:null})));
}
$('more').onclick=()=>{showAll=!showAll;table()};
['fCls','fGrp','fTier','fSig'].forEach(id=>$(id).onchange=e=>{if(id==='fCls'){$('fGrp').value='';opts()}ga(id==='fTier'?'filter_tier':'pairs_filter',{control:id,value:e.target.type==='checkbox'?e.target.checked:e.target.value});table()});
let qt;$('fQ').oninput=()=>{clearTimeout(qt);qt=setTimeout(()=>{table();ga('pairs_filter',{control:'search',value:$('fQ').value})},400)};

/* ---------- motivos e faixa ---------- */
function reasons(w){const pt=lang==='pt',r=[];
 if(!w.pass_fdr)r.push(w.p<0.05?(pt?`p‑valor só passa sem correção: ${fp(w.p)} < 5%, mas ajustado pelo FDR (${nT().toLocaleString('pt-BR')} testes) fica ${fp(w.q)}`:`p‑value only passes uncorrected: ${fp(w.p)} < 5%, but FDR‑adjusted (${nT().toLocaleString('en')} tests) it is ${fp(w.q)}`)
  :(pt?`p‑valor ${fp(w.p)} acima de 5% mesmo sem correção`:`p‑value ${fp(w.p)} above 5% even uncorrected`));
 if(!w.slim){
  if(w.hl==null||!isFinite(w.hl))r.push(pt?'sem volta à média mensurável (meia‑vida indefinida)':'no measurable mean reversion (undefined half‑life)');
  else if(w.hl<2)r.push(pt?`meia‑vida ${num(w.hl,1)} dia(s) < 2: quase o mesmo ativo, a diferença some antes de cobrir os custos`:`half‑life ${num(w.hl,1)} day(s) < 2: nearly the same asset, the gap closes before covering costs`);
  else if(w.hl>60)r.push(pt?`meia‑vida ${num(w.hl,1)} dias > 60: volta à média lenta demais`:`half‑life ${num(w.hl,1)} days > 60: mean reversion too slow`);
  if(!w.pass_stab)r.push(pt?`estabilidade ${pct(w.stab)} < 60%: cointegrado em poucas janelas de 1 ano`:`stability ${pct(w.stab)} < 60%: cointegrated in few 1‑year windows`);
  if(!w.pass_break)r.push(pt?`drift do hedge ${pct(w.drift)} > 35%: a proporção entre os ativos mudou`:`hedge drift ${pct(w.drift)} > 35%: the ratio between the assets changed`);
  if(!w.unlinked&&w.grade!=='A'){if(!w.joh)r.push(pt?'teste de Johansen não confirma (tira pontos da nota)':'Johansen test does not confirm (costs grade points)');
   if(!w.trades)r.push(pt?'nenhuma operação no backtest fora da amostra (tira pontos da nota)':'no trades in the out‑of‑sample backtest (costs grade points)');
   else if((w.oos_sh||0)<0.3)r.push(pt?`Sharpe fora da amostra ${num(w.oos_sh)} < 0,3 (tira pontos da nota)`:`out‑of‑sample Sharpe ${num(w.oos_sh)} < 0.3 (costs grade points)`)}}
 if(w.unlinked)r.push(pt?'sem vínculo econômico: não recebe nota; mesmo passando nos testes, fica só como exploratório':'no economic link: no grade; even if it passes the tests, it stays exploratory only');
 return r}
function bcard(w){const pt=lang==='pt',rs=reasons(w);
 return `<div class="bc ${w.tier==='robust'?'rob':''}" data-id="${w.id}"><div class="t"><div class="n">${w.ny} × ${w.nx}<small>${tk(w.y)} / ${tk(w.x)} · ${gl(w.group)}</small></div>${w.grade?`<span class="gr g${w.grade}">${w.grade}</span>`:''}</div>
 <div class="m">${tagH(w)} &nbsp;z ${num(w.z)} · ${pt?'meia‑vida':'half‑life'} ${w.hl==null?'—':num(w.hl,1)} · ${pt?'estab.':'stab.'} ${pct(w.stab)}</div>
 ${rs.length?`<ul>${rs.map(x=>`<li>${x}</li>`).join('')}</ul>`:`<ul><li>${pt?'passa em todos os testes e tem nota A':'passes every test and has an A grade'}</li></ul>`}</div>`}
function band(){const pt=lang==='pt',rob=P.filter(w=>w.tier==='robust'&&!w.unlinked),cand=P.filter(w=>w.tier==='cand'&&!w.unlinked).sort((a,b)=>b.score-a.score),ex=econ?P.filter(w=>w.unlinked&&w.pass_fdr):[];
 $('bRob').innerHTML=rob.map(bcard).join('')||`<p class="note">${pt?'Nenhum par passa nos quatro testes com esta configuração.':'No pair passes all four tests with this setting.'}</p>`;
 $('bCand').innerHTML=cand.map(bcard).join('');$('bExpW').hidden=!econ;$('bExp').innerHTML=ex.map(bcard).join('')||`<p class="note">${pt?'Nenhum par sem vínculo passa no FDR.':'No unlinked pair passes FDR.'}</p>`;
 $('bandNote').textContent=pt?`${rob.length} robustos · ${cand.length} candidatos${econ?` · ${ex.length} sem vínculo no FDR`:''}`:`${rob.length} robust · ${cand.length} candidates${econ?` · ${ex.length} unlinked passing FDR`:''}`}
$('band').onclick=e=>{const c=e.target.closest('.bc');if(c){ga('pairs_select',{asset:c.dataset.id,source:'band'});pick(c.dataset.id,true)}};

/* ---------- detalhe ---------- */
function whyPt(w){const s=[];
 s.push(w.pass_fdr?`Cointegração significativa mesmo depois da correção para ${nT().toLocaleString('pt-BR')} testes (p ajustado ${fp(w.q)}).`:`Depois da correção para ${nT().toLocaleString('pt-BR')} testes, o p‑valor ajustado (${fp(w.q)}) não passa de 5%: pode ser acaso.`);
 if(w.hl<2)s.push('A distância some em menos de 2 dias: são quase o mesmo ativo (arbitragem), e não sobra espaço para operar depois dos custos.');else if(w.hl>60)s.push('A meia‑vida passa de 60 dias: a volta à média é lenta demais.');
 s.push(w.pass_stab?`Cointegrado em ${pct(w.stab)} das janelas de 1 ano.`:`Cointegrado em só ${pct(w.stab)} das janelas de 1 ano — a relação vai e vem.`);
 if(!w.pass_break)s.push(`O hedge ratio mudou ${pct(w.drift)} entre as duas metades da janela: sinal de quebra estrutural.`);
 if(Math.abs(w.z)>=2)s.push(`Hoje o spread está ${w.z>0?'acima':'abaixo'} de 2 desvios. Pela regra do backtest, isso abriria uma operação ${w.pass_fdr&&w.pass_hl?'':'— mas o par não está elegível'}.`);return s.join(' ')}
function whyEn(w){const s=[];
 s.push(w.pass_fdr?`Cointegration remains significant after correcting for ${nT().toLocaleString('en')} tests (adjusted p ${fp(w.q)}).`:`After correcting for ${nT().toLocaleString('en')} tests, the adjusted p‑value (${fp(w.q)}) is above 5%: it may be chance.`);
 if(w.hl<2)s.push('The gap closes in under 2 days: they are nearly the same asset (arbitrage), leaving no room to trade after costs.');else if(w.hl>60)s.push('Half‑life above 60 days: mean reversion is too slow.');
 s.push(w.pass_stab?`Cointegrated in ${pct(w.stab)} of 1‑year windows.`:`Cointegrated in only ${pct(w.stab)} of 1‑year windows — the link comes and goes.`);
 if(!w.pass_break)s.push(`The hedge ratio moved ${pct(w.drift)} between the two halves of the window: a sign of a structural break.`);
 if(Math.abs(w.z)>=2)s.push(`Today the spread is ${w.z>0?'above':'below'} 2 standard deviations. Under the backtest rule this would open a trade${w.pass_fdr&&w.pass_hl?'':' — but the pair is not eligible'}.`);return s.join(' ')}
const tile=(t,v,s,c='')=>`<div class="tile"><div class="ill">${t}</div><div class="v ${c}">${v}</div>${s?`<div class="s">${s}</div>`:''}</div>`;
async function pick(id,user){sel=P.find(w=>w.id===id);const w=sel,l=L();if(user){ga('pairs_select',{asset:id});$('det').scrollIntoView({behavior:'smooth'})}table();
 $('dTag').innerHTML=tagH(w);
 const rs=reasons(w);$('dReasons').innerHTML=rs.length?`<b>${lang==='pt'?(w.tier==='robust'?'Por que não é nota A':'Por que não é robusto'):(w.tier==='robust'?'Why it is not an A':'Why it is not robust')}</b><ul>${rs.map(x=>`<li>${x}</li>`).join('')}</ul>`:'';
 $('dCharts').hidden=!!w.unlinked;$('dSlim').hidden=!w.unlinked;
 $('dSlim').textContent=lang==='pt'?'Par sem vínculo econômico (exploratório): guardamos só o resumo estatístico, sem séries nem gráficos, para não inflar os dados.':'Pair with no economic link (exploratory): only the statistical summary is stored, without series or charts, to keep the data small.';
 $('dGrp').textContent=gl(w.group)+' · '+w.link;$('dTitle').innerHTML=`${w.ny} <span style="color:var(--mut)">×</span> ${w.nx}`;
 $('dGrade').innerHTML=w.grade?`<span class="gr g${w.grade}" style="width:44px;height:44px;font-size:20px;border-radius:12px">${w.grade}</span> <span class="ill">${w.score}/100</span>`:'';
 const t=l.tiles;
 if(w.slim){$('dTiles').innerHTML=tile(t[2],fp(w.p),lang==='pt'?'3 anos, log':'3 years, log','bad')+tile(t[3],fp(w.q),'Benjamini‑Hochberg',w.pass_fdr?'ok':'bad')+tile(lang==='pt'?'Correlação dos retornos':'Return correlation',num(w.rcorr),'');$('dWhy').innerHTML=lang==='pt'?'Não passa nem a 5% sem correção, então os demais testes não foram calculados.':'It does not pass even at 5% uncorrected, so the other tests were not computed.';return}
 $('dTiles').innerHTML=tile(t[0],num(w.z),l.st[w.state],Math.abs(w.z)>=2?'ok':'')+tile(t[1],w.hl==null?'—':num(w.hl,1),l.days,w.pass_hl?'ok':'bad')+tile(t[2],fp(w.p),lang==='pt'?'3 anos, log':'3 years, log')
  +tile(t[3],fp(w.q),'Benjamini‑Hochberg',w.pass_fdr?'ok':'bad')+tile(t[4],w.joh?l.yes:l.no,'',w.joh?'ok':'mid')+tile(t[5],pct(w.stab),'≥ 60%',w.pass_stab?'ok':'bad')+tile(t[6],pct(w.drift),'< 35%',w.pass_break?'ok':'bad');
 $('dWhy').innerHTML=l.why(w);if(w.unlinked)return;
 const d=await get(`data/pair/${id}.json`);
 const ty=tk(w.y),tx=tk(w.x);$('lgA').innerHTML=`<span><i style="background:#2dd4bf"></i>${w.ny} (${ty})</span><span><i style="background:#e5b454"></i>${w.nx} (${tx})</span>`;
 chart($('cA'),{n:d.dates.length,dates:d.dates,s:[{v:d.py,c:'#2dd4bf',n:ty},{v:d.px,c:'#e5b454',n:tx}],shadeFrom:d.oos});
 const mk=[];d.trades.forEach(t=>{mk.push({i:t.i,y:d.z[t.i],t:t.s>0?'up':'dn',c:t.s>0?'#2dd4bf':'#f97366'});mk.push({i:t.o,y:d.z[t.o],t:'o',c:'#f4f1ea'})});
 const sh=[];let a=null;d.elig.forEach((v,i)=>{if(v&&a==null)a=i;if((!v||i===d.elig.length-1)&&a!=null){sh.push([a,i]);a=null}});
 $('lgZ').innerHTML=`<span><i style="background:#a1a1aa"></i>${l.lgZ[0]}</span><span><i style="background:#2dd4bf"></i>▲▼ ${l.lgZ[1]}</span><span><i style="background:#f4f1ea"></i>● ${l.lgZ[2]}</span><span><i style="background:rgba(45,212,191,.25)"></i>${lang==='pt'?'par elegível (walk‑forward)':'eligible (walk‑forward)'}</span>`;
 chart($('cZ'),{n:d.dates.length,dates:d.dates,s:[{v:d.z,c:'#a1a1aa',w:1.2,n:'z'}],lo:-4.5,hi:4.5,shade:sh,mk,h:[{y:2,c:'#2dd4bf'},{y:-2,c:'#2dd4bf'},{y:.5,c:'#3f3f46',d:[2,4]},{y:-.5,c:'#3f3f46',d:[2,4]},{y:0,c:'#27272a',d:[]}]});
 chart($('cB'),{n:d.dates.length,dates:d.dates,s:[{v:d.beta,c:'#2dd4bf',n:'β'}]});
 const ix=d.rp.map(r=>d.dates.indexOf(r[0]));chart($('cP'),{n:d.dates.length,dates:d.dates,s:[{v:d.rp.map(r=>r[1]),x:ix,c:'#e5b454',dots:true}],lo:0,hi:1,h:[{y:.05,c:'#f97366'}]});
 const eq=d.eq.map((v,i)=>i>=d.oos-1?v:null);chart($('cE'),{n:d.dates.length,dates:d.dates,s:[{v:eq,c:'#2dd4bf',w:2,n:lang==='pt'?'patrimônio':'equity'}],h:[{y:1,c:'#3f3f46'}]});
 $('eNote').textContent=l.eNote(d.dates[d.oos]);const o=l.oos;
 $('eTiles').innerHTML=tile(o[0],pct(w.oos_ret,1),'',w.oos_ret>0?'ok':w.oos_ret<0?'bad':'')+tile(o[1],num(w.oos_sh),'')+tile(o[2],pct(w.oos_dd,1),'')+tile(o[3],w.trades||0,w.trades?'':l.noTr)+tile(o[4],pct(w.hit),'')+tile(o[5],pct(w.days_in),lang==='pt'?'do período OOS':'of the OOS period')}

/* ---------- comparação e exemplo espúrio ---------- */
function funnel(){const f=M.funnel,mx=f.all_pairs,pt=lang==='pt';
 const row=(t,v,c,s='')=>`<div class="fr"><span>${t}</span><div class="bar"><i style="width:${Math.max(.6,Math.sqrt(v/mx)*100)}%;background:${c}"></i></div><b>${v.toLocaleString(pt?'pt-BR':'en')}</b></div>${s}`;
 $('funOld').innerHTML=row(pt?'Combinações testadas':'Combinations tested',f.old_tested,'#3f3f46')+row(pt?'Aceitos (p < 5%, sem correção)':'Accepted (p < 5%, uncorrected)',f.old_accepted,'#f97366')+row(pt?'… sem vínculo econômico':'… with no economic link',f.old_no_link,'#f97366')+row(pt?'… que passam no método novo':'… that pass the new method',f.old_in_robust,'#2dd4bf');
 $('funNew').innerHTML=row(pt?'Combinações possíveis':'Possible combinations',f.all_pairs,'#3f3f46')+row(pt?'Com vínculo econômico':'With an economic link',f.econ,'#52525b')+row(pt?'Correlação de retornos ≥ 0,3':'Return correlation ≥ 0.3',f.corr,'#52525b')
  +row(pt?`p < 5% sem correção (~${num(f.expected_false_raw,0)} por acaso)`:`p < 5% uncorrected (~${num(f.expected_false_raw,0)} by chance)`,f.raw05,'#e5b454')+row(pt?'Passam no FDR 5%':'Pass FDR 5%',f.fdr,'#2dd4bf')+row(pt?'… e meia‑vida 2–60d':'… and half‑life 2–60d',f.fdr_hl,'#2dd4bf')+row(pt?'… e estáveis (≥ 60%)':'… and stable (≥ 60%)',f.fdr_hl_stab,'#2dd4bf')+row(pt?'Robustos (sem quebra)':'Robust (no break)',f.robust,'#2dd4bf');
 $('cmpWhy').innerHTML=pt?`<b>Leitura:</b> dos ${f.old_accepted} pares que o método antigo aprovaria, ${f.old_no_link} não têm nenhuma ligação econômica (por exemplo, uma ação brasileira contra um futuro de juros americano) e só ${f.old_in_robust} sobrevivem aos critérios novos. No método novo, ${f.raw05} pares passam a 5% sem correção, mas se esperariam ~${num(f.expected_false_raw,0)} só por acaso; o FDR deixa ${f.fdr}. Poucos pares robustos é o resultado honesto: cointegração estável é rara.`
  :`<b>Reading:</b> of the ${f.old_accepted} pairs the old method would accept, ${f.old_no_link} have no economic link at all (e.g. a Brazilian stock against a US rates future) and only ${f.old_in_robust} survive the new criteria. In the new method, ${f.raw05} pairs pass at 5% uncorrected, but ~${num(f.expected_false_raw,0)} would be expected by chance alone; FDR leaves ${f.fdr}. Few robust pairs is the honest result: stable cointegration is rare.`}
function econTexts(){const pt=lang==='pt',f=M.funnel,loc=pt?'pt-BR':'en',n=x=>x.toLocaleString(loc);
 if(!econ||!U){$('econNote').innerHTML=pt?`<b>Desligada (padrão):</b> só entram os ${n(f.econ)} pares com vínculo econômico, e a correção FDR conta os ${n(f.corr)} testes realizados. Ligue para ver o que acontece quando testamos tudo contra tudo.`
  :`<b>Off (default):</b> only the ${n(f.econ)} pairs with an economic link are included, and the FDR correction counts the ${n(f.corr)} tests performed. Switch on to see what happens when we test everything against everything.`;
  $('funEcon').innerHTML='';$('econWhy').innerHTML=pt?'Ligue a chave “Incluir pares sem vínculo econômico” no ranking para preencher este bloco.':'Turn on “Include pairs with no economic link” in the ranking to fill this block.';return}
 const u=U.funnel;
 $('econNote').innerHTML=pt?`<b>Ligada:</b> testamos também as ${n(u.un_tested)} combinações sem vínculo, todas, sem pré‑filtro de correlação (o teste é leve o bastante). A correção FDR (Benjamini‑Hochberg, 5%) passa a contar <b>todos os ${n(u.family)} testes</b>, inclusive os pares com vínculo — a régua aperta para todos. Pares sem vínculo não recebem nota em letra: ficam marcados como <b>exploratórios</b> mesmo se passarem em tudo, e guardam só um resumo.`
  :`<b>On:</b> we also test the ${n(u.un_tested)} combinations with no link, all of them, with no correlation pre‑filter (the test is light enough). The FDR correction (Benjamini‑Hochberg, 5%) now counts <b>all ${n(u.family)} tests</b>, linked pairs included — the bar rises for everyone. Unlinked pairs get no letter grade: they are marked <b>exploratory</b> even if they pass everything, and keep only a summary.`;
 const mx=M.funnel.all_pairs,row=(t,v,c)=>`<div class="fr"><span>${t}</span><div class="bar"><i style="width:${Math.max(.6,Math.sqrt(v/mx)*100)}%;background:${c}"></i></div><b>${n(v)}</b></div>`;
 $('funEcon').innerHTML=row(pt?'Testes na família do FDR':'Tests in the FDR family',u.family,'#3f3f46')+row(pt?'… sem vínculo':'… with no link',u.un_tested,'#52525b')+row(pt?'… sem vínculo com corr. de retornos ≥ 0,3':'… unlinked with return corr. ≥ 0.3',u.un_corr,'#52525b')
  +row(pt?`Sem vínculo com p < 5% (~${n(u.un_expected_false)} por acaso)`:`Unlinked with p < 5% (~${n(u.un_expected_false)} by chance)`,u.un_raw05,'#f97366')+row(pt?`Sem vínculo no FDR (${n(u.family)} testes)`:`Unlinked passing FDR (${n(u.family)} tests)`,u.un_fdr,'#f97366')+row(pt?'Sem vínculo que passam em tudo':'Unlinked passing everything',u.un_all,'#f97366')
  +row(pt?`Com vínculo no FDR (antes ${f.fdr})`:`Linked passing FDR (was ${f.fdr})`,u.lk_fdr,'#2dd4bf')+row(pt?`Robustos com vínculo (antes ${f.robust})`:`Robust linked pairs (was ${f.robust})`,u.lk_robust,'#2dd4bf');
 const ex=U.pairs.filter(w=>w.pass_fdr).map(w=>`${w.ny} × ${w.nx}`).join(', ');
 $('econWhy').innerHTML=pt?`<b>Leitura:</b> ${n(u.un_raw05)} pares sem vínculo passam a 5% sem correção — perto dos ~${n(u.un_expected_false)} que o acaso produziria. Com a correção sobre ${n(u.family)} testes, sobra ${n(u.un_fdr)}${ex?` (${ex})`:''} e nenhum passa em tudo. O custo de testar tudo: entre os pares com vínculo, os aprovados no FDR caem de ${f.fdr} para ${u.lk_fdr} e os robustos de ${f.robust} para ${u.lk_robust}. Mais testes sem motivo econômico só diluem os resultados verdadeiros.`
  :`<b>Reading:</b> ${n(u.un_raw05)} unlinked pairs pass at 5% uncorrected — close to the ~${n(u.un_expected_false)} chance alone would produce. Correcting over ${n(u.family)} tests leaves ${n(u.un_fdr)}${ex?` (${ex})`:''} and none passes everything. The cost of testing everything: among linked pairs, FDR passes drop from ${f.fdr} to ${u.lk_fdr} and robust pairs from ${f.robust} to ${u.lk_robust}. More tests without an economic reason only dilute the true results.`}
function spur(){const s=M.spurious,pt=lang==='pt',A=tk(s.a),B=tk(s.b);
 $('spIntro').innerHTML=pt?`Dois ativos com tendência quase sempre parecem correlacionados, mesmo sem nenhuma ligação. Exemplo real, aprovado pelo método antigo: <b>${s.na}</b> × <b>${s.nb}</b>. Os preços têm correlação de ${num(s.lcorr)}, mas os retornos diários quase não se relacionam. O par não tem vínculo econômico, então o método novo nem chegaria a testá‑lo — e, mesmo testado, não passaria.`
  :`Two trending assets almost always look correlated, even with no link at all. A real example accepted by the old method: <b>${s.na}</b> × <b>${s.nb}</b>. Prices have a ${num(s.lcorr)} correlation, but daily returns barely relate. The pair has no economic link, so the new method would not even test it — and, if tested, it would fail.`;
 $('spTiles').innerHTML=tile(pt?'Correlação dos preços':'Price correlation',num(s.lcorr),pt?'1 ano (método antigo)':'1 year (old method)','bad')+tile(pt?'Correlação dos retornos':'Return correlation',num(s.rcorr),pt?'3 anos':'3 years','ok')
  +tile(pt?'p em 1 ano':'p over 1 year',fp(s.p_short),pt?'“cointegrado” a 5%':'“cointegrated” at 5%','bad')+tile(pt?'p em 3 anos':'p over 3 years',fp(s.p_long),pt?'rejeitado':'rejected','ok')+tile(pt?'Estabilidade':'Stability',pct(s.stab),pt?'das janelas de 1 ano':'of 1‑year windows','ok');
 $('lgS').innerHTML=`<span><i style="background:#2dd4bf"></i>${s.na} (${A})</span><span><i style="background:#e5b454"></i>${s.nb} (${B})</span>`;
 chart($('cS1'),{n:s.dates.length,dates:s.dates,s:[{v:s.pa,c:'#2dd4bf',n:A},{v:s.pb,c:'#e5b454',n:B}]});
 chart($('cS2'),{n:s.dates.length,dates:s.dates,s:[{v:s.rp.map(r=>r[1]),x:s.rp.map(r=>s.dates.indexOf(r[0])),c:'#e5b454',dots:true}],lo:0,hi:1,h:[{y:.05,c:'#f97366'}]})}
let rwN=0,rwHi=0;
function rw(user){const n=500,g=()=>{let u=0,v=0;while(!u)u=Math.random();v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
 const walk=()=>{const d=(Math.random()-.5)*.003;let p=0;return Array.from({length:n},()=>p+=d+.012*g())},a=walk(),b=walk();
 const corr=(x,y)=>{const mx=x.reduce((s,v)=>s+v,0)/x.length,my=y.reduce((s,v)=>s+v,0)/y.length;let c=0,vx=0,vy=0;x.forEach((v,i)=>{c+=(v-mx)*(y[i]-my);vx+=(v-mx)**2;vy+=(y[i]-my)**2});return c/Math.sqrt(vx*vy)};
 const da=a.slice(1).map((v,i)=>v-a[i]),db=b.slice(1).map((v,i)=>v-b[i]),lc=corr(a.map(Math.exp),b.map(Math.exp)),rc=corr(da,db);
 if(user){rwN++;if(Math.abs(lc)>0.6)rwHi++;ga('pairs_sim',{value:rwN})}
 chart($('cRW'),{n,s:[{v:a.map(Math.exp),c:'#2dd4bf'},{v:b.map(Math.exp),c:'#e5b454'}]});const pt=lang==='pt';
 $('rwOut').innerHTML=(pt?`Correlação dos preços: <b>${num(lc)}</b> · dos retornos: <b>${num(rc)}</b>.`:`Price correlation: <b>${num(lc)}</b> · return correlation: <b>${num(rc)}</b>.`)+(rwN?(pt?` Em ${rwN} sorteios, ${rwHi} tiveram |correlação dos preços| acima de 0,6 — o limite que o método antigo usava.`:` In ${rwN} draws, ${rwHi} had |price correlation| above 0.6 — the old method's threshold.`):'')}
$('rwBtn').onclick=()=>rw(true);

function texts(){const p=M.params,pt=lang==='pt';
 $('how').innerHTML=pt?`<p><b>1. Universo com vínculo econômico.</b> Pares só dentro do mesmo setor ou classe (bancos com bancos, Treasuries com Treasuries) e uma lista curada de ligações diretas: ON × PN, controlada × holding, índice × ETF ou futuro, BDR e ADR × ação original convertida para reais.</p>
 <p><b>2. Dados.</b> Até 6 anos de fechamentos diários (só fechamentos, nada intradiário), em log. Pré‑filtro: correlação dos <em>retornos</em> ≥ 0,3 nos últimos 3 anos.</p>
 <p><b>3. Cointegração.</b> Teste de Engle‑Granger nos dois sentidos (fica o melhor) em 3 anos, conferido pelo teste de Johansen. Os p‑valores de todos os pares testados são corrigidos por Benjamini‑Hochberg (FDR 5%).</p>
 <p><b>4. Robustez.</b> Meia‑vida da volta à média entre 2 e 60 dias; estabilidade = fração das janelas móveis de 1 ano (a cada mês) em que o par é cointegrado, mínimo 60%; quebra estrutural = variação do hedge ratio entre as duas metades da janela abaixo de 35%.</p>
 <p><b>5. Sinal sem olhar o futuro.</b> Hedge ratio por regressão móvel de 252 dias até a véspera; z‑score com média e desvio dos ${p.zwin} dias anteriores.</p>
 <p><b>6. Backtest walk‑forward.</b> A cada ${p.reb} pregões o par é reavaliado só com os 3 anos anteriores; se elegível, opera nos meses seguintes: entra com |z| ≥ ${p.entry}, sai com |z| ≤ 0,5, stop em |z| ≥ ${p.stop} ou após 3× a meia‑vida. Resultado em retorno de preço, com 0,10% de custo por perna em cada lado.</p>
 <p><b>7. Faixas.</b> <em>Robusto</em> = passa nos quatro testes. <em>Candidato</em> = nota A, B ou C, mas falha em algum teste (o motivo aparece no cartão). A chave “Incluir pares sem vínculo econômico” testa todas as combinações e recalcula o FDR sobre todos os testes; esses pares não recebem nota em letra e ficam sempre como <em>exploratórios</em>.</p>
 <p><b>Selo (0–100):</b> FDR 25 · Johansen 10 · estabilidade 25 · meia‑vida 10 · hedge estável 10 · Sharpe fora da amostra 20. A ≥ 80, B ≥ 65, C ≥ 50.</p>`
 :`<p><b>1. Universe with an economic link.</b> Pairs only within the same sector or asset class (banks with banks, Treasuries with Treasuries) plus a curated list of direct links: common × preferred shares, subsidiary × holding, index × ETF or future, BDR and ADR × original stock converted to reais.</p>
 <p><b>2. Data.</b> Up to 6 years of daily closes (closes only, nothing intraday), in logs. Pre‑filter: <em>return</em> correlation ≥ 0.3 over the last 3 years.</p>
 <p><b>3. Cointegration.</b> Engle‑Granger test in both directions (best kept) over 3 years, cross‑checked with Johansen. P‑values of all tested pairs are corrected with Benjamini‑Hochberg (5% FDR).</p>
 <p><b>4. Robustness.</b> Mean‑reversion half‑life between 2 and 60 days; stability = share of rolling 1‑year windows (monthly) in which the pair is cointegrated, at least 60%; structural break = hedge‑ratio change between the two halves of the window below 35%.</p>
 <p><b>5. Signal without look‑ahead.</b> Hedge ratio from a 252‑day rolling regression up to the previous day; z‑score with mean and std of the previous ${p.zwin} days.</p>
 <p><b>6. Walk‑forward backtest.</b> Every ${p.reb} sessions the pair is re‑evaluated with the prior 3 years only; if eligible it trades over the next months: enter at |z| ≥ ${p.entry}, exit at |z| ≤ 0.5, stop at |z| ≥ ${p.stop} or after 3× the half‑life. Results in price returns, 0.10% cost per leg each way.</p>
 <p><b>7. Tiers.</b> <em>Robust</em> = passes all four tests. <em>Candidate</em> = grade A, B or C but fails some test (the card says why). The “Include pairs with no economic link” switch tests every combination and recomputes FDR over all tests; those pairs get no letter grade and are always <em>exploratory</em>.</p>
 <p><b>Badge (0–100):</b> FDR 25 · Johansen 10 · stability 25 · half‑life 10 · stable hedge 10 · out‑of‑sample Sharpe 20. A ≥ 80, B ≥ 65, C ≥ 50.</p>`;
 $('lim').innerHTML=pt?`<p><b>Viés de seleção.</b> O ranking de hoje usa os dados de hoje. O backtest reavalia cada par só com o passado, mas a lista de pares e as regras foram escolhidas olhando o histórico inteiro.</p>
 <p><b>Cointegração quebra.</b> Fusões, mudanças regulatórias e choques setoriais desfazem relações antigas sem aviso. Estabilidade passada não garante a futura.</p>
 <p><b>Custos e execução.</b> O backtest supõe execução no fechamento, 0,10% por perna e aluguel de ações sem custo. Na prática, vender a descoberto tem custo de aluguel, e ativos pouco líquidos escorregam mais.</p>
 <p><b>Pares quase idênticos.</b> BDR × ação, índice × ETF e ADR × ação têm meia‑vida abaixo de 2 dias: são arbitragem, e a diferença costuma ser menor que os custos. Ficam no ranking como referência, mas não ficam elegíveis.</p>
 <p><b>Futuros.</b> Séries contínuas do Yahoo têm saltos na rolagem de vencimento, o que distorce spreads com futuros.</p>
 <p><b>Dados.</b> Yahoo Finance, preços ajustados por proventos, até ${M.asof}. Atualização automática em dias úteis após o fechamento.</p>`
 :`<p><b>Selection bias.</b> Today's ranking uses today's data. The backtest re‑evaluates each pair with the past only, but the pair list and the rules were chosen looking at the full history.</p>
 <p><b>Cointegration breaks.</b> Mergers, regulation and sector shocks undo old relationships without warning. Past stability does not guarantee future stability.</p>
 <p><b>Costs and execution.</b> The backtest assumes execution at the close, 0.10% per leg and free stock borrowing. In practice short selling has borrow costs and illiquid assets slip more.</p>
 <p><b>Near‑identical pairs.</b> BDR × stock, index × ETF and ADR × stock have half‑lives under 2 days: that is arbitrage, and the gap is usually smaller than costs. They stay in the ranking as a reference but are never eligible.</p>
 <p><b>Futures.</b> Yahoo's continuous futures series jump at contract rolls, which distorts spreads involving futures.</p>
 <p><b>Data.</b> Yahoo Finance, prices adjusted for distributions, through ${M.asof}. Updated automatically on business days after the close.</p>`}
function all(){$('asof').textContent=L().asof(M.asof.split('-').reverse().join('/')).replace('$n',(econ&&U?U.funnel.family:M.funnel.corr).toLocaleString(lang==='pt'?'pt-BR':'en'));opts();table();band();econTexts();funnel();spur();rw(false);texts();if(sel)pick((P.find(w=>w.id===sel.id)||P[0]).id)}
(async()=>{[M,P]=await Promise.all([get('data/meta.json'),get('data/pairs.json')]);P0=P;i18n();
 const first=P.find(w=>w.group!=='Curados'&&w.trades>=5)||P[0];sel=first;all();pick(first.id);
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){ga('pairs_section',{section:e.target.querySelector('h3').dataset.i18n||'detail'});io.unobserve(e.target)}}),{threshold:.4});
 document.querySelectorAll('main>section,main .two>section').forEach(s=>io.observe(s));
 let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(all,200)})})();
})();
