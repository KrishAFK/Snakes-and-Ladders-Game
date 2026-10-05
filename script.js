// ----- Game logic (mirrors the Java code) -----
const snakes = new Array(105).fill(0), ladders = new Array(105).fill(0);
snakes[14]=4; snakes[28]=10; snakes[43]=1; snakes[51]=31; snakes[63]=39;
snakes[68]=33; snakes[77]=26; snakes[83]=58; snakes[90]=70; snakes[99]=80;
ladders[2]=21; ladders[8]=30; ladders[16]=37; ladders[27]=69;
ladders[41]=62; ladders[45]=55; ladders[65]=97; ladders[73]=94;

const players = [{name:"Krish",position:0,cls:"p1"},{name:"Kunjan",position:0,cls:"p2"}];
let current = 0, busy = false, over = false;
const K = matchMedia("(prefers-reduced-motion: reduce)").matches ? .2 : 1;
const sleep = ms => new Promise(r => setTimeout(r, ms*K));

function turn(p, dice){               // same rules as Java; also reports the path for animation
  p.position += dice;
  const land = p.position, path = [];
  if (snakes[p.position] > 0){ path.push({kind:"snake",from:p.position}); p.position = snakes[p.position]; }
  if (ladders[p.position] > 0){ path.push({kind:"ladder",from:p.position}); p.position = ladders[p.position]; }
  if (p.position > 100){ p.position -= dice; return {won:false,land:null,path:[]}; }
  return {won:p.position === 100, land, path};
}

