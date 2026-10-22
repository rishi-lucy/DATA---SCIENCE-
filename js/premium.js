/* ============================================================
   Premium motion + interaction layer
   Progressive enhancement only — every feature works without it.
   ============================================================ */
(function(){
 const RM=window.matchMedia?window.matchMedia("(prefers-reduced-motion: reduce)"):{matches:false};
 const reduce=()=>!!RM.matches;
 const seenReveal=new WeakSet(),seenCount=new WeakSet();

 /* ---------- reveal on scroll ---------- */
 let io=null;
 if("IntersectionObserver" in window&&!reduce()){
  io=new IntersectionObserver(entries=>{
   entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target)}});
  },{threshold:.07,rootMargin:"0px 0px -36px 0px"});
 }
 function reveal(el){
  if(!el||seenReveal.has(el))return;
  seenReveal.add(el);
  if(reduce()||!io){el.classList.add("in");return}
  io.observe(el);
 }

 /* ---------- animated counters ---------- */
 function count(el){
  if(seenCount.has(el))return;
  seenCount.add(el);
  const target=Number(String(el.dataset.count||el.textContent).replace(/[^\d.-]/g,""))||0;
  if(reduce()){el.textContent=target.toLocaleString();return}
  let started=false;
  const begin=()=>{
   if(started)return;started=true;
   const t0=performance.now(),dur=900;
   const step=t=>{
    const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
    el.textContent=Math.round(target*e).toLocaleString();
    if(p<1)requestAnimationFrame(step);else el.textContent=target.toLocaleString();
   };
   requestAnimationFrame(step);
  };
  if("IntersectionObserver" in window){
   const ob=new IntersectionObserver(es=>{es.forEach(x=>{if(x.isIntersecting){ob.disconnect();begin()}})},{threshold:.35});
   ob.observe(el);
  }else begin();
 }

 /* ---------- progress bars: animate from zero ---------- */
 function bars(root){
  root.querySelectorAll(".bar-fill").forEach(el=>{
   if(el.dataset.animated)return;
   el.dataset.animated="1";
   if(reduce())return;
   el.style.width="0%";
   requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.width=""}));
  });
 }

 /* ---------- scan newly rendered content ---------- */
 function scan(root){
  root=root||document;
  if(!root.querySelectorAll)return;
  root.querySelectorAll(".stagger").forEach(g=>{
   [...g.children].forEach((c,i)=>{
    if(!c.classList.contains("reveal"))c.classList.add("reveal");
    if(!c.style.getPropertyValue("--i"))c.style.setProperty("--i",i);
   });
  });
  root.querySelectorAll(".sec,.page-head,.detail-head,.stu-hero,.res-head,.hero-copy").forEach(el=>{
   if(!el.classList.contains("reveal"))el.classList.add("reveal");
  });
  root.querySelectorAll(".reveal").forEach(reveal);
  bars(root);
  root.querySelectorAll("[data-count]").forEach(count);
 }

 /* ---------- sticky nav state + reading progress ---------- */
 const sb=document.createElement("div");
 sb.id="scrollbar";sb.setAttribute("aria-hidden","true");
 document.body.appendChild(sb);
 let ticking=false;
 function onScroll(){
  if(ticking)return;
  ticking=true;
  requestAnimationFrame(()=>{
   const y=window.scrollY||window.pageYOffset||0;
   document.querySelectorAll(".bar").forEach(b=>b.classList.toggle("scrolled",y>8));
   const h=document.documentElement.scrollHeight-window.innerHeight;
   sb.style.width=(h>0?Math.max(0,Math.min(100,(y/h)*100)):0)+"%";
   document.querySelectorAll(".reveal:not(.in)").forEach(el=>{
    if(el.getBoundingClientRect().top<window.innerHeight-24)el.classList.add("in");
   });
   ticking=false;
  });
 }
 window.addEventListener("scroll",onScroll,{passive:true});
 window.addEventListener("resize",onScroll,{passive:true});
 onScroll();

 /* ---------- theme toggle sync ---------- */
 function syncTheme(){
  const dark=document.documentElement.dataset.theme==="dark";
  document.querySelectorAll(".theme-toggle").forEach(b=>{
   b.setAttribute("aria-pressed",dark?"true":"false");
   b.setAttribute("aria-label",dark?"Switch to light mode":"Switch to dark mode");
  });
 }
 syncTheme();

 /* ---------- gentle page transition ---------- */
 document.addEventListener("click",e=>{
  const a=e.target.closest?a.target.closest("a[href]"):null;
  if(!a)return;
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  if(a.target&&a.target!=="_self"&&a.target!=="")return;
  if(a.hasAttribute("download")||a.hasAttribute("onclick"))return;
  const href=a.getAttribute("href")||"";
  if(!href||href.charAt(0)==="#"||/^(https?:|mailto:|tel:|javascript:)/i.test(href))return;
  if(reduce())return;
  e.preventDefault();
  document.body.classList.add("leaving");
  setTimeout(()=>{window.location.href=href},165);
 });

 /* ---------- modal focus trap ---------- */
 document.addEventListener("keydown",e=>{
  if(e.key!=="Tab")return;
  const m=document.querySelector(".modal.open");
  if(!m)return;
  const f=[...m.querySelectorAll('a[href],button:not([disabled]),input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);
  if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 });

 /* ---------- "/" focuses the page search ---------- */
 document.addEventListener("keydown",e=>{
  if(e.key!=="/"||e.ctrlKey||e.metaKey||e.altKey)return;
  const tag=(document.activeElement&&document.activeElement.tagName)||"";
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(tag))return;
  const t=["#gs","#sr","#resourceSearch","#moduleSearch","#toolSearch","#projectSearch"].map(s=>document.querySelector(s)).find(Boolean);
  if(t){e.preventDefault();t.focus();if(t.select)t.select()}
 });

 /* ---------- keep new DOM animated ---------- */
 if("MutationObserver" in window){
  let queued=false;
  const mo=new MutationObserver(()=>{
   if(queued)return;queued=true;
   requestAnimationFrame(()=>{queued=false;scan(document)});
  });
  mo.observe(document.getElementById("app")||document.body,{childList:true,subtree:true});
 }

 /* ---------- public refresh hook ---------- */
 window.PR={refresh:()=>scan(document),reduce,count};

 /* ---------- boot ---------- */
 const start=()=>{scan(document);onScroll();syncTheme()};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>requestAnimationFrame(start));
 else requestAnimationFrame(start);
})();
