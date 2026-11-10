import {hentData,gemData} from './model.js';
import {opretKredslob} from './puljer.js';
const $=id=>document.getElementById(id),LAGRING='byg-kulstof.v2';
let t=hentData(null);try{t=hentData(JSON.parse(localStorage.getItem(LAGRING)));}catch{}
const gem=m=>{try{localStorage.setItem(LAGRING,JSON.stringify(gemData(m)));}catch{}};
const m=opretKredslob(t,gem);m.tegn();
$('forfra').onclick=()=>{m.stopTraek?.();m.nulstil();m.besked('Figuren bygges forfra.','info');m.tegn();};
$('fokus').onclick=()=>{const v=document.body.classList.toggle('fokus');$('fokus').setAttribute('aria-pressed',v);$('fokus').textContent=v?'Afslut fokus':'Fokus';};
$('tidligere').onchange=()=>{document.body.classList.toggle('vis-tidligere',$('tidligere').checked);m.opdaterPile();};
$('vis-opgave').onclick=()=>{
 m.stopTraek?.();m.annuller();const ren=document.body.classList.toggle('figur-visning');
 $('vis-opgave').setAttribute('aria-pressed',!ren);$('vis-opgave').textContent=ren?'Afprøv opgaven':'Vis kun figuren';
};
document.addEventListener('keydown',e=>{
 if(document.body.classList.contains('figur-visning')||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='Escape'){if(m.annuller())e.preventDefault();}
 if(e.key==='Enter'&&(e.target===document.body||!e.target.closest('button,a,[role="button"],summary,select,input'))){e.preventDefault();const n=$('btn-naeste');if(n&&!$('faerdig-kort').hidden)n.click();else m.indsend();}
});
if(window.top!==window.self){document.body.classList.add('fokus');$('fokus').setAttribute('aria-pressed','true');$('fokus').textContent='Afslut fokus';}
if(['#hurtig','#geologi','#mennesker'].includes(location.hash))history.replaceState(null,'','#landskab');
