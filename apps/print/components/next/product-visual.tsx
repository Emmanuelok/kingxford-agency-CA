import { useId } from 'react';
import type { Product } from '../../lib/presswerk/catalog';

const palettes=[['#173b32','#d8ed80'],['#e6d3bd','#644334'],['#ddd6ec','#4e4568'],['#dfc6b8','#794b3a'],['#d8dfd1','#36503b']];

export default function ProductVisual({product,small=false}:{product:Product;small?:boolean}){
  const instance = useId().replace(/:/g, '');
  const shade = `url(#${instance}-shade)`;
  const fabric = `url(#${instance}-fabric)`;
  const paper = `url(#${instance}-paper)`;
  const index=product.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%palettes.length;
  const [base,ink]=palettes[index];
  const text=<><text x="160" y="132" textAnchor="middle" fontSize="12" fontWeight="600" letterSpacing="3" fill={ink}>AVALON</text><path d="M146 102 160 76l14 26h-28Z" fill="none" stroke={ink} strokeWidth="2"/></>;
  let item;
  if(product.id==='mug')item=<><ellipse cx="155" cy="196" rx="64" ry="9" fill="#262b2520"/><path d="M204 82c65-9 59 95-2 82" fill="none" stroke="#f7f4ed" strokeWidth="19"/><path d="M99 68h108v102c-3 33-104 33-108 0Z" fill={base}/><ellipse cx="153" cy="68" rx="54" ry="12" fill="#fdfbf4"/><ellipse cx="153" cy="70" rx="43" ry="7" fill="#cecabe"/>{text}</>;
  else if(product.id==='bottle')item=<><ellipse cx="160" cy="206" rx="39" ry="7" fill="#262b2520"/><rect x="137" y="20" width="46" height="26" rx="6" fill="#282e29"/><path d="M138 42h44v18q17 9 17 27v99q0 19-39 19t-39-19V87q0-18 17-27Z" fill={base}/>{text}<path d="M128 88v90" stroke="#ffffff35" strokeWidth="5"/></>;
  else if(product.id==='cap')item=<><path d="M85 143q-4-81 77-81t78 81" fill={base}/><path d="M90 137q-51 50 34 48l135-18q36-12-20-29Z" fill={base} stroke={ink} strokeWidth="1"/><path d="M166 65q-13 21-12 70" fill="none" stroke={ink} opacity=".3"/>{text}</>;
  else if(product.id==='tote')item=<><path d="M120 71V57q0-41 40-41t40 41v14" fill="none" stroke="#c3b399" strokeWidth="9"/><path d="M93 66h134l8 135H85Z" fill="#e6d9c2"/><path d="M106 81v114m108-114v114" stroke="#bca88b" opacity=".4"/><g fill="#2e4a3e"><text x="160" y="150" textAnchor="middle" fontSize="16" fontFamily="Georgia">Everyday,</text><text x="160" y="172" textAnchor="middle" fontSize="16" fontFamily="Georgia">extraordinary.</text><path d="M148 117 160 93l12 24Z"/></g></>;
  else if(product.id==='hoodie')item=<>
    <path d="m118 55 20-8h44l21 8q11 5 18 24l31 99-26 10-26-69v80H119v-80l-26 69-26-10 31-99q7-19 20-24Z" fill={fabric}/>
    <path d="M137 55q-23-12-18-30 5-20 41-20t41 20q5 18-18 30l-23 10Z" fill={base}/>
    <path d="M134 37q-2-21 26-22t26 22l-26 26Z" fill="#17271e" opacity=".32"/>
    <path d="m131 49 29 17 29-17M123 68l-6 27m80-27 6 27" fill="none" stroke={ink} strokeWidth="1" opacity=".3"/>
    <path d="m148 59-4 34m28-34 4 34" stroke="#f7f3e8" strokeWidth="2"/><path d="M143 92v6m34-6v6" stroke={ink} strokeWidth="3"/>
    <path d="M139 156h42l15 24v8h-72v-8Z" fill={base} stroke={ink} strokeOpacity=".22"/>
    <path d="m137 160-9 17m54-17 10 17" stroke={ink} strokeOpacity=".25" fill="none"/>
    <path d="M119 198h81v11h-81ZM67 178l26 10-3 10-27-10Zm159 10 26-10 4 10-27 10Z" fill={base}/>
    <path d="M122 204h75" stroke={ink} opacity=".18"/><g transform="translate(34 19) scale(.78)">{text}</g>
  </>;
  else if(product.category==='Apparel')item=<><path d="m113 43 30-12q17 17 34 0l30 12 45 35-24 35-25-17v109H117V96l-25 17-24-35Z" fill={base}/><path d="M143 31q17 26 34 0" stroke={ink} strokeWidth="5" fill="none" opacity=".5"/>{text}</>;
  else if(product.id==='tissue')item=<>
    <path d="m51 101 170-48 62 110-171 44Z" fill="#bcc6af" opacity=".42"/>
    <path d="m42 83 178-46 58 111-177 48Z" fill={paper}/>
    <path d="m53 66 174-39 37 109-174 43Z" fill="#fffdf5" fillOpacity=".76" stroke="#fff" strokeOpacity=".8"/>
    <g transform="translate(64 62) rotate(-13)" fill={ink} opacity=".67">{[0,1,2].map(row => [0,1,2,3].map(column => <g key={`${row}-${column}`} transform={`translate(${column*42} ${row*34})`}><path d="m6 6 8-13 8 13Z" fill="none" stroke={ink} strokeWidth=".9"/><text x="14" y="14" fontSize="4" textAnchor="middle" letterSpacing="1">AVALON</text></g>))}</g>
    <path d="m113 56 21 111m32-125 19 113" stroke="#b8b9a8" strokeOpacity=".27"/><path d="m48 84 13 23 155-39" fill="none" stroke="#fff" strokeOpacity=".65"/>
  </>;
  else if(product.id==='tape')item=<>
    <path d="M174 129q12 41 38 43l71 1-11 35-73-7q-40-3-59-49Z" fill="#c5aa79"/>
    <path d="m211 177 47 5-3 14-46-6" fill="none" stroke={ink} strokeOpacity=".2"/>
    <text x="232" y="191" textAnchor="middle" fontSize="8" letterSpacing="2" fill={ink} transform="rotate(7 232 191)">AVALON</text>
    <path d="M63 83v58q0 41 65 41t65-41V83Z" fill="#a38552"/><path d="M63 83v58q0 41 65 41t65-41V83Z" fill={shade}/>
    <ellipse cx="128" cy="83" rx="65" ry="39" fill="#d9c399"/><ellipse cx="128" cy="83" rx="35" ry="21" fill="#8a744f"/><path d="M93 83v20q35 24 70 0V83" fill="#aa926a"/><ellipse cx="128" cy="101" rx="31" ry="15" fill="#eae3d4"/><path d="M64 89q2 39 64 39t64-39" fill="none" stroke="#eddfc1" strokeOpacity=".42"/>
    <text x="124" y="155" textAnchor="middle" fontSize="12" fill={ink} letterSpacing="2">AVALON</text>
  </>;
  else if(product.id==='mailer')item=<>
    <g transform="rotate(-7 160 125)"><path d="M77 50h162l8 147q-83 16-170 1Z" fill={fabric}/><path d="M77 50h162l-7-27H85Z" fill={base}/><path d="M84 31h149l3 12H81Z" fill="#dddcd5"/><path d="M86 35h141" stroke="#fdfdf5" strokeWidth="3"/><path d="M82 57h152M82 189q75 12 157 0" stroke={ink} strokeOpacity=".26" fill="none"/><path d="m78 70 11 33-9 39m157-70-10 33 13 35m-153 52 19-6m123 6-19-6" stroke="#fff" strokeOpacity=".25" fill="none"/>{text}<text x="160" y="169" fontSize="7" letterSpacing="2" textAnchor="middle" fill={ink}>GOOD THINGS INSIDE.</text></g>
  </>;
  else if(product.id==='pouch')item=<>
    <path d="m106 37 108-7-5 21 14 141q-51 22-119 6l11-143Z" fill={base}/><path d="m106 37 108-7-5 21 14 141q-51 22-119 6l11-143Z" fill={shade}/>
    <path d="m112 44 94-6m-93 11 93-6m-88 11 86-6" fill="none" stroke={ink} strokeOpacity=".24" strokeWidth="1.3"/>
    <path d="m107 189 12-14 87-5 17 22q-57 25-119 6Z" fill={base}/><path d="m107 189 12-14 87-5 17 22" fill="none" stroke="#fff" strokeOpacity=".24"/>
    <rect x="124" y="75" width="72" height="83" rx="1" fill="#f2eee2"/><path d="m149 106 11-19 11 19Z" fill={ink}/><text x="160" y="126" textAnchor="middle" fontSize="9" letterSpacing="1.7" fill={ink}>AVALON</text><path d="M140 138h40m-33 5h26" stroke={ink} strokeOpacity=".4"/>
    <path d="m117 67-5 100m96-106 9 104" stroke="#fff" strokeOpacity=".19" fill="none"/>
  </>;
  else if(product.category==='Packaging')item=<><path d="m72 94 104-35 85 44-106 35Z" fill="#d4c6aa"/><path d="m72 94 83 44v67l-83-45Z" fill="#af9d7b"/><path d="m155 138 106-35v67l-106 35Z" fill={base}/><path d="m72 94 15-58 104-27-15 50Z" fill={base}/><text x="131" y="50" textAnchor="middle" transform="rotate(-15 131 50)" fontSize="12" fontWeight="600" letterSpacing="2" fill={ink}>AVALON</text><text x="207" y="164" transform="rotate(-18 207 164)" textAnchor="middle" fontSize="11" letterSpacing="2" fill={ink}>MADE FOR YOU</text></>;
  else if(product.category==='Books & publishing')item=<><path d="m108 31 127 15v159l-127-15Z" fill="#f9f6eb"/><path d="m89 43 127 15v151L89 194Z" fill={base}/><path d="m89 43 19-12 127 15-19 12Z" fill={ink} opacity=".5"/><path d="M97 45v151" stroke={ink} opacity=".3"/><text x="119" y="91" fontSize="15" fontFamily="Georgia" fill={ink}>Objects</text><text x="119" y="113" fontSize="15" fontFamily="Georgia" fill={ink}>& ideas.</text><text x="120" y="173" fontSize="7" letterSpacing="2" fill={ink}>AVALON EDITIONS</text></>;
  else if(product.id==='roll')item=<>
    <path d="M136 146q18 12 40 2l92-10v64l-100 13q-35 0-48-19Z" fill="#fdfaf0"/><path d="m184 158 33-4v45l-33 4Zm44-5 32-4v45l-32 4Z" fill={base}/><text x="200" y="185" textAnchor="middle" fontSize="14" fill={ink}>a.</text><text x="244" y="181" textAnchor="middle" fontSize="14" fill={ink}>a.</text>
    <path d="M78 71h63q44 0 44 62t-44 62H78Z" fill={base}/><path d="M78 71h63q44 0 44 62t-44 62H78Z" fill={shade}/>
    <ellipse cx="78" cy="133" rx="37" ry="62" fill="#f7f3e7"/><ellipse cx="78" cy="133" rx="29" ry="52" fill="none" stroke="#dbd6c9" strokeWidth="2"/><ellipse cx="78" cy="133" rx="22" ry="42" fill="none" stroke="#d6d0c0" strokeWidth="2"/><ellipse cx="78" cy="133" rx="13" ry="27" fill="#bbaa86"/><ellipse cx="80" cy="133" rx="8" ry="22" fill="#756a50"/>
    <text x="139" y="137" fill={ink} fontSize="12" textAnchor="middle" transform="rotate(90 139 137)" letterSpacing="2">AVALON</text>
  </>;
  else if(product.id==='stickers'||product.category==='Stickers & labels')item=<><rect x="77" y="30" width="160" height="181" rx="5" fill="#fbfaf6" transform="rotate(-8 160 120)"/>{[[114,84],[195,83],[114,159],[195,158]].map(([x,y])=><g key={x+','+y}><circle cx={x} cy={y} r="30" fill={base}/><text x={x} y={y+5} textAnchor="middle" fontSize="14" fontFamily="Georgia" fill={ink}>a.</text></g>)}</>;
  else if(['banner','vinyl','yard','booth'].includes(product.id))item=<><rect x="111" y="19" width="105" height="180" fill={base}/><text x="124" y="64" fill={ink} fontSize="21" fontWeight="600">BE</text><text x="124" y="88" fill={ink} fontSize="21" fontWeight="600">SEEN.</text><path d="M124 115h75m-75 9h56" stroke={ink} strokeWidth="2"/><text x="123" y="184" fill={ink} fontSize="8" letterSpacing="2">AVALON</text><rect x="98" y="199" width="130" height="8" rx="4" fill="#bbbcb2"/></>;
  else if(product.id==='model')item=<>
    <path d="m51 151 127-53 93 64-128 54Z" fill="#d5d1c3"/><path d="m51 151 92 58 128-54v7l-128 54-92-58Z" fill="#aaa994"/>
    <path d="m84 127 45-18 40 29-46 19Z" fill="#f8f7ed"/><path d="m84 127 39 30v33l-39-30Z" fill="#c2c5b8"/><path d="m123 157 46-19v33l-46 19Z" fill="#ebede3"/>
    <path d="m129 63 64-27 47 33-64 28Z" fill="#fffef5"/><path d="m129 63 47 34v71l-47-33Z" fill="#cfd3c7"/><path d="m176 97 64-28v72l-64 27Z" fill="#f3f4eb"/>
    <path d="m139 86 27 19v11l-27-19Zm0 21 27 19v11l-27-19Zm0 21 27 19v11l-27-19Z" fill={ink} opacity=".57"/>
    <path d="m184 105 47-20v11l-47 20Zm0 22 47-20v11l-47 20Z" fill={ink} opacity=".7"/>
    <path d="m195 145 15-7v16l-15 7Z" fill={ink}/><path d="m133 168 21-8 20 13-21 9Z" fill="#f9faf2"/>
    <path d="M77 142v22m-3-11h6" stroke="#6d8060" strokeWidth="3"/><ellipse cx="77" cy="142" rx="10" ry="15" fill="#91a77f"/><path d="M239 153v26" stroke="#6d8060" strokeWidth="3"/><ellipse cx="239" cy="153" rx="12" ry="16" fill="#a8b98d"/>
  </>;
  else if(product.id==='parts')item=<>
    <g transform="translate(159 130) rotate(-20) scale(1 .72)">
      <g transform="translate(0 24)" fill="#546254"><circle r="60"/>{Array.from({length:10},(_,tooth)=><rect key={tooth} x="-13" y="-76" width="26" height="35" rx="3" transform={`rotate(${tooth*36})`}/>)}</g>
      <g fill={fabric}><circle r="60"/>{Array.from({length:10},(_,tooth)=><rect key={tooth} x="-13" y="-76" width="26" height="35" rx="3" transform={`rotate(${tooth*36})`}/>)}</g>
      <circle r="46" fill="none" stroke={ink} strokeOpacity=".17" strokeWidth="1.5"/><circle r="24" fill="#354638"/><path d="M-24 0a24 24 0 0 0 48 0v13a24 24 0 0 1-48 0Z" fill="#1a2a1f" opacity=".52"/>
      {[0,1,2,3,4].map(hole => <g key={hole} transform={`rotate(${hole*72})`}><circle cy="-40" r="6" fill="#566a52"/><path d="M-5-37q5-5 10 0" fill="none" stroke="#152e1a" strokeOpacity=".38"/></g>)}
      <path d="m-62-24 2-9m12-24 9-5m19-8h13m29 5 8 5m21 18 5 9" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2"/>
    </g>
    <path d="m83 196 31-13 30 12-31 15Z" fill="#e2e4d9"/><text x="113" y="198" textAnchor="middle" fontSize="5" fill="#597052" letterSpacing="1">PROTOTYPE</text>
  </>;
  else if(product.category==='Technical & 3D')item=<><rect x="70" y="34" width="180" height="172" fill="#fafbf4"/><g stroke="#506d60" fill="none" strokeWidth="1"><path d="M98 67h117v104H98Zm36 0v58h81m-117 7h36v39M104 73h24v45h-24Z"/><path d="M87 56h140M87 49v14m140-14v14M86 180h142" strokeDasharray="3 3"/></g><text x="99" y="194" fill="#486054" fontSize="8" letterSpacing="1.5">AVALON / DRAWING 01</text></>;
  else if(product.width>=product.height&&product.category==='Paper & stationery')item=<><rect x="74" y="84" width="187" height="108" rx="2" fill="#d9dacf" transform="rotate(8 167 138)"/><rect x="64" y="62" width="187" height="108" rx="2" fill={base} transform="rotate(-7 160 115)"/><g transform="rotate(-7 160 115)">{text}<text x="160" y="151" textAnchor="middle" fontSize="6" letterSpacing="2" fill={ink}>A LASTING IMPRESSION.</text></g></>;
  else item=<><rect x="92" y="25" width="139" height="188" rx="1" fill="#b3b5a4"/><rect x="85" y="20" width="139" height="188" fill={base}/><circle cx="155" cy="90" r="41" fill={ink} opacity=".65"/><path d="M110 133q45-76 90 0" fill={base}/><text x="101" y="165" fontSize="16" fontFamily="Georgia" fill={ink}>A fresh</text><text x="101" y="185" fontSize="16" fontFamily="Georgia" fill={ink}>perspective.</text></>;
  return <div className={'av-product-visual'+(small?' small':'')} data-product={product.id}><svg viewBox="0 0 320 235" role="img" aria-label={product.name+' design illustration'}><defs><linearGradient id={`${instance}-shade`} x1="0" x2="1"><stop stopColor="#ffffff" stopOpacity=".25"/><stop offset=".3" stopColor="#fff" stopOpacity="0"/><stop offset=".82" stopColor="#111d12" stopOpacity=".19"/><stop offset="1" stopColor="#fff" stopOpacity=".14"/></linearGradient><linearGradient id={`${instance}-fabric`} x1="0" x2="1"><stop stopColor={base}/><stop offset=".4" stopColor={base}/><stop offset="1" stopColor={ink} stopOpacity=".65"/></linearGradient><linearGradient id={`${instance}-paper`} x1="0" y1="0" x2=".9" y2="1"><stop stopColor="#fffdf2"/><stop offset=".5" stopColor="#ecebdf"/><stop offset="1" stopColor="#f7f7ec"/></linearGradient></defs><ellipse cx="160" cy="218" rx="90" ry="8" fill="#1b2d2610"/>{item}</svg></div>;
}
