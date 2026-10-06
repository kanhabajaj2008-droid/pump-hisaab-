(()=>{
const $=s=>document.querySelector(s);
const PUMPS={bpcl:'Akshat Filling Station (BPCL)',hpcl:'Pragati Filling Station (HPCL)'};
const SL=[];['1','2'].forEach(m=>[['p','Petrol'],['d','Diesel']].forEach(([f,nm])=>['1','2'].forEach(k=>SL.push({id:`m${m}${f}${k}`,label:`Machine ${m} · ${nm} ${k}`,f:f.toUpperCase()}))));
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const n=v=>{const x=parseFloat(v);return isNaN(x)?0:x};
const f2=v=>(+v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(!window.FIREBASE_CONFIG||/PASTE/.test(FIREBASE_CONFIG.apiKey)){document.body.innerHTML='<div class="card"><h3>Firebase config missing</h3>Edit <b>js/firebase-config.js</b> and paste your Firebase web config.</div>';return}
firebase.initializeApp(FIREBASE_CONFIG);const auth=firebase.auth(),db=firebase.firestore();
const S={u:null,p:null,tab:'dash',pump:'all',ep:'bpcl',date:today(),from:today().slice(0,8)+'01',to:today(),prices:[],h:[],x:[],users:[]};
const isOwner=()=>S.p&&S.p.role==='owner';
const myPumps=()=>isOwner()?Object.keys(PUMPS):(S.p.pumps||[]).filter(p=>PUMPS[p]);
const scope=()=>S.pump==='all'?myPumps():[S.pump];
const pn=p=>PUMPS[p]||p;
const opts=(arr,sel)=>arr.map(([v,l])=>`<option value="${v}" ${v===sel?'selected':''}>${esc(l)}</option>`).join('');
async function load(){
  const ps=myPumps(),g=async(c,p)=>(await db.collection(c).where('pump','==',p).get()).docs.map(d=>({id:d.id,...d.data()}));
  const r=await Promise.all(ps.flatMap(p=>[g('prices',p),g('hisaab',p),g('expenses',p)]));
  S.prices=[];S.h=[];S.x=[];r.forEach((a,i)=>[S.prices,S.h,S.x][i%3].push(...a));
  if(isOwner())S.users=(await db.collection('users').get()).docs.map(d=>({id:d.id,...d.data()}));
}
const refresh=async()=>{await load();render()};
const price=(p,f,d)=>{const a=S.prices.filter(x=>x.pump===p&&x.fuel===f&&x.from<=d).sort((a,b)=>b.from.localeCompare(a.from)||(b.at||0)-(a.at||0));return a[0]?a[0].price:null};
const expOf=(p,d)=>S.x.filter(x=>x.pump===p&&x.date===d).reduce((s,x)=>s+x.amount,0);
function lit(p,d,rd,tp=0,td=0){const L={P:0,D:0};let err='';
  SL.forEach(s=>{const r=rd[s.id]||{},a=r.o!==''&&r.o!=null,b=r.c!==''&&r.c!=null;
    if(a!==b){err=`${s.label}: enter both opening and closing, or leave both blank`;return}
    if(!a)return;const l=n(r.c)-n(r.o);if(l<0)err=`${s.label}: closing is less than opening`;else L[s.f]+=l});
  const M={P:L.P,D:L.D};L.P=Math.max(0,L.P-tp);L.D=Math.max(0,L.D-td);const rp=price(p,'P',d),rz=price(p,'D',d);return{L,M,rp,rz,pa:L.P*(rp||0),da:L.D*(rz||0),err}}
const K=(l,v,c='')=>`<div class="k"><small>${l}</small><b class="${c}">${v}</b></div>`;
function sum(rows){return rows.reduce((t,r)=>{const e=expOf(r.pump,r.date);
  for(const k of['pl','dl','pa','da','cash','upi','card','credit','other','ghar','kept'])t[k]+=r[k]||0;
  t.exp+=e;t.hand+=(r.open||0)+(r.cash||0)-e;return t},{pl:0,dl:0,pa:0,da:0,cash:0,upi:0,card:0,credit:0,other:0,ghar:0,kept:0,exp:0,hand:0})}
function block(title,rows){const t=sum(rows),sales=t.pa+t.da,coll=t.cash+t.upi+t.card+t.credit+t.other,diff=coll-sales;
  return `<div class="card"><h3>${title} <span class="m">(${rows.length} entries)</span></h3><div class="g">
  ${K('Petrol litres',f2(t.pl))}${K('Diesel litres',f2(t.dl))}${K('Petrol sales ₹',f2(t.pa))}${K('Diesel sales ₹',f2(t.da))}${K('Total fuel sales ₹',f2(sales))}
  ${K('Total collection ₹',f2(coll))}${K('Cash ₹',f2(t.cash))}${K('UPI ₹',f2(t.upi))}${K('Card ₹',f2(t.card))}${K('Credit ₹',f2(t.credit))}${K('Expenses ₹',f2(t.exp))}
  ${K('Actual cash in hand ₹',f2(t.hand))}${K('Ghar bheja ₹',f2(t.ghar))}${K('Pump pe rakha ₹',f2(t.kept))}${K('Difference ₹',f2(diff),diff<-0.5?'neg':diff>0.5?'pos':'')}</div></div>`}
const inScope=r=>scope().includes(r.pump);
function dash(){const d=S.date,m=d.slice(0,7);
  const st=scope().map(p=>`${esc(pn(p))}: ${S.h.some(r=>r.id===p+'_'+d)?'<b class=pos>Entered ✓</b>':'<b class=neg>Pending</b>'}`).join('<br>');
  return `<div class="card"><label>Date<input type="date" value="${d}" onchange="A.date(this.value)"></label><div class="m">Today's status</div>${st}</div>`+
  block('Day '+d,S.h.filter(r=>inScope(r)&&r.date===d))+block('Month '+m,S.h.filter(r=>inScope(r)&&r.date.startsWith(m)))}
function entry(){const p=S.ep,d=S.date,doc=S.h.find(r=>r.id===p+'_'+d);let rd={};
  if(doc)rd=doc.r||{};else{const prevs=S.h.filter(r=>r.pump===p&&r.date<d).sort((a,b)=>b.date.localeCompare(a.date));
    SL.forEach(s=>{for(const pv of prevs){const c=(pv.r||{})[s.id];if(c&&c.c!==''&&c.c!=null){rd[s.id]={o:c.c,c:''};break}}})}
  const pvd=S.h.filter(r=>r.pump===p&&r.date<d).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const v=k=>doc?(doc[k]||''):(k==='open'&&pvd&&pvd.kept?pvd.kept:''),mp=myPumps();const tv=k=>doc?(doc[k]??0):10;
  return `<div class="card"><h3>Daily Hisaab (Full Day)</h3><div class="row">
  ${mp.length>1?`<label>Pump<select onchange="A.ep(this.value)">${opts(mp.map(x=>[x,pn(x)]),p)}</select></label>`:`<div><b>${esc(pn(p))}</b></div>`}
  <label>Date<input type="date" value="${d}" onchange="A.edate(this.value)"></label></div>
  <p class="m">${doc?'Editing saved entry by '+esc(doc.by):'New entry. Opening readings are pre-filled from the last closing. Leave unused nozzles blank.'}</p>
  <div class="tw"><table><tr><th>Nozzle</th><th>Opening</th><th>Closing</th><th>Litres</th></tr>${SL.map(s=>`<tr><td>${s.label}</td>
  <td><input id="o_${s.id}" type="number" step="any" inputmode="decimal" value="${esc(rd[s.id]?.o??'')}" oninput="A.calc()"></td>
  <td><input id="c_${s.id}" type="number" step="any" inputmode="decimal" value="${esc(rd[s.id]?.c??'')}" oninput="A.calc()"></td><td id="l_${s.id}">–</td></tr>`).join('')}</table></div>
  <div class="row"><label>Testing – Petrol (L)<input id="tp" type="number" step="any" inputmode="decimal" value="${tv('tp')}" oninput="A.calc()"></label><label>Testing – Diesel (L)<input id="td" type="number" step="any" inputmode="decimal" value="${tv('td')}" oninput="A.calc()"></label></div><p class="m">Testing ka fuel tank me wapas jata hai: sale se kam hota hai, payment nahi aata, stock se kam nahi hota.</p>
  <div class="row">${[['open','Opening cash'],['cash','Cash'],['upi','UPI / online'],['card','Card'],['credit','Credit'],['other','Other collection'],['ghar','Ghar bheja (Sillak Ghar)'],['kept','Pump pe rakha (round figure / change)']].map(([i,l])=>`<label>${l} ₹<input id="${i}" type="number" step="any" inputmode="decimal" value="${v(i)}" oninput="A.calc()"></label>`).join('')}</div>
  <div id="sum" class="g"></div><p><button class="p" onclick="A.save()">Save Hisaab</button></p></div>`}
const rowsBy=()=>S.h.filter(r=>inScope(r)&&r.date>=S.from&&r.date<=S.to).sort((a,b)=>b.date.localeCompare(a.date));
function tbl(full){const rows=rowsBy();
  const hd=full?['Date','Pump','Petrol L','Diesel L','Petrol ₹','Diesel ₹','Sales ₹','Cash','UPI','Card','Credit','Other','Expenses','Diff','Cash in hand','Ghar bheja','Pump pe rakha','Testing L','By']:['Date','Pump','Petrol L','Diesel L','Petrol ₹','Diesel ₹','Total ₹','By'];
  const line=r=>{const e=expOf(r.pump,r.date),s=r.pa+r.da,c=r.cash+r.upi+r.card+r.credit+r.other;
    return full?[r.date,pn(r.pump),f2(r.pl),f2(r.dl),f2(r.pa),f2(r.da),f2(s),f2(r.cash),f2(r.upi),f2(r.card),f2(r.credit),f2(r.other),f2(e),f2(c-s),f2(r.open+r.cash-e),f2(r.ghar),f2(r.kept),f2((r.tp||0)+(r.td||0)),r.by]:[r.date,pn(r.pump),f2(r.pl),f2(r.dl),f2(r.pa),f2(r.da),f2(s),r.by]};
  window._csv=[hd,...rows.map(line)];const t=sum(rows);
  return `<div class="card"><div class="row"><label>From<input type="date" value="${S.from}" onchange="A.rng('from',this.value)"></label><label>To<input type="date" value="${S.to}" onchange="A.rng('to',this.value)"></label>
  ${myPumps().length>1?`<label>Pump<select onchange="A.pump(this.value)">${opts([['all','Both pumps'],...myPumps().map(x=>[x,pn(x)])],S.pump)}</select></label>`:''}</div>
  ${full?'<p><button class="p" onclick="A.csv()">Download CSV (Excel)</button></p>':''}
  <div class="tw"><table><tr>${hd.map(h=>`<th>${h}</th>`).join('')}${isOwner()?'<th></th>':''}</tr>
  ${rows.map((r,i)=>`<tr>${window._csv[i+1].map(c=>`<td>${esc(c)}</td>`).join('')}${isOwner()?`<td><button class="d" onclick="A.del('hisaab','${r.id}')">Delete</button></td>`:''}</tr>`).join('')||'<tr><td>No entries in this range</td></tr>'}
  </table></div><p class="m">Totals: Petrol ${f2(t.pl)} L · Diesel ${f2(t.dl)} L · Sales ₹${f2(t.pa+t.da)} · Expenses ₹${f2(t.exp)}</p></div>`}
function exp(){const mp=scope(),rows=S.x.filter(inScope).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,100);
  return `<div class="card"><h3>Add expense</h3><div class="row"><label>Pump<select id="xp">${opts(myPumps().map(x=>[x,pn(x)]),S.ep)}</select></label><label>Date<input id="xd" type="date" value="${S.date}"></label>
  <label>Description<input id="xt"></label><label>Amount ₹<input id="xa" type="number" step="any" inputmode="decimal"></label></div><button class="p" onclick="A.addExp()">Add expense</button></div>
  <div class="card"><h3>Recent expenses</h3><div class="tw"><table><tr><th>Date</th><th>Pump</th><th>Description</th><th>₹</th><th>By</th><th></th></tr>
  ${rows.map(x=>`<tr><td>${x.date}</td><td>${esc(pn(x.pump))}</td><td>${esc(x.desc)}</td><td>${f2(x.amount)}</td><td>${esc(x.by)}</td><td>${isOwner()?`<button class="d" onclick="A.del('expenses','${x.id}')">Delete</button>`:''}</td></tr>`).join('')}</table></div></div>`}
function prc(){const cur=Object.keys(PUMPS).flatMap(p=>['P','D'].map(f=>`${esc(pn(p))} ${f==='P'?'Petrol':'Diesel'}: <b>${price(p,f,today())??'not set'}</b>`)).join('<br>');
  return `<div class="card"><h3>Fuel prices (owner only)</h3><p>${cur}</p><div class="row"><label>Pump<select id="pp">${opts(Object.entries(PUMPS),'bpcl')}</select></label>
  <label>Fuel<select id="pf"><option value="P">Petrol</option><option value="D">Diesel</option></select></label><label>Price ₹/L<input id="pv" type="number" step="any" inputmode="decimal"></label>
  <label>Effective from<input id="pd" type="date" value="${today()}"></label></div><button class="p" onclick="A.setPrice()">Save price</button>
  <p class="m">Staff cannot edit prices. Past days keep the old price (history preserved).</p></div>
  <div class="card"><h3>Price history</h3><div class="tw"><table><tr><th>From</th><th>Pump</th><th>Fuel</th><th>₹/L</th></tr>${[...S.prices].sort((a,b)=>b.from.localeCompare(a.from)).map(x=>`<tr><td>${x.from}</td><td>${esc(pn(x.pump))}</td><td>${x.fuel==='P'?'Petrol':'Diesel'}</td><td>${x.price}</td></tr>`).join('')}</table></div></div>`}
function staff(){return `<div class="card"><h3>Add staff</h3><div class="row"><label>Name<input id="sn" placeholder="Kanha"></label><label>Email<input id="se" type="email"></label><label>Password (6+)<input id="sp" type="text"></label></div>
  ${Object.entries(PUMPS).map(([k,v])=>`<label><input class="sps" type="checkbox" value="${k}" style="width:auto"> ${esc(v)}</label>`).join('')}<button class="p" onclick="A.addStaff()">Create staff account</button></div>
  <div class="card"><h3>Users</h3><div class="tw"><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Pumps</th><th>Active</th></tr>${S.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email||'')}</td><td>${u.role}</td><td>${(u.pumps||[]).join(', ')}</td>
  <td>${u.role==='owner'?'–':`<button onclick="A.act('${u.id}',${!u.active})">${u.active?'Disable':'Enable'}</button>`}</td></tr>`).join('')}</table></div></div>`}
const V={dash,entry,sales:()=>tbl(false),exp,rep:()=>tbl(true),price:prc,staff};
function render(){const a=$('#app');
  if(!S.u){a.innerHTML=`<div class="lg"><div class="card" style="width:100%"><h2 style="text-align:center;margin:4px 0 14px">⛽ Pump Hisaab</h2><label>Email<input id="em" type="email"></label><label>Password<input id="pw" type="password" onkeydown="if(event.key==='Enter')A.login()"></label><button class="p" style="width:100%;margin-top:6px" onclick="A.login()">Login</button></div></div>`;return}
  if(!S.p){a.innerHTML=`<div class="card"><h3>Profile not found</h3>Ask the owner to create your profile. Your UID:<br><b>${S.u.uid}</b><p><button onclick="A.out()">Logout</button></p></div>`;return}
  if(!S.p.active||!myPumps().length){a.innerHTML=`<div class="card"><h3>No pump assigned / account disabled</h3>Ask the owner to assign a pump to your account.<p><button onclick="A.out()">Logout</button></p></div>`;return}
  const T=[['dash','Dashboard'],['entry','Daily Hisaab'],['sales','Sales'],['exp','Expenses'],['rep','Reports']];if(isOwner())T.push(['price','Prices'],['staff','Staff']);
  a.innerHTML=`<header><b>⛽ Pump Hisaab</b><span>${esc(S.p.name)} (${S.p.role}) ${myPumps().length>1&&['dash','sales','exp'].includes(S.tab)?`<select style="width:auto" onchange="A.pump(this.value)">${opts([['all','Both pumps'],...myPumps().map(x=>[x,pn(x)])],S.pump)}</select>`:''} <button onclick="A.out()">Logout</button></span></header>
  <nav>${T.map(([k,l])=>`<button class="${S.tab===k?'on':''}" onclick="A.tab('${k}')">${l}</button>`).join('')}</nav><main>${V[S.tab]()}</main>`;
  if(S.tab==='entry')A.calc();}
const w=f=>async(...a)=>{try{return await f(...a)}catch(e){alert(e.code==='permission-denied'?'Permission denied. Check your role / Firestore rules.':e.code==='failed-precondition'?'Firestore index required: '+e.message:e.message)}};
const A=window.A={
  tab:k=>{S.tab=k;render()},date:v=>{S.date=v;render()},edate:v=>{S.date=v;render()},ep:v=>{S.ep=v;render()},pump:v=>{S.pump=v;render()},rng:(k,v)=>{S[k]=v;render()},
  login:w(async()=>{await auth.signInWithEmailAndPassword($('#em').value.trim(),$('#pw').value)}),out:()=>auth.signOut(),
  calc(){const p=S.ep,d=S.date,rd={};SL.forEach(s=>{rd[s.id]={o:$('#o_'+s.id).value,c:$('#c_'+s.id).value};const r=rd[s.id];$('#l_'+s.id).textContent=(r.o!==''&&r.c!=='')?f2(n(r.c)-n(r.o)):'–'});
    const g=id=>n($('#'+id).value),k=lit(p,d,rd,g('tp'),g('td')),e=expOf(p,d),sales=k.pa+k.da,coll=g('cash')+g('upi')+g('card')+g('credit')+g('other'),diff=coll-sales;
    $('#sum').innerHTML=(k.err?`<div class="k neg" style="grid-column:1/-1">${esc(k.err)}</div>`:'')+((k.L.P>0&&k.rp==null)||(k.L.D>0&&k.rz==null)?'<div class="k neg" style="grid-column:1/-1">Fuel price not set by owner for this date</div>':'')+
    K('Meter total L',f2(k.M.P+k.M.D))+K('Petrol L (net)',f2(k.L.P))+K('Diesel L (net)',f2(k.L.D))+K('Petrol rate',k.rp??'–')+K('Diesel rate',k.rz??'–')+K('Petrol ₹',f2(k.pa))+K('Diesel ₹',f2(k.da))+K('Total sales ₹',f2(sales))+K('Total collection ₹',f2(coll))+
    K('Expenses ₹ (from Expenses tab)',f2(e))+K('Actual cash in hand ₹',f2(g('open')+g('cash')-e))+K('Ghar bheja ₹',f2(g('ghar')))+K('Pump pe rakha ₹',f2(g('kept')))+K('Cash match ₹ (hand − ghar − pump pe)',f2(g('open')+g('cash')-e-g('ghar')-g('kept')),Math.abs(g('open')+g('cash')-e-g('ghar')-g('kept'))>0.5?'neg':'pos')+K('Difference ₹',f2(diff),diff<-0.5?'neg':diff>0.5?'pos':'');return{rd,k}},
  save:w(async()=>{const{rd,k}=A.calc();if(k.err)return alert(k.err);
    if((k.L.P>0&&k.rp==null)||(k.L.D>0&&k.rz==null))return alert('Owner must set the fuel price first (Prices tab).');
    const g=id=>n($('#'+id).value);
    await db.doc('hisaab/'+S.ep+'_'+S.date).set({pump:S.ep,date:S.date,r:rd,pl:k.L.P,dl:k.L.D,mp:k.M.P,md:k.M.D,tp:g('tp'),td:g('td'),ratP:k.rp||0,ratD:k.rz||0,pa:k.pa,da:k.da,open:g('open'),cash:g('cash'),upi:g('upi'),card:g('card'),credit:g('credit'),other:g('other'),ghar:g('ghar'),kept:g('kept'),by:S.p.name,uid:S.u.uid,at:Date.now()});
    await refresh();alert('Saved ✓')}),
  addExp:w(async()=>{const a=n($('#xa').value),t=$('#xt').value.trim();if(!a||!t)return alert('Enter description and amount');
    await db.collection('expenses').add({pump:$('#xp').value,date:$('#xd').value,desc:t,amount:a,by:S.p.name,uid:S.u.uid,at:Date.now()});await refresh()}),
  del:w(async(c,id)=>{if(confirm('Delete this record?')){await db.doc(c+'/'+id).delete();await refresh()}}),
  setPrice:w(async()=>{const v=n($('#pv').value);if(v<=0)return alert('Enter price');
    await db.collection('prices').add({pump:$('#pp').value,fuel:$('#pf').value,price:v,from:$('#pd').value,by:S.p.name,at:Date.now()});await refresh()}),
  addStaff:w(async()=>{const g=id=>$('#'+id).value.trim(),name=g('sn'),em=g('se'),pw=g('sp'),ps=[...document.querySelectorAll('.sps:checked')].map(x=>x.value);
    if(!name||!em||pw.length<6||!ps.length)return alert('Fill name, email, password (6+ chars) and choose at least one pump');
    const sec=firebase.initializeApp(FIREBASE_CONFIG,'sec'+Date.now());
    try{const c=await sec.auth().createUserWithEmailAndPassword(em,pw);await db.doc('users/'+c.user.uid).set({name,email:em,role:'staff',pumps:ps,active:true})}
    finally{await sec.auth().signOut().catch(()=>{});await sec.delete()}
    await refresh();alert('Staff account created')}),
  act:w(async(id,v)=>{await db.doc('users/'+id).update({active:v});await refresh()}),
  csv(){const t=window._csv.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'),a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\ufeff'+t],{type:'text/csv'}));a.download=`pump-report-${S.from}_to_${S.to}.csv`;a.click()}};
auth.onAuthStateChanged(async u=>{S.u=u;S.p=null;
  if(u){try{const s=await db.doc('users/'+u.uid).get();if(s.exists)S.p=s.data();
    if(S.p&&S.p.active&&myPumps().length){S.ep=myPumps()[0];S.pump=myPumps().length>1?'all':myPumps()[0];await load()}}catch(e){alert('Could not load profile: '+e.message+'\nCheck Firestore rules are published.')}}
  render()});
})();
