(function(){
var f=document.getElementById('sc');if(!f)return;
var rows=f.getAttribute('data-rows').split('|'),out=document.getElementById('sc-out');
var bands=[[6,11,'Learn the method first. Read the chat app case study before the next round.'],[12,17,'The method is there. Work on the rows with a score of 1 or 2.'],[18,21,'Most rows are clear. Practice the cost of each choice.'],[22,24,'Strong round. Repeat with a harder case, or add a changed constraint.']];
function update(){
 var v=rows.map(function(_,i){var c=f.querySelector('input[name=r'+i+']:checked');return c?+c.value:0});
 var done=v.filter(Boolean).length;
 if(done<rows.length){out.textContent='Scored '+done+' of '+rows.length+' rows.';return}
 var t=v.reduce(function(a,b){return a+b},0),min=Math.min.apply(null,v);
 var band=bands.filter(function(b){return t>=b[0]&&t<=b[1]})[0];
 var low=rows.filter(function(_,i){return v[i]===min}).join(', ');
 out.textContent='Total: '+t+' of 24. '+band[2]+' Lowest row'+(low.indexOf(',')>-1?'s':'')+' ('+min+'): '+low+'. Look at the lowest row first.';
}
f.addEventListener('change',update);
f.addEventListener('reset',function(){setTimeout(update,0)});
f.hidden=false;update();
})();
