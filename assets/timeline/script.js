/* Port of the original's animation logic: GSAP + ScrollTrigger + Lenis, canvas-driven hero. */
gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create("magic", ".33,0,0,1");
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Lenis smooth scroll, driven by the GSAP ticker ---------- */
const lenis=new Lenis({autoRaf:false});
lenis.on("scroll",ScrollTrigger.update);
gsap.ticker.add(t=>lenis.raf(t*1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();
document.addEventListener("click",e=>{
  const a=e.target.closest("a");if(!a)return;
  const h=a.getAttribute("href");if(!h||h==="#"||h[0]!=="#")return;
  const t=$(h);if(t){e.preventDefault();lenis.scrollTo(t,{duration:2})}
});

/* ---------- text splitting (words / chars, each in a clipping mask) ---------- */
function splitNode(node,mode,counter){
  [...node.childNodes].forEach(n=>{
    if(n.nodeType===3){
      const frag=document.createDocumentFragment();
      const parts=mode==="words"?n.textContent.split(/(\s+)/):[...n.textContent];
      parts.forEach(p=>{
        if(mode==="words"&&/^\s+$/.test(p)||p===" "){frag.appendChild(document.createTextNode(" "));return}
        if(!p)return;
        const m=document.createElement("span");m.className="mask";
        const w=document.createElement("span");w.className=mode==="words"?"word":"char";
        w.style.setProperty("--"+(mode==="words"?"word":"char"),counter.n++);w.textContent=p;
        m.appendChild(w);frag.appendChild(m);
      });
      n.replaceWith(frag);
    }else if(n.nodeType===1)splitNode(n,mode,counter);
  });
}
$$("[data-split]").forEach(el=>splitNode(el,"words",{n:0}));
$$("[data-line]").forEach(el=>{el.setAttribute("aria-hidden","true");splitNode(el,"chars",{n:0});el.style.display="inline-block"});

/* ---------- in-view reveals (is-inview class) ---------- */
$$("[data-scroll]").forEach(el=>{
  const off=parseFloat(el.dataset.off||"20");
  ScrollTrigger.create({trigger:el,start:`top ${100-off}%`,once:true,onEnter:()=>el.classList.add("is-inview")});
});
$$(".reveal-image").forEach(el=>{
  const img=$("img",el),done=()=>el.classList.add("is-loaded");
  if(img.complete&&img.naturalWidth)done();else{img.addEventListener("load",done);img.addEventListener("error",done)}
});
$$(".item .reveal img").forEach(img=>{
  const done=()=>img.classList.add("loaded");
  if(img.complete&&img.naturalWidth)done();else{img.addEventListener("load",done);img.addEventListener("error",done)}
});

/* ---------- nav active state ---------- */
const navLinks=$$(".nav a");
[["#inicio",0],["#obras",1],["#vida",2]].forEach(([id,i])=>{
  ScrollTrigger.create({trigger:id,start:"top 55%",end:"bottom 55%",onToggle:s=>{if(s.isActive)navLinks.forEach((l,j)=>l.classList.toggle("on",j===i))}});
});

/* ---------- hero canvas ---------- */
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(f,t)=>({x:f.x+(t.x-f.x)*.7,y:f.y+(t.y-f.y)*.7,scale:f.scale+(t.scale-f.scale)*.7});
const SEGS=[
 {from:{x:-1,y:-.98,scale:1.02},mid:{x:4.38,y:-6.64,scale:1.103},to:{x:7.07,y:-9.47,scale:1.145}},
 {from:{x:0,y:0,scale:1},mid:{x:4.38,y:-8.14,scale:1.103},to:{x:6.57,y:-12.21,scale:1.155}},
 {from:{x:0,y:0,scale:1},mid:{x:4.38,y:-6.3,scale:1.103},to:{x:6.57,y:-9.45,scale:1.155}},
 {from:{x:0,y:0,scale:1},mid:{x:4.38,y:-5.15,scale:1.103},to:{x:6.57,y:-7.73,scale:1.155}},
 {from:{x:0,y:0,scale:1},mid:{x:4.38,y:-4.92,scale:1.103},to:{x:6.57,y:-7.38,scale:1.155}},
 {from:{x:0,y:-1.98,scale:1},mid:{x:4.38,y:-4.32,scale:1.103},to:{x:6.57,y:-5.49,scale:1.155}},
 {from:{x:0,y:0,scale:1},mid:{x:4.38,y:-4.92,scale:1.103},to:{x:6.57,y:-7.38,scale:1.155}},
 {from:{x:0,y:0,scale:1},mid:{x:4.38,y:-5.38,scale:1.103},to:{x:6.57,y:-8.07,scale:1.155}},
 {from:{x:0,y:0,scale:1},mid:{x:4.38,y:-8.14,scale:1.103},to:{x:6.57,y:-12.21,scale:1.155}},
 {from:{x:0,y:0,scale:1},mid:{x:6.87,y:-10.6,scale:1.153},to:{x:10.31,y:-15.9,scale:1.23}},
 {from:{x:0,y:0,scale:1},mid:{x:10.84,y:3.83,scale:1.232},to:{x:16.26,y:5.75,scale:1.348}},
].map(s=>({from:s.from,mid:mix(s.from,s.mid),to:mix(s.from,s.to)}));
const RATIO=2000/1328;
const hero=$("[data-hero]"),canvas=$("[data-canvas]"),ctx=canvas.getContext("2d",{alpha:false});
let frames=[],size={w:0,h:0,dpr:1},prog={progress:0};

function pose({from,mid,to},p){
  const n=clamp(p,0,1.5),[a,b,t]=n<=1?[from,mid,n]:[mid,to,(n-1)/.5];
  return{x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),scale:lerp(a.scale,b.scale,t)};
}
function draw(){
  const {w,h,dpr}=size,p=prog.progress;
  const W=Math.max(1.02*w,1.06*h*RATIO),H=W/RATIO;
  for(let i=0;i<SEGS.length;i++){
    const f=frames[i];if(!f)continue;
    const {x,y,scale}=pose(SEGS[i],p),dw=W*scale,dh=H*scale;
    const cx=w/2+x/100*W,cy=H/2+y/100*H;
    ctx.drawImage(f,(cx-dw/2)*dpr,(cy-dh/2)*dpr,dw*dpr,dh*dpr);
  }
  const a=.3*(1-clamp(p,0,1.5)/1.5);
  if(a>0){ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.fillRect(0,0,w*dpr,h*dpr)}
}
function resize(){
  size.w=canvas.clientWidth;size.h=canvas.clientHeight;size.dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(size.w*size.dpr);canvas.height=Math.round(size.h*size.dpr);draw();
}
new ResizeObserver(resize).observe(canvas);

async function loadFrames(){
  const imgs=$$(".srcs img");
  frames=await Promise.all(imgs.map(async img=>{
    try{await img.decode();return await createImageBitmap(img)}catch{return img.complete&&img.naturalWidth?img:null}
  }));
}

/* ---------- intro timeline + scroll scrub ---------- */
function intro(){
  resize();
  const chars=$$("[data-line] .char"),wrapper=$("[data-scene-wrapper]"),scene=$("[data-scene]");
  const t=gsap.timeline();
  t.set(hero,{visibility:"visible"})
   .fromTo(scene,{scale:1.4},{scale:1.2,duration:1,ease:"power4.out"},0)
   .to(scene,{scale:1,duration:2,ease:"power4.inOut"},1)
   .fromTo(wrapper,{clipPath:"inset(100% 100% 100% 100%)"},{clipPath:"inset(48% 46% 48% 46%)",duration:1,ease:"power4.out"},0)
   .from(chars,{duration:2,x:"1em",ease:"power4.inOut",stagger:{each:.01,from:"start"}},1)
   .fromTo(wrapper,{clipPath:"inset(48% 46% 48% 46%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:2,ease:"power4.inOut"},"<")
   .call(()=>$("[data-divider]").classList.add("is-inview"),null,"<50%")
   .from("[data-nav] > *",{xPercent:50,autoAlpha:0,duration:.6,ease:"magic",stagger:.15},"<")
   .fromTo("[data-year]",{autoAlpha:0},{autoAlpha:1,duration:1,ease:"power4.inOut"},"<50%")
   .call(()=>lenis.start(),null,"-=0.8");
  if(reduce)t.progress(1);

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)",()=>{
    const s=gsap.timeline({defaults:{ease:"none"},scrollTrigger:{trigger:hero,start:"top top",end:"+=150%",scrub:true}});
    s.to(prog,{progress:1.5,duration:1.5,onUpdate:draw},0)
     .to('[data-line="1"]',{xPercent:-110,duration:.45},0)
     .to('[data-line="2"]',{xPercent:110,duration:.45},0)
     .to("[data-navwrap]",{autoAlpha:0,duration:.45},0)
     .fromTo("[data-year]",{autoAlpha:1},{autoAlpha:0,duration:.45,immediateRender:false},0);
  });
}