// ----- Board drawing -----
const $ = id => document.getElementById(id);
function xy(n){
  const i=n-1, row=Math.floor(i/10); let col=i%10; if(row%2===1) col=9-col;
  return {x:(col+.5)*10, y:(9-row+.5)*10};
}
const grid=$("grid");
for(let r=9;r>=0;r--) for(let c=0;c<10;c++){
  const n = r*10 + (r%2===0 ? c+1 : 10-c);
  const d=document.createElement("div");
  d.className="cell "+((r+c)%2?"a":"b");
  d.textContent=n===100?"🏆 100":n; grid.appendChild(d);
}
const routes={}, cl=v=>Math.min(97,Math.max(3,v));
let html="";
ladders.forEach((to,from)=>{ if(!to) return;
  const a=xy(from), b=xy(to); routes[from]=[a,b];
  const dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L, nx=-uy*1.5, ny=ux*1.5;
  const rail=(sd,w,c,o=0)=>`<line x1="${a.x+nx*sd+ux*o}" y1="${a.y+ny*sd+uy*o}" x2="${b.x+nx*sd}" y2="${b.y+ny*sd}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  html+=rail(1,1.5,"#4a2c12")+rail(-1,1.5,"#4a2c12");
  for(let t=3;t<L-1.5;t+=3.4){
    const x=a.x+ux*t, y=a.y+uy*t;
    html+=`<line x1="${x+nx}" y1="${y+ny}" x2="${x-nx}" y2="${y-ny}" stroke="#4a2c12" stroke-width="1.15" stroke-linecap="round"/><line x1="${x+nx}" y1="${y+ny}" x2="${x-nx}" y2="${y-ny}" stroke="#d9a066" stroke-width=".6" stroke-linecap="round"/>`;
  }
  html+=rail(1,.9,"#b97c3f")+rail(-1,.9,"#b97c3f")+rail(1,.25,"#efc48a")+rail(-1,.25,"#efc48a");
  for(let t=3;t<L-1.5;t+=3.4){const x=a.x+ux*t,y=a.y+uy*t;
    html+=`<circle cx="${x+nx}" cy="${y+ny}" r=".3" fill="#5a3a1a"/><circle cx="${x-nx}" cy="${y-ny}" r=".3" fill="#5a3a1a"/>`;}
});
const hues=[130,15,275,190,48,335,95,210,160,0]; let hi=0;
snakes.forEach((to,from)=>{ if(!to) return;
  const a=xy(from), b=xy(to), dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy), nx=-dy/L, ny=dx/L;
  const amp=Math.min(4,L*.16), W=Math.max(2,Math.round(L/13)), N=40, h=hues[hi++%hues.length], pts=[];
  for(let k=0;k<=N;k++){const t=k/N, o=Math.sin(t*Math.PI*W)*amp*Math.sqrt(Math.sin(t*Math.PI));
    pts.push({x:cl(a.x+dx*t+nx*o), y:cl(a.y+dy*t+ny*o)});}
  routes[from]=pts;
  let body="",belly="",spots="";
  for(let k=0;k<N;k++){const p=pts[k],q=pts[k+1],w=2.9-2*k/N;
    body+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="hsl(${h} 55% 34%)" stroke-width="${w}" stroke-linecap="round"/>`;
    belly+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="hsl(${h} 65% 70%)" stroke-width="${w*.38}" stroke-linecap="round" opacity=".75"/>`;
    if(k%3===1) spots+=`<circle cx="${p.x}" cy="${p.y}" r="${w*.26}" fill="hsl(${h} 60% 20%)"/>`;}
  const p0=pts[0], ang=Math.atan2(p0.y-pts[2].y,p0.x-pts[2].x)*180/Math.PI;
  html+=body+belly+spots+`<g transform="translate(${p0.x} ${p0.y}) rotate(${ang})"><path d="M3.1,0H4.3M4.3,0l.8,-.6M4.3,0l.8,.6" stroke="#e63946" stroke-width=".3" fill="none" stroke-linecap="round"/><ellipse cx=".7" rx="2.5" ry="2" fill="hsl(${h} 55% 32%)"/><ellipse cx=".9" rx="1.6" ry="1.1" fill="hsl(${h} 70% 62%)" opacity=".45"/><circle cx="1.4" cy="-1.05" r=".65" fill="#fff"/><circle cx="1.4" cy="1.05" r=".65" fill="#fff"/><circle cx="1.6" cy="-1.05" r=".32" fill="#111"/><circle cx="1.6" cy="1.05" r=".32" fill="#111"/></g>`;
});
$("svg").innerHTML=html;

// ----- Tokens -----
const toks=players.map(p=>{const t=document.createElement("div");t.className="tok "+p.cls;$("board").appendChild(t);return t;});
const off=(i,c)=>({x:c.x+(i?1.6:-1.6),y:c.y+(i?1.6:-1.6)});
function setTok(i,c){const q=off(i,c);toks[i].style.left=q.x+"%";toks[i].style.top=q.y+"%";}
function place(){
  players.forEach((p,i)=>{
    setTok(i, p.position===0 ? {x:-4.5+(i?1.6:-1.6),y:93+i*4} : xy(p.position));
    $("pos"+i).textContent="Position "+p.position;
  });
  $("pl0").classList.toggle("active",current===0&&!over);
  $("pl1").classList.toggle("active",current===1&&!over);
}
function slide(i,pts,ms){            // slow ease-in-out travel along a snake body or ladder
  return new Promise(res=>{
    const tk=toks[i]; tk.style.transition="none"; const t0=performance.now(), d=ms*K;
    requestAnimationFrame(function f(now){
      const t=Math.min(1,Math.max(0,(now-t0)/d)), e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      const g=e*(pts.length-1), k=Math.min(pts.length-2,Math.floor(g)), u=g-k;
      setTok(i,{x:pts[k].x+(pts[k+1].x-pts[k].x)*u, y:pts[k].y+(pts[k+1].y-pts[k].y)*u});
      if(t<1) requestAnimationFrame(f); else { tk.offsetWidth; tk.style.transition=""; res(); }
    });
  });
}

// ----- UI flow -----
const log=$("log");
function say(txt){const d=document.createElement("div");d.textContent=txt;log.appendChild(d);log.scrollTop=log.scrollHeight;}
const faces=["","⚀","⚁","⚂","⚃","⚄","⚅"];

$("roll").onclick=async()=>{
  if(busy||over) return; busy=true; $("roll").disabled=true;
  const i=current, p=players[i], dice=Math.floor(Math.random()*6)+1, dEl=$("dice");
  dEl.classList.add("roll"); $("big").textContent="";
  const spin=setInterval(()=>dEl.textContent=faces[1+Math.floor(Math.random()*6)],90);
  await sleep(700);
  clearInterval(spin); dEl.classList.remove("roll"); dEl.textContent=faces[dice];
  $("big").textContent=dice; $("big").style.color="var(--p"+(i+1)+")";
  $("rolled").textContent=p.name+" rolled a "+dice;
  const res=turn(p,dice);
  if(res.land){ setTok(i,xy(res.land)); await sleep(1100); }          // step onto the square, then pause
  for(const st of res.path){                                            // slow climb / slide
    await sleep(500);
    await slide(i,routes[st.from],st.kind==="ladder"?2800:3200);
    await sleep(600);
  }
  say(p.name+"'s position : "+p.position);
  if(res.won){ over=true; place(); $("winTxt").textContent="🎉 "+p.name+" won! 🎉"; setTimeout(()=>$("win").classList.add("show"),600); return; }
  current=1-current; busy=false; $("roll").disabled=false; place();
};
$("again").onclick=()=>{players.forEach(p=>p.position=0);current=0;over=false;busy=false;
  $("roll").disabled=false;log.innerHTML="";$("rolled").textContent="Roll to start";$("big").textContent="–";
  $("dice").textContent="🎲";$("win").classList.remove("show");place();};
place();
