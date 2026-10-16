(function(){
var KEY='mdr-progress',HUBS=['feeds-and-media','sdks-and-libraries','live-data-and-payments','offline-and-sync'],TOTAL=16;
function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{}');return{read:d.read||[],last:d.last||null}}catch(e){return{read:[],last:null}}}
function save(d){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
var p=location.pathname,m=p.match(/^\/mobile-system-design\/([a-z0-9-]+)\/$/),g=p.match(/^\/guides\/([a-z0-9-]+)\/$/);
var isCase=m&&HUBS.indexOf(m[1])<0,isGuide=g;
var d=load();
function title(){var h=document.querySelector('h1');return h?h.textContent.replace(/\s+/g,' ').trim():document.title}
if(isCase||isGuide){
 d.last={path:p,title:title()};save(d);
 var pager=document.querySelector('.pager');
 if(pager){
  var b=document.createElement('button');b.type='button';b.className='mark-read';
  var paint=function(){var on=d.read.indexOf(p)>=0;b.setAttribute('aria-pressed',on);b.textContent=on?'✓ Marked as read (click to undo)':'Mark as read'};
  b.onclick=function(){var i=d.read.indexOf(p);if(i<0)d.read.push(p);else d.read.splice(i,1);save(d);paint()};
  paint();pager.before(b);
 }
}else if(p==='/'||p==='/start/'||p==='/mobile-system-design/'){
 var cases=d.read.filter(function(x){return/^\/mobile-system-design\//.test(x)}).length;
 if(d.last||cases){
  var box=document.createElement('div');box.className='cta-card progress-box';
  var h='';
  if(cases)h+='<p>You have read '+Math.min(cases,TOTAL)+' of '+TOTAL+' case studies.</p>';
  if(d.last&&/^\/[a-z0-9\/-]+$/.test(d.last.path)){var a=document.createElement('a');a.href=d.last.path;a.textContent=d.last.title;h+='<p>Continue where you left off: <a href="'+a.getAttribute('href')+'">'+a.innerHTML+'</a></p>'}
  box.innerHTML=h;
  var wrap=document.querySelector('main .wrap');if(wrap)wrap.insertBefore(box,wrap.firstChild);
 }
}
})();
