// Et sammenhængende, selvtegnet landskab i snit. Områderne er skematiske.
// Alle kemiske svar og elevens mærker lægges ovenpå af side.js.
const trae=(x,y,s=1,farve='#3e845d')=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-94M0-34l-23-27M0-52l20-22" stroke="#795638" stroke-width="12" fill="none"/><path d="M-9-57C-77-40-88-91-55-111C-79-155-24-173-5-150C15-190 64-162 56-130C103-117 78-61 36-69Z" fill="${farve}" stroke="#31624a" stroke-width="3"/><path d="M-28-108q23-27 58-17" stroke="#99bc79" stroke-width="5" fill="none" opacity=".5"/></g>`;
const skal=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-27 0Q-36-40 0-49Q36-40 27 0L11 15H-11Z" fill="#f8e9bd" stroke="#7d806a" stroke-width="3"/><path d="M0 9V-40M-5 9l-15-34M5 9l15-34" fill="none" stroke="#bcac84" stroke-width="2"/></g>`;
const sten=Array.from({length:22},(_,i)=>`<path d="M${30+i*47} ${625+(i%4)*17}l14-9 15 7-6 13Z" fill="#ae967a" opacity=".4"/>`).join('');
const plankton=Array.from({length:9},(_,i)=>{
 const x=1090+(i%3)*79,y=620+Math.floor(i/3)*40;
 return `<g transform="translate(${x} ${y})"><path d="M-17 0H17M0-17V17M-12-12L12 12M12-12L-12 12" stroke="#8ebc5b" stroke-width="3"/><circle r="10" fill="#9bd077" stroke="#43775b" stroke-width="2"/></g>`;
}).join('');
export const LANDSKAB = `
<defs>
 <linearGradient id="himmel" x2="0" y2="1"><stop stop-color="#c1e3ed"/><stop offset="1" stop-color="#edf3dc"/></linearGradient>
 <linearGradient id="vand" x2="0" y2="1"><stop stop-color="#80c7dc"/><stop offset="1" stop-color="#388ba6"/></linearGradient>
 <linearGradient id="jordlag" x2="0" y2="1"><stop stop-color="#c7a47b"/><stop offset="1" stop-color="#9c775c"/></linearGradient>
 <linearGradient id="dyb" x2="0" y2="1"><stop stop-color="#c4ac8d"/><stop offset="1" stop-color="#b47960"/></linearGradient>
 <pattern id="kalklag" width="100" height="42" patternUnits="userSpaceOnUse"><rect width="100" height="42" fill="#e4dac0"/><path d="M0 41H100M51 0V41" stroke="#b7aa89" stroke-width="2"/><path d="M8 13h18m40 10h20" stroke="#cabd9e" stroke-width="2"/></pattern>
 <marker id="pilspids" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker>
</defs>
<rect width="1600" height="960" fill="url(#himmel)"/>
<circle cx="128" cy="75" r="37" fill="#ffdc81" opacity=".9"/>
<g fill="#fffdf1" opacity=".8"><path d="M25 170q-10-35 30-40 14-51 59-31 27-19 49 9 42 0 43 36 42 6 30 29Z"/><path d="M1260 135q-11-26 21-30 8-39 46-23 31-25 52 10 44-5 40 34 23 7 12 20Z"/></g>
<!-- Relief og bjergarter over jordoverfladen. -->
<path d="M340 425L545 215L622 300L709 150L880 375L970 452Z" fill="#a8b7a8"/>
<path d="M476 380L709 150L630 365L551 436Z" fill="#869e91"/>
<path d="M709 150l-57 78 41-17 24 32 15-29 31 20Z" fill="#f5f4e8"/>
<path d="M411 409L545 215l-22 154 53 48Z" fill="#c6ccb9"/>
<g fill="none" stroke="#7b958a" stroke-width="3" opacity=".7"><path d="M578 317l41 8 12 32m43-100 35 34 22-12m-210 45 29 21-2 35m194-37 21 33 35 7"/></g>
<!-- Vulkanen står på land. CO₂ er usynlig; skyen markerer et sted med afgasning. -->
<path d="M722 443L847 237L879 237L1001 462Z" fill="#b68b6b" stroke="#82664f" stroke-width="3"/>
<path d="M847 237q16 12 32 0l-7 27 29 27-12 71-20-55-14-22Z" fill="#d36e50"/>
<path d="M864 243q32-75 93-84t88-65" fill="none" stroke="#a7ada4" stroke-width="38" stroke-linecap="round" opacity=".55"/>
<path d="M875 228q16-64 77-60t105-68" fill="none" stroke="#e0e0d0" stroke-width="25" stroke-linecap="round" opacity=".75"/>
<!-- Undergrunden er ét samlet snit. -->
<path d="M0 438Q170 411 300 433T500 426Q682 410 770 443Q934 425 1035 466L1150 686Q1310 742 1600 746V960H0Z" fill="url(#dyb)"/>
<path d="M0 440Q170 411 300 433T500 426Q682 410 770 443Q934 425 1035 466L1100 550Q900 520 720 528T360 510Q170 492 0 530Z" fill="url(#jordlag)"/>
<path d="M0 440Q170 411 300 433T500 426Q682 410 770 443Q934 425 1035 466" stroke="#6e8352" stroke-width="17" fill="none"/>
<path d="M0 480Q150 467 300 490T610 478Q830 455 1048 500" stroke="#675740" stroke-width="10" fill="none" opacity=".65"/>
<path d="M0 650Q220 610 450 650T860 678L1070 713M0 875Q230 845 490 890T860 920" fill="none" stroke="#917b60" stroke-width="5"/>
${sten}
<!-- Et gammelt lag af kul, og særskilte lommer med olie og naturgas. -->
<path d="M42 752Q230 711 432 750L411 803Q250 774 45 817Z" fill="#373d36" stroke="#656655" stroke-width="3"/>
<g stroke="#82806a" stroke-width="3"><path d="M75 780l45-10m35 2 40-6m38 9 47-8m42 9 45 2"/></g>
<path d="M495 889Q510 702 660 683Q810 695 835 894Z" fill="#c8bb9a" stroke="#877c65" stroke-width="7"/>
<path d="M515 847Q660 799 813 850L822 893H507Z" fill="#363d35"/>
<path d="M530 771Q552 709 660 702Q765 712 802 774Q660 747 530 771Z" fill="#d7c67f"/>
<path d="M500 685Q665 626 830 685" stroke="#8a795f" stroke-width="20" fill="none"/>
<g fill="none" stroke="#78593d" stroke-width="4"><path d="M165 436q-15 55 30 88m-17-57-38 37m42-13 41 24m40-77q14 50-8 89m9-44 33 16m-37-4-32 21"/></g>
<g fill="#825838"><path d="M91 531q20-23 41 0-10 28-41 0m180 26q23-21 41 0-14 24-41 0m-82 18q11-18 30-5-7 19-30 5"/></g>
<!-- Kalklag under kyst og hav. -->
<path d="M876 796Q1090 744 1240 795T1600 815V930Q1390 949 1230 909T882 922Z" fill="url(#kalklag)" stroke="#9e9479" stroke-width="3"/>
<path d="M1195 795Q1040 835 877 959L832 960Q995 831 1158 778Z" fill="#8c8e7a" stroke="#776f5d" stroke-width="3" opacity=".9"/>
<!-- Havet er gennemsigtigt i snittet. -->
<path d="M1020 450H1600V746Q1320 748 1150 686Z" fill="url(#vand)"/>
<path d="M1020 450H1600" stroke="#e3f3e5" stroke-width="8"/>
<g stroke="#c4e7dc" stroke-width="4" fill="none" opacity=".8"><path d="M1090 471q25-12 50 0t50 0m160-5q25-12 50 0t50 0m-140 105h165m-185 26h80m-90 123h190"/></g>
<g fill="#98b996" opacity=".25"><path d="M1160 460l-40 220 190 60-20-280Zm230 0-30 270 190 10-15-280Z"/></g>
${plankton}
<g fill="none" stroke="#397c65" stroke-width="7" stroke-linecap="round"><path d="M1140 684q-35-35-8-63t-17-49m25 112q35-35 18-70m-18 40-29-15m32 5 25-17"/></g>
${skal(1410,711,.8)}${skal(1523,725,1)}${skal(1462,692,.55)}${skal(1345,722,.5)}
<path d="M1150 686Q1310 742 1600 746" fill="none" stroke="#b8bda1" stroke-width="9"/>
<!-- Floden snor sig fra det forvitrede bjerg mod kysten. -->
<path d="M754 306Q753 348 807 368T880 404Q876 430 960 429T1050 466" fill="none" stroke="#d1d8b7" stroke-width="27"/>
<path d="M754 306Q753 348 807 368T880 404Q876 430 960 429T1050 466" fill="none" stroke="#64b9c7" stroke-width="16"/>
<path d="M762 309Q761 345 814 362" fill="none" stroke="#c5e5d9" stroke-width="4"/>
<g stroke="#5c9bb4" stroke-width="4" opacity=".65"><path d="M656 225l-9 24m31-14-9 24m32-6-9 24"/></g>
<!-- Fabrikken på land og et rør fra det fossile lager. -->
<path d="M615 814V456H538" fill="none" stroke="#747863" stroke-width="10"/>
<path d="M443 444V349l50 27v-27l50 27v-27l66 34v61Z" fill="#778b81" stroke="#4c655d" stroke-width="4"/>
<path d="M492 359V270h23v101m49 7V246h26v137" fill="#8e9e8e" stroke="#52675b" stroke-width="4"/>
<g stroke="#d5e3bf" stroke-width="13"><path d="M466 407h25m22 0h25m22 0h25"/></g>
<path d="M576 242q-25-39 17-54t46-46" fill="none" stroke="#a5b2a1" stroke-width="32" stroke-linecap="round" opacity=".75"/>
<path d="M508 267q-11-38 20-50" fill="none" stroke="#c1c8b5" stroke-width="20" stroke-linecap="round"/>
<!-- Skoven ligger oven på jordens organiske lag. -->
${trae(100,425,.7,'#4d8e62')}${trae(180,431,1.02,'#3e805c')}${trae(280,430,1.1,'#4a9064')}${trae(365,429,.73,'#5b9965')}
<g fill="#557b49"><path d="M18 430l16-31-2 29 20-19-8 25m334-4 18-29-2 24 18-14-9 21"/></g>
`;