/* ---------- timeline (Obras) ---------- */
function timeline(){
  const root=$("[data-timeline]"),fill=$("[data-fill]");
  const mm=gsap.matchMedia();
  const years=$$("[data-year-t]",root),items=$$("[data-item]",root);

  const common=()=>{
    gsap.to("[data-tip]",{rotate:2610,ease:"none",scrollTrigger:{trigger:root,start:"top center",end:"bottom center",scrub:true}});
    items.forEach(it=>{
      const rev=$(".reveal",it),img=$(".reveal img",it);
      if(!rev||!img)return;
      gsap.timeline({scrollTrigger:{trigger:it,start:"top bottom",end:"center center",scrub:true}})
        .fromTo(rev,{clipPath:"inset(0% 0% 100% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",ease:"sine.inOut"},0)
        .fromTo(img,{yPercent:-30},{yPercent:0,ease:"sine.inOut"},0);
    });
  };
  mm.add("(min-width: 768px)",()=>{
    const update=()=>{
      const r=root.getBoundingClientRect(),mid=innerHeight/2;
      const y0=years[0]?(()=>{const yr=years[0].getBoundingClientRect();return Math.max(yr.top-r.top+yr.height/2,0)})():0;
      const vh=innerHeight,n=mid-y0;
      let s=(y0>0&&r.top>n&&vh!==n)?y0*clamp((vh-r.top)/(vh-n),0,1):mid-r.top;
      gsap.set(fill,{height:clamp(s,0,r.height)});
    };
    ScrollTrigger.create({trigger:root,start:"top bottom",end:"bottom center",onUpdate:update,onRefresh:update});update();
    const set=(el,on)=>gsap.to(el,{opacity:on?1:.4,duration:.2,overwrite:"auto"});
    years.forEach(el=>{
      const past=()=>{const r=el.getBoundingClientRect();gsap.set(el,{opacity:r.top+r.height/2<=innerHeight/2?1:.4})};
      past();
      ScrollTrigger.create({trigger:el,start:"center center",end:"bottom top",onEnter:()=>set(el,true),onLeaveBack:()=>set(el,false),onRefresh:past});
    });
    common();
  });
  mm.add("(max-width: 767px)",()=>{
    const update=()=>{const r=root.getBoundingClientRect();gsap.set(fill,{height:clamp(innerHeight/2-r.top,0,r.height)})};
    ScrollTrigger.create({trigger:root,start:"top bottom",end:"bottom center",onUpdate:update,onRefresh:update});update();
    items.forEach(it=>ScrollTrigger.create({trigger:it,start:"top center",end:"bottom center",toggleClass:{targets:it,className:"act"}}));
    common();
  });
}

