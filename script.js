// ===== STATE =====
var S = {
  step: 0,
  name: "",
  files: { profile: null, music: null, bg: null },
  profileURL: "", bgURL: "", musicURL: "",
  displayName: "Ren",
  description: "You miss 100% of the shots you don’t take",
  themeColor: "#a855f7",

  // visual
  enableBlur: true, enableGlow: true,
  glassBlur: 8, volumeBlur: 5, glow: 30,

  // weather
  effectType: "none", effectLevel: 40,

  // cursor
  cursorType: "main", cursorGlow: 30, cursorSize: 18,

  // links
  iconDefs: {
    discord:{label:"Discord",fa:"fab fa-discord"}, github:{label:"GitHub",fa:"fab fa-github"},
    spotify:{label:"Spotify",fa:"fab fa-spotify"}, tiktok:{label:"TikTok",fa:"fab fa-tiktok"},
    instagram:{label:"Instagram",fa:"fab fa-instagram"}, youtube:{label:"YouTube",fa:"fab fa-youtube"},
    facebook:{label:"Facebook",fa:"fab fa-facebook"}, world:{label:"Website",fa:"fas fa-globe"},
    twitter:{label:"Twitter/X",fa:"fab fa-x-twitter"}
  },
  icons:{
    discord:{on:false,url:""}, github:{on:false,url:""}, spotify:{on:false,url:""},
    tiktok:{on:false,url:""}, instagram:{on:false,url:""}, youtube:{on:false,url:""},
    facebook:{on:false,url:""}, world:{on:false,url:""}, twitter:{on:false,url:""}
  },

  // fonts
  fontKey:"system-ui",

  // discord presence (optional)
  discordId:"", discordEnabled:false, _presenceTimer:0
};

