(function(){
var art=document.querySelector('article.prose');
if(!art||!art.querySelector('h2.step, h2[id^="1-"]'))return;
var KEY='mdr-view',DEFAULT='skim',WPM=220;
function get(){try{return localStorage.getItem(KEY)||DEFAULT}catch(e){return DEFAULT}}
function put(v){try{localStorage.setItem(KEY,v)}catch(e){}}
function words(n){return(n.textContent||'').trim().split(/\s+/).length}
function lead(n){var s=n.querySelector&&n.querySelector('strong');return s?s.textContent.trim().toLowerCase():''}
function keepIntro(n){
 if(n.matches('.cta-mini'))return true;
 if(n.tagName==='BLOCKQUOTE'){var l=lead(n);return l.indexOf('build it')===0||l.indexOf('tl;dr')===0}
 return false;
}
function keepStep(n){
 if(/^H[1-6]$/.test(n.tagName)||n.tagName==='FIGURE'||n.tagName==='DETAILS'||n.matches('.cta-card,.cta-mini,.pager,.mark-read,.score-calc,.sim'))return true;
 if(n.matches('blockquote.bq-say,blockquote.bq-call,p.b-say'))return true;
 return n.tagName==='P'&&/^in short/.test(lead(n));
}
var kids=[].slice.call(art.children),segs=[],cur={h:null,nodes:[],skim:false};
segs.push(cur);
kids.forEach(function(n){
 if(n.tagName==='H2'){cur={h:n,nodes:[],skim:/^\d/.test(n.id)};segs.push(cur)}
 else cur.nodes.push(n);
});
var total=0,kept=0;
segs.forEach(function(s,i){
 s.hide=[];
 s.nodes.forEach(function(n){
  var w=n.tagName==='DETAILS'||n.matches('.cta-card,.cta-mini,.pager,.mark-read')?0:words(n);
  total+=w;
  var skim=i===0?true:s.skim;
  var keep=!skim||(i===0?keepIntro(n):keepStep(n));
  if(keep)kept+=w;else s.hide.push(n);
 });
});
total+=segs.filter(function(s){return s.h}).length*0;
function mins(w){return Math.max(1,Math.round(w/WPM))}
var bar=document.createElement('div');bar.className='viewbar';bar.setAttribute('role','group');bar.setAttribute('aria-label','Reading view');
bar.innerHTML='<span class="vb-t">Reading view</span><button type="button" data-v="skim">Skim</button><button type="button" data-v="full">Full</button><span class="vb-n" role="status" aria-live="polite"></span>';
art.insertBefore(bar,art.firstChild);
var note=bar.querySelector('.vb-n');
segs.forEach(function(s){
 if(!s.h||!s.skim||!s.hide.length)return;
 var w=0;s.hide.forEach(function(n){w+=words(n)});
 var b=document.createElement('button');b.type='button';b.className='sec-more';b.setAttribute('aria-expanded','false');
 b.setAttribute('data-m',mins(w));
 var anchor=s.h;for(var j=0;j<s.nodes.length&&j<2;j++){if(s.nodes[j].tagName==='P'&&/^in short/.test(lead(s.nodes[j]))){anchor=s.nodes[j];break}}
 anchor.parentNode.insertBefore(b,anchor.nextSibling);
 s.btn=b;s.open=false;
 b.onclick=function(){s.open=!s.open;apply(false)};
});
function setHidden(n,on){if(on)n.setAttribute('hidden','until-found');else n.removeAttribute('hidden')}
function apply(announce){
 var v=bar.getAttribute('data-view'),skim=v==='skim';
 segs.forEach(function(s,i){
  var hide=skim&&(i===0||!s.open);
  s.hide.forEach(function(n){setHidden(n,hide)});
  if(s.btn){
   s.btn.hidden=!skim;
   s.btn.setAttribute('aria-expanded',String(!hide));
   s.btn.textContent=hide?'Show the detail of this section ('+s.btn.getAttribute('data-m')+' min)':'Hide the detail of this section';
  }
 });
 [].forEach.call(bar.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-v')===v))});
 note.textContent=skim?'Headings, short answers and what to say. About '+mins(kept)+' min instead of '+mins(total)+'.':'The whole case. About '+mins(total)+' min.';
}
function set(v,save){bar.setAttribute('data-view',v);if(save)put(v);apply()}
bar.addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(b)set(b.getAttribute('data-v'),true)});
bar.setAttribute('data-view',get()==='full'?'full':'skim');
apply();
// Page find, links to hidden text and printing always get the whole page.
function reveal(){if(bar.getAttribute('data-view')==='skim')set('full',false)}
document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&(e.key==='f'||e.key==='F'))reveal()});
window.addEventListener('beforeprint',reveal);
art.addEventListener('beforematch',function(e){var t=e.target;segs.forEach(function(s){if(s.hide.indexOf(t)>=0){s.open=true;s.hide.forEach(function(n){setHidden(n,false)});if(s.btn){s.btn.textContent='Hide the detail of this section';s.btn.setAttribute('aria-expanded','true')}}})});
function hash(){var id=decodeURIComponent(location.hash.slice(1));if(!id)return;var t=document.getElementById(id);if(t&&t.closest('[hidden]'))reveal()}
hash();window.addEventListener('hashchange',hash);
})();
