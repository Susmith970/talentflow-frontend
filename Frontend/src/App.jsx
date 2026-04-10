import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   TalentFlow — Production Job Hunt System
   Design: Dark editorial — slate-black base, gold accent, sharp type
   Fonts: Instrument Serif (display) + Geist (body) + Geist Mono (code/data)
═══════════════════════════════════════════════════════════════════════════ */

// In production, set REACT_APP_API_URL env var to your Railway backend URL
const API = process.env.REACT_APP_API_URL || "http://localhost:5050";

const apiFetch = async (path, method = "GET", body = null) => {
  const opts = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${API}${path}`, opts);
  if (!r.ok && r.status !== 401) {
    const err = await r.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  return r.json();
};

const apiUpload = async (path, formData) => {
  const r = await fetch(`${API}${path}`, { method: "POST", credentials: "include", body: formData });
  return r.json();
};

/* ── Tokens ── */
const C = {
  bg:   "#080B12", s0:  "#0D1020", s1:  "#111525", s2:  "#161B30",
  b0:   "#1E2440", b1:  "#272D50", b2:  "#323860",
  t0:   "#EDF0FF", t1:  "#8892BC", t2:  "#454D75", t3:  "#252C50",
  gold: "#D4A843", goldd:"#A07820", goldb:"#FDD97A",
  teal: "#1EC8A0", teald:"#0A7A60", tealb:"#D0F5EC",
  blue: "#4B86FF", blued:"#162060",
  green:"#1EC55A", greend:"#092A18",
  amber:"#F0A020", amberd:"#301800",
  red:  "#EF4060", redd: "#280810",
  vio:  "#9B7EF8", viod: "#2A1660",
};

const STATUS_CFG = {
  new:         { l:"New",            c:C.t2,    bg:C.s1,     i:"○" },
  ready:       { l:"Resume Ready",   c:C.blue,  bg:C.blued,  i:"◈" },
  applying:    { l:"Applying…",      c:C.vio,   bg:C.viod,   i:"⟳" },
  submitted:   { l:"Submitted",      c:C.gold,  bg:"#281800", i:"✓" },
  manual:      { l:"Apply Manually", c:C.amber, bg:C.amberd, i:"✎" },
  interviewing:{ l:"Interviewing",   c:C.teal,  bg:C.teald,  i:"◆" },
  offered:     { l:"Offer! 🎉",       c:C.green, bg:C.greend, i:"★" },
  rejected:    { l:"Rejected",       c:C.red,   bg:C.redd,   i:"✗" },
};

const SRC_C = {
  "LinkedIn":"#0A66C2","LinkedIn RSS":"#0A66C2","We Work Remotely":"#0E7A4E",
  "RemoteOK":"#DA3749","Jobright":"#E55A2B","Arbeitnow":"#6366F1",
  "Jobicy":"#8B5CF6","HN Hiring":"#FF6600","YC Jobs":"#F05033",
  "Greenhouse":"#24A148","Lever boards":"#2196F3","Remotive":"#E74C3C",
};

/* ── Atoms ── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:${C.bg};color:${C.t0};font-family:'Geist',sans-serif}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:${C.b0};border-radius:4px}
input,select,textarea,button{font-family:'Geist',sans-serif;color-scheme:dark}
a{text-decoration:none}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
/* Mobile responsive */
@media(max-width:768px){
  .tf-sidebar{display:none!important}
  .tf-mobile-nav{display:flex!important}
  .tf-topbar-stats{display:none!important}
  .tf-main{padding:12px 14px!important}
  .tf-page{padding:14px 12px!important;height:calc(100vh - 48px - 56px)!important}
  .tf-grid-2{grid-template-columns:1fr!important}
  .tf-grid-4{grid-template-columns:1fr 1fr!important}
  .tf-card-row{flex-direction:column!important;gap:8px!important}
  .tf-hide-mobile{display:none!important}
  .tf-score-circle{display:none!important}
  .tf-job-card{padding:12px!important}
  .tf-qa-header{flex-direction:column!important;gap:10px!important}
}
@media(max-width:480px){
  .tf-grid-4{grid-template-columns:1fr!important}
}
`

const Mono = ({ c, s=11, w=400, children, style={} }) => (
  <span style={{fontFamily:"'Geist Mono',monospace",color:c||C.t1,fontSize:s,fontWeight:w,...style}}>{children}</span>
);

const Pill = ({ label, color, bg, sm }) => (
  <span style={{background:bg||`${color}18`,border:`1px solid ${color}30`,color,
    borderRadius:4,padding:sm?"1px 6px":"2px 9px",fontSize:sm?9:10,fontWeight:600,
    fontFamily:"'Geist Mono',monospace",whiteSpace:"nowrap",display:"inline-flex",
    alignItems:"center",gap:3}}>
    {label}
  </span>
);

const StatusPill = ({ status, lg }) => {
  const s = STATUS_CFG[status] || STATUS_CFG.new;
  return <span style={{background:s.bg,border:`1px solid ${s.c}40`,color:s.c,
    borderRadius:4,padding:lg?"5px 12px":"2px 8px",fontSize:lg?11:10,fontWeight:700,
    fontFamily:"'Geist Mono',monospace",display:"inline-flex",alignItems:"center",
    gap:5,whiteSpace:"nowrap"}}>{s.i} {s.l}</span>;
};

const SrcPill = ({ src }) => <Pill label={src} color={SRC_C[src]||C.t1} sm />;

const Score = ({ n, size=50 }) => {
  const r=size*.37,circ=2*Math.PI*r;
  const col=n>=85?C.teal:n>=70?C.amber:n>=50?C.red:C.t2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.b0} strokeWidth={size*.085}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={size*.085}
        strokeDasharray={`${(n/100)*circ} ${circ}`} strokeDashoffset={circ*.25} strokeLinecap="round"/>
      <text x={size/2} y={size/2+size*.08} textAnchor="middle"
        fontFamily="'Geist Mono',monospace" fontSize={size*.22} fontWeight="700" fill={col}>{n||"—"}</text>
    </svg>
  );
};

const Spin = ({sz=14,c:col}) => (
  <div style={{width:sz,height:sz,borderRadius:"50%",border:`2px solid ${C.b1}`,
    borderTop:`2px solid ${col||C.gold}`,animation:"spin .6s linear infinite",
    flexShrink:0,display:"inline-block"}}/>
);

const Btn = ({ children, onClick, disabled, variant="gold", size="md", style={} }) => {
  const V={
    gold:`linear-gradient(135deg,${C.gold},${C.goldd})`,
    teal:`linear-gradient(135deg,${C.teal},${C.teald})`,
    ghost:C.s1, red:`${C.red}20`, vio:`linear-gradient(135deg,${C.vio},#7832F0)`,
  };
  const TC={gold:"#000",teal:"#000",ghost:C.t1,red:C.red,vio:"#fff"};
  const pad=size==="sm"?"6px 14px":"9px 20px";
  return <button onClick={onClick} disabled={disabled} style={{
    padding:pad,borderRadius:8,fontSize:size==="sm"?11:12,fontWeight:700,
    cursor:disabled?"not-allowed":"pointer",opacity:disabled?.45:1,
    display:"inline-flex",alignItems:"center",gap:7,letterSpacing:".03em",
    background:V[variant],color:TC[variant],
    border:variant==="ghost"?`1px solid ${C.b0}`:variant==="red"?`1px solid ${C.red}40`:"none",
    transition:"all .15s",...style}}>
    {children}
  </button>;
};

const Card = ({ children, style={} }) => (
  <div style={{background:C.s0,border:`1px solid ${C.b0}`,borderRadius:12,...style}}>{children}</div>
);

const Label = ({ children }) => (
  <Mono c={C.t2} s={9} style={{display:"block",marginBottom:8,letterSpacing:".12em"}}>{children}</Mono>
);

const Input = ({ label, value, onChange, placeholder, type="text", required, rows, style={} }) => {
  const base = {width:"100%",background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,
    padding:"9px 12px",color:C.t0,fontSize:12,outline:"none",
    fontFamily:"'Geist',sans-serif",transition:"border-color .15s"};
  const onF = e => e.target.style.borderColor = C.gold;
  const onB = e => e.target.style.borderColor = C.b0;
  return (
    <div style={{marginBottom:14,...style}}>
      {label && <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:6}}>{label}{required&&<span style={{color:C.red}}> *</span>}</Mono>}
      {rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder}
            rows={rows} onFocus={onF} onBlur={onB}
            style={{...base,resize:"vertical",lineHeight:1.7}}/>
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder}
            onFocus={onF} onBlur={onB} style={base}/>
      }
    </div>
  );
};

const TagInput = ({ label, value, onChange, placeholder }) => {
  const [inp, setInp] = useState("");
  // Normalize: convert any object items (e.g. {name,issuer,date} certs) to strings
  const normalize = (arr) => (arr||[]).map(v => {
    if (typeof v === "object" && v !== null) {
      return [v.name, v.issuer, v.date].filter(Boolean).join(", ");
    }
    return String(v||"");
  }).filter(Boolean);
  const items = normalize(value);
  const add = (v) => { const t=v.trim(); if(t&&!items.includes(t)) onChange([...items,t]); setInp(""); };
  return (
    <div style={{marginBottom:14}}>
      {label && <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:6}}>{label}</Mono>}
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:7}}>
        {items.map(v=>(
          <div key={v} style={{background:C.blued,border:`1px solid ${C.blue}35`,borderRadius:5,
            padding:"3px 9px",display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:C.blue,fontSize:11,fontWeight:600}}>{v}</span>
            <button onClick={()=>onChange(items.filter(x=>x!==v))}
              style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:7}}>
        <input value={inp} onChange={e=>setInp(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add(inp);}}}
          placeholder={placeholder||"Type and press Enter"}
          style={{flex:1,background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,
            padding:"8px 12px",color:C.t0,fontSize:12,outline:"none",
            fontFamily:"'Geist',sans-serif"}}
          onFocus={e=>e.target.style.borderColor=C.gold}
          onBlur={e=>e.target.style.borderColor=C.b0}/>
        <Btn onClick={()=>add(inp)} size="sm" disabled={!inp.trim()}>Add</Btn>
      </div>
    </div>
  );
};

