(()=>{
let s='';
try{
 const u=new URLSearchParams(location.search).get('utm_source');
 if(u)sessionStorage.setItem('mdr-src',u.slice(0,40));
 s=sessionStorage.getItem('mdr-src')||'';
}catch(e){}
const v=(s||'direct')+' '+location.pathname;
document.querySelectorAll('form.signup').forEach(f=>{
 const i=document.createElement('input');
 i.type='hidden';i.name='fields[source]';i.value=v.slice(0,120);
 f.appendChild(i);
});
})();
