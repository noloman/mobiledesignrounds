(()=>{
const q=document.getElementById('q'),res=document.getElementById('res'),cnt=document.getElementById('cnt');
let idx=[];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function run(){
 const terms=norm(q.value).split(/\s+/).filter(Boolean);
 history.replaceState(null,'',q.value?'?q='+encodeURIComponent(q.value):location.pathname);
 if(!terms.length){res.innerHTML='';cnt.textContent='';return}
 const hits=[];
 for(const p of idx){
  const t=norm(p.t),d=norm(p.d),h=norm(p.h),b=p.w||'';let sc=0,ok=true;
  for(const w of terms){
   let s=0;if(t.includes(w))s+=10;if(d.includes(w))s+=4;if(h.includes(w))s+=2;if(b.includes(w))s+=1;
   if(!s){ok=false;break}sc+=s;
  }
  if(ok)hits.push([sc+(p.k==='Case study'?2:0),p]);
 }
 hits.sort((a,b)=>b[0]-a[0]);
 cnt.textContent=hits.length?hits.length+(hits.length===1?' result':' results'):'No results. Try fewer or different words.';
 res.innerHTML=hits.slice(0,30).map(([,p])=>`<li><a href="${esc(p.u)}">${esc(p.t)}</a> <span class="fine">${esc(p.k)}</span><br><span class="fine">${esc(p.d)}</span></li>`).join('');
}
fetch('/search-index.json').then(r=>r.json()).then(j=>{idx=j;const u=new URLSearchParams(location.search).get('q');if(u)q.value=u;run()}).catch(()=>{cnt.textContent='Search could not load. Use the menu instead.'});
q.addEventListener('input',run);
})();