const Err = ({ msg }) => msg ? (
  <div style={{background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:8,
    padding:"9px 13px",color:C.red,fontSize:12,marginBottom:14}}>{msg}</div>
) : null;

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: AUTH (login / register)
═══════════════════════════════════════════════════════════════════════════ */
function AuthPage({ profilesExist, onAuth }) {
  const [mode, setMode]     = useState(profilesExist ? "login" : "register");
  const [step, setStep]     = useState(1);   // register is multi-step
  const [loading, setLoad]  = useState(false);
  const [err, setErr]       = useState("");
  const fileRef = useRef();

  // Form state
  const [form, setForm] = useState({
    username:"", password:"", name:"", email:"", phone:"",
    linkedin:"", github:"", website:"", location:"",
    title:"", summary:"", years_experience:"",
    target_roles:[], work_preference:"Remote",
    skills:[], ml_skills:[], tools:[],
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [drag, setDrag] = useState(false);

  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const doLogin = async () => {
    setLoad(true); setErr("");
    try {
      const r = await apiFetch("/api/auth/login","POST",{
        username:form.username, password:form.password });
      if(r.error) throw new Error(r.error);
      onAuth(r.profile);
    } catch(e) { setErr(e.message); }
    setLoad(false);
  };

  const doRegister = async () => {
    setLoad(true); setErr("");
    try {
      // Step 1: create account
      const r = await apiFetch("/api/auth/register","POST",{
        ...form, years_experience: parseInt(form.years_experience)||0 });
      if(r.error) throw new Error(r.error);

      // Step 2: upload resume if provided
      if(resumeFile) {
        const fd = new FormData();
        fd.append("file", resumeFile);
        await apiUpload("/api/profile/upload-resume", fd);
      }
      onAuth(r.profile);
    } catch(e) { setErr(e.message); }
    setLoad(false);
  };

  const STEPS = [
    { title:"Account",    sub:"Username & password" },
    { title:"About You",  sub:"Name, contact, location" },
    { title:"Job Goals",  sub:"What you're looking for" },
    { title:"Resume",     sub:"Upload to extract skills & tailor resumes" },
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",overflow:"hidden"}}>
      {/* Left brand */}
      <div style={{width:380,background:C.s0,borderRight:`1px solid ${C.b0}`,
        display:"flex",flexDirection:"column",padding:"48px 36px",flexShrink:0,position:"relative",overflow:"hidden"}}>
        {/* Decorative grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.b0} 1px,transparent 1px),linear-gradient(90deg,${C.b0} 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:.12,pointerEvents:"none"}}/>

        <div style={{position:"relative"}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:56}}>
            <div style={{width:38,height:38,borderRadius:10,background:C.gold,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,fontWeight:900,color:"#000",
              boxShadow:`0 0 24px ${C.goldd}60`}}>J</div>
            <div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:C.t0}}>JobHunt</div>
              <Mono c={C.t2} s={9} style={{letterSpacing:".1em"}}>AI JOB SEARCH</Mono>
            </div>
          </div>

          <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:42,fontWeight:400,
            color:C.t0,lineHeight:1.12,marginBottom:16}}>
            Your next role<br/>
            <span style={{color:C.gold,fontStyle:"italic"}}>starts here.</span>
          </h1>
          <p style={{color:C.t1,fontSize:13,lineHeight:1.8,marginBottom:36}}>
            12 job boards scraped every 24 hours. ATS-tailored resumes that match
            your format. Auto-apply to LinkedIn, Indeed, Greenhouse & Lever.
          </p>

          {[
            ["🔍","12 sources: LinkedIn, WWR, Jobright, Greenhouse, Lever + more"],
            ["📄","Resume tailored per job — your format, smarter keywords"],
            ["⚡","Auto-apply to Easy Apply & public ATS forms"],
            ["📊","Full pipeline tracking: New → Applied → Offer"],
            ["☁","Google Drive sync for all generated resumes"],
          ].map(([icon,text])=>(
            <div key={text} style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:32,height:32,borderRadius:8,background:C.s1,
                border:`1px solid ${C.b0}`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:14,flexShrink:0}}>{icon}</div>
              <span style={{color:C.t1,fontSize:12}}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
        padding:"40px 48px",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:500,animation:"fadeUp .4s ease"}}>

          {/* Mode tabs */}
          <div style={{display:"flex",gap:3,background:C.s1,border:`1px solid ${C.b0}`,
            borderRadius:10,padding:3,marginBottom:30}}>
            {[["login","Sign In"],["register","Create Profile"]].map(([v,l])=>(
              <button key={v} onClick={()=>{setMode(v);setErr("");setStep(1);}}
                style={{flex:1,padding:"8px 0",background:mode===v?C.gold:"transparent",
                  border:"none",borderRadius:8,color:mode===v?"#000":C.t1,
                  fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s",
                  fontFamily:"'Geist',sans-serif"}}>{l}</button>
            ))}
          </div>

          <Err msg={err}/>

          {/* ── LOGIN ── */}
          {mode==="login" && (
            <div>
              <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:26,fontWeight:400,
                color:C.t0,marginBottom:20}}>Welcome back</h2>
              <Input label="Username" value={form.username} onChange={e=>F("username",e.target.value)} required/>
              <Input label="Password" type="password" value={form.password} onChange={e=>F("password",e.target.value)} required/>
              <Btn onClick={doLogin} disabled={loading||!form.username||!form.password} style={{width:"100%",justifyContent:"center",marginTop:8}}>
                {loading?<><Spin sz={13}/>Signing in…</>:"Sign In"}
              </Btn>
              {!profilesExist && (
                <p style={{color:C.t2,fontSize:12,textAlign:"center",marginTop:14}}>
                  No profiles yet.{" "}
                  <button onClick={()=>setMode("register")} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:12}}>Create one →</button>
                </p>
              )}
            </div>
          )}

          {/* ── REGISTER (multi-step) ── */}
          {mode==="register" && (
            <div>
              {/* Step progress */}
              <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:28}}>
                {STEPS.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"auto"}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:28,height:28,borderRadius:"50%",
                        background:step>i+1?C.teal:step===i+1?C.gold:C.b0,
                        border:`2px solid ${step>i+1?C.teal:step===i+1?C.gold:C.b1}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,fontWeight:700,color:step>i+1?"#fff":step===i+1?"#000":C.t2}}>
                        {step>i+1?"✓":i+1}
                      </div>
                      <Mono c={step===i+1?C.t0:C.t2} s={9} style={{whiteSpace:"nowrap"}}>{s.title}</Mono>
                    </div>
                    {i<STEPS.length-1&&<div style={{flex:1,height:1,background:step>i+1?C.teal:C.b0,margin:"0 6px",marginBottom:14}}/>}
                  </div>
                ))}
              </div>

              {step===1 && <>
                <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:C.t0,marginBottom:18}}>Create your account</h2>
                <Input label="Username" value={form.username} onChange={e=>F("username",e.target.value)} placeholder="e.g. alexrivera" required/>
                <Input label="Password" type="password" value={form.password} onChange={e=>F("password",e.target.value)} placeholder="At least 8 characters" required/>
                <Btn onClick={()=>{if(form.username&&form.password){setErr("");setStep(2);}else setErr("Fill in both fields.");}} style={{width:"100%",justifyContent:"center"}}>
                  Continue →
                </Btn>
              </>}

              {step===2 && <>
                <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:C.t0,marginBottom:18}}>About you</h2>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  <Input label="Full name" value={form.name} onChange={e=>F("name",e.target.value)} required/>
                  <Input label="Email" type="email" value={form.email} onChange={e=>F("email",e.target.value)} required/>
                  <Input label="Phone" value={form.phone} onChange={e=>F("phone",e.target.value)}/>
                  <Input label="Location" value={form.location} onChange={e=>F("location",e.target.value)} placeholder="San Francisco, CA"/>
                  <Input label="LinkedIn" value={form.linkedin} onChange={e=>F("linkedin",e.target.value)} placeholder="linkedin.com/in/handle"/>
                  <Input label="GitHub" value={form.github} onChange={e=>F("github",e.target.value)} placeholder="github.com/handle"/>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <Btn onClick={()=>setStep(1)} variant="ghost">← Back</Btn>
                  <Btn onClick={()=>{if(form.name&&form.email){setErr("");setStep(3);}else setErr("Name and email required.");}} style={{flex:1,justifyContent:"center"}}>Continue →</Btn>
                </div>
              </>}

              {step===3 && <>
                <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:C.t0,marginBottom:18}}>Your job goals</h2>
                <Input label="Current title or headline" value={form.title} onChange={e=>F("title",e.target.value)} placeholder="ML Engineer / Senior Software Engineer"/>
                <Input label="Years of experience" type="number" value={form.years_experience} onChange={e=>F("years_experience",e.target.value)}/>
                <TagInput label="Target roles (press Enter after each)" value={form.target_roles} onChange={v=>F("target_roles",v)} placeholder="e.g. ML Engineer"/>
                <div style={{marginBottom:14}}>
                  <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Work preference</Mono>
                  <div style={{display:"flex",gap:6}}>
                    {["Remote","Hybrid","On-site","Any"].map(w=>(
                      <button key={w} onClick={()=>F("work_preference",w)} style={{
                        flex:1,padding:"8px 0",background:form.work_preference===w?C.blued:C.s1,
                        border:`1px solid ${form.work_preference===w?C.blue:C.b0}`,
                        borderRadius:7,color:form.work_preference===w?C.blue:C.t1,
                        fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <TagInput label="Skills (Python, TypeScript, React…)" value={form.skills} onChange={v=>F("skills",v)}/>
                <TagInput label="ML/AI skills (optional)" value={form.ml_skills} onChange={v=>F("ml_skills",v)}/>
                <TagInput label="Tools & platforms (AWS, Docker…)" value={form.tools} onChange={v=>F("tools",v)}/>
                <div style={{display:"flex",gap:10}}>
                  <Btn onClick={()=>setStep(2)} variant="ghost">← Back</Btn>
                  <Btn onClick={()=>{setErr("");setStep(4);}} style={{flex:1,justifyContent:"center"}}>Continue →</Btn>
                </div>
              </>}

              {step===4 && <>
                <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:C.t0,marginBottom:6}}>Upload your resume</h2>
                <p style={{color:C.t1,fontSize:12,marginBottom:16}}>We'll extract your profile and use it to tailor resumes for every job. Skipping is OK — you can upload later in Settings.</p>
                <div onDragOver={e=>{e.preventDefault();setDrag(true);}}
                  onDragLeave={()=>setDrag(false)}
                  onDrop={e=>{e.preventDefault();setDrag(false);setResumeFile(e.dataTransfer.files[0]);}}
                  onClick={()=>fileRef.current?.click()}
                  style={{border:`1.5px dashed ${drag?C.gold:resumeFile?C.teal:C.b1}`,
                    borderRadius:10,padding:"28px 20px",textAlign:"center",cursor:"pointer",
                    background:drag?`${C.gold}08`:resumeFile?`${C.teal}08`:C.s1,
                    marginBottom:20,transition:"all .15s"}}>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{display:"none"}}
                    onChange={e=>setResumeFile(e.target.files[0])}/>
                  <div style={{fontSize:32,marginBottom:8}}>{resumeFile?"✅":"📄"}</div>
                  {resumeFile
                    ? <><div style={{color:C.teal,fontWeight:700,fontSize:13}}>{resumeFile.name}</div>
                        <Mono c={C.t2}>{(resumeFile.size/1024).toFixed(0)} KB · click to change</Mono></>
                    : <><div style={{color:C.t0,fontSize:13,fontWeight:600,marginBottom:3}}>Drop resume or click to browse</div>
                        <Mono c={C.t2}>PDF · DOCX · TXT</Mono></>}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <Btn onClick={()=>setStep(3)} variant="ghost">← Back</Btn>
                  <Btn onClick={doRegister} disabled={loading} style={{flex:1,justifyContent:"center"}}>
                    {loading?<><Spin sz={13}/>Creating profile…</>:"Create Profile & Start"}
                  </Btn>
                </div>
              </>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB DETAIL DRAWER
═══════════════════════════════════════════════════════════════════════════ */
function JobDrawer({ job: jobProp, onClose, onStatus, onGenResume, onApply, genLoading }) {
  const [tab, setTab]     = useState("overview");
  const [note, setNote]   = useState("");
  const [job, setJob]     = useState(jobProp);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setJob(jobProp); setTab("overview"); setNote(jobProp?.notes||""); }, [jobProp?.id]);

  if (!job) return null;
  const cfg = STATUS_CFG[job.status] || STATUS_CFG.new;

  const saveNote = async () => {
    await apiFetch(`/api/jobs/${job.id}/note`,"PATCH",{notes:note});
  };

  const copy = () => {
    if(job.cover_letter) navigator.clipboard.writeText(job.cover_letter).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:540,
      background:C.s0,borderLeft:`1px solid ${C.b0}`,
      display:"flex",flexDirection:"column",zIndex:200,
      animation:"slideIn .3s ease",boxShadow:`-20px 0 60px #00000060`}}>

      {/* Header */}
      <div style={{padding:"16px 20px 14px",borderBottom:`1px solid ${C.b0}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            <StatusPill status={job.status} lg/>
            <SrcPill src={job.source}/>
            <Pill label={job.work_type} color={job.work_type==="Remote"?C.teal:job.work_type==="Hybrid"?C.amber:C.vio}/>
            {job.easy_apply&&<Pill label="⚡ Easy Apply" color={C.vio}/>}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.t1,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
        </div>

        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
          <div style={{width:44,height:44,borderRadius:10,background:C.blued,
            border:`1px solid ${C.b0}`,display:"flex",alignItems:"center",
            justifyContent:"center",fontFamily:"'Instrument Serif',serif",
            fontSize:18,color:C.blue,flexShrink:0}}>
            {job.company[0]}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C.t0,lineHeight:1.2,marginBottom:3}}>{job.title}</div>
            <div style={{color:C.t1,fontSize:12}}>{job.company} · {job.location}{job.salary?` · ${job.salary}`:""}</div>
          </div>
          <Score n={job.ats_score} size={52}/>
        </div>

        {/* Status moves */}
        <div style={{marginBottom:12}}>
          <Label>MOVE TO</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {Object.entries(STATUS_CFG).filter(([k])=>k!==job.status).map(([k,s])=>(
              <button key={k} onClick={()=>onStatus(job.id,k)} style={{
                padding:"3px 9px",background:s.bg,border:`1px solid ${s.c}40`,
                borderRadius:5,color:s.c,fontSize:10,fontWeight:700,cursor:"pointer",
                fontFamily:"'Geist',sans-serif"}}>{s.i} {s.l}</button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {job.easy_apply
            ? <Btn onClick={()=>onApply(job.id)} variant="vio" style={{flex:1.4}}>⚡ Auto-Apply</Btn>
            : job.status==="manual"
              ? <a href={job.manual_apply_url||job.url} target="_blank" rel="noopener noreferrer"
                  onClick={()=>onStatus(job.id,"submitted")}
                  style={{flex:1.4,padding:"9px 0",background:`linear-gradient(135deg,${C.gold},${C.goldd})`,
                    borderRadius:8,color:"#000",fontSize:12,fontWeight:700,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                    textDecoration:"none",letterSpacing:".03em"}}>
                  ↗ Submit Manually
                </a>
              : <a href={job.url} target="_blank" rel="noopener noreferrer"
                  style={{flex:1.4,padding:"9px 0",background:`linear-gradient(135deg,${C.gold},${C.goldd})`,
                    borderRadius:8,color:"#000",fontSize:12,fontWeight:700,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                    textDecoration:"none",letterSpacing:".03em"}}>↗ Open Listing</a>
          }
          {!job.resume_filename
            ? <Btn onClick={()=>onGenResume(job.id)} disabled={genLoading} style={{flex:1}}>
                {genLoading?<><Spin sz={11}/>Generating…</>:"📄 Gen Resume"}
              </Btn>
            : <a href={`${API}/api/resume/download/${job.resume_filename}`} target="_blank" rel="noopener noreferrer">
                <Btn variant="teal">⬇ Resume</Btn>
              </a>
          }
          <a href={job.url} target="_blank" rel="noopener noreferrer"
            style={{padding:"9px 12px",background:C.s1,border:`1px solid ${C.b0}`,
              borderRadius:8,color:C.t1,fontSize:12,display:"flex",alignItems:"center",
              textDecoration:"none"}}>🔗</a>
        </div>
        {job.status==="manual"&&<Mono c={C.amber} s={11} style={{display:"block",marginTop:8}}>
          ✎ This ATS requires manual form submission. Your tailored resume is ready to upload.
        </Mono>}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.b0}`,flexShrink:0,background:C.bg}}>
        {[["overview","Overview"],["ats","ATS Score"],["notes","Notes"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{
            padding:"9px 18px",background:"none",border:"none",
            borderBottom:`2px solid ${tab===v?C.gold:"transparent"}`,
            color:tab===v?C.t0:C.t1,fontSize:11,fontWeight:tab===v?700:400,
            cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>
        {tab==="overview"&&(
          <div>
            <div style={{marginBottom:14}}>
              <Label>DESCRIPTION</Label>
              <Card style={{padding:"12px 14px"}}>
                <p style={{color:C.t1,fontSize:13,lineHeight:1.75}}>{job.description||"No description available."}</p>
              </Card>
            </div>
            {(job.tags||[]).length>0&&(
              <div style={{marginBottom:14}}>
                <Label>TAGS</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {job.tags.map(t=><Pill key={t} label={t} color={C.blue}/>)}
                </div>
              </div>
            )}
            {job.match_reason&&(
              <div style={{background:`${cfg.c}0A`,border:`1px solid ${cfg.c}25`,borderRadius:8,padding:"12px 14px"}}>
                <Mono c={cfg.c} s={11} w={600} style={{display:"block",marginBottom:5}}>{cfg.i} AI Match Reasoning</Mono>
                <p style={{color:C.t1,fontSize:12,lineHeight:1.65}}>{job.match_reason}</p>
              </div>
            )}
          </div>
        )}
        {tab==="ats"&&(
          <div>
            <div style={{display:"flex",gap:14,alignItems:"center",background:C.s1,
              border:`1px solid ${C.b0}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
              <Score n={job.ats_score} size={68}/>
              <div>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:20,
                  color:job.ats_score>=80?C.teal:C.amber,marginBottom:4}}>
                  {job.match_label||"Not scored yet"}
                </div>
                <Mono c={C.t1} s={12}>{job.match_reason||"Generate a resume to run full ATS analysis."}</Mono>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div style={{background:`${C.teal}0A`,border:`1px solid ${C.teal}20`,borderRadius:8,padding:"12px 14px"}}>
                <Label>✓ MATCHED</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {(job.matched_keywords||[]).map(k=><Pill key={k} label={k} color={C.teal}/>)}
                  {!(job.matched_keywords||[]).length&&<Mono c={C.t2} s={11}>—</Mono>}
                </div>
              </div>
              <div style={{background:`${C.amber}0A`,border:`1px solid ${C.amber}20`,borderRadius:8,padding:"12px 14px"}}>
                <Label>✗ MISSING</Label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {(job.missing_keywords||[]).map(k=><Pill key={k} label={k} color={C.amber}/>)}
                  {!(job.missing_keywords||[]).length&&<Mono c={C.teal} s={11}>Perfect match!</Mono>}
                </div>
              </div>
            </div>
            {(job.ats_tips||[]).length>0&&(
              <div style={{background:`${C.blue}08`,border:`1px solid ${C.blue}20`,borderRadius:8,padding:"12px 14px"}}>
                <Label>💡 TIPS TO IMPROVE</Label>
                {job.ats_tips.map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                    <Mono c={C.blue} s={12}>›</Mono>
                    <span style={{color:C.t1,fontSize:12,lineHeight:1.6}}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab==="notes"&&(
          <div>
            <Label>TIMELINE</Label>
            <div style={{position:"relative",paddingLeft:18,marginBottom:20}}>
              <div style={{position:"absolute",left:7,top:0,bottom:0,width:1,background:C.b0}}/>
              {[
                {e:"Scraped",d:job.posted,done:true,c:C.blue},
                {e:"Resume Generated",d:job.resume_filename?"Done":"Pending",done:!!job.resume_filename,c:C.blue},
                {e:"Submitted",d:job.submitted_at?new Date(job.submitted_at).toLocaleString():"Pending",done:!!job.submitted_at,c:C.gold},
                {e:"Interviewing",d:["interviewing","offered"].includes(job.status)?"Yes":"Pending",done:["interviewing","offered"].includes(job.status),c:C.teal},
                {e:"Offer",d:job.status==="offered"?"🏆 Received!":"Pending",done:job.status==="offered",c:C.green},
              ].map((ev,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12,position:"relative"}}>
                  <div style={{width:13,height:13,borderRadius:"50%",background:ev.done?ev.c:C.s1,
                    border:`2px solid ${ev.done?ev.c:C.b0}`,position:"absolute",left:-12.5,top:3,flexShrink:0}}/>
                  <div style={{paddingLeft:6}}>
                    <div style={{color:ev.done?C.t0:C.t2,fontSize:12,fontWeight:ev.done?600:400,marginBottom:2}}>{ev.e}</div>
                    <Mono c={ev.done?ev.c:C.t3} s={10}>{ev.d}</Mono>
                  </div>
                </div>
              ))}
            </div>
            <Label>NOTES</Label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} onBlur={saveNote}
              placeholder="Recruiter contacts, interview prep, salary notes, follow-up dates…"
              rows={5} style={{width:"100%",background:C.s1,border:`1px solid ${C.b0}`,
                borderRadius:8,padding:"10px 12px",color:C.t0,fontSize:12,lineHeight:1.75,
                outline:"none",resize:"vertical",fontFamily:"'Geist',sans-serif",
                transition:"border-color .15s"}}
              onFocus={e=>e.target.style.borderColor=C.gold}
              onBlurCapture={e=>e.target.style.borderColor=C.b0}/>
            <Mono c={C.t2} s={10} style={{display:"block",marginTop:4}}>Saves automatically on blur</Mono>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════════════ */
// Sanitize profile: convert cert/award objects like {name,issuer,date} to strings.
// These end up in the DB from old PDF extraction and crash React when rendered.
function sanitizeProfile(p) {
  if (!p || typeof p !== "object") return p || {};
  const out = { ...p };
  ["certifications","awards","publications","skills","ml_skills","tools","target_roles"].forEach(k => {
    if (Array.isArray(out[k])) {
      out[k] = out[k].map(v => {
        if (v && typeof v === "object") {
          return [v.name,v.issuer,v.date,v.title].filter(Boolean).join(", ");
        }
        return String(v || "").trim();
      }).filter(Boolean);
    }
  });
  return out;
}

function MainApp({ profile: initProfile, onLogout }) {
  const [profile, setProfile] = useState(sanitizeProfile(initProfile));
  const [page, setPage]       = useState("dashboard");
  const [jobs, setJobs]       = useState([]);
  const [stats, setStats]     = useState({total:0,by_status:{},by_source:{}});
  const [resumes, setResumes] = useState([]);
  const [selJob, setSelJob]   = useState(null);
  const [scraping, setScrape] = useState(false);
  // ── Pipeline ──
  const [pipeline, setPipeline]     = useState({running:false,phase:"",phase_label:"Idle",log:[],
    jobs_scraped:0,jobs_new:0,jobs_eligible:0,jobs_resumed:0,jobs_submitted:0,jobs_failed:0,jobs_manual:0,
    current_job:"",error:null,finished_at:null});
  const [pipeOpts, setPipeOpts]     = useState({score_threshold:65,max_apply:30});
  const [scrapeInfo, setScrInfo] = useState({found:0,current_source:""});
  const [genLoading, setGenLoad] = useState(false);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [err, setErr]         = useState("");

  // Resume builder
  const [jd, setJd]           = useState("");
  const [rbTitle, setRbTitle] = useState("");
  const [rbCo, setRbCo]       = useState("");
  const [rbResult, setRbResult] = useState(null);
  const [rbLoading, setRbLoad]  = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");  // Settings save feedback
  // ── Quick Apply ──
  const [qaUrl,     setQaUrl]     = useState("");
  const [qaTitle,   setQaTitle]   = useState("");
  const [qaCompany, setQaCompany] = useState("");
  const [qaLoading, setQaLoad]    = useState(false);
  const [qaResult,  setQaResult]  = useState(null);
  const [qaError,   setQaError]   = useState("");

  const loadJobs  = useCallback(async () => {
    const data = await apiFetch("/api/jobs").catch(()=>[]);
    setJobs(Array.isArray(data)?data:[]);
  },[]);

  const loadStats = useCallback(async () => {
    const data = await apiFetch("/api/jobs/stats").catch(()=>({}));
    setStats(data||{total:0,by_status:{},by_source:{}});
  },[]);

  const loadResumes = useCallback(async () => {
    const data = await apiFetch("/api/resume/list").catch(()=>[]);
    setResumes(Array.isArray(data)?data:[]);
  },[]);

  useEffect(() => {
    loadJobs(); loadStats(); loadResumes();
  },[]);

  // Poll pipeline status when running
  useEffect(() => {
    if (!pipeline.running) return;
    const iv = setInterval(async () => {
      try {
        const s = await apiFetch("/api/pipeline/status");
        setPipeline(s);
        if (!s.running) {
          clearInterval(iv);
          await loadJobs(); await loadStats();
        }
      } catch(e) {}
    }, 2000);
    return () => clearInterval(iv);
  }, [pipeline.running]);

  // Poll scrape progress
  useEffect(() => {
    if (!scraping) return;
    const iv = setInterval(async ()=>{
      const p = await apiFetch("/api/scrape/progress").catch(()=>null);
      if (!p) return;
      setScrInfo({found:p.found||0,current_source:p.current_source||""});
      if (!p.running) {
        setScrape(false); clearInterval(iv);
        await loadJobs(); await loadStats();
      }
    }, 1500);
    return () => clearInterval(iv);
  },[scraping]);

  const startScrape = async () => {
    setScrape(true); setErr("");
    try {
      await apiFetch("/api/scrape/start","POST",{
        roles:profile.target_roles, work_preference:profile.work_preference });
    } catch(e) { setErr(e.message); setScrape(false); }
  };

  const onStatus = async (jid, status) => {
    await apiFetch(`/api/jobs/${jid}/status`,"PATCH",{status});
    setJobs(prev=>prev.map(j=>j.id!==jid?j:{...j,status,
      submitted_at:["submitted","applying"].includes(status)?new Date().toISOString():j.submitted_at}));
    if(selJob?.id===jid) setSelJob(j=>({...j,status}));
  };

  const onGenResume = async (jid) => {
    setGenLoad(true); setErr("");
    try {
      const r = await apiFetch("/api/resume/generate","POST",{job_id:jid});
      if(r.error) throw new Error(r.error);
      await loadJobs(); await loadResumes();
      if(selJob?.id===jid) {
        setSelJob(j=>({...j,resume_filename:r.filename,ats_score:r.ats_score||j.ats_score,
          match_label:r.match_label||j.match_label,match_reason:r.match_reason||j.match_reason,
          matched_keywords:r.matched_keywords||[],missing_keywords:r.missing_keywords||[],
          ats_tips:r.ats_tips||[],status:"ready"}));
      }
    } catch(e) { setErr(e.message); }
    setGenLoad(false);
  };

  const onApply = async (jid) => {
    await apiFetch(`/api/apply/${jid}`,"POST");
    onStatus(jid,"applying");
  };

  const buildResume = async () => {
    if(!jd.trim()){ setErr("Paste a job description first."); return; }
    setRbLoad(true); setErr(""); setRbResult(null);
    try {
      const r = await apiFetch("/api/resume/generate","POST",{
        job_description:jd, job_title:rbTitle||"Role", company:rbCo||"Company" });
      if(r.error) throw new Error(r.error);
      setRbResult(r); await loadResumes();
    } catch(e) { setErr(e.message); }
    setRbLoad(false);
  };

  /* ── Filtered job list ── */
  const STATUS_PIPE = Object.keys(STATUS_CFG);
  const filtered = jobs.filter(j=>{
    if(filter==="new"         && j.status!=="new")                                    return false;
    if(filter==="ready"       && j.status!=="ready")                                  return false;
    if(filter==="manual"      && j.status!=="manual")                                 return false;
    if(filter==="submitted"   && !["submitted","applying","interviewing","offered"].includes(j.status)) return false;
    if(filter==="strong"      && j.ats_score<80)                                      return false;
    if(filter==="remote"      && j.work_type!=="Remote")                              return false;
    if(search && !`${j.title} ${j.company}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>b.ats_score-a.ats_score);

  const applied = jobs.filter(j=>["submitted","applying","interviewing","offered"].includes(j.status)).length;
  const manual  = jobs.filter(j=>j.status==="manual").length;
  const ready   = jobs.filter(j=>j.status==="ready").length;

  const NAV = [
    {id:"pipeline",  label:"Pipeline",   icon:"▶",},
    {id:"dashboard",label:"Dashboard",icon:"◈"},
    {id:"jobs",     label:"Jobs",     icon:"≡", badge:manual?"✎ "+manual:null, badgeC:C.amber},
    {id:"apply",    label:"Auto-Apply",icon:"⚡",badge:ready?ready:null, badgeC:C.vio},
    {id:"builder",  label:"Resume Builder",icon:"✎"},
    {id:"resumes",  label:"My Resumes",icon:"📄"},
    {id:"settings", label:"Settings", icon:"⚙"},
  ];

  return (
    <div style={{height:"100vh",display:"flex",overflow:"hidden"}}>
      {/* Sidebar */}
      <nav className="tf-sidebar" style={{width:200,background:C.s0,borderRight:`1px solid ${C.b0}`,
        display:"flex",flexDirection:"column",flexShrink:0,padding:"0 0 16px"}}>
        <div style={{padding:"18px 16px 14px",borderBottom:`1px solid ${C.b0}`}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:C.gold,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:15,fontWeight:900,color:"#000",boxShadow:`0 0 14px ${C.goldd}50`}}>J</div>
            <div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:17,color:C.t0}}>JobHunt</div>
              <Mono c={C.t2} s={9} style={{letterSpacing:".08em"}}>AI JOB SEARCH</Mono>
            </div>
          </div>
        </div>

        <div style={{flex:1,padding:"10px 8px 0"}}>
          {NAV.map(n=>{
            const active=page===n.id;
            return (
              <button key={n.id} onClick={()=>setPage(n.id)} style={{
                width:"100%",display:"flex",alignItems:"center",gap:9,
                padding:"8px 9px",borderRadius:7,cursor:"pointer",
                background:active?`${C.gold}12`:"transparent",
                border:`1px solid ${active?C.gold+"30":"transparent"}`,
                color:active?C.gold:C.t1,fontSize:12,fontWeight:active?600:400,
                marginBottom:2,textAlign:"left",fontFamily:"'Geist',sans-serif",
                transition:"all .12s"}}>
                <span style={{fontSize:13,width:16,textAlign:"center"}}>{n.icon}</span>
                <span style={{flex:1}}>{n.label}</span>
                {n.badge&&<span style={{background:`${n.badgeC}25`,color:n.badgeC,
                  borderRadius:9,padding:"1px 6px",fontSize:10,fontWeight:700,
                  fontFamily:"'Geist Mono',monospace"}}>{n.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* Profile pill */}
        <div style={{padding:"0 8px"}}>
          <div style={{background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,padding:"8px 10px",marginBottom:8}}>
            <div style={{color:C.t0,fontSize:11,fontWeight:600,marginBottom:2}}>{profile.name||profile.username}</div>
            <Mono c={C.t2} s={9}>{(profile.target_roles||[]).slice(0,2).join(" · ")||"No roles set"}</Mono>
          </div>
          <Btn onClick={onLogout} variant="ghost" size="sm" style={{width:"100%",justifyContent:"center"}}>Sign Out</Btn>
        </div>
      </nav>

      {/* Mobile bottom nav - hidden on desktop */}
      <div className="tf-mobile-nav" style={{
        display:"none",
        position:"fixed",bottom:0,left:0,right:0,
        background:C.s0,borderTop:`1px solid ${C.b0}`,
        padding:"6px 0 calc(6px + env(safe-area-inset-bottom))",
        zIndex:1000,justifyContent:"space-around",alignItems:"center"
      }}>
        {NAV.map(n=>{
          const active=page===n.id;
          return (
            <button key={n.id} onClick={()=>setPage(n.id)} style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              background:"none",border:"none",cursor:"pointer",
              color:active?C.gold:C.t2,padding:"4px 8px",
              fontFamily:"'Geist',sans-serif",minWidth:44
            }}>
              <span style={{fontSize:16}}>{n.icon}</span>
              <span style={{fontSize:9,fontWeight:active?700:400,
                letterSpacing:".03em"}}>{n.label.replace("Auto-","").replace(" Builder","")}</span>
              {n.badge&&<span style={{position:"absolute",top:4,
                width:14,height:14,borderRadius:"50%",
                background:n.badgeC,color:"#000",fontSize:8,fontWeight:800,
                display:"flex",alignItems:"center",justifyContent:"center"
              }}>{typeof n.badge==="number"&&n.badge>9?"9+":n.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {/* Top bar */}
        <div style={{height:48,background:C.s0,borderBottom:`1px solid ${C.b0}`,
          display:"flex",alignItems:"center",padding:"0 20px",flexShrink:0,gap:12}}>
          <div style={{fontWeight:700,fontSize:13,color:C.t0}}>
            {NAV.find(n=>n.id===page)?.label}
          </div>
          <div style={{flex:1}}/>
          {scraping&&(
            <div style={{display:"flex",alignItems:"center",gap:8,
              background:`${C.teal}10`,border:`1px solid ${C.teal}30`,
              borderRadius:6,padding:"4px 12px"}}>
              <Spin sz={11} c={C.teal}/>
              <Mono c={C.teal} s={11}>{scrapeInfo.current_source||"Scraping…"} · {scrapeInfo.found} found</Mono>
            </div>
          )}
          <div className="tf-topbar-stats" style={{display:"flex",alignItems:"center"}}>
          {[
            [jobs.length,"TOTAL",C.t0],
            [applied,"APPLIED",C.gold],
            [jobs.filter(j=>j.status==="interviewing").length,"INTERVIEW",C.teal],
            [jobs.filter(j=>j.status==="offered").length,"OFFERS",C.green],
          ].map(([v,l,c])=>(
            <div key={l} style={{textAlign:"center",padding:"0 12px",borderLeft:`1px solid ${C.b0}`}}>
              <div style={{color:c,fontFamily:"'Geist Mono',monospace",fontSize:17,fontWeight:700,lineHeight:1}}>{v}</div>
              <Mono c={C.t2} s={8} style={{letterSpacing:".1em"}}>{l}</Mono>
            </div>
          ))}
          </div>
        </div>

        {err&&<div style={{background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:0,
          padding:"8px 20px",color:C.red,fontSize:12,flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {err}
          <button onClick={()=>setErr("")} style={{background:"none",border:"none",color:C.red,cursor:"pointer"}}>✕</button>
        </div>}

        {/* Page content */}
        <div style={{flex:1,overflow:"hidden",paddingBottom:"env(safe-area-inset-bottom)"}}>

          {/* ── PIPELINE PAGE ── */}
          {page==="pipeline"&&(
            <div style={{padding:"22px 26px",overflowY:"auto",height:"100%"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
                <div>
                  <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:28,fontWeight:400,color:C.t0,marginBottom:4}}>
                    Auto Pipeline
                  </h1>
                  <p style={{color:C.t1,fontSize:13}}>
                    One click: scrape → score → generate resume → submit. Runs fully automated.
                  </p>
                </div>
                {!pipeline.running
                  ? <Btn variant="teal" onClick={async()=>{
                      try {
                        const r = await apiFetch("/api/pipeline/start","POST",{
                          ...pipeOpts,
                          roles: profile.target_roles,
                          work_preference: profile.work_preference,
                        });
                        if(r.error) { setErr(r.error); return; }
                        setPipeline(p=>({...p,running:true,phase:"starting",log:[],
                          jobs_scraped:0,jobs_new:0,jobs_eligible:0,jobs_resumed:0,
                          jobs_submitted:0,jobs_failed:0,jobs_manual:0,error:null}));
                      } catch(e){ setErr(e.message); }
                    }}>
                    ▶ Run Pipeline
                  </Btn>
                  : <Btn variant="red" onClick={async()=>{
                      await apiFetch("/api/pipeline/stop","POST");
                      setPipeline(p=>({...p,running:false,phase:"done",phase_label:"Stopped"}));
                    }}>
                    ■ Stop
                  </Btn>
                }
              </div>

              {/* Options */}
              <Card style={{padding:"16px 20px",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:12}}>Pipeline Options</div>
                <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-end"}}>
                  <div>
                    <Mono c={C.t1} s={11} style={{display:"block",marginBottom:5}}>Min ATS Score</Mono>
                    <div style={{display:"flex",gap:6}}>
                      {[50,60,65,70,75,80].map(v=>(
                        <button key={v} onClick={()=>setPipeOpts(o=>({...o,score_threshold:v}))}
                          style={{padding:"5px 10px",background:pipeOpts.score_threshold===v?C.blued:C.s1,
                            border:`1px solid ${pipeOpts.score_threshold===v?C.blue:C.b0}`,
                            borderRadius:6,color:pipeOpts.score_threshold===v?C.blue:C.t1,
                            fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Mono c={C.t1} s={11} style={{display:"block",marginBottom:5}}>Max Applications</Mono>
                    <div style={{display:"flex",gap:6}}>
                      {[10,20,30,50,100].map(v=>(
                        <button key={v} onClick={()=>setPipeOpts(o=>({...o,max_apply:v}))}
                          style={{padding:"5px 10px",background:pipeOpts.max_apply===v?C.blued:C.s1,
                            border:`1px solid ${pipeOpts.max_apply===v?C.blue:C.b0}`,
                            borderRadius:6,color:pipeOpts.max_apply===v?C.blue:C.t1,
                            fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Phase progress bar */}
              {(pipeline.running || pipeline.phase==="done") && (() => {
                const PHASES = ["scraping","scoring","filtering","resuming","submitting","done"];
                const pi = PHASES.indexOf(pipeline.phase);
                const pct = pi < 0 ? 0 : Math.round(((pi+1)/PHASES.length)*100);
                return (
                  <Card style={{padding:"16px 20px",marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <Mono c={C.t0} s={12} w={600}>{pipeline.phase_label || pipeline.phase}</Mono>
                      {pipeline.running && <Spin sz={13} c={C.teal}/>}
                      {pipeline.phase==="done" && <Mono c={C.teal} s={12}>✓ Complete</Mono>}
                    </div>
                    <div style={{height:6,background:C.b0,borderRadius:3,overflow:"hidden",marginBottom:10}}>
                      <div style={{height:"100%",width:`${pct}%`,
                        background:`linear-gradient(90deg,${C.teal},${C.blue})`,
                        borderRadius:3,transition:"width 0.5s"}}/>
                    </div>
                    {pipeline.current_job && (
                      <Mono c={C.t1} s={11} style={{display:"block",marginBottom:8}}>
                        → {pipeline.current_job}
                      </Mono>
                    )}
                    {/* Stats row */}
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      {[
                        ["Scraped",   pipeline.jobs_scraped,  C.t1],
                        ["New",       pipeline.jobs_new,      C.blue],
                        ["Eligible",  pipeline.jobs_eligible, C.amber],
                        ["Resumed",   pipeline.jobs_resumed,  C.vio],
                        ["Submitted", pipeline.jobs_submitted,C.teal],
                        ["Manual",    pipeline.jobs_manual,   C.gold],
                        ["Failed",    pipeline.jobs_failed,   C.red],
                      ].map(([l,v,c])=>(
                        <div key={l} style={{background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,
                          padding:"8px 14px",textAlign:"center",minWidth:70}}>
                          <div style={{color:c,fontFamily:"'Geist Mono',monospace",fontSize:20,fontWeight:700,lineHeight:1}}>{v}</div>
                          <Mono c={C.t2} s={9} style={{letterSpacing:".07em"}}>{l.toUpperCase()}</Mono>
                        </div>
                      ))}
                    </div>
                    {pipeline.error && (
                      <div style={{marginTop:10,background:`${C.red}10`,border:`1px solid ${C.red}30`,
                        borderRadius:6,padding:"8px 12px",color:C.red,fontSize:12}}>
                        Error: {pipeline.error}
                      </div>
                    )}
                  </Card>
                );
              })()}

              {/* Live log */}
              {pipeline.log && pipeline.log.length > 0 && (
                <Card style={{padding:"14px 16px"}}>
                  <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:10}}>
                    Live Log
                  </div>
                  <div style={{background:C.bg,borderRadius:8,padding:"12px 14px",
                    maxHeight:400,overflowY:"auto",fontFamily:"'Geist Mono',monospace"}}>
                    {[...pipeline.log].reverse().map((entry,i)=>{
                      const c = entry.level==="error"?C.red:entry.level==="warn"?C.amber:C.t1;
                      return (
                        <div key={i} style={{display:"flex",gap:10,marginBottom:4}}>
                          <Mono c={C.t3} s={10} style={{flexShrink:0}}>{entry.ts}</Mono>
                          <Mono c={c} s={11}>{entry.msg}</Mono>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* How it works */}
              {!pipeline.running && pipeline.phase !== "done" && (
                <Card style={{padding:"20px 22px",marginTop:16}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.t0,marginBottom:12}}>How the Pipeline Works</div>
                  {[
                    ["1","Scrape","Pulls all jobs posted in the last 24h from 12 sources (LinkedIn, Greenhouse, Lever, RemoteOK, and more)"],
                    ["2","Score","Runs ATS scoring on every new job against your profile — instantly filters unqualified roles"],
                    ["3","Filter","Only processes jobs above your minimum score threshold (default 65%)"],
                    ["4","Resume","Generates a tailored PDF resume for each qualifying job — Claude rewrites your bullets to match the JD"],
                    ["5","Submit","Auto-submits via the correct ATS: LinkedIn Easy Apply, Greenhouse, Lever, Ashby, Workable, SmartRecruiters, or universal form filler"],
                    ["6","Track","Every result is saved — submitted / manual / failed — visible in the Jobs page"],
                  ].map(([n,title,desc])=>(
                    <div key={n} style={{display:"flex",gap:14,marginBottom:14}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:C.blued,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,color:C.blue,fontFamily:"'Geist Mono',monospace",
                        fontSize:12,fontWeight:700}}>{n}</div>
                      <div>
                        <div style={{color:C.t0,fontWeight:700,fontSize:12,marginBottom:2}}>{title}</div>
                        <div style={{color:C.t1,fontSize:12,lineHeight:1.6}}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}


          {/* ── DASHBOARD ── */}
          {page==="dashboard"&&(
            <div style={{padding:"22px 26px",overflowY:"auto",height:"100%"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
                <div>
                  <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:28,fontWeight:400,color:C.t0,marginBottom:4}}>
                    Good hunting, {profile.name?.split(" ")[0]||profile.username} 👋
                  </h1>
                  <Mono c={C.t2} s={12}>{stats.last_scrape?`Last scraped: ${new Date(stats.last_scrape).toLocaleString()}`:"No scrape run yet"}</Mono>
                </div>
                <Btn onClick={startScrape} disabled={scraping} variant="teal">
                  {scraping?<><Spin sz={12} c={C.teald}/>Scraping 12 sources…</>:"⟳  Scrape New Jobs (24h)"}
                </Btn>
              </div>

              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:22}}>
                {[
                  {l:"Total Found",    v:stats.total||0,                          c:C.t0},
                  {l:"New",           v:stats.by_status?.new||0,                 c:C.t2},
                  {l:"Resume Ready",  v:stats.by_status?.ready||0,               c:C.blue},
                  {l:"Submitted",     v:(stats.by_status?.submitted||0)+(stats.by_status?.applying||0),c:C.gold},
                  {l:"Interviewing",  v:stats.by_status?.interviewing||0,        c:C.teal},
                  {l:"Offers",        v:stats.by_status?.offered||0,             c:C.green},
                ].map(k=>(
                  <Card key={k.l} style={{padding:"13px 15px"}}>
                    <div style={{color:k.c,fontFamily:"'Geist Mono',monospace",fontSize:26,fontWeight:700,lineHeight:1,marginBottom:5}}>{k.v}</div>
                    <Mono c={C.t2} s={9} style={{letterSpacing:".07em"}}>{k.l.toUpperCase()}</Mono>
                  </Card>
                ))}
              </div>

              {/* Source breakdown */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16,marginBottom:22}}>
                <Card style={{padding:"16px 18px"}}>
                  <Label>JOBS BY SOURCE</Label>
                  {Object.entries(stats.by_source||{}).sort((a,b)=>b[1]-a[1]).map(([src,cnt])=>{
                    const mx=Math.max(1,...Object.values(stats.by_source||{}));
                    return (
                      <div key={src} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
                        <div style={{width:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          <Mono c={C.t1} s={10}>{src}</Mono>
                        </div>
                        <div style={{flex:1,height:6,background:C.b0,borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:`${(cnt/mx)*100}%`,height:"100%",
                            background:SRC_C[src]||C.blue,borderRadius:3,transition:"width .4s"}}/>
                        </div>
                        <Mono c={C.t1} s={10} style={{width:24,textAlign:"right"}}>{cnt}</Mono>
                      </div>
                    );
                  })}
                  {!Object.keys(stats.by_source||{}).length&&(
                    <div style={{textAlign:"center",padding:"20px 0"}}>
                      <Mono c={C.t2} s={12}>Run a scrape to see results</Mono>
                    </div>
                  )}
                </Card>

                <Card style={{padding:"16px 18px"}}>
                  <Label>PIPELINE</Label>
                  {STATUS_PIPE.map(sk=>{
                    const s=STATUS_CFG[sk]; const cnt=stats.by_status?.[sk]||0;
                    return (
                      <div key={sk} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{color:s.c,width:16,textAlign:"center",fontSize:12}}>{s.i}</span>
                        <span style={{flex:1,color:C.t1,fontSize:12}}>{s.l}</span>
                        <Mono c={s.c} s={12} w={700}>{cnt}</Mono>
                      </div>
                    );
                  })}
                </Card>
              </div>

              {/* Recent high-match jobs */}
              {jobs.filter(j=>j.ats_score>=80).length>0&&(
                <div>
                  <Label>🔥 TOP MATCHES (80%+)</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
                    {jobs.filter(j=>j.ats_score>=80).slice(0,6).map(job=>(
                      <div key={job.id} onClick={()=>{setSelJob(job);setPage("jobs");}}
                        style={{background:C.s0,border:`1px solid ${C.b0}`,borderRadius:10,
                          padding:"13px 15px",cursor:"pointer",transition:"border-color .12s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.b0}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:6}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{color:C.t0,fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.title}</div>
                            <div style={{color:C.t1,fontSize:11}}>{job.company} · {job.location}</div>
                          </div>
                          <Score n={job.ats_score} size={42}/>
                        </div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <StatusPill status={job.status}/>
                          <SrcPill src={job.source}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── JOBS PAGE ── */}
          {page==="jobs"&&(
            <div style={{display:"grid",gridTemplateColumns:"310px 1fr",height:"100%",overflow:"hidden"}}>
              {/* List */}
              <div style={{borderRight:`1px solid ${C.b0}`,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
                <div style={{padding:"9px 11px",borderBottom:`1px solid ${C.b0}`,flexShrink:0}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, company…"
                    style={{width:"100%",background:C.s1,border:`1px solid ${C.b0}`,borderRadius:7,
                      padding:"7px 11px",color:C.t0,fontSize:12,outline:"none",
                      fontFamily:"'Geist',sans-serif",marginBottom:8}}
                    onFocus={e=>e.target.style.borderColor=C.gold}
                    onBlur={e=>e.target.style.borderColor=C.b0}/>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:7}}>
                    {[["all","All"],["new","New"],["manual","Manual↑"],["ready","Ready"],
                      ["submitted","Submitted"],["strong","80%+"],["remote","Remote"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setFilter(v)} style={{
                        padding:"3px 8px",background:filter===v?`${C.blue}18`:C.s0,
                        border:`1px solid ${filter===v?C.blue:C.b0}`,
                        borderRadius:4,color:filter===v?C.blue:C.t1,
                        fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <Mono c={C.t2} s={10}>{filtered.length} jobs · by ATS score</Mono>
                </div>
                <div style={{overflowY:"auto",flex:1}}>
                  {filtered.length===0&&(
                    <div style={{padding:28,textAlign:"center"}}>
                      <Mono c={C.t2} s={13}>No jobs match</Mono>
                      {jobs.length===0&&(
                        <div style={{marginTop:16}}>
                          <Btn onClick={startScrape} disabled={scraping} size="sm" variant="teal">
                            {scraping?<><Spin sz={11} c={C.teald}/>Scraping…</>:"Scrape Jobs Now"}
                          </Btn>
                        </div>
                      )}
                    </div>
                  )}
                  {filtered.map(job=>{
                    const cfg=STATUS_CFG[job.status]||STATUS_CFG.new;
                    const active=selJob?.id===job.id;
                    return (
                      <div key={job.id} onClick={()=>setSelJob(job)} style={{
                        padding:"11px 13px",cursor:"pointer",
                        borderBottom:`1px solid ${C.b0}`,
                        borderLeft:`3px solid ${active?cfg.c:"transparent"}`,
                        background:active?`${cfg.c}08`:"transparent",transition:"all .1s"}}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:6}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{color:C.t0,fontWeight:700,fontSize:12,lineHeight:1.3,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.title}</div>
                            <div style={{color:C.t1,fontSize:11}}>{job.company} · {job.location}</div>
                          </div>
                          <Score n={job.ats_score} size={40}/>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          <StatusPill status={job.status}/>
                          <SrcPill src={job.source}/>
                          {job.salary&&<Pill label={job.salary} color={C.gold} sm/>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Detail / empty */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",background:C.s1}}>
                {!selJob&&<div style={{textAlign:"center"}}>
                  <div style={{fontSize:40,opacity:.15,marginBottom:10}}>◎</div>
                  <Mono c={C.t2} s={13}>Select a job to view details</Mono>
                </div>}
              </div>
              {selJob&&<JobDrawer job={jobs.find(j=>j.id===selJob.id)||selJob}
                onClose={()=>setSelJob(null)}
                onStatus={onStatus} onGenResume={onGenResume}
                onApply={onApply} genLoading={genLoading}/>}
            </div>
          )}

          {/* ── AUTO-APPLY PAGE ── */}
          {page==="apply"&&(
            <div style={{padding:"22px 26px",overflowY:"auto",height:"100%"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
                <div>
                  <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:28,fontWeight:400,color:C.t0,marginBottom:4}}>Auto-Apply</h1>
                  <p style={{color:C.t1,fontSize:13}}>LinkedIn, Indeed, Greenhouse & Lever are submitted automatically. Others get your resume ready to upload.</p>
                </div>
                <Btn onClick={()=>apiFetch("/api/apply/batch","POST")} variant="vio"
                  disabled={ready===0} style={{flexShrink:0}}>
                  ⚡ Apply All Ready Jobs ({ready})
                </Btn>
              </div>

              {/* ── Quick Apply from URL ── */}
              <Card style={{padding:"20px 22px",marginBottom:20,border:`1px solid ${C.blued}`}}>
                <div className="tf-qa-header" style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <div style={{fontSize:20}}>🔗</div>
                  <div>
                    <div style={{color:C.t0,fontWeight:700,fontSize:13}}>Quick Apply — Paste Any Job URL</div>
                    <Mono c={C.t1} s={11}>Works for Greenhouse, Lever, Ashby, Workable, LinkedIn, and more</Mono>
                  </div>
                </div>

                <Input
                  label="Job URL"
                  value={qaUrl}
                  onChange={e=>{setQaUrl(e.target.value); setQaResult(null); setQaError("");}}
                  placeholder="https://boards.greenhouse.io/stripe/jobs/... or any job link"
                />
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                  <Input label="Job Title (optional — auto-detected)" value={qaTitle} onChange={e=>setQaTitle(e.target.value)} placeholder="Senior Data Engineer"/>
                  <Input label="Company (optional — auto-detected)" value={qaCompany} onChange={e=>setQaCompany(e.target.value)} placeholder="Stripe"/>
                </div>

                <Btn
                  disabled={!qaUrl.trim() || qaLoading}
                  onClick={async()=>{
                    setQaLoad(true); setQaResult(null); setQaError("");
                    try {
                      const r = await apiFetch("/api/apply/from-url","POST",{
                        url:     qaUrl.trim(),
                        title:   qaTitle.trim()||undefined,
                        company: qaCompany.trim()||undefined,
                      });
                      if(r.error) { setQaError(r.error); }
                      else { setQaResult(r); setQaUrl(""); setQaTitle(""); setQaCompany(""); await loadJobs(); }
                    } catch(e){ setQaError(e.message); }
                    setQaLoad(false);
                  }}
                  variant="teal"
                  style={{width:"100%",justifyContent:"center",marginTop:4}}
                >
                  {qaLoading
                    ? <><Spin sz={13}/> Fetching JD → Tailoring Resume → Submitting…</>
                    : "⚡ Apply Now"
                  }
                </Btn>

                {qaLoading&&(
                  <div style={{marginTop:14,background:C.s1,borderRadius:8,padding:"10px 14px"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                      <Spin sz={12} c={C.teal}/>
                      <Mono c={C.teal} s={11}>Running pipeline on this job…</Mono>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}>
                      {["Fetching JD","Tailoring Resume","Submitting"].map((step,i)=>(
                        <div key={step} style={{textAlign:"center",padding:"6px",
                          background:C.bg,borderRadius:6,border:`1px solid ${C.b0}`}}>
                          <Mono c={C.t2} s={10}>{step}</Mono>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qaError&&(
                  <div style={{marginTop:12,background:`${C.red}10`,border:`1px solid ${C.red}30`,
                    borderRadius:8,padding:"10px 14px",color:C.red,fontSize:12}}>
                    ✗ {qaError}
                  </div>
                )}

                {qaResult&&(
                  <div style={{marginTop:14,background:qaResult.submitted?`${C.teal}08`:`${C.amber}08`,
                    border:`1px solid ${qaResult.submitted?C.teal:C.amber}30`,borderRadius:10,padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{fontSize:22}}>{qaResult.submitted?"✅":"✎"}</span>
                      <div>
                        <div style={{color:C.t0,fontWeight:700,fontSize:13}}>
                          {qaResult.submitted
                            ? `Applied to ${qaResult.title} @ ${qaResult.company}`
                            : `Resume ready — manual submission needed`}
                        </div>
                        <Mono c={C.t1} s={11}>Platform: {qaResult.platform} · ATS: {qaResult.ats_score}% · {qaResult.match_label}</Mono>
                      </div>
                    </div>
                    {qaResult.submitted&&(
                      <Pill label="✓ Application Submitted Automatically" color={C.teal}/>
                    )}
                    {(qaResult.manual||qaResult.pre_filled)&&!qaResult.submitted&&(
                      <div>
                        <div style={{color:C.amber,fontSize:12,marginBottom:8}}>
                          {qaResult.pre_filled
                            ? "Form pre-filled in browser — check the browser window to complete submission"
                            : qaResult.reason||"This ATS requires manual completion"}
                        </div>
                        <a href={qaResult.apply_url} target="_blank" rel="noopener noreferrer">
                          <Btn variant="ghost" size="sm">↗ Open Application Form</Btn>
                        </a>
                      </div>
                    )}
                    {qaResult.resume_filename&&(
                      <div style={{marginTop:8}}>
                        <a href={`http://localhost:5050/api/resume/download/${qaResult.resume_filename}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{textDecoration:"none"}}>
                          <Pill label={`📄 ${qaResult.resume_filename}`} color={C.blue} sm/>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Platform info */}
              <div className="tf-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
                {[
                  {name:"LinkedIn",   color:"#0A66C2",auto:true},
                  {name:"Indeed",     color:"#003A9B",auto:true},
                  {name:"Greenhouse", color:"#24A148",auto:true},
                  {name:"Lever",      color:"#2196F3",auto:true},
                ].map(pl=>(
                  <Card key={pl.name} style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:pl.color}}/>
                      <span style={{color:C.t0,fontSize:12,fontWeight:600}}>{pl.name}</span>
                    </div>
                    <Pill label={pl.auto?"✓ Auto-submit":"✎ Manual"} color={pl.auto?C.green:C.amber}/>
                    <div style={{color:C.t2,fontSize:11,marginTop:6}}>
                      {jobs.filter(j=>j.apply_platform===pl.name.toLowerCase()).length} jobs
                    </div>
                  </Card>
                ))}
              </div>

              {/* Ready queue */}
              {jobs.filter(j=>j.status==="ready"&&j.resume_filename).length>0&&(
                <div style={{marginBottom:22}}>
                  <Label>⚡ READY TO AUTO-SUBMIT</Label>
                  {jobs.filter(j=>j.status==="ready"&&j.resume_filename).map(job=>(
                    <Card key={job.id} className="tf-job-card" style={{padding:"13px 15px",display:"flex",alignItems:"center",gap:13,marginBottom:8}}>
                      <Score n={job.ats_score} size={44}/>
                      <div style={{flex:1}}>
                        <div style={{color:C.t0,fontWeight:700,fontSize:13}}>{job.title}</div>
                        <div style={{color:C.t1,fontSize:12}}>{job.company} · {job.salary}</div>
                        <Mono c={C.teal} s={10}>📄 {job.resume_filename}</Mono>
                      </div>
                      <Btn onClick={()=>onApply(job.id)} variant="vio" size="sm">⚡ Apply</Btn>
                    </Card>
                  ))}
                </div>
              )}

              {/* Manual queue */}
              {jobs.filter(j=>j.status==="manual").length>0&&(
                <div style={{marginBottom:22}}>
                  <Label>✎ NEEDS MANUAL SUBMISSION</Label>
                  <div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}20`,borderRadius:8,padding:"9px 13px",marginBottom:10}}>
                    <Mono c={C.t1} s={12}>Resume ready — open link, upload it, done.</Mono>
                  </div>
                  {jobs.filter(j=>j.status==="manual").map(job=>(
                    <Card key={job.id} className="tf-job-card" style={{padding:"13px 15px",display:"flex",alignItems:"center",gap:13,marginBottom:8}}>
                      <Score n={job.ats_score} size={44}/>
                      <div style={{flex:1}}>
                        <div style={{color:C.t0,fontWeight:700,fontSize:13}}>{job.title}</div>
                        <div style={{color:C.t1,fontSize:12}}>{job.company}</div>
                        <Mono c={C.amber} s={10}>{job.manual_reason||"Manual portal"}</Mono>
                      </div>
                      <a href={job.manual_apply_url||job.url} target="_blank" rel="noopener noreferrer"
                        onClick={()=>onStatus(job.id,"submitted")}>
                        <Btn variant="ghost" size="sm">↗ Open & Apply</Btn>
                      </a>
                    </Card>
                  ))}
                </div>
              )}

              {ready===0&&jobs.filter(j=>j.status==="manual").length===0&&(
                <div style={{textAlign:"center",padding:"60px 0"}}>
                  <div style={{fontSize:48,marginBottom:14,opacity:.15}}>⚡</div>
                  <div style={{color:C.t0,fontSize:15,fontWeight:600,marginBottom:8}}>No jobs ready to apply</div>
                  <p style={{color:C.t1,fontSize:13,maxWidth:340,margin:"0 auto 20px"}}>
                    Generate resumes for your pending jobs first — Jobs page → select a job → Gen Resume.
                  </p>
                  <Btn onClick={()=>setPage("jobs")} variant="ghost">Go to Jobs →</Btn>
                </div>
              )}
            </div>
          )}

          {/* ── RESUME BUILDER ── */}
          {page==="builder"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 300px",height:"100%",overflow:"hidden"}}>
              <div style={{overflowY:"auto",padding:"22px 26px",borderRight:`1px solid ${C.b0}`}}>
                <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:26,fontWeight:400,color:C.t0,marginBottom:6}}>Resume Builder</h1>
                <p style={{color:C.t1,fontSize:13,marginBottom:22,lineHeight:1.7}}>
                  Paste any job description — we tailor your resume to match it, <strong style={{color:C.t0}}>preserving your exact format</strong> while weaving in JD keywords naturally.
                </p>

                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  <Input label="Job title" value={rbTitle} onChange={e=>setRbTitle(e.target.value)} placeholder="e.g. Staff ML Engineer"/>
                  <Input label="Company" value={rbCo} onChange={e=>setRbCo(e.target.value)} placeholder="e.g. Stripe"/>
                </div>

                <div style={{marginBottom:18}}>
                  <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:6}}>Job description <span style={{color:C.red}}>*</span></Mono>
                  <textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the full job description here…"
                    rows={10} style={{width:"100%",background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,
                      padding:"12px 14px",color:C.t0,fontSize:13,lineHeight:1.75,
                      outline:"none",resize:"vertical",fontFamily:"'Geist',sans-serif",
                      transition:"border-color .15s"}}
                    onFocus={e=>e.target.style.borderColor=C.gold}
                    onBlur={e=>e.target.style.borderColor=C.b0}/>
                </div>

                <Err msg={err}/>
                <Btn onClick={buildResume} disabled={rbLoading||!jd.trim()} style={{width:"100%",justifyContent:"center"}}>
                  {rbLoading?<><Spin sz={13}/>Tailoring resume…</>:"⚡  Generate Tailored Resume"}
                </Btn>

                {rbResult&&(
                  <div style={{background:`${C.teal}0D`,border:`1px solid ${C.teal}25`,borderRadius:10,padding:"16px 18px",marginTop:20}}>
                    <div style={{color:C.teal,fontWeight:700,fontSize:14,marginBottom:10}}>✓ Resume Generated!</div>
                    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
                      <Score n={rbResult.ats_score} size={56}/>
                      <div>
                        <div style={{color:C.t0,fontWeight:700,fontSize:13}}>{rbResult.match_label}</div>
                        <Mono c={C.t1} s={11}>{rbResult.filename}</Mono>
                        {rbResult.layout_preserved&&<Pill label="✓ Your format preserved" color={C.teal} sm/>}
                      </div>
                    </div>
                    {(rbResult.keywords_added||[]).length>0&&(
                      <div style={{marginBottom:12}}>
                        <Label>KEYWORDS WOVEN IN</Label>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {rbResult.keywords_added.map(k=><Pill key={k} label={k} color={C.teal}/>)}
                        </div>
                      </div>
                    )}
                    <a href={`${API}${rbResult.url}`} target="_blank" rel="noopener noreferrer">
                      <Btn variant="teal" size="sm">⬇ Download PDF</Btn>
                    </a>
                  </div>
                )}

                {/* ATS rules */}
                <div style={{background:C.s1,border:`1px solid ${C.b0}`,borderRadius:10,padding:"14px 16px",marginTop:22}}>
                  <Label>ATS-SAFE FORMAT RULES APPLIED</Label>
                  {["Single-column layout — parsers read left-to-right",
                    "No tables, text boxes, images, or icons",
                    "Standard headings: Summary · Skills · Experience · Education",
                    "Helvetica/Times — 100% ATS font compatibility",
                    "All facts preserved exactly — only language adapted",
                    "JD keywords woven into bullets and summary naturally",
                  ].map((r,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                      <span style={{color:C.teal,flexShrink:0}}>✓</span>
                      <span style={{color:C.t1,fontSize:12}}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume library */}
              <div style={{overflowY:"auto",padding:"22px 18px"}}>
                <div style={{fontWeight:700,fontSize:13,color:C.t0,marginBottom:14}}>
                  My Resumes <Mono c={C.t2} s={10} style={{marginLeft:6,fontWeight:400}}>{resumes.length} files</Mono>
                </div>
                {resumes.length===0&&<div style={{textAlign:"center",paddingTop:40}}>
                  <div style={{fontSize:36,opacity:.15,marginBottom:10}}>📄</div>
                  <Mono c={C.t2} s={12}>No resumes yet</Mono>
                </div>}
                {resumes.map(r=>(
                  <Card key={r.filename} style={{padding:"11px 13px",marginBottom:10}}>
                    <div style={{color:C.t0,fontSize:11,fontWeight:600,marginBottom:3,wordBreak:"break-all"}}>{r.filename}</div>
                    <div style={{display:"flex",gap:8,marginBottom:8}}>
                      <Mono c={C.t2} s={10}>{r.size_kb} KB</Mono>
                      <Mono c={C.t2} s={10}>·</Mono>
                      <Mono c={C.t2} s={10}>{new Date(r.created).toLocaleDateString()}</Mono>
                    </div>
                    <a href={`${API}${r.url}`} target="_blank" rel="noopener noreferrer" style={{display:"block"}}>
                      <Btn variant="ghost" size="sm" style={{width:"100%",justifyContent:"center"}}>⬇ Download</Btn>
                    </a>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── MY RESUMES ── */}
          {page==="resumes"&&(
            <div style={{padding:"22px 26px",overflowY:"auto",height:"100%"}}>
              <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:26,fontWeight:400,color:C.t0,marginBottom:20}}>
                My Resumes <Mono c={C.t2} s={14} style={{marginLeft:10,fontWeight:400}}>{resumes.length} files</Mono>
              </h1>
              {resumes.length===0&&<div style={{textAlign:"center",paddingTop:60}}>
                <div style={{fontSize:56,opacity:.1,marginBottom:16}}>📄</div>
                <div style={{color:C.t0,fontSize:16,fontWeight:600,marginBottom:8}}>No resumes generated yet</div>
                <p style={{color:C.t1,fontSize:13,marginBottom:20}}>Generate resumes from the Jobs page or Resume Builder.</p>
                <Btn onClick={()=>setPage("builder")}>Open Resume Builder →</Btn>
              </div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
                {resumes.map(r=>(
                  <Card key={r.filename} style={{padding:"14px 16px"}}>
                    <div style={{fontSize:32,marginBottom:10}}>📄</div>
                    <div style={{color:C.t0,fontSize:12,fontWeight:600,marginBottom:4,wordBreak:"break-word"}}>{r.filename}</div>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      <Mono c={C.t2} s={10}>{r.size_kb} KB</Mono>
                      <Mono c={C.t2} s={10}>·</Mono>
                      <Mono c={C.t2} s={10}>{new Date(r.created).toLocaleString()}</Mono>
                    </div>
                    <a href={`${API}${r.url}`} target="_blank" rel="noopener noreferrer" style={{display:"block"}}>
                      <Btn variant="teal" style={{width:"100%",justifyContent:"center"}}>⬇ Download PDF</Btn>
                    </a>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {page==="settings"&&(
            <div style={{padding:"22px 26px",overflowY:"auto",height:"100%",maxWidth:780}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:26,fontWeight:400,color:C.t0}}>Profile & Settings</h1>
                <Btn onClick={async()=>{
                  try{
                    const r = await apiFetch("/api/profile","PUT",profile);
                    if(r.error) throw new Error(r.error);
                    setProfile(sanitizeProfile(r.profile||profile));
                    setSaveMsg("✓ Saved!");
                    setTimeout(()=>setSaveMsg(""),3000);
                  } catch(e){ setErr(e.message); }
                }}>💾 Save All Changes</Btn>
              </div>
              {saveMsg&&<div style={{color:C.teal,fontSize:12,marginBottom:12,fontWeight:600}}>{saveMsg}</div>}
              <p style={{color:C.t1,fontSize:12,marginBottom:20}}>Everything here feeds resume generation, ATS scoring, and application form filling.</p>

              {/* ── CONTACT ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.b0}`,letterSpacing:".06em"}}>CONTACT INFORMATION</div>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  {[["Full Name","name"],["Email","email"],["Phone","phone"],["Location","location"],["LinkedIn URL","linkedin"],["GitHub URL","github"],["Portfolio / Website","website"],["Current Company","current_company"]].map(([l,k])=>(
                    <Input key={k} label={l} value={profile[k]||""} onChange={e=>setProfile(p=>({...p,[k]:e.target.value}))} placeholder={k==="linkedin"?"linkedin.com/in/username":k==="github"?"github.com/username":""}/>
                  ))}
                  <Input label="Years of Experience" type="number" value={profile.years_experience||""} onChange={e=>setProfile(p=>({...p,years_experience:parseInt(e.target.value)||0}))}/>
                  <Input label="Professional Title" value={profile.title||""} onChange={e=>setProfile(p=>({...p,title:e.target.value}))} placeholder="Senior Data Engineer"/>
                </div>
                <TagInput label="Target Roles" value={profile.target_roles||[]} onChange={v=>setProfile(p=>({...p,target_roles:v}))} placeholder="Add role and press Enter"/>
                <div style={{marginBottom:12}}>
                  <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Work Preference</Mono>
                  <div style={{display:"flex",gap:6}}>
                    {["Remote","Hybrid","On-site","Any"].map(w=>(
                      <button key={w} onClick={()=>setProfile(p=>({...p,work_preference:w}))} style={{
                        flex:1,padding:"7px 0",background:profile.work_preference===w?C.blued:C.s1,
                        border:`1px solid ${profile.work_preference===w?C.blue:C.b0}`,
                        borderRadius:7,color:profile.work_preference===w?C.blue:C.t1,
                        fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>{w}</button>
                    ))}
                  </div>
                </div>
                <Input label="Professional Summary (for resume)" value={profile.summary||""} onChange={e=>setProfile(p=>({...p,summary:e.target.value}))} rows={4} placeholder="Data Engineer with X years…"/>
              </Card>

              {/* ── APPLICATION QUESTIONS ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:4,paddingBottom:8,borderBottom:`1px solid ${C.b0}`,letterSpacing:".06em"}}>APPLICATION QUESTIONS</div>
                <p style={{color:C.t1,fontSize:11,marginBottom:16,lineHeight:1.7}}>
                  Every field here is pre-filled automatically on job applications. The more complete this is, the higher your auto-submit success rate.
                </p>

                {/* Contact & Address */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginBottom:8,letterSpacing:".05em"}}>📍 ADDRESS (used for location fields on forms)</Mono>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  <Input label="Street Address" value={profile.address_line1||""} onChange={e=>setProfile(p=>({...p,address_line1:e.target.value}))} placeholder="123 Main St"/>
                  <Input label="City" value={profile.address_city||""} onChange={e=>setProfile(p=>({...p,address_city:e.target.value}))} placeholder="Reston"/>
                  <Input label="State" value={profile.address_state||""} onChange={e=>setProfile(p=>({...p,address_state:e.target.value}))} placeholder="VA"/>
                  <Input label="Zip Code" value={profile.address_zip||""} onChange={e=>setProfile(p=>({...p,address_zip:e.target.value}))} placeholder="20191"/>
                  <Input label="Country" value={profile.address_country||"United States"} onChange={e=>setProfile(p=>({...p,address_country:e.target.value}))} placeholder="United States"/>
                  <Input label="Middle Name (optional)" value={profile.middle_name||""} onChange={e=>setProfile(p=>({...p,middle_name:e.target.value}))} placeholder="Lee"/>
                </div>

                {/* Work Authorization */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginTop:14,marginBottom:8,letterSpacing:".05em"}}>🛂 WORK AUTHORIZATION</Mono>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  <div style={{marginBottom:14}}>
                    <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Authorized to work in US?</Mono>
                    <div style={{display:"flex",gap:6}}>
                      {["Yes","No"].map(v=>(
                        <button key={v} onClick={()=>setProfile(p=>({...p,work_authorized:v}))} style={{
                          flex:1,padding:"7px 0",background:profile.work_authorized===v?C.blued:C.s1,
                          border:`1px solid ${profile.work_authorized===v?C.blue:C.b0}`,
                          borderRadius:7,color:profile.work_authorized===v?C.blue:C.t1,
                          fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Require Visa Sponsorship?</Mono>
                    <div style={{display:"flex",gap:6}}>
                      {["Yes","No"].map(v=>(
                        <button key={v} onClick={()=>setProfile(p=>({...p,requires_sponsorship:v}))} style={{
                          flex:1,padding:"7px 0",background:profile.requires_sponsorship===v?C.blued:C.s1,
                          border:`1px solid ${profile.requires_sponsorship===v?C.blue:C.b0}`,
                          borderRadius:7,color:profile.requires_sponsorship===v?C.blue:C.t1,
                          fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Citizenship Status</Mono>
                    <select value={profile.citizenship_status||"U.S. Citizen"} onChange={e=>setProfile(p=>({...p,citizenship_status:e.target.value}))}
                      style={{width:"100%",background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,padding:"8px 12px",color:C.t0,fontSize:12,outline:"none",fontFamily:"'Geist',sans-serif"}}>
                      {["U.S. Citizen","U.S. Permanent Resident","H-1B Visa","H-4 EAD","OPT/STEM OPT","F-1 Visa","L-1 Visa","TN Visa","Other Work Visa","Need Sponsorship"].map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <Input label="Visa Type (if applicable)" value={profile.visa_type||""} onChange={e=>setProfile(p=>({...p,visa_type:e.target.value}))} placeholder="H-1B, OPT, etc."/>
                </div>

                {/* Compensation */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginTop:14,marginBottom:8,letterSpacing:".05em"}}>💰 COMPENSATION & LOGISTICS</Mono>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  <Input label="Expected Salary (e.g. $130,000)" value={profile.salary_expectation||""} onChange={e=>setProfile(p=>({...p,salary_expectation:e.target.value}))} placeholder="$130,000"/>
                  <Input label="Employment Type" value={profile.employment_type||"Full-time"} onChange={e=>setProfile(p=>({...p,employment_type:e.target.value}))} placeholder="Full-time"/>
                  <Input label="Available Start Date" value={profile.start_date||""} onChange={e=>setProfile(p=>({...p,start_date:e.target.value}))} placeholder="2 weeks"/>
                  <Input label="Notice Period" value={profile.notice_period||""} onChange={e=>setProfile(p=>({...p,notice_period:e.target.value}))} placeholder="2 weeks"/>
                  <div style={{marginBottom:14}}>
                    <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Willing to Relocate?</Mono>
                    <div style={{display:"flex",gap:6}}>
                      {["Yes","No","Maybe"].map(v=>(
                        <button key={v} onClick={()=>setProfile(p=>({...p,willing_to_relocate:v}))} style={{
                          flex:1,padding:"7px 0",background:profile.willing_to_relocate===v?C.blued:C.s1,
                          border:`1px solid ${profile.willing_to_relocate===v?C.blue:C.b0}`,
                          borderRadius:7,color:profile.willing_to_relocate===v?C.blue:C.t1,
                          fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Remote Preference</Mono>
                    <select value={profile.remote_preference||"Open to both"} onChange={e=>setProfile(p=>({...p,remote_preference:e.target.value}))}
                      style={{width:"100%",background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,padding:"8px 12px",color:C.t0,fontSize:12,outline:"none",fontFamily:"'Geist',sans-serif"}}>
                      {["Remote only","Hybrid","On-site only","Open to both"].map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Education */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginTop:14,marginBottom:8,letterSpacing:".05em"}}>🎓 EDUCATION (for application dropdowns)</Mono>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  <div style={{marginBottom:14}}>
                    <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>Highest Degree</Mono>
                    <select value={profile.highest_degree||"Master's Degree"} onChange={e=>setProfile(p=>({...p,highest_degree:e.target.value}))}
                      style={{width:"100%",background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,padding:"8px 12px",color:C.t0,fontSize:12,outline:"none",fontFamily:"'Geist',sans-serif"}}>
                      {["High School / GED","Associate's Degree","Bachelor's Degree","Master's Degree","MBA","PhD / Doctorate","Professional Degree (JD/MD)","Other"].map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <Input label="Major / Field of Study" value={profile.degree_major||""} onChange={e=>setProfile(p=>({...p,degree_major:e.target.value}))} placeholder="Data Engineering, Computer Science"/>
                  <Input label="Graduation Year" value={profile.graduation_year||""} onChange={e=>setProfile(p=>({...p,graduation_year:e.target.value}))} placeholder="2024"/>
                  <Input label="Portfolio / Personal Site URL" value={profile.portfolio_url||""} onChange={e=>setProfile(p=>({...p,portfolio_url:e.target.value}))} placeholder="https://yoursite.com"/>
                </div>

                {/* EEO */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginTop:14,marginBottom:8,letterSpacing:".05em"}}>📋 EEO / DEMOGRAPHIC (voluntary)</Mono>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  {[
                    ["Veteran Status","veteran_status",["I am not a veteran","I am a veteran","I am a disabled veteran","Prefer not to say"]],
                    ["Disability Status","disability_status",["I do not have a disability","I have a disability","Prefer not to say"]],
                    ["Gender","gender",["Prefer not to say","Male","Female","Non-binary","Agender","Other"]],
                    ["Race / Ethnicity","race_ethnicity",["Prefer not to say","Hispanic or Latino","White (Not Hispanic or Latino)","Black or African American","Asian","Native Hawaiian or Pacific Islander","American Indian or Alaska Native","Two or more races"]],
                  ].map(([label, key, options])=>(
                    <div key={key} style={{marginBottom:14}}>
                      <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>{label}</Mono>
                      <select value={profile[key]||options[0]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}
                        style={{width:"100%",background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,padding:"8px 12px",color:C.t0,fontSize:12,outline:"none",fontFamily:"'Geist',sans-serif"}}>
                        {options.map(v=><option key={v}>{v}</option>)}
                      </select>
                    </div>
                  ))}
                  <Input label="Pronouns (optional)" value={profile.pronouns||""} onChange={e=>setProfile(p=>({...p,pronouns:e.target.value}))} placeholder="they/them, she/her, he/him"/>
                  <Input label="How did you hear about us?" value={profile.referral_source||""} onChange={e=>setProfile(p=>({...p,referral_source:e.target.value}))} placeholder="LinkedIn"/>
                </div>

                {/* Background */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginTop:14,marginBottom:8,letterSpacing:".05em"}}>✅ BACKGROUND & COMPLIANCE</Mono>
                <div className="tf-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                  {[["Willing to do background check?","willing_background_check"],["Willing to do drug test?","willing_drug_test"]].map(([lbl,key])=>(
                    <div key={key} style={{marginBottom:14}}>
                      <Mono c={C.t0} s={12} w={600} style={{display:"block",marginBottom:8}}>{lbl}</Mono>
                      <div style={{display:"flex",gap:6}}>
                        {["Yes","No"].map(v=>(
                          <button key={v} onClick={()=>setProfile(p=>({...p,[key]:v}))} style={{
                            flex:1,padding:"7px 0",background:(profile[key]||"Yes")===v?C.blued:C.s1,
                            border:`1px solid ${(profile[key]||"Yes")===v?C.blue:C.b0}`,
                            borderRadius:7,color:(profile[key]||"Yes")===v?C.blue:C.t1,
                            fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Geist',sans-serif"}}>{v}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cover letter default */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginTop:14,marginBottom:8,letterSpacing:".05em"}}>✉️ DEFAULT COVER LETTER (used when AI isn't available)</Mono>
                <Input label="Cover letter text" value={profile.cover_letter_default||""} onChange={e=>setProfile(p=>({...p,cover_letter_default:e.target.value}))} rows={5}
                  placeholder="Dear Hiring Team,&#10;&#10;I am excited to apply for this role..."/>

                {/* Custom Q&A */}
                <Mono c={C.gold} s={11} w={700} style={{display:"block",marginTop:16,marginBottom:4,letterSpacing:".05em"}}>🤖 CUSTOM Q&A — catch-all for unusual questions</Mono>
                <p style={{color:C.t2,fontSize:11,marginBottom:10,lineHeight:1.6}}>
                  Add answers to unusual questions that appear on specific company forms. The autofill engine checks these first.
                </p>
                {(profile.custom_answers||[]).map((qa,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 32px",gap:"0 8px",marginBottom:8,alignItems:"end"}}>
                    <Input label={i===0?"Question text":""} value={qa.question||""} onChange={e=>setProfile(p=>({...p,custom_answers:(p.custom_answers||[]).map((x,j)=>j===i?{...x,question:e.target.value}:x)}))} placeholder="e.g. Why do you want to work here?"/>
                    <Input label={i===0?"Your answer":""} value={qa.answer||""} onChange={e=>setProfile(p=>({...p,custom_answers:(p.custom_answers||[]).map((x,j)=>j===i?{...x,answer:e.target.value}:x)}))} placeholder="e.g. I'm passionate about…"/>
                    <button onClick={()=>setProfile(p=>({...p,custom_answers:(p.custom_answers||[]).filter((_,j)=>j!==i)}))}
                      style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,paddingBottom:14}}>×</button>
                  </div>
                ))}
                <Btn size="sm" variant="ghost" onClick={()=>setProfile(p=>({...p,custom_answers:[...(p.custom_answers||[]),{question:"",answer:""}]}))}>+ Add Custom Answer</Btn>
              </Card>

              {/* ── EXPERIENCE ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.b0}`}}>
                  <div style={{fontWeight:700,fontSize:12,color:C.t0,letterSpacing:".06em"}}>WORK EXPERIENCE</div>
                  <Btn size="sm" variant="ghost" onClick={()=>setProfile(p=>({...p,experience:[...(p.experience||[]),{title:"",company:"",location:"",dates:"",bullets:[""]}]}))}>+ Add Job</Btn>
                </div>
                {!(profile.experience||[]).length&&<div style={{textAlign:"center",padding:"16px 0",color:C.t2,fontSize:12}}>No experience yet — add jobs or upload your resume below.</div>}
                {(profile.experience||[]).map((exp,ei)=>(
                  <div key={ei} style={{background:C.bg,border:`1px solid ${C.b0}`,borderRadius:9,padding:"13px 15px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{color:C.gold,fontSize:11,fontWeight:700,fontFamily:"'Geist Mono',monospace"}}>{exp.company||"Company"} — {exp.title||"Title"}</span>
                      <button onClick={()=>setProfile(p=>({...p,experience:(p.experience||[]).filter((_,i)=>i!==ei)}))}
                        style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,lineHeight:1,padding:0}}>×</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                      <Input label="Job Title" value={exp.title||""} onChange={e=>setProfile(p=>({...p,experience:(p.experience||[]).map((x,i)=>i===ei?{...x,title:e.target.value}:x)}))}/>
                      <Input label="Company" value={exp.company||""} onChange={e=>setProfile(p=>({...p,experience:(p.experience||[]).map((x,i)=>i===ei?{...x,company:e.target.value}:x)}))}/>
                      <Input label="Location" value={exp.location||""} onChange={e=>setProfile(p=>({...p,experience:(p.experience||[]).map((x,i)=>i===ei?{...x,location:e.target.value}:x)}))} placeholder="City, ST or Remote"/>
                      <Input label="Dates" value={exp.dates||""} onChange={e=>setProfile(p=>({...p,experience:(p.experience||[]).map((x,i)=>i===ei?{...x,dates:e.target.value}:x)}))} placeholder="Jan 2022 – Present"/>
                    </div>
                    <div style={{marginBottom:4}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                        <Mono c={C.t1} s={11} w={600}>Bullet Points</Mono>
                        <button onClick={()=>setProfile(p=>({...p,experience:(p.experience||[]).map((x,i)=>i===ei?{...x,bullets:[...(x.bullets||[]),""]}:x)}))}
                          style={{background:"none",border:`1px solid ${C.b0}`,borderRadius:5,color:C.teal,cursor:"pointer",fontSize:11,padding:"2px 9px",fontFamily:"'Geist',sans-serif"}}>+ bullet</button>
                      </div>
                      {(exp.bullets||[""]).map((b,bi)=>(
                        <div key={bi} style={{display:"flex",gap:6,marginBottom:5,alignItems:"flex-start"}}>
                          <span style={{color:C.t3,fontSize:12,paddingTop:7,flexShrink:0}}>•</span>
                          <textarea value={b} onChange={e=>setProfile(p=>({...p,experience:(p.experience||[]).map((x,i)=>i===ei?{...x,bullets:(x.bullets||[]).map((bb,bj)=>bj===bi?e.target.value:bb)}:x)}))}
                            rows={2} placeholder="Accomplished [X] by doing [Y], resulting in [Z% improvement]"
                            style={{flex:1,background:C.s1,border:`1px solid ${C.b0}`,borderRadius:6,padding:"6px 9px",
                              color:C.t0,fontSize:11,lineHeight:1.6,resize:"vertical",outline:"none",fontFamily:"'Geist',sans-serif"}}
                            onFocus={e=>e.target.style.borderColor=C.gold}
                            onBlur={e=>e.target.style.borderColor=C.b0}/>
                          {(exp.bullets||[]).length > 1 &&
                            <button onClick={()=>setProfile(p=>({...p,experience:(p.experience||[]).map((x,i)=>i===ei?{...x,bullets:(x.bullets||[]).filter((_,bj)=>bj!==bi)}:x)}))}
                              style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:15,paddingTop:6,flexShrink:0}}>×</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>

              {/* ── PROJECTS ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.b0}`}}>
                  <div style={{fontWeight:700,fontSize:12,color:C.t0,letterSpacing:".06em"}}>PROJECTS</div>
                  <Btn size="sm" variant="ghost" onClick={()=>setProfile(p=>({...p,projects:[...(p.projects||[]),{name:"",technologies:"",dates:"",url:"",bullets:[""]}]}))}>+ Add Project</Btn>
                </div>
                {!(profile.projects||[]).length&&<div style={{textAlign:"center",padding:"12px 0",color:C.t2,fontSize:12}}>No projects yet.</div>}
                {(profile.projects||[]).map((proj,pi)=>(
                  <div key={pi} style={{background:C.bg,border:`1px solid ${C.b0}`,borderRadius:9,padding:"13px 15px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{color:C.vio,fontSize:11,fontWeight:700,fontFamily:"'Geist Mono',monospace"}}>{proj.name||"New Project"}</span>
                      <button onClick={()=>setProfile(p=>({...p,projects:(p.projects||[]).filter((_,i)=>i!==pi)}))}
                        style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,padding:0}}>×</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                      <Input label="Project Name" value={proj.name||""} onChange={e=>setProfile(p=>({...p,projects:(p.projects||[]).map((x,i)=>i===pi?{...x,name:e.target.value}:x)}))}/>
                      <Input label="Technologies" value={proj.technologies||""} onChange={e=>setProfile(p=>({...p,projects:(p.projects||[]).map((x,i)=>i===pi?{...x,technologies:e.target.value}:x)}))} placeholder="Python, AWS, React"/>
                      <Input label="Dates (optional)" value={proj.dates||""} onChange={e=>setProfile(p=>({...p,projects:(p.projects||[]).map((x,i)=>i===pi?{...x,dates:e.target.value}:x)}))} placeholder="Jan 2024"/>
                      <Input label="GitHub / Demo URL" value={proj.url||""} onChange={e=>setProfile(p=>({...p,projects:(p.projects||[]).map((x,i)=>i===pi?{...x,url:e.target.value}:x)}))} placeholder="github.com/user/project"/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                      <Mono c={C.t1} s={11} w={600}>Bullets</Mono>
                      <button onClick={()=>setProfile(p=>({...p,projects:(p.projects||[]).map((x,i)=>i===pi?{...x,bullets:[...(x.bullets||[]),""]}:x)}))}
                        style={{background:"none",border:`1px solid ${C.b0}`,borderRadius:5,color:C.teal,cursor:"pointer",fontSize:11,padding:"2px 9px",fontFamily:"'Geist',sans-serif"}}>+ bullet</button>
                    </div>
                    {(proj.bullets||[""]).map((b,bi)=>(
                      <div key={bi} style={{display:"flex",gap:6,marginBottom:5,alignItems:"flex-start"}}>
                        <span style={{color:C.t3,fontSize:12,paddingTop:7,flexShrink:0}}>•</span>
                        <textarea value={b} onChange={e=>setProfile(p=>({...p,projects:(p.projects||[]).map((x,i)=>i===pi?{...x,bullets:(x.bullets||[]).map((bb,bj)=>bj===bi?e.target.value:bb)}:x)}))}
                          rows={2} style={{flex:1,background:C.s1,border:`1px solid ${C.b0}`,borderRadius:6,padding:"6px 9px",
                            color:C.t0,fontSize:11,lineHeight:1.6,resize:"vertical",outline:"none",fontFamily:"'Geist',sans-serif"}}
                          onFocus={e=>e.target.style.borderColor=C.gold}
                          onBlur={e=>e.target.style.borderColor=C.b0}/>
                      </div>
                    ))}
                  </div>
                ))}
              </Card>

              {/* ── EDUCATION ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.b0}`}}>
                  <div style={{fontWeight:700,fontSize:12,color:C.t0,letterSpacing:".06em"}}>EDUCATION</div>
                  <Btn size="sm" variant="ghost" onClick={()=>setProfile(p=>({...p,education:[...(p.education||[]),{degree:"",school:"",location:"",dates:"",gpa:"",honors:""}]}))}>+ Add Degree</Btn>
                </div>
                {!(profile.education||[]).length&&<div style={{textAlign:"center",padding:"12px 0",color:C.t2,fontSize:12}}>No education added yet.</div>}
                {(profile.education||[]).map((edu,ei)=>(
                  <div key={ei} style={{background:C.bg,border:`1px solid ${C.b0}`,borderRadius:9,padding:"13px 15px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{color:C.teal,fontSize:11,fontWeight:700,fontFamily:"'Geist Mono',monospace"}}>{edu.school||"School"}</span>
                      <button onClick={()=>setProfile(p=>({...p,education:(p.education||[]).filter((_,i)=>i!==ei)}))}
                        style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,padding:0}}>×</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                      <Input label="Degree" value={edu.degree||""} onChange={e=>setProfile(p=>({...p,education:(p.education||[]).map((x,i)=>i===ei?{...x,degree:e.target.value}:x)}))} placeholder="M.S. Computer Science"/>
                      <Input label="School" value={edu.school||""} onChange={e=>setProfile(p=>({...p,education:(p.education||[]).map((x,i)=>i===ei?{...x,school:e.target.value}:x)}))}/>
                      <Input label="Location" value={edu.location||""} onChange={e=>setProfile(p=>({...p,education:(p.education||[]).map((x,i)=>i===ei?{...x,location:e.target.value}:x)}))}/>
                      <Input label="Dates" value={edu.dates||""} onChange={e=>setProfile(p=>({...p,education:(p.education||[]).map((x,i)=>i===ei?{...x,dates:e.target.value}:x)}))} placeholder="Aug 2020 – May 2022"/>
                      <Input label="GPA (optional)" value={edu.gpa||""} onChange={e=>setProfile(p=>({...p,education:(p.education||[]).map((x,i)=>i===ei?{...x,gpa:e.target.value}:x)}))}/>
                      <Input label="Honors / Awards" value={edu.honors||""} onChange={e=>setProfile(p=>({...p,education:(p.education||[]).map((x,i)=>i===ei?{...x,honors:e.target.value}:x)}))} placeholder="Magna Cum Laude"/>
                    </div>
                  </div>
                ))}
              </Card>

              {/* ── SKILLS ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.b0}`,letterSpacing:".06em"}}>TECHNICAL SKILLS</div>
                <TagInput label="Programming Languages" value={profile.skills||[]} onChange={v=>setProfile(p=>({...p,skills:v}))} placeholder="Python, SQL, Java… (press Enter)"/>
                <TagInput label="ML / AI / Frameworks" value={profile.ml_skills||[]} onChange={v=>setProfile(p=>({...p,ml_skills:v}))} placeholder="PySpark, PyTorch, dbt…"/>
                <TagInput label="Tools & Platforms" value={profile.tools||[]} onChange={v=>setProfile(p=>({...p,tools:v}))} placeholder="AWS, Docker, Kubernetes…"/>
                <TagInput label="Certifications" value={profile.certifications||[]} onChange={v=>setProfile(p=>({...p,certifications:v.map(x=>typeof x==="object"?[x.name,x.issuer,x.date].filter(Boolean).join(", "):String(x))}))} placeholder="AWS Solutions Architect…"/>
                <TagInput label="Awards & Honors" value={profile.awards||[]} onChange={v=>setProfile(p=>({...p,awards:v}))}/>
              </Card>

              {/* ── UPLOAD RESUME ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.b0}`,letterSpacing:".06em"}}>UPLOAD RESUME TO AUTO-FILL PROFILE</div>
                <p style={{color:C.t1,fontSize:12,lineHeight:1.7,marginBottom:12}}>
                  Upload your existing resume to extract all data automatically.
                  <strong style={{color:C.gold}}> Set ANTHROPIC_API_KEY for full AI extraction.</strong>
                </p>
                <label style={{display:"block",cursor:"pointer"}}>
                  <input type="file" accept=".pdf,.docx,.txt" style={{display:"none"}}
                    onChange={async e=>{
                      const f=e.target.files[0]; if(!f) return;
                      const fd=new FormData(); fd.append("file",f);
                      try{
                        const r=await apiUpload("/api/profile/upload-resume",fd);
                        if(r.ok){ const prof=await apiFetch("/api/profile"); setProfile(sanitizeProfile(prof)); setSaveMsg("✓ Resume extracted!"); setTimeout(()=>setSaveMsg(""),4000); }
                        else setErr(r.error||"Upload failed");
                      }catch(ex){setErr(ex.message);}
                    }}/>
                  <div style={{background:C.s1,border:`2px dashed ${C.b1}`,borderRadius:10,padding:"18px",textAlign:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.b1}>
                    <div style={{fontSize:24,marginBottom:6}}>📄</div>
                    <div style={{color:C.t0,fontSize:12,fontWeight:600}}>Click to upload PDF, DOCX, or TXT</div>
                    <Mono c={C.t2} s={10} style={{display:"block",marginTop:3}}>Will extract experience, skills, education, projects</Mono>
                  </div>
                </label>
              </Card>

              {/* ── SAVE ── */}
              <div style={{marginBottom:20}}>
                <Btn onClick={async()=>{
                  try{
                    const r=await apiFetch("/api/profile","PUT",profile);
                    if(r.error) throw new Error(r.error);
                    setProfile(sanitizeProfile(r.profile||profile));
                    setSaveMsg("✓ All changes saved!");
                    setTimeout(()=>setSaveMsg(""),3000);
                    setErr("");
                  }catch(e){setErr(e.message);}
                }} style={{width:"100%",justifyContent:"center",padding:"12px"}}>💾 Save All Changes</Btn>
                {saveMsg&&<div style={{color:C.teal,fontSize:12,marginTop:8,textAlign:"center",fontWeight:600}}>{saveMsg}</div>}
                <Err msg={err}/>
              </div>

              {/* ── LINKEDIN SESSION ── */}
              <Card style={{padding:"18px 20px",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:8,letterSpacing:".06em"}}>LINKEDIN SESSION SETUP</div>
                <p style={{color:C.t1,fontSize:12,lineHeight:1.7,marginBottom:10}}>Run this once to save your LinkedIn session cookie. Works with any login method (Google SSO, 2FA, password).</p>
                <div style={{background:C.bg,border:`1px solid ${C.b0}`,borderRadius:8,padding:"11px 14px",fontFamily:"'Geist Mono',monospace",fontSize:12,color:C.teal}}>
                  python backend/auto_apply.py --save-session
                </div>
              </Card>

              {/* ── ENV VARS ── */}
              <Card style={{padding:"18px 20px"}}>
                <div style={{fontWeight:700,fontSize:12,color:C.t0,marginBottom:10,letterSpacing:".06em"}}>ENVIRONMENT VARIABLES (.env)</div>
                {[
                  ["ANTHROPIC_API_KEY","sk-ant-…","Required for AI resume tailoring"],
                  ["LINKEDIN_EMAIL","you@email.com","For password-based LinkedIn login"],
                  ["LINKEDIN_PASSWORD","••••","For password-based LinkedIn login"],
                  ["INDEED_EMAIL","you@email.com","For Indeed auto-apply"],
                  ["INDEED_PASSWORD","••••","For Indeed auto-apply"],
                ].map(([k,ex,desc])=>(
                  <div key={k} style={{background:C.s1,border:`1px solid ${C.b0}`,borderRadius:8,padding:"9px 13px",marginBottom:7}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:C.gold,fontFamily:"'Geist Mono',monospace",fontSize:11,fontWeight:700}}>{k}</span>
                      <span style={{color:C.t3,fontFamily:"'Geist Mono',monospace",fontSize:10}}>{ex}</span>
                    </div>
                    <div style={{color:C.t2,fontSize:11,marginTop:3}}>{desc}</div>
                  </div>
                ))}
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [authState, setAuth] = useState({ checking:true, loggedIn:false, profile:null, profilesExist:true });

  useEffect(() => {
    apiFetch("/api/auth/status")
      .then(r => setAuth({ checking:false, loggedIn:r.logged_in, profile:r.profile||null, profilesExist:r.profiles_exist }))
      .catch(()=> setAuth({ checking:false, loggedIn:false, profile:null, profilesExist:false }));
  },[]);

  const onAuth   = (p) => setAuth({ checking:false, loggedIn:true, profile:p, profilesExist:true });
  const onLogout = async () => {
    await apiFetch("/api/auth/logout","POST").catch(()=>{});
    setAuth({ checking:false, loggedIn:false, profile:null, profilesExist:true });
  };

  return (
    <>
      <style>{css}</style>
      {authState.checking
        ? <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
            <Spin sz={28}/>
          </div>
        : authState.loggedIn && authState.profile
          ? <MainApp profile={authState.profile} onLogout={onLogout}/>
          : <AuthPage profilesExist={authState.profilesExist} onAuth={onAuth}/>
      }
    </>
  );
}