// fonts (key -> stack + optional google href)
var FONT_MAP = {
  "system-ui": { stack:"system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"" },
  "Inter":     { stack:"'Inter',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" },
  "Poppins":   { stack:"'Poppins',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" },
  "Montserrat":{ stack:"'Montserrat',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" },
  "Lato":      { stack:"'Lato',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" },
  "Open Sans": { stack:"'Open Sans',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" },
  "Outfit":    { stack:"'Outfit',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" },
  "Nunito":    { stack:"'Nunito',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap" },
  "Raleway":   { stack:"'Raleway',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" },
  "Source Sans 3": { stack:"'Source Sans 3',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" },
  "Ubuntu":    { stack:"'Ubuntu',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif", href:"https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap" },
  "Merriweather":{ stack:"'Merriweather',serif", href:"https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" },
  "Playfair Display":{ stack:"'Playfair Display',serif", href:"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" }
};

// ===== DOM =====
function $(s, r){ return (r||document).querySelector(s); }
var stepper=$("#stepper"), stepsEl=$("#steps"), backBtn=$("#backBtn"), nextBtn=$("#nextBtn"), skipBtn=$("#skipBtn"), previewFrame=$("#preview");

// ===== UTILS =====
function slugify(x){ var s=(x||"").toLowerCase().trim(); s=s.replace(/[^a-z0-9 _-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,40); return s||"site"; }
function fileExt(f){ var n=(f&&f.name?f.name:"").toLowerCase(); var m=n.match(/\.(\w{1,10})$/); return m?m[1]:""; }
function sizePretty(n){ return n>1048576? (n/1048576).toFixed(1)+" MB" : ((n/1024)|0)+" KB"; }
function escapeHtml(s){ return (s||"").replace(/[&<>\"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function chosenTheme(){ return S.themeColor||"#a855f7"; }
function revokeURL(u){ if(u&&u.startsWith("blob:")) try{ URL.revokeObjectURL(u);}catch(_){}} 
function hexToRgb(h){ h=h.replace('#','').trim(); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }

// ===== PREVIEW IFRAME =====
let pDoc,pRoot,pBg,pContent,pImg,pName,pDesc,pIcons,pFxCanvas,pPresence,pFontLink;
let previewMounted=false, pending=false, lastIconHash="", fxCtx=null, fxRAF=0, fxParticles=[];

function mountPreviewOnce(){
  if(previewMounted) return;
  pDoc = previewFrame.contentDocument;
  const theme=chosenTheme(); const {r,g,b}=hexToRgb(theme);
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link id="gfont" rel="stylesheet" href="">
<style>
:root{ --accent:${theme}; --accent-r:${r}; --accent-g:${g}; --accent-b:${b}; --panel:rgba(40,40,40,0.45); --glass-blur:8px; --vol-blur:5px; --glow-alpha:.3; --cursor-size:18px; --cursor-border:2px; --cursor-color: rgba(255,255,255,.9); --cursor-shadow: 0 0 20px rgba(255,255,255,.5); }
html,body{margin:0;height:100%;overflow:hidden;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#fff;background:#000;cursor:none}
.sys-cursor{cursor:auto} .sys-cursor #cursor{display:none}
.bg{position:fixed;inset:0;background:#000;transition:filter .6s ease;filter:blur(8px)}
.overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:50}
.enter-text{font-size:1.1rem;color:#00aaff;text-shadow:0 0 10px #00aaff}
.profile-wrap{position:relative;z-index:10;height:100%;display:flex;align-items:center;justify-content:center;display:none}
.glass-card{background:rgba(20,20,22,.35);backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur));border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 0 24px rgba(var(--accent-r),var(--accent-g),var(--accent-b),var(--glow-alpha));padding:18px 22px;max-width:420px;text-align:center}
.profile img{width:120px;height:120px;border-radius:50%;border:3px solid var(--accent);box-shadow:0 0 16px rgba(var(--accent-r),var(--accent-g),var(--accent-b),var(--glow-alpha))}
.name{font-size:1.6rem;font-weight:700;margin-top:.6rem}
.tagline{opacity:.9;margin-top:.35rem;font-size:.95rem}
.icons{margin-top:1.2rem;display:flex;gap:1.2rem;justify-content:center}
.icons a{font-size:1.4rem;color:var(--accent);text-shadow:0 0 8px rgba(var(--accent-r),var(--accent-g),var(--accent-b),var(--glow-alpha))}
.presence{margin-top:12px;display:none}
.pres-card{display:flex;align-items:center;gap:10px;background:rgba(20,20,22,.35);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px 10px;backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur))}
.pres-av{position:relative;width:40px;height:40px;border-radius:50%;overflow:hidden}
.pres-av img{width:100%;height:100%;object-fit:cover;display:block}
.pres-dot{position:absolute;right:0;bottom:0;transform:translate(35%,35%);width:14px;height:14px;border-radius:50%;border:2px solid #1e1f25;background:#80848e}
.pres-dot.online{background:#23a55a}.pres-dot.idle{background:#f0b232}.pres-dot.dnd{background:#f23f43}
.pres-info{display:flex;flex-direction:column;gap:2px;text-align:left}
.pres-name{font-weight:700}
.pres-act{color:#b5bac1;font-size:.92rem}
.audio-controls{position:fixed;top:16px;left:16px;z-index:100;display:flex;align-items:center;gap:12px;transition:all .3s}
.sound-btn{background:rgba(0,0,0,.5);width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:1.4rem;cursor:pointer;border:none;backdrop-filter:blur(var(--vol-blur));-webkit-backdrop-filter:blur(var(--vol-blur));transition:all .3s}
.sound-btn:hover{background:rgba(0,0,0,.6);transform:scale(1.06)}
.sound-btn:hover + .volume-container, .volume-container:hover{width:150px;padding:0 15px}
.volume-container{display:flex;align-items:center;width:0;overflow:hidden;transition:all .3s;background:rgba(0,0,0,.5);border-radius:25px;backdrop-filter:blur(var(--vol-blur));-webkit-backdrop-filter:blur(var(--vol-blur));height:50px}
.volume-slider{width:100%;-webkit-appearance:none;height:6px;background:#333;border-radius:3px;outline:none}
.volume-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;background:var(--accent);border-radius:50%;cursor:pointer;box-shadow:0 0 8px rgba(var(--accent-r),var(--accent-g),var(--accent-b),var(--glow-alpha))}
#fx{position:fixed;inset:0;z-index:5;pointer-events:none}
#cursor{position:fixed;z-index:200;pointer-events:none;transform:translate(-50%,-50%);width:var(--cursor-size);height:var(--cursor-size)}
#cursor.circle{border-radius:50%; background: var(--cursor-color); box-shadow: var(--cursor-shadow)}
#cursor.ring{border-radius:50%; border: var(--cursor-border) solid var(--cursor-color); box-shadow: var(--cursor-shadow); background: transparent}
#cursor.dot{border-radius:50%; background: var(--cursor-color); box-shadow: var(--cursor-shadow)}
.footer{position:fixed;bottom:10px;width:100%;text-align:center;font-size:.8rem;color:#94a3b8;opacity:.85;pointer-events:none}
</style></head><body>
<canvas id="fx"></canvas>
<div id="cursor" class="circle"></div>
<div class="bg" id="bg"></div>
<div class="overlay" id="overlay"><div class="enter-text">Click Anywhere to Enter</div></div>
<div class="profile-wrap" id="content">
  <div class="glass-card">
    <div class="profile">
      <img id="pImg" alt="Profile">
      <div class="name" id="pName"></div>
      <div class="tagline" id="pDesc"></div>
      <div class="presence" id="pPresence"></div>
      <div class="icons" id="pIcons"></div>
    </div>
  </div>
</div>
<audio id="bgMusic" loop preload="auto"><source id="pAudioSrc" src="" type="audio/mpeg" /></audio>
<div class="audio-controls">
  <button class="sound-btn" id="soundBtn"><i class="fas fa-volume-up"></i></button>
  <div class="volume-container"><input type="range" id="volumeControl" class="volume-slider" min="0" max="1" step="0.01" value="0.5"></div>
</div>
<div class="footer">Powered by alqulol</div>
<script>
(function(){
  const overlay=document.getElementById("overlay");
  const bg=document.getElementById("bg");
  const content=document.getElementById("content");
  const music=document.getElementById("bgMusic");
  const fx=document.getElementById("fx");
  const cursor=document.getElementById("cursor");
  const gfont=document.getElementById("gfont");
  overlay.addEventListener("click",function(){
    bg.style.filter="none"; overlay.style.display="none"; content.style.display="flex";
    const src=document.getElementById("pAudioSrc").getAttribute("src");
    if(src){ music.load(); music.play().catch(()=>{}); }
  });
  const soundBtn=document.getElementById("soundBtn");
  const volumeControl=document.getElementById("volumeControl");
  const icon=soundBtn.querySelector("i");
  let muted=false;
  function updateIcon(){ icon.className=(muted || Number(volumeControl.value)===0)?"fas fa-volume-mute":"fas fa-volume-up"; }
  soundBtn.addEventListener("click",()=>{ muted=!muted; music.muted=muted; updateIcon(); });
  volumeControl.addEventListener("input",()=>{ music.volume=Number(volumeControl.value); updateIcon(); });
  updateIcon();
  window.__previewRefs__ = {
    bg, content, music, soundBtn, volumeControl, icon,
    pImg:document.getElementById("pImg"), pName:document.getElementById("pName"), pDesc:document.getElementById("pDesc"), pIcons:document.getElementById("pIcons"), pAudioSrc:document.getElementById("pAudioSrc"),
    pPresence:document.getElementById("pPresence"),
    fx, cursor, root:document.documentElement, body:document.body, gfont
  };
  window.addEventListener("mousemove",(e)=>{ cursor.style.left=e.clientX+"px"; cursor.style.top=e.clientY+"px"; });
  window.addEventListener("touchmove",(e)=>{ const t=e.touches[0]; if(t){ cursor.style.left=t.clientX+"px"; cursor.style.top=t.clientY+"px"; } },{passive:true});
})();
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</body></html>`;
  pDoc.open(); pDoc.write(html); pDoc.close();

  const refs = pDoc.defaultView.__previewRefs__;
  pRoot=refs.root; pBg=refs.bg; pContent=refs.content;
  pImg=refs.pImg; pName=refs.pName; pDesc=refs.pDesc; pIcons=refs.pIcons;
  pFxCanvas=refs.fx; pPresence=refs.pPresence; pFontLink=refs.gfont;

  fxCtx = pFxCanvas.getContext('2d');
  resizeFx();
  pDoc.defaultView.addEventListener('resize', resizeFx);
  previewMounted = true;
}

function resizeFx(){ if(!pFxCanvas) return; pFxCanvas.width=pDoc.defaultView.innerWidth; pFxCanvas.height=pDoc.defaultView.innerHeight; }
function stopFx(){ fxParticles=[]; if(fxRAF){ pDoc.defaultView.cancelAnimationFrame(fxRAF); fxRAF=0; } if(fxCtx){ fxCtx.clearRect(0,0,pFxCanvas.width,pFxCanvas.height); } }
function startSnow(level){
  stopFx(); const count=Math.max(0,Math.floor(level*3));
  for(let i=0;i<count;i++) fxParticles.push({x:Math.random()*pFxCanvas.width,y:Math.random()*pFxCanvas.height,r:Math.random()*2+1,s:Math.random()*0.5+0.5});
  const step=()=>{ fxCtx.clearRect(0,0,pFxCanvas.width,pFxCanvas.height);
    fxCtx.fillStyle='rgba(255,255,255,0.9)';
    for(const p of fxParticles){ p.y+=p.s; p.x+=Math.sin(p.y*0.01)*0.2; if(p.y>pFxCanvas.height){ p.y=-5; p.x=Math.random()*pFxCanvas.width; } fxCtx.beginPath(); fxCtx.arc(p.x,p.y,p.r,0,Math.PI*2); fxCtx.fill(); }
    fxRAF=pDoc.defaultView.requestAnimationFrame(step);
  }; step();
}
function startRain(level){
  stopFx(); const count=Math.max(0,Math.floor(level*4));
  for(let i=0;i<count;i++) fxParticles.push({x:Math.random()*pFxCanvas.width,y:Math.random()*pFxCanvas.height,l:Math.random()*15+10,s:Math.random()*4+6});
  const step=()=>{ fxCtx.clearRect(0,0,pFxCanvas.width,pFxCanvas.height);
    fxCtx.strokeStyle='rgba(180,200,255,0.7)'; fxCtx.lineWidth=1;
    for(const p of fxParticles){ fxCtx.beginPath(); fxCtx.moveTo(p.x,p.y); fxCtx.lineTo(p.x+1,p.y+p.l); fxCtx.stroke(); p.y+=p.s; p.x+=0.5; if(p.y>pFxCanvas.height){ p.y=-20; p.x=Math.random()*pFxCanvas.width; } }
    fxRAF=pDoc.defaultView.requestAnimationFrame(step);
  }; step();
}
function schedulePreviewUpdate(){ if(pending) return; pending=true; requestAnimationFrame(()=>{ pending=false; patchPreview(); }); }

function selectedIconsHtml(){
  var out=[]; for(const k of Object.keys(S.icons)){ const it=S.icons[k]; if(it.on){ out.push(`<a href="${escapeHtml(it.url||"#")}"><i class="${S.iconDefs[k].fa}"></i></a>`); } }
  return out.join("");
}
function iconsHash(){ let parts=[]; Object.keys(S.icons).forEach(k=>{ const it=S.icons[k]; if(it.on) parts.push(k+":"+it.url); }); return parts.join("|"); }
function setAccentVars(){ const {r,g,b}=hexToRgb(chosenTheme()); pRoot.style.setProperty('--accent',chosenTheme()); pRoot.style.setProperty('--accent-r',r); pRoot.style.setProperty('--accent-g',g); pRoot.style.setProperty('--accent-b',b); }

// presence helpers
async function fetchPresence(id){
  const res=await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(id)}`,{cache:"no-store"});
  const j=await res.json(); if(!res.ok || !j || !j.success) throw new Error("lanyard"); return j.data;
}
function pickBestActivity(acts){ const order=[0,1,3,5,2]; for(const t of order){ const hit=(acts||[]).find(a=>a.type===t); if(hit) return hit; } return null; }
function actLabel(a){ if(!a) return ""; const s=a.state?` — ${a.state}`:""; switch(a.type){case 0:return `Playing ${a.name}${s}`; case 1:return `Streaming ${a.name}${s}`; case 2:return `Listening to ${a.name}${s}`; case 3:return `Watching ${a.name}${s}`; case 5:return `Competing in ${a.name}${s}`; default:return a.name||"";} }
function avatarUrl(id,hash,size){ return hash?`https://cdn.discordapp.com/avatars/${id}/${hash}.png?size=${size||128}`:`https://cdn.discordapp.com/embed/avatars/0.png`; }
function renderPresenceIntoPreview(d){
  if(!pPresence) return;
  const st=d.discord_status||"offline";
  const dot=st==='online'?'online':st==='idle'?'idle':st==='dnd'?'dnd':'';
  const nm=(d.discord_user.display_name||d.discord_user.username||"Discord User").replace(/[&<]/g,m=>m==="&"?"&amp;":"&lt;");
  const av=avatarUrl(d.discord_user.id,d.discord_user.avatar,128);
  const act=(actLabel(pickBestActivity(d.activities||[]))||"Currently doing nothing").replace(/[&<]/g,m=>m==="&"?"&amp;":"&lt;");
  pPresence.innerHTML =
    `<div class="pres-card">
       <div class="pres-av"><img alt="Avatar" src="${av}"><div class="pres-dot ${dot}"></div></div>
       <div class="pres-info"><div class="pres-name">${nm}</div><div class="pres-act">${act}</div></div>
     </div>`;
  pPresence.style.display="block";
}
function hidePresencePreview(){ if(!pPresence) return; pPresence.style.display="none"; pPresence.innerHTML=""; }
function startPresencePolling(){
  stopPresencePolling();
  if(!S.discordEnabled || !S.discordId){ hidePresencePreview(); return; }
  const tick=async()=>{ try{ renderPresenceIntoPreview(await fetchPresence(S.discordId)); }catch(_){ hidePresencePreview(); } };
  tick(); S._presenceTimer=setInterval(tick,15000);
}
function stopPresencePolling(){ if(S._presenceTimer){ clearInterval(S._presenceTimer); S._presenceTimer=0; } }
function applyFontInPreview(){
  if(!previewMounted) return; const meta=FONT_MAP[S.fontKey]||FONT_MAP["system-ui"];
  pDoc.body.style.fontFamily=meta.stack; if(pFontLink) pFontLink.href=meta.href||"";
}

function patchPreview(){
  if(!previewMounted) mountPreviewOnce();
  setAccentVars();
  const glowAlpha = S.enableGlow ? Math.max(0, Math.min(1, S.glow/100*0.7)) : 0;
  pRoot.style.setProperty('--glow-alpha', String(glowAlpha));
  const gb=S.enableBlur?S.glassBlur:0, vb=S.enableBlur?S.volumeBlur:0;
  pRoot.style.setProperty('--glass-blur', gb+'px');
  pRoot.style.setProperty('--vol-blur', vb+'px');

  if(S.bgURL){ pBg.style.background=`url("${S.bgURL}") repeat center center fixed`; pBg.style.backgroundSize='cover'; } else { pBg.style.background='#000'; }

  if(S.profileURL) pImg.src=S.profileURL;
  pName.textContent=S.displayName||""; pDesc.textContent=S.description||"";

  const h=iconsHash(); if(h!==lastIconHash){ pIcons.innerHTML=selectedIconsHtml(); lastIconHash=h; }

  const srcEl=pDoc.getElementById('pAudioSrc'); const cur=srcEl.getAttribute('src')||"", next=S.musicURL||""; if(cur!==next) srcEl.setAttribute('src',next);

  pRoot.style.setProperty('--cursor-size', S.cursorSize+'px');
  const body=pDoc.body, cursor=pDoc.getElementById('cursor');
  if(S.cursorType==="windows"){ body.classList.add('sys-cursor'); }
  else{
    body.classList.remove('sys-cursor');
    cursor.className = (S.cursorType==="main") ? "circle" : S.cursorType;
    const cg = Math.max(0, Math.min(1, S.cursorGlow/100));
    const shadow = `0 0 ${12+28*cg}px rgba(255,255,255,${0.25+0.55*cg})`;
    pRoot.style.setProperty('--cursor-shadow', shadow);
    pRoot.style.setProperty('--cursor-border', '2px');
  }

  if(S.effectType==='none') stopFx(); else if(S.effectType==='snow') startSnow(S.effectLevel); else startRain(S.effectLevel);

  if(S.discordEnabled && S.discordId) startPresencePolling(); else { stopPresencePolling(); hidePresencePreview(); }

  applyFontInPreview();
}

// ===== BUILDER UI =====
function renderStepper(){
  var steps=[
    "Start","Website name","Profile picture","Music (MP3 ≤ 20MB)","Background (GIF/PNG/JPG)",
    "Theme color","Name / Description / Links","Discord (optional)","Blur & Glow","Weather Effects",
    "Cursor","Confirm","Generate"
  ];
  stepper.innerHTML = steps.map((t,i)=>`<span class="chip ${i===S.step?'active':''}">${i+1}. ${t}</span>`).join("");
}
function fileBox(label,hint,accept,id){
  return `<div class="filebox">
    <label>${label}</label>
    <input id="${id}" class="hidden-input" type="file" ${accept?('accept="'+accept+'"'):""}>
    <button class="big-file-btn" type="button" data-for="${id}"><i class="fa-solid fa-folder-open"></i> Choose file</button>
    <div class="file-hint">${hint}</div>
    <div class="file-selected" id="${id}Sel"></div>
  </div>`;
}
function fontOptionsHtml(){ return Object.keys(FONT_MAP).map(k=>`<option value="${k}" ${S.fontKey===k?'selected':''}>${k}</option>`).join(""); }
function iconsScreenHtml(){
  return `<div class="icon-grid">${
    Object.keys(S.iconDefs).map(k=>{
      const def=S.iconDefs[k], st=S.icons[k];
      return `<div class="icon-item ${st.on?'on':''}" data-k="${k}">
        <div class="icon-head"><input type="checkbox" class="icon-on" ${st.on?'checked':''}>
          <span class="ico"><i class="${def.fa}"></i></span><strong>${def.label}</strong></div>
        <div class="icon-url"><label>URL</label><input type="text" class="icon-url-input" placeholder="https://..." value="${escapeHtml(st.url)}"></div>
      </div>`;
    }).join("")
  }</div>`;
}

// screens
var screens=[
  ()=>'<h2>Let’s build your ZIP</h2><p class="hint">Click <b>Next</b> to begin.</p>',
  ()=>`<div class="row"><div>
        <label>Website name (folder + html filename)</label>
        <input id="siteName" type="text" placeholder="yourname" value="${S.name||""}">
        <div class="hint">Output: <span class="mono">${S.name||"yourname"}/${S.name||"yourname"}.html</span></div>
      </div></div>`,
  ()=>`${fileBox("Profile picture (PNG/JPG/GIF)","Renamed to: online.png / online.jpg / online.gif","image/png,image/jpeg,image/gif","fileProfile")}
      ${S.files.profile?`<div class="file-selected">Selected: ${S.files.profile.name} (${sizePretty(S.files.profile.size)})</div>`:""}`,
  ()=>`${fileBox("Music (MP3, ≤ 20MB)","Renamed to: online.mp3","audio/mpeg","fileMusic")}
      ${S.files.music?`<div class="file-selected ${S.files.music.size<=20*1024*1024?'':'err'}">Selected: ${S.files.music.name} (${sizePretty(S.files.music.size)})</div>`:""}`,
  ()=>`${fileBox("Background (GIF/PNG/JPG)","Renamed to: onlinebackground.gif/.png/.jpg","image/gif,image/png,image/jpeg","fileBg")}
      ${S.files.bg?`<div class="file-selected">Selected: ${S.files.bg.name} (${sizePretty(S.files.bg.size)})</div>`:""}`,
  ()=>`<h2>Theme Color</h2>
      <div class="color-palette"><div class="color-big">
        <input id="themePicker" type="color" value="${S.themeColor||"#a855f7"}">
      </div><div class="hint">All glows follow this color.</div></div>`,
  ()=>`<div class="row">
        <div>
          <label>Display name</label>
          <input id="dispName" type="text" value="${escapeHtml(S.displayName)}">
          <label style="margin-top:10px">Font family</label>
          <select id="fontFamily">${fontOptionsHtml()}</select>
        </div>
        <div>
          <label>Description / tagline</label>
          <textarea id="desc">${escapeHtml(S.description)}</textarea>
        </div>
      </div>
      <h3 style="margin-top:12px">Links (enable the ones you want)</h3>${iconsScreenHtml()}`,
  ()=>{ const badge = (S.discordEnabled && S.discordId)?'<span class="badge good"><i class="fa-solid fa-circle-check"></i> Connected</span>':'<span class="badge"><i class="fa-brands fa-discord"></i> Optional</span>';
        return `<h2>Discord (optional)</h2>
        <p class="hint">Invite users to your server, then (optionally) show your live Discord presence under the description.</p>
        <div class="discord-actions">
          <a class="btn btn-primary" href="https://discord.gg/mUSy6TQgCu" target="_blank" rel="noopener"><i class="fa-brands fa-discord"></i> Join your Discord</a>
          ${badge}
        </div>
        <div class="row" style="margin-top:12px"><div>
          <label>Your Discord ID</label>
          <input id="discordId" type="text" placeholder="e.g. 123456789012345678" value="${escapeHtml(S.discordId)}">
          <div class="hint">We use <span class="mono">https://api.lanyard.rest/v1/users/{Id}</span> to fetch presence.</div>
          <div class="discord-actions">
            <button id="verifyDiscord" class="btn btn-secondary"><i class="fa-solid fa-magnifying-glass"></i> Verify</button>
            <button id="clearDiscord" class="btn btn-secondary"><i class="fa-solid fa-xmark"></i> Clear</button>
          </div>
          <div id="discordStatus" style="margin-top:8px"></div>
          <div id="presMini" class="pres-mini">
            <div class="av"><img id="pmAv" alt="Avatar" style="width:100%;height:100%;object-fit:cover"><span id="pmDot" class="dot"></span></div>
            <div class="info"><div class="name" id="pmName"></div><div class="act" id="pmAct"></div></div>
          </div>
        </div></div>`; },
  ()=>`<h2>Blur & Glow</h2>
      <div class="toggle-row"><label><input id="enableBlur" type="checkbox" ${S.enableBlur?'checked':''}> Enable blur boxes (glass + volume)</label></div>
      <div class="toggle-row"><label><input id="enableGlow" type="checkbox" ${S.enableGlow?'checked':''}> Enable glow light</label></div>
      <div class="slider-row"><label>Glass blur (profile card)</label><input id="glassBlur" type="range" min="0" max="20" step="1" value="${S.glassBlur}"></div>
      <div class="slider-row"><label>Volume blur</label><input id="volBlur" type="range" min="0" max="20" step="1" value="${S.volumeBlur}"></div>
      <div class="slider-row"><label>Glow intensity</label><input id="glow" type="range" min="0" max="100" step="1" value="${S.glow}"></div>`,
  ()=>`<h2>Weather Effects</h2>
      <div class="row"><div>
        <label>Effect</label>
        <select id="fxType">
          <option value="none" ${S.effectType==='none'?'selected':''}>None</option>
          <option value="snow" ${S.effectType==='snow'?'selected':''}>Snow</option>
          <option value="rain" ${S.effectType==='rain'?'selected':''}>Rain</option>
        </select>
      </div><div>
        <label>Intensity</label>
        <input id="fxLevel" type="range" min="0" max="100" step="1" value="${S.effectLevel}">
      </div></div>`,
  ()=>`<h2>Custom Cursor</h2>
      <div class="row"><div>
        <label>Type</label>
        <select id="cursorType">
          <option value="main" ${S.cursorType==='main'?'selected':''}>Main</option>
          <option value="windows" ${S.cursorType==='windows'?'selected':''}>Windows (system)</option>
          <option value="circle" ${S.cursorType==='circle'?'selected':''}>Circle</option>
          <option value="ring" ${S.cursorType==='ring'?'selected':''}>Ring</option>
          <option value="dot" ${S.cursorType==='dot'?'selected':''}>Dot</option>
        </select>
      </div><div>
        <label>Glow</label><input id="cursorGlow" type="range" min="0" max="100" step="1" value="${S.cursorGlow}">
        <label style="margin-top:10px">Cursor size (px)</label><input id="cursorSize" type="range" min="6" max="64" step="1" value="${S.cursorSize}">
      </div></div>
      <div class="hint">“Windows” uses your normal cursor and hides the custom glow cursor.</div>`,
  ()=>{ const list=Object.keys(S.icons).filter(k=>S.icons[k].on).map(k=>k+' → '+(S.icons[k].url||'#'));
        return `<h2>Confirm</h2>
        <p><b>Folder/HTML:</b> <span class="mono">${S.name||'(missing)'}/${S.name||'(missing)'}.html</span></p>
        <ul>
          <li>Profile → <span class="mono">online.${(S.files.profile && fileExt(S.files.profile))||'png'}</span></li>
          <li>Music → <span class="mono">online.mp3</span></li>
          <li>Background → <span class="mono">onlinebackground.${(S.files.bg && fileExt(S.files.bg))||'gif'}</span></li>
        </ul>
        <p><b>Display name:</b> ${escapeHtml(S.displayName||'(missing)')}<br>
           <b>Description:</b> ${escapeHtml(S.description||'(missing)')}</p>
        <p><b>Font:</b> ${escapeHtml(S.fontKey)}</p>
        <p><b>Icons (${list.length}):</b><br>${list.length?escapeHtml(list.join(' | ')):'none'}</p>
        <p><b>Theme color:</b> <span class="mono">${S.themeColor}</span></p>
        <p><b>Blur:</b> ${S.enableBlur?'ON':'OFF'} (glass ${S.glassBlur}px, volume ${S.volumeBlur}px); <b>Glow:</b> ${S.enableGlow?'ON':'OFF'} @ ${S.glow}</p>
        <p><b>FX:</b> ${S.effectType} @ ${S.effectLevel} | <b>Cursor:</b> ${S.cursorType} (glow ${S.cursorGlow}, size ${S.cursorSize}px)</p>
        <p><b>Discord:</b> ${(S.discordEnabled && S.discordId)?('enabled for <span class="mono">'+escapeHtml(S.discordId)+'</span>'):'skipped'}</p>
        <p class="${(S.files.profile && S.files.music && S.files.bg && S.name)?'':'err'}">
          ${(S.files.profile && S.files.music && S.files.bg && S.name)?'Looks good — Next to generate.':'Missing stuff — go back and fix.'}
        </p>
        <p class="hint">Footer is locked to “Powered by alqulol”.</p>`; },
  ()=>`<h2>Generate ZIP</h2>
      <p>Click to download the folder <span class="mono">${S.name||'site'}</span> (HTML + assets).</p>
      <button class="btn btn-primary" id="genZipBtn"><i class="fa-solid fa-box-archive"></i> Generate ZIP</button>`
];

function render(){
  renderStepper();
  stepsEl.innerHTML = screens[S.step]();
  backBtn.disabled = (S.step===0);
  nextBtn.textContent = (S.step===screens.length-1) ? "Done" : "Next";
  skipBtn.style.display = (S.step===7) ? "" : "none";

  stepsEl.querySelectorAll(".big-file-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      var id = btn.getAttribute("data-for");
      $("#"+id).click();
    });
  });

  if(S.step===1){ setTimeout(()=>$("#siteName")?.focus(),0); }

  if([2,3,4].includes(S.step)){
    var input = S.step===2?$("#fileProfile"):(S.step===3?$("#fileMusic"):$("#fileBg"));
    if(S.step===2) input.accept="image/png,image/jpeg,image/gif";
    if(S.step===3) input.accept="audio/mpeg";
    if(S.step===4) input.accept="image/gif,image/png,image/jpeg";
    input.addEventListener('change', function(){
      var f=input.files[0]; if(!f) return;
      if(S.step===2 && !/^image\/(png|jpeg|gif)$/.test(f.type)) return alert("Profile must be PNG/JPG/GIF.");
      if(S.step===3 && f.type!=="audio/mpeg") return alert("Music must be MP3.");
      if(S.step===3 && f.size>20*1024*1024) return alert("MP3 must be ≤ 20 MB.");
      if(S.step===4 && !/^image\/(gif|png|jpeg)$/.test(f.type)) return alert("Background must be GIF/PNG/JPG.");
      if(S.step===2){ S.files.profile=f; revokeURL(S.profileURL); S.profileURL=URL.createObjectURL(f); $("#fileProfileSel").textContent='Selected: '+f.name+' ('+sizePretty(f.size)+')'; }
      if(S.step===3){ S.files.music=f;   revokeURL(S.musicURL);   S.musicURL  =URL.createObjectURL(f); $("#fileMusicSel").textContent  ='Selected: '+f.name+' ('+sizePretty(f.size)+')'; }
      if(S.step===4){ S.files.bg=f;      revokeURL(S.bgURL);      S.bgURL     =URL.createObjectURL(f); $("#fileBgSel").textContent     ='Selected: '+f.name+' ('+sizePretty(f.size)+')'; }
      schedulePreviewUpdate();
    });
  }

  if(S.step===5){ $("#themePicker").addEventListener('input', e=>{ S.themeColor=e.target.value; schedulePreviewUpdate(); }); }

  if(S.step===6){
    $("#dispName").addEventListener('input', e=>{ S.displayName=e.target.value; schedulePreviewUpdate(); });
    $("#desc").addEventListener('input', e=>{ S.description=e.target.value; schedulePreviewUpdate(); });
    $("#fontFamily").addEventListener('change', e=>{ S.fontKey=e.target.value; schedulePreviewUpdate(); });

    const grid = stepsEl.querySelector(".icon-grid");
    grid.addEventListener('click', e=>{
      const item=e.target.closest(".icon-item"); if(!item) return;
      const cb=item.querySelector(".icon-on");
      if(e.target!==cb) cb.checked=!cb.checked;
      const k=item.getAttribute("data-k"); S.icons[k].on=cb.checked; item.classList.toggle("on",cb.checked); schedulePreviewUpdate();
    });
    grid.addEventListener('input', e=>{
      if(e.target.classList.contains("icon-url-input")){
        const k=e.target.closest(".icon-item").getAttribute("data-k");
        S.icons[k].url=e.target.value.trim(); schedulePreviewUpdate();
      }
    });
  }

  if(S.step===7){
    const idInput=$("#discordId"), verify=$("#verifyDiscord"), clear=$("#clearDiscord"), statusEl=$("#discordStatus"),
          mini=$("#presMini"), pmAv=$("#pmAv"), pmDot=$("#pmDot"), pmName=$("#pmName"), pmAct=$("#pmAct");

    function setStatus(msg, cls){ statusEl.innerHTML=`<span class="badge ${cls||""}">${msg}</span>`; }
    function setMini(d){
      if(!d){ mini.classList.remove("show"); return; }
      pmAv.src = avatarUrl(d.discord_user.id,d.discord_user.avatar,128);
      const st=d.discord_status||"offline";
      pmDot.className="dot "+(st==='online'?'online':st==='idle'?'idle':st==='dnd'?'dnd':'');
      pmName.textContent = d.discord_user.display_name||d.discord_user.username||"Discord User";
      pmAct.textContent = actLabel(pickBestActivity(d.activities||[])) || "Currently doing nothing";
      mini.classList.add("show");
    }

    idInput.addEventListener('input', e=>{ S.discordId=e.target.value.trim(); });

    verify.addEventListener('click', async ()=>{
      const id=(S.discordId||"").trim();
      if(!/^\d{5,}$/.test(id)){ setStatus('Enter a valid numeric Discord ID','err'); setMini(null); S.discordEnabled=false; schedulePreviewUpdate(); return; }
      setStatus('Checking…');
      try{ const d=await fetchPresence(id); setStatus('Connected!','good'); setMini(d); S.discordEnabled=true; schedulePreviewUpdate(); }
      catch(_){ setStatus('Could not verify this ID','err'); setMini(null); S.discordEnabled=false; schedulePreviewUpdate(); }
    });

    clear.addEventListener('click', ()=>{ S.discordId=""; S.discordEnabled=false; idInput.value=""; setStatus('Cleared.'); setMini(null); schedulePreviewUpdate(); });
  }

  if(S.step===8){
    $("#enableBlur").addEventListener('change', e=>{ S.enableBlur=e.target.checked; schedulePreviewUpdate(); });
    $("#enableGlow").addEventListener('change', e=>{ S.enableGlow=e.target.checked; schedulePreviewUpdate(); });
    $("#glassBlur").addEventListener('input', e=>{ S.glassBlur=+e.target.value; schedulePreviewUpdate(); });
    $("#volBlur").addEventListener('input', e=>{ S.volumeBlur=+e.target.value; schedulePreviewUpdate(); });
    $("#glow").addEventListener('input', e=>{ S.glow=+e.target.value; schedulePreviewUpdate(); });
  }

  if(S.step===9){
    $("#fxType").addEventListener('change', e=>{ S.effectType=e.target.value; schedulePreviewUpdate(); });
    $("#fxLevel").addEventListener('input', e=>{ S.effectLevel=+e.target.value; schedulePreviewUpdate(); });
  }

  if(S.step===10){
    $("#cursorType").addEventListener('change', e=>{ S.cursorType=e.target.value; schedulePreviewUpdate(); });
    $("#cursorGlow").addEventListener('input', e=>{ S.cursorGlow=+e.target.value; schedulePreviewUpdate(); });
    $("#cursorSize").addEventListener('input', e=>{ S.cursorSize=+e.target.value; schedulePreviewUpdate(); });
  }

  if(S.step===12){ $("#genZipBtn").addEventListener('click', generateZip); }
}

// nav
let navLock=false;
backBtn.addEventListener('click', ()=>{ if(S.step>0 && !navLock){ S.step--; render(); }});
skipBtn.addEventListener('click', ()=>{ if(S.step===7){ S.discordEnabled=false; S.discordId=""; schedulePreviewUpdate(); S.step++; render(); }});
nextBtn.addEventListener('click', function(){
  if(navLock) return; navLock=true;
  try{
    if(S.step===1){ const raw=($("#siteName")?.value||"").trim(); if(!raw) return alert("Enter a website name."); S.name=slugify(raw); }
    if(S.step===2 && !S.files.profile) return alert("Choose a profile picture.");
    if(S.step===3){ if(!S.files.music) return alert("Choose an MP3."); if(S.files.music.size>20*1024*1024) return alert("MP3 must be ≤ 20 MB."); }
    if(S.step===4 && !S.files.bg) return alert("Choose a background image/GIF.");
    if(S.step===6 && !S.displayName) return alert("Enter display name.");
    if(S.step===11 && !(S.files.profile && S.files.music && S.files.bg && S.name)) return alert("Missing required items.");
    if(S.step < screens.length-1){ S.step++; render(); }
  } finally { setTimeout(()=>{ navLock=false; },150); }
});

// ===== ZIP OUTPUT =====
async function generateZip(){
  var zip=new JSZip(), n=slugify(S.name), folder=zip.folder(n);
  folder.file(n+".html", buildFinalHtmlForZip());
  var pExt=fileExt(S.files.profile)||"png", bExt=fileExt(S.files.bg)||"gif";
  folder.file("online."+pExt, S.files.profile);
  folder.file("online.mp3", S.files.music);
  folder.file("onlinebackground."+bExt, S.files.bg);
  var blob=await zip.generateAsync({type:"blob"}); saveAs(blob, n+"-portfolio.zip");
}
function selectedIconsHtmlFinal(){
  var out=[]; for(const k of Object.keys(S.icons)){ const it=S.icons[k]; if(it.on){ out.push(`        <a href="${escapeHtml(it.url||"#")}"><i class="${S.iconDefs[k].fa}"></i></a>`); } }
  return out.join("\n");
}
function buildFinalHtmlForZip(){
  var pExt=fileExt(S.files.profile)||"png", bExt=fileExt(S.files.bg)||"gif", theme=chosenTheme();
  const {r,g,b}=hexToRgb(theme), fontMeta=FONT_MAP[S.fontKey]||FONT_MAP["system-ui"];
  const glowAlpha=S.enableGlow?Math.max(0,Math.min(1,S.glow/100*0.7)):0;
  const cursorShadow=`0 0 ${12+28*(S.cursorGlow/100)}px rgba(255,255,255,${0.25+0.55*(S.cursorGlow/100)})`;
  const bodyCursorClass=(S.cursorType==='windows')?'sys-cursor':'';
  const cursorClass=(S.cursorType==='windows')?'circle':(S.cursorType==='main'?'circle':S.cursorType);
  const cursorSizePx=Math.max(6,Math.min(64,S.cursorSize|0));
  const googleLink=fontMeta.href?`<link rel="stylesheet" href="${fontMeta.href}">`:'';
  const presenceScript = (!S.discordEnabled||!S.discordId)?'':
`<script>(function(){
  const container=document.getElementById('presence'); if(!container) return;
  function avatarUrl(id,hash,size){return hash?('https://cdn.discordapp.com/avatars/'+id+'/'+hash+'.png?size='+(size||128)):'https://cdn.discordapp.com/embed/avatars/0.png';}
  function pick(acts){const order=[0,1,3,5,2];for(const t of order){const h=(acts||[]).find(a=>a.type===t);if(h) return h;}return null;}
  function label(a){if(!a) return '';const s=a.state?(' — '+a.state):'';switch(a.type){case 0:return 'Playing '+a.name+s;case 1:return 'Streaming '+a.name+s;case 2:return 'Listening to '+a.name+s;case 3:return 'Watching '+a.name+s;case 5:return 'Competing in '+a.name+s;default:return a.name||'';}}
  function esc(x){return String(x||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function render(d){const st=d.discord_status||'offline', dot=(st==='online'?'online':(st==='idle'?'idle':(st==='dnd'?'dnd':'')));
    container.innerHTML='<div class="pres-card"><div class="pres-av"><img alt="Avatar" src="'+avatarUrl(d.discord_user.id,d.discord_user.avatar,128)+'"><div class="pres-dot '+dot+'"></div></div>'
      +'<div class="pres-info"><div class="pres-name">'+esc(d.discord_user.display_name||d.discord_user.username||'Discord User')+'</div>'
      +'<div class="pres-act">'+esc(label(pick(d.activities)))+'</div></div></div>'; container.style.display='block';}
  async function tick(){try{const r=await fetch('https://api.lanyard.rest/v1/users/${encodeURIComponent(S.discordId)}',{cache:'no-store'});const j=await r.json();if(j&&j.success) render(j.data);}catch(e){}}
  tick(); setInterval(tick,15000);
})();</script>`;
  return [
'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />',
'<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
`<title>${escapeHtml(S.displayName)} | Portfolio</title>`,
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
googleLink,
'<style>',
`  :root { --accent:${theme}; --accent-r:${r}; --accent-g:${g}; --accent-b:${b}; --panel:rgba(40,40,40,0.45); --glass-blur:${S.enableBlur?S.glassBlur:0}px; --vol-blur:${S.enableBlur?S.volumeBlur:0}px; --glow-alpha:${glowAlpha}; --cursor-size:${cursorSizePx}px; --cursor-border:2px; --cursor-color: rgba(255,255,255,.9); --cursor-shadow:${JSON.stringify(cursorShadow)}; }`,
`  html, body { margin:0; height:100%; overflow:hidden; font-family:${fontMeta.stack}; color:#fff; background:#000; cursor:none }`,
'  .sys-cursor{cursor:auto} .sys-cursor #cursor{display:none}',
'  #fx{position:fixed;inset:0;z-index:5;pointer-events:none}',
'  #cursor{position:fixed;z-index:200;pointer-events:none;transform:translate(-50%,-50%);width:var(--cursor-size);height:var(--cursor-size)}',
'  #cursor.circle{border-radius:50%; background: var(--cursor-color); box-shadow: var(--cursor-shadow)}',
'  #cursor.ring{border-radius:50%; border: var(--cursor-border) solid var(--cursor-color); box-shadow: var(--cursor-shadow); background: transparent}',
'  #cursor.dot{border-radius:50%; background: var(--cursor-color); box-shadow: var(--cursor-shadow)}',
`  .bg{ position:fixed; inset:0; background:url("onlinebackground.${bExt}") repeat center center fixed; background-size:cover; transition:filter .8s ease; filter:blur(8px);} `,
'  .overlay{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; cursor:pointer; }',
'  .enter-text{ font-size:2rem; color:#00aaff; text-shadow:0 0 10px #00aaff,0 0 20px #00aaff; }',
'  .profile-wrap{ position:relative; z-index:10; height:100%; display:flex; align-items:center; justify-content:center; }',
`  .glass-card{ background: rgba(20,20,22,0.35); backdrop-filter: blur(var(--glass-blur)); -webkit-backdrop-filter: blur(var(--glass-blur)); border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 0 24px rgba(${r},${g},${b},${glowAlpha}); padding: 20px 26px; max-width: 440px; text-align:center; }`,
`  .profile img{ width:120px; height:120px; border-radius:50%; border:3px solid var(--accent); box-shadow: 0 0 16px rgba(${r},${g},${b},${glowAlpha}); }`,
'  .name{ font-size:1.8rem; font-weight:700; margin-top:0.6rem; }',
'  .tagline{ opacity:.9; margin-top:0.3rem; font-size:0.95rem; }',
'  .presence{margin-top:12px; display:'+(S.discordEnabled && S.discordId ? 'block' : 'none')+';}',
'  .pres-card{display:flex;align-items:center;gap:10px;background:rgba(20,20,22,.35);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px 10px;backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur))}',
'  .pres-av{position:relative;width:40px;height:40px;border-radius:50%;overflow:hidden}',
'  .pres-av img{width:100%;height:100%;object-fit:cover;display:block}',
'  .pres-dot{position:absolute;right:0;bottom:0;transform:translate(35%,35%);width:14px;height:14px;border-radius:50%;border:2px solid #1e1f25;background:#80848e}',
'  .pres-dot.online{background:#23a55a}.pres-dot.idle{background:#f0b232}.pres-dot.dnd{background:#f23f43}',
'  .pres-info{display:flex;flex-direction:column;gap:2px;text-align:left}',
'  .pres-name{font-weight:700}',
'  .pres-act{color:#b5bac1;font-size:.92rem}',
'  .icons{ margin-top:1.2rem; display:flex; gap:1.2rem; justify-content:center; }',
`  .icons a{ font-size:1.4rem; color:var(--accent); text-shadow: 0 0 8px rgba(${r},${g},${b},${glowAlpha}); }`,
'  .audio-controls{position:fixed;top:16px;left:16px;z-index:100;display:flex;align-items:center;gap:12px}',
'  .sound-btn{background:rgba(0,0,0,.5);width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:1.4rem;cursor:pointer;border:none;backdrop-filter:blur(var(--vol-blur));-webkit-backdrop-filter:blur(var(--vol-blur))}',
'  .sound-btn:hover{background:rgba(0,0,0,.6);transform:scale(1.06)}',
'  .sound-btn:hover + .volume-container, .volume-container:hover{width:150px;padding:0 15px}',
'  .volume-container{display:flex;align-items:center;width:0;overflow:hidden;transition:all .3s;background:rgba(0,0,0,.5);border-radius:25px;backdrop-filter:blur(var(--vol-blur));-webkit-backdrop-filter:blur(var(--vol-blur));height:50px}',
'  .volume-slider{width:100%;-webkit-appearance:none;height:6px;background:#333;border-radius:3px;outline:none}',
`  .volume-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;background:var(--accent);border-radius:50%;cursor:pointer;box-shadow:0 0 8px rgba(${r},${g},${b},${glowAlpha})}`,
'  .footer{position:fixed;bottom:10px;width:100%;text-align:center;font-size:.8rem;color:#94a3b8;opacity:.85;pointer-events:none}',
'</style></head><body class="'+bodyCursorClass+'">',
'<canvas id="fx"></canvas><div id="cursor" class="'+cursorClass+'"></div>',
'<div class="bg" id="bg"></div>',
'<div class="overlay" id="overlay"><div class="enter-text">Click Anywhere to Enter</div></div>',
'<div class="profile-wrap" id="content" style="display:none">',
'  <div class="glass-card">',
'    <div class="profile">',
`      <img src="online.${pExt}" alt="Profile Picture" />`,
`      <div class="name">${escapeHtml(S.displayName)}</div>`,
`      <div class="tagline">${escapeHtml(S.description)}</div>`,
'      <div class="presence" id="presence"></div>',
'      <div class="icons">', selectedIconsHtmlFinal(), '</div>',
'    </div>',
'  </div>',
'</div>',
'<audio id="bgMusic" loop preload="auto"><source src="online.mp3" type="audio/mpeg" /></audio>',
'<div class="audio-controls">',
'  <button class="sound-btn" id="soundBtn"><i class="fas fa-volume-up"></i></button>',
'  <div class="volume-container"><input type="range" id="volumeControl" class="volume-slider" min="0" max="1" step="0.01" value="0.5"></div>',
'</div>',
'<div class="footer">Powered by alqulol</div>',
'<script>',
'  const overlay=document.getElementById("overlay");',
'  const bg=document.getElementById("bg");',
'  const content=document.getElementById("content");',
'  const music=document.getElementById("bgMusic");',
'  const cursor=document.getElementById("cursor");',
'  overlay.addEventListener("click",function(){ bg.style.filter="none"; overlay.style.display="none"; content.style.display="flex"; music.play().catch(()=>{}); });',
'  (function(){',
'    const soundBtn=document.getElementById("soundBtn");',
'    const volumeControl=document.getElementById("volumeControl");',
'    const icon=soundBtn.querySelector("i");',
'    let muted=false;',
'    function updateIcon(){ icon.className=(muted||Number(volumeControl.value)===0)?"fas fa-volume-mute":"fas fa-volume-up"; }',
'    soundBtn.addEventListener("click",()=>{ muted=!muted; music.muted=muted; updateIcon(); });',
'    volumeControl.addEventListener("input",()=>{ music.volume=Number(volumeControl.value); updateIcon(); });',
'    updateIcon();',
'  })();',
'  (function(){',
'    const body=document.body;',
'    if(!body.classList.contains("sys-cursor")){',
'      window.addEventListener("mousemove",(e)=>{ cursor.style.left=e.clientX+"px"; cursor.style.top=e.clientY+"px"; });',
'      window.addEventListener("touchmove",(e)=>{ const t=e.touches[0]; if(t){ cursor.style.left=t.clientX+"px"; cursor.style.top=t.clientY+"px"; } },{passive:true});',
'    }',
'  })();',
'</script>',
presenceScript,
'<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>',
'</body></html>'
  ].join("\n");
}

// ===== START =====
function start(){ mountPreviewOnce(); patchPreview(); render(); }
start();
