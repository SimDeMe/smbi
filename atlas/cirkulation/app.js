import {months,steps} from './model.js';
import {Globe} from './globe.js';
import {Section} from './section.js';
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const state={month:7,rotation:1,targetRotation:1,continents:true,labels:true,paused:reduced.matches,placing:false};
let globe,section,step=0,last=0,frame=0;
function story(){ $('step-number').textContent=String(step+1).padStart(2,'0')+' / 07';$('story-title').textContent=steps[step][0];$('story-text').textContent=steps[step][1];$('previous').disabled=step===0;$('next').disabled=step===6;}
function draw(){globe?.draw();section?.draw();}
function pauseButton(){$('pause').setAttribute('aria-pressed',String(state.paused));$('pause').setAttribute('aria-label',state.paused?'Afspil animationen':'Sæt animationen på pause');$('pause').innerHTML=state.paused?'▶ <span>Afspil</span>':'Ⅱ <span>Pause</span>';$('notice').textContent=state.paused?'Animationen er på pause. Du kan stadig dreje kloden og ændre modellen.':'Prøv juli og januar: regnbæltet flytter sig mest over land.';}
function loop(time){frame=0;const dt=last?Math.min((time-last)/1000,.06):0;last=time;if(!state.paused&&!document.hidden){state.rotation+=(state.targetRotation-state.rotation)*Math.min(1,dt*4);if(Math.abs(state.rotation-state.targetRotation)<.001)state.rotation=state.targetRotation;globe?.draw(dt);section?.draw(dt);frame=requestAnimationFrame(loop);}}
function animate(){last=0;if(!frame&&!state.paused&&!document.hidden)frame=requestAnimationFrame(loop);}
function updateMonth(value){state.month=Number(value);$('month').value=value;const name=months[Math.round(state.month)-1];$('month-name').textContent=name;$('month').setAttribute('aria-valuetext',name);for(const b of document.querySelectorAll('[data-month]'))b.setAttribute('aria-pressed',String(Math.abs(state.month-Number(b.dataset.month))<.2));draw();}
$('month').addEventListener('input',e=>updateMonth(e.target.value));
for(const b of document.querySelectorAll('[data-month]'))b.addEventListener('click',()=>updateMonth(b.dataset.month));
$('rotation').addEventListener('click',()=>{state.targetRotation=1-state.targetRotation;if(state.paused||reduced.matches)state.rotation=state.targetRotation;$('rotation').setAttribute('aria-pressed',String(!!state.targetRotation));$('rotation-label').textContent=state.targetRotation?'Jorden drejer':'Jorden står stille';step=3;story();draw();});
for(const key of ['continents','labels'])$(key).addEventListener('click',()=>{state[key]=!state[key];$(key).setAttribute('aria-pressed',String(state[key]));draw();});
$('pause').addEventListener('click',()=>{state.paused=!state.paused;pauseButton();if(state.paused){cancelAnimationFrame(frame);frame=0;state.rotation=state.targetRotation;draw();}else animate();});
$('balloon').addEventListener('click',()=>{state.placing=!state.placing;$('balloon').setAttribute('aria-pressed',String(state.placing));$('globus').classList.toggle('placing',state.placing);$('globe-hint').textContent=state.placing?'Klik på kloden · eller fokusér den og tryk Enter':'Træk for at dreje · piletaster virker også';$('notice').textContent=state.placing?'Vælg et sted på kloden, og følg ballonen med vinden.':'Ballonværktøjet er slået fra.';});
$('reset').addEventListener('click',()=>globe?.reset());
$('previous').addEventListener('click',()=>{step=Math.max(0,step-1);story();});$('next').addEventListener('click',()=>{step=Math.min(6,step+1);story();});
$('help').addEventListener('click',()=>$('guide').showModal());$('close-guide').addEventListener('click',()=>$('guide').close());$('guide').addEventListener('click',e=>{if(e.target===$('guide')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('mumbai').addEventListener('click',()=>{if(!globe)return;globe.rotation=[-73,-19,0];state.continents=true;$('continents').setAttribute('aria-pressed','true');step=6;story();globe.balloons=[];globe.release([73,19]);draw();$('notice').textContent=state.month>=6&&state.month<=9?'Mumbai: fugtig sydvestmonsun fra havet. Prøv januar for at vende vinden.':'Mumbai: tør nordøstmonsun fra land om vinteren. Prøv juli for at vende vinden.';});
reduced.addEventListener('change',e=>{if(e.matches){state.paused=true;cancelAnimationFrame(frame);frame=0;state.rotation=state.targetRotation;pauseButton();draw();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else animate();});
story();pauseButton();updateMonth(7);
try {
 if(!window.d3||!window.topojson)throw new Error('Kortbiblioteket kunne ikke indlæses.');
 globe=new Globe($('globus'),state,()=>{$('notice').textContent=state.paused?'Ballonen er sluppet. Tryk Afspil for at følge den.':'Ballonen følger vinden ved jorden. Det stiplede spor viser dens vej.';});
 section=new Section($('snit'),state);globe.resize();section.resize();
 globe.load().then(()=>{$('load-status').hidden=true;}).catch(()=>{$('load-status').textContent='Landekortet mangler. Vindmodellen virker stadig. Genindlæs for at prøve igen.';});
 animate();
}catch(error){$('load-status').textContent=error.message+' Læs forklaringerne eller åbn vejledningen.';$('notice').textContent='Figuren kunne ikke vises. Forklaringer og vejledning er stadig tilgængelige.';}