/* ---------- scroll: each card opens in its own way, reads, then hands over to the next ----------
   One layer per card. Each card has its own time-based timeline: play when it reaches the middle of the
   screen, reverse when it leaves. Smoothing comes from Lenis only; nothing here depends on scroll speed. */
const DESC=[
  "Eladio Dieste, el ingeniero uruguayo, mudó la arcilla en obras que eran a la vez muy finas y muy duras.",
  "En 2021, la obra del ingeniero Eladio Dieste: iglesia de Atlántida fue declarada Patrimonio de la Humanidad por la UNESCO.",
  "Estructuras laminares autoportantes, caracterizadas por su elegancia formal y eficiencia estructural.",
  "Una casa para usar, pero que ya era arte: la eficiencia estructural y la sensibilidad estética se fusionan.",
  "A través del ladrillo armado, Dieste buscó una arquitectura de la necesidad.",
  "La función y la forma se fusionan de manera poética y eficiente.",
  "Un ingeniero, convertido en artista que elevó el ladrillo a la categoría de material noble.",
  "Una arquitectura distintiva, económica y profundamente humana.",
  "Escribió extensamente sobre sus invenciones, especialmente sobre las estructuras de cerámica armada.",
  "La inventiva, la comprensión profunda de los materiales y una búsqueda constante de la belleza.",
  "Estructuras de cerámica armada: finas, duras y eficientes.",
  "La productividad y la eficacia no son fines en sí mismos. El pleno logro del hombre sí.",
  "Un impacto que sigue resonando en la forma en que entendemos la construcción y el diseño.",
  "No sabemos cuál es el fin; sabemos a qué deberá ser fiel."
];
/* each variant changes layout AND timing: card/text rects [l,t,w,h] in vw/vh, image move, duration, ease */
const VARIANTS=[
  {d:{card:[6,10,52,80],text:[64,30,30]},m:{card:[6,7,88,46],text:[6,58,88]},zoom:1.35,dx:0,dy:0,dur:1.3,ease:"power3.inOut",tx:30,tdelay:.55},
  {d:{card:[42,10,52,80],text:[6,32,30]},m:{card:[6,7,88,46],text:[6,58,88]},zoom:1.2,dx:-14,dy:0,dur:1.1,ease:"expo.inOut",tx:-30,tdelay:.45},
  {d:{card:[30,8,36,84],text:[70,34,26]},m:{card:[14,7,72,50],text:[6,62,88]},zoom:1.55,dx:0,dy:10,dur:1.5,ease:"power4.inOut",tx:30,tdelay:.7},
  {d:{card:[6,8,64,58],text:[40,72,54]},m:{card:[6,7,88,40],text:[6,52,88]},zoom:1.25,dx:12,dy:0,dur:1.2,ease:"sine.inOut",tx:0,tdelay:.5}
];
function scrollOpen(){
  const L=(a,b,t)=>a+(b-a)*t;
  const desk=()=>innerWidth>=768;
  const R=([l,t,w,h])=>({l:innerWidth*l/100,t:innerHeight*t/100,w:innerWidth*w/100,h:innerHeight*(h||0)/100});
  let z=200;

  $$("[data-item]").forEach((item,i)=>{
    const child=$(".child",item),src=$(".reveal img",item),V=VARIANTS[i%VARIANTS.length];
    const title=$("h3 .in",item).firstChild.textContent,year=$(".ym",item).textContent,href=item.getAttribute("href");

    const ov=document.createElement("div");ov.className="ov";
    ov.innerHTML='<div class="ov-bg"></div><div class="ov-card"><div class="ov-img"></div></div>'+
      '<div class="ov-copy"><span class="ov-num"></span><h2 class="ov-h"><span></span></h2><p class="ov-p"></p></div>';
    document.body.appendChild(ov);
    const bg=$(".ov-bg",ov),card=$(".ov-card",ov),inner=$(".ov-img",ov),copy=$(".ov-copy",ov),
          num=$(".ov-num",ov),h=$(".ov-h span",ov),hh=$(".ov-h",ov),p=$(".ov-p",ov);
    num.textContent=year;h.textContent=title;
    p.innerHTML=DESC[i%DESC.length]+(href?` <a href="${href}">Ver obra →</a>`:"");
    let k=desk()?V.d:V.m;

    const proxy={v:0};
    function apply(){
      const v=proxy.v;
      if(v>0.0005){
        if(ov.style.visibility!=="visible"){ov.style.visibility="visible";child.style.visibility="hidden"}
      }else{ov.style.visibility="hidden";child.style.visibility="visible";return}
      const r=child.getBoundingClientRect(),o=R(k.card);   // live rect: the card leaves from / returns to where the item actually is
      gsap.set(card,{left:L(r.left,o.l,v),top:L(r.top,o.t,v),width:L(r.width,o.w,v),height:L(r.height,o.h,v)});
      gsap.set(inner,{scale:L(V.zoom,1,v),xPercent:V.dx*(1-v),yPercent:V.dy*(1-v)});
      gsap.set(bg,{opacity:.9*v});
    }
    function layout(){
      k=desk()?V.d:V.m;const t=R(k.text);
      gsap.set(copy,{left:t.l,top:t.t,width:t.w});
      gsap.set(hh,{fontSize:Math.min(desk()?7:12,(k.text[2]*.92)/(title.length*.5))+"vw"});
    }
    layout();
    gsap.set(inner,{backgroundImage:"none"});
    /* ONE scrubbed timeline per card, length 1 = the card's whole pass through the screen:
       image grows 0 -> .38, text reads in after the image is nearly open (.30 -> .55),
       hold, text leaves (.66 -> .78), image returns (.76 -> 1). Everything is driven by scroll. */
    const tl=gsap.timeline({defaults:{ease:"none"},scrollTrigger:{
      trigger:item,start:"center 85%",end:"center 15%",scrub:true,
      onToggle:s=>{if(s.isActive){layout();inner.style.backgroundImage=`url(${src.currentSrc||src.src})`;ov.style.zIndex=++z}},
      onRefresh:layout
    }});
    tl.fromTo(proxy,{v:0},{v:1,duration:.38,ease:V.ease,onUpdate:apply},0)
      .fromTo(num,{opacity:0,y:18},{opacity:.7,y:0,duration:.14},.30)
      .fromTo(h,{yPercent:110},{yPercent:0,duration:.2,ease:"power3.out"},.33)
      .fromTo(p,{opacity:0,x:V.tx,y:V.tx?0:20},{opacity:1,x:0,y:0,duration:.2,ease:"power2.out"},.42)
      .to([num,p],{opacity:0,y:-16,duration:.12},.66)
      .to(h,{yPercent:-110,duration:.12,ease:"power3.in"},.66)
      .to(proxy,{v:0,duration:.24,ease:"power2.inOut",onUpdate:apply},.76)
      .set({},{},1);
  });
}

/* ---------- boot ---------- */
(async()=>{
  const fonts=document.fonts?document.fonts.ready:Promise.resolve();
  await Promise.race([Promise.all([loadFrames(),fonts]),new Promise(r=>setTimeout(r,8000))]);
  intro();timeline();scrollOpen();
  requestAnimationFrame(()=>ScrollTrigger.refresh());
  addEventListener("load",()=>ScrollTrigger.refresh());
})();
