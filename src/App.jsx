import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Brain,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Users,
  Sun,
  Moon,
  Coffee,
  CheckSquare,
  MessageSquare,
  Shield,
  Dumbbell,
  ChevronRight,
  Sparkles
} from 'lucide-react';

// --- AURA PERSONAS & THEMES ---
const AURA_MODES = {
  diary: {
    id: 'diary',
    name: 'Guardian',
    c1: '#4338CA', // Indigo
    c2: '#8B5CF6', // Violet
    speed: 0.15, // Introspective, calm
    intent: "I've gathered my observations from today. You seem to be in a reflective state."
  },
  flow: {
    id: 'flow',
    name: 'Operator',
    c1: '#0D9488', // Teal
    c2: '#3B82F6', // Electric Blue
    speed: 0.4, // Focus, clarity, faster
    intent: "I've restructured your afternoon to protect your deep work block."
  },
  mind: {
    id: 'mind',
    name: 'Healer',
    c1: '#059669', // Emerald
    c2: '#6EE7B7', // Soft Mint
    speed: 0.1, // Refreshing, slow, healing
    intent: "Your stress markers are slightly elevated. Let's look at your core focus areas."
  },
  crew: {
    id: 'crew',
    name: 'Producer',
    c1: '#D946EF', // Magenta
    c2: '#F59E0B', // Amber
    speed: 0.35, // Playful, energetic
    intent: "Your sub-agents are actively managing your digital footprint in the background."
  }
};

// --- SHADERS FOR 3D ORB ---
const snoise3D = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
`;

const vertexShader = `
  ${snoise3D}
  uniform float uTime;
  uniform float uSpeed;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vViewPosition;
  void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      float noiseVal = snoise(position * uNoiseDensity + uTime * uSpeed);
      vec3 displacedPosition = position + normal * noiseVal * uNoiseStrength;
      vPos = displacedPosition;
      vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
  }
`;

const innerFragmentShader = `
  ${snoise3D}
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
      float n1 = snoise(vPos * 1.5 + uTime * 0.15);
      vec3 warp = vPos * 2.0 + vec3(snoise(vPos * 2.0 + uTime * 0.2), snoise(vPos * 2.0 - uTime * 0.3), snoise(vPos * 2.0 + uTime * 0.1));
      float n2 = snoise(warp * 1.5 - uTime * 0.4);
      float veins = smoothstep(0.4, 0.95, 1.0 - abs(n2)); 
      float microVeins = smoothstep(0.7, 1.0, (1.0 - abs(snoise(warp * 4.0 + uTime * 0.6))) * 0.5);
      veins += microVeins;
      vec3 mixColor = mix(uColor1, uColor2, n1 * 0.5 + 0.5);
      vec3 finalColor = vec3(0.05, 0.05, 0.1); 
      finalColor += mixColor * veins * 4.0; 
      finalColor += mixColor * pow(1.0 - abs(n1), 3.0) * 0.5;
      float fresnel = clamp(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
      finalColor += uColor1 * pow(fresnel, 3.0) * 1.5;
      gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const outerFragmentShader = `
  ${snoise3D}
  uniform float uTime;
  uniform vec3 uGlassColor1;
  uniform vec3 uGlassColor2;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vPos;
  void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnelTerm = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
      float fPow = pow(fresnelTerm, 3.0);
      float fRim = pow(fresnelTerm, 5.0);
      float surfaceNoise = snoise(vPos * 3.0 + uTime * 0.2) * 0.5 + 0.5;
      vec3 glassColor = mix(uGlassColor1, uGlassColor2, surfaceNoise);
      vec3 finalColor = glassColor * fPow * 1.5; 
      finalColor += vec3(1.0, 1.0, 1.0) * fRim * 3.0; 
      float alpha = fPow * 0.8 + fRim * 0.8;
      gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- STYLES & ANIMATIONS ---
const customStyles = `
  @keyframes breathe-slow {
    0%, 100% { transform: scale(1) translate(0px, 0px) rotate(0deg); opacity: 0.5; }
    33% { transform: scale(1.1) translate(30px, -20px) rotate(5deg); opacity: 0.7; }
    66% { transform: scale(0.9) translate(-20px, 30px) rotate(-5deg); opacity: 0.6; }
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255,255,255,0.5);
  }
  
  .glass-dark {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255,255,255,0.05);
    color: white;
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scroll-mask {
    mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 100%);
  }
`;

export default function AuraMultiPersonaApp() {
  const [activeTab, setActiveTab] = useState('diary');
  const [showInnerVoice, setShowInnerVoice] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);
  const [shadowRevealed, setShadowRevealed] = useState(false);

  const [isThreeLoaded, setIsThreeLoaded] = useState(false);
  const containerRef = useRef(null);
  const uniformsRef = useRef(null);

  const mode = AURA_MODES[activeTab];
  const tClass = "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";

  // Dynamic Three.js Loading - Robust implementation
  useEffect(() => {
    if (window.THREE) {
      setIsThreeLoaded(true);
      return;
    }
    const existingScript = document.getElementById('three-js-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsThreeLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'three-js-script';
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => setIsThreeLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize 3D Scene
  useEffect(() => {
    if (!isThreeLoaded || !containerRef.current) return;

    const THREE = window.THREE;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Clear any previous canvas (HMR safe)
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 128, 128);

    uniformsRef.current = {
      inner: {
        uTime: { value: 0 }, uSpeed: { value: mode.speed }, uNoiseDensity: { value: 1.2 }, uNoiseStrength: { value: 0.15 },
        uColor1: { value: new THREE.Color(mode.c1) }, uColor2: { value: new THREE.Color(mode.c2) }
      },
      outer: {
        uTime: { value: 0 }, uSpeed: { value: mode.speed }, uNoiseDensity: { value: 1.2 }, uNoiseStrength: { value: 0.2 },
        uGlassColor1: { value: new THREE.Color(mode.c1) }, uGlassColor2: { value: new THREE.Color(mode.c2) }
      }
    };

    const innerMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader: innerFragmentShader, uniforms: uniformsRef.current.inner });
    const outerMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader: outerFragmentShader, uniforms: uniformsRef.current.outer, transparent: true, side: THREE.FrontSide, depthWrite: false, blending: THREE.AdditiveBlending });

    const innerMesh = new THREE.Mesh(geometry, innerMat);
    const outerMesh = new THREE.Mesh(geometry, outerMat);
    outerMesh.scale.set(1.15, 1.15, 1.15);

    scene.add(innerMesh);
    scene.add(outerMesh);

    const clock = new THREE.Clock();
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      uniformsRef.current.inner.uTime.value = t;
      uniformsRef.current.outer.uTime.value = t;

      innerMesh.rotation.y = t * 0.05; innerMesh.rotation.z = t * 0.02;
      outerMesh.rotation.y = t * 0.05; outerMesh.rotation.z = t * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose(); innerMat.dispose(); outerMat.dispose(); geometry.dispose();
    };
  }, [isThreeLoaded]);

  // Interpolate Colors seamlessly on Tab Change
  useEffect(() => {
    if (!uniformsRef.current) return;
    const targetC1 = new window.THREE.Color(mode.c1);
    const targetC2 = new window.THREE.Color(mode.c2);
    const targetSpeed = mode.speed;

    let lerpId;
    const lerpColors = () => {
      const uInner = uniformsRef.current.inner;
      const uOuter = uniformsRef.current.outer;
      uInner.uColor1.value.lerp(targetC1, 0.05); uInner.uColor2.value.lerp(targetC2, 0.05);
      uOuter.uGlassColor1.value.lerp(targetC1, 0.05); uOuter.uGlassColor2.value.lerp(targetC2, 0.05);
      uInner.uSpeed.value += (targetSpeed - uInner.uSpeed.value) * 0.05;
      uOuter.uSpeed.value += (targetSpeed - uOuter.uSpeed.value) * 0.05;
      lerpId = requestAnimationFrame(lerpColors);
    };
    lerpColors();
    return () => cancelAnimationFrame(lerpId);
  }, [mode]);

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4 font-sans text-slate-900 selection:bg-indigo-200">
      <style>{customStyles}</style>

      {/* Simulated iPhone Frame */}
      <div className="relative w-full max-w-[400px] h-[850px] bg-[#F8FAFC] rounded-[3.5rem] border-[12px] border-slate-900 overflow-hidden shadow-2xl flex flex-col ring-4 ring-slate-800/20">

        {/* MASSIVE FRACTAL GLASS BACKGROUND */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className={`absolute top-[-10%] left-[-20%] w-[130%] h-[70%] rounded-full mix-blend-multiply transition-colors duration-1000 ease-in-out`}
            style={{ background: `radial-gradient(circle, ${mode.c1} 0%, transparent 70%)`, filter: 'blur(70px)', opacity: 0.35, animation: 'breathe-slow 15s ease-in-out infinite' }} />
          <div className={`absolute top-[30%] right-[-40%] w-[120%] h-[80%] rounded-full mix-blend-multiply transition-colors duration-1000 ease-in-out`}
            style={{ background: `radial-gradient(circle, ${mode.c2} 0%, transparent 70%)`, filter: 'blur(70px)', opacity: 0.25, animation: 'breathe-slow 18s ease-in-out infinite reverse' }} />
          {/* Subtle Grain Texture */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwaHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAuNWg0MG0tNDAgMzlhLjUuNSAwIDAgMCAwIDFWMG0wIDM5LjVoNDAiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAyKSIvPjwvc3ZnPg==')] opacity-60 mix-blend-overlay" />
        </div>

        {/* Dynamic Island Area */}
        <div className="absolute top-0 w-full flex justify-center pt-3 z-50 pointer-events-none">
          <div className="w-[126px] h-[32px] bg-black rounded-full shadow-sm" />
        </div>

        {/* Top Header */}
        <header className="absolute top-0 w-full z-40 pt-16 pb-4 px-7 flex justify-between items-center bg-gradient-to-b from-white/60 via-white/20 to-transparent backdrop-blur-[2px]">
          <div className="flex flex-col transform transition-all duration-500">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles size={10} style={{ color: mode.c1 }} className="animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: mode.c1 }}>{mode.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Aura Core</h1>
          </div>
          <button
            onClick={() => setShowInnerVoice(!showInnerVoice)}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center glass-card hover:bg-white/80 active:scale-95 ${tClass} ${showInnerVoice ? 'bg-white shadow-lg ring-2 ring-white/50' : ''}`}
          >
            <Zap size={20} className={showInnerVoice ? "animate-pulse" : ""} style={{ color: mode.c1 }} />
            {/* Notification Dot */}
            {!showInnerVoice && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: mode.c2 }} />}
          </button>
        </header>

        {/* Inner Voice Dropdown */}
        <div className={`absolute top-[110px] left-0 w-full z-50 px-6 overflow-hidden ${tClass} ${showInnerVoice ? 'max-h-48 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
          <div className="glass-dark p-5 rounded-[1.5rem] flex items-start gap-4 shadow-2xl border-t border-white/20">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <Activity size={16} style={{ color: mode.c2 }} />
            </div>
            <div>
              <p className="text-[10px] font-mono mb-1.5 uppercase tracking-[0.15em]" style={{ color: mode.c2 }}>Inner Monologue</p>
              <p className="text-[15px] font-medium text-white/95 leading-relaxed tracking-wide">"{mode.intent}"</p>
            </div>
          </div>
        </div>

        {/* 3D ORB (Persistent Center Anchor) */}
        <div className={`absolute top-[130px] left-1/2 -translate-x-1/2 w-[320px] h-[320px] z-10 pointer-events-none flex items-center justify-center transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${showInnerVoice ? 'scale-110 translate-y-4' : 'scale-100'}`}>
          {/* Dynamic Glow behind orb */}
          <div className="absolute w-[60%] h-[60%] rounded-full blur-[50px] opacity-30 mix-blend-screen transition-colors duration-1000" style={{ backgroundColor: mode.c2 }} />

          <div ref={containerRef} className="w-full h-full absolute z-20" />

          {/* Scanning Reticles */}
          <div className="absolute w-[75%] h-[75%] rounded-full border border-slate-400/30 opacity-40 z-10" />
          <div className="absolute w-[55%] h-[55%] rounded-full border border-slate-500/40 border-dashed animate-[spin_60s_linear_infinite] opacity-30 z-10" />
        </div>

        {/* SCROLLABLE MAIN CONTENT (Flows beautifully over the orb with a gradient mask) */}
        <main className="absolute inset-0 z-20 overflow-y-auto scroll-mask no-scrollbar scroll-smooth pt-[370px] pb-36 px-6">

          {/* --- A: DIARY / PULSE SCREEN (Creative Dashboard) --- */}
          {activeTab === 'diary' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

              {/* Organic Top Insight Node */}
              <div className="relative group perspective-[1000px]">
                <div className="glass-card p-6 rounded-[3rem] transform transition-transform duration-700 hover:rotate-x-2 border border-white/80 overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 blur-[50px] opacity-40 mix-blend-multiply transition-colors duration-1000" style={{ backgroundColor: mode.c1 }} />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: mode.c1 }}></span>
                        <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: mode.c1 }}></span>
                      </span>
                      <h2 className="text-[11px] font-mono tracking-[0.2em] uppercase text-slate-500 font-bold">Synchronal Pulse</h2>
                    </div>
                    <div className="px-3 py-1.5 glass-card rounded-full text-[10px] uppercase font-bold text-slate-700 tracking-wider shadow-sm border-white/60">
                      Phase: Integration
                    </div>
                  </div>

                  <p className="text-[16px] leading-relaxed font-semibold text-slate-800 relative z-10 w-[90%]">
                    Your focus metrics show an early peak. I suggest shifting heavy architecture work to the next 90 minutes while cognitive reserves are highest.
                  </p>
                </div>
              </div>

              {/* Fluid Calendar / Time Context */}
              <div className="px-1">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 pt-2 -mx-6 px-6 snap-x">
                  {[...Array(6)].map((_, i) => {
                    const isNow = i === 1;
                    return (
                      <div key={i} className={`shrink-0 snap-center transition-all duration-500 flex flex-col items-center gap-3 relative ${isNow ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold whitespace-nowrap">
                          {isNow ? 'NOW' : `+${(i - 1) * 2}H`}
                        </span>
                        {/* Organic node replacing standard card */}
                        <div className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all duration-500 border ${isNow ? 'bg-white shadow-xl scale-125 border-white' : 'glass-card border-white/50 hover:bg-white/80'}`}>
                          {isNow ? <Zap size={18} style={{ color: mode.c1 }} className="animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                        </div>
                        {isNow && (
                          <div className="absolute -bottom-4 w-1 h-1 rounded-full bg-slate-800" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Interconnected Priority Nodes */}
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 font-bold mb-6 px-2 flex items-center gap-3">
                  <span className="w-4 h-[1px] bg-slate-400" /> Active Threads
                </h3>

                <div className="relative pl-6 flex flex-col gap-5">
                  {/* Serpentine Connecting Line */}
                  <svg className="absolute left-[8px] top-6 bottom-6 w-12 pointer-events-none opacity-30" preserveAspectRatio="none">
                    <path d="M 0 0 C 20 50, -20 100, 0 150 C 20 200, -20 250, 0 300" fill="transparent" stroke="url(#arc-gradient)" strokeWidth="2" strokeDasharray="6 6" className="animate-[dash_60s_linear_infinite]" />
                    <defs>
                      <linearGradient id="arc-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={mode.c1} />
                        <stop offset="100%" stopColor={mode.c2} />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* High Priority Node */}
                  <div className="glass-card p-4 rounded-[100px] border border-white/90 shadow-lg flex items-center gap-4 relative z-10 transform hover:scale-[1.02] transition-transform cursor-pointer bg-white/70">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: mode.c1, backgroundColor: `${mode.c1}15` }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mode.c1 }} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-[15px] text-slate-800 truncate">V2 System Architecture</p>
                      <p className="text-[12px] text-slate-500 font-medium truncate mt-0.5">Deep block • Requires 100% focus</p>
                    </div>
                  </div>

                  {/* Standard Node */}
                  <div className="glass-card p-4 rounded-[100px] border border-white/50 shadow-sm flex items-center gap-4 relative z-10 transform hover:scale-[1.02] transition-transform cursor-pointer ml-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-slate-300">
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-[14px] text-slate-700 truncate">Finalize PR #402</p>
                    </div>
                  </div>

                  {/* Automated Node */}
                  <div className="glass-card p-4 rounded-[100px] border border-white/30 shadow-sm flex items-center gap-4 relative z-10 ml-8 opacity-70">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-200">
                      <Zap size={12} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] text-slate-600 truncate flex items-center gap-2">
                        Updating dependencies <span className="text-[9px] uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-full">Auto</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* --- B: FLOW SCREEN (Temporal / Spatial Tasks) --- */}
          {activeTab === 'flow' && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

              {/* Radial Energy Gauge instead of standard cards */}
              <div className="flex flex-col items-center mt-4 relative">
                <div className="absolute w-[200px] h-[200px] rounded-full blur-[40px] opacity-30 mix-blend-multiply" style={{ backgroundColor: mode.c2 }} />

                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" />
                    {/* Ghost track */}
                    <circle cx="96" cy="96" r="72" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
                    {/* Active track */}
                    <circle cx="96" cy="96" r="72" fill="none" stroke={mode.c1} strokeWidth="12" strokeDasharray="452" strokeDashoffset="120" strokeLinecap="round" className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Activity size={24} style={{ color: mode.c1 }} className="mb-1" />
                    <span className="text-3xl font-bold tracking-tighter text-slate-800">74%</span>
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 font-bold mt-1">Cognitive Load</span>
                  </div>
                </div>
              </div>

              {/* Horizontal Spatial Timeline */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-6 px-4">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Temporal Flow</h3>
                  <button className="glass-card w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                    <ChevronRight size={16} className="text-slate-600" />
                  </button>
                </div>

                <div className="relative h-40 w-full overflow-hidden">
                  {/* Continuous fluid bar */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[150%] h-16 bg-white/40 rounded-full border border-white/60 shadow-inner flex items-center pr-12 pointer-events-none">
                    {/* Completed section */}
                    <div className="h-full rounded-full bg-slate-200/50 w-[30%] backdrop-blur-md relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwaHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAuNWg0MG0tNDAgMzlhLjUuNSAwIDAgMCAwIDFWMG0wIDM5LjVoNDAiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
                    </div>
                  </div>

                  {/* Floating timeline events */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-[10%] glass-card px-4 py-2 rounded-2xl shadow-lg border-white border text-[13px] font-semibold text-slate-700 flex items-center gap-2 transform -translate-y-12">
                    <CheckCircle2 size={14} className="text-slate-400" /> Standup
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 left-[35%] w-32 glass-card py-2 px-4 rounded-2xl shadow-xl border-white border relative transform scale-110 z-10" style={{ boxShadow: `0 10px 30px -10px ${mode.c1}40` }}>
                    <div className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: mode.c1 }}></span>
                      <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: mode.c1 }}></span>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">In Progress</p>
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">Architecture Review</p>
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 left-[70%] glass-card px-4 py-2 rounded-2xl border border-white/40 shadow-sm text-[13px] font-semibold text-slate-500 opacity-60 transform translate-y-10">
                    Design Sync
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* --- C: MIND SCREEN (Organic Mind Map) --- */}
          {activeTab === 'mind' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 items-center pt-8">

              <div className="text-center mb-8">
                <h3 className="font-bold text-slate-800 text-2xl tracking-tight">Cognitive State</h3>
                <p className="text-[13px] text-slate-500 mt-2 font-medium">Model alignment: 94%</p>
              </div>

              {/* Orbital 3D-like layout */}
              <div className="relative w-full h-[360px] flex items-center justify-center transform-gpu">
                {/* Orbit Rings */}
                <div className="absolute w-[280px] h-[70px] border border-slate-300 rounded-[100%] transform -rotate-12 opacity-40"></div>
                <div className="absolute w-[340px] h-[90px] border border-slate-300 rounded-[100%] transform rotate-12 opacity-30"></div>

                {/* Central Core Concept */}
                <div className="absolute w-28 h-28 rounded-full flex flex-col items-center justify-center z-30 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-xl border border-white transform hover:scale-110 transition-transform cursor-pointer group">
                  <div className="absolute inset-0 rounded-full blur-[20px] mix-blend-multiply opacity-30" style={{ backgroundColor: mode.c1 }} />
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 relative z-10" style={{ backgroundColor: `${mode.c1}15` }}>
                    <Brain size={20} style={{ color: mode.c1 }} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-bold text-[14px] text-slate-800 relative z-10">Identity</span>
                </div>

                {/* Orbiting Satellite 1 */}
                <div className="absolute top-[15%] right-[15%] z-20 hover:z-40">
                  <div className="glass-card w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center shadow-lg border-white/80 hover:scale-110 transition-all cursor-pointer transform rotate-6">
                    <span className="font-bold text-[12px] text-slate-700">Creation</span>
                    <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: mode.c2, boxShadow: `0 0 10px ${mode.c2}` }} />
                  </div>
                </div>

                {/* Orbiting Satellite 2 */}
                <div className="absolute bottom-[20%] left-[10%] z-40 hover:z-50">
                  <div className="bg-white/95 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl border border-white hover:scale-110 transition-all cursor-pointer transform -rotate-6">
                    <span className="font-bold text-[14px] text-slate-800">Health</span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Focus</span>
                  </div>
                </div>

                {/* Orbiting Satellite 3 */}
                <div className="absolute top-[40%] left-[5%] z-10 hover:z-40">
                  <div className="glass-card w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-sm opacity-60 hover:opacity-100 hover:scale-110 transition-all cursor-pointer border-white/40">
                    <span className="font-bold text-[11px] text-slate-600">Rest</span>
                  </div>
                </div>
              </div>

              <div className="glass-card px-8 py-5 rounded-[2rem] border-white/60 mx-4 mt-4">
                <p className="text-[14px] text-center text-slate-700 font-medium leading-relaxed">
                  Your "Health" vector is drawing the most energy today. I've adjusted your task suggestions accordingly.
                </p>
              </div>
            </div>
          )}

          {/* --- D: CREW SCREEN (Non-standard Agents View) --- */}
          {activeTab === 'crew' && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-4">
              <div className="flex items-center justify-center">
                <div className="glass-card px-6 py-3 rounded-full border border-white flex items-center gap-3 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: mode.c1 }}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: mode.c1 }}></span>
                  </span>
                  <span className="text-[12px] font-mono font-bold tracking-[0.2em] text-slate-600 uppercase">Swarm Status: Nominal</span>
                </div>
              </div>

              <div className="relative pl-6 pr-2">
                {/* Connecting backbone line */}
                <div className="absolute left-[34px] top-6 bottom-6 w-1 bg-gradient-to-b from-slate-200 via-rose-200 to-transparent rounded-full" />

                {/* Active Agent - Floating Focus */}
                <div className="relative mb-12 transform hover:translate-x-2 transition-transform cursor-pointer">
                  {/* Decorative orbital ring around icon */}
                  <div className="absolute -left-[14px] top-0 w-16 h-16 border rounded-full border-rose-300 pointer-events-none animate-[spin_10s_linear_infinite]" />

                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border border-rose-100 relative z-10 ml-[-6px]">
                    <Shield size={20} className="text-rose-500" />
                  </div>

                  <div className="pl-12 absolute top-1 left-4 w-full">
                    <div className="glass-card p-5 rounded-[2rem] border-white/80 bg-white/50 shadow-sm ml-2">
                      <h4 className="text-[16px] font-bold text-slate-800 tracking-tight">Focus Guardian</h4>
                      <p className="text-[13px] text-slate-600 mt-1 leading-relaxed font-medium">Intercepting all non-urgent pings until 12:00 PM to protect deep block.</p>
                      <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-white/80 rounded-full border border-white text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">Config</span>
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100 text-[10px] font-bold uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Agent - Sweeper */}
                <div className="relative mb-12 transform hover:translate-x-2 transition-transform cursor-pointer pt-20">
                  <div className="absolute -left-[6px] top-26 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-teal-100 relative z-10">
                    <Layers size={18} className="text-teal-500" />
                  </div>

                  <div className="pl-12 absolute top-24 left-4 w-full">
                    <div className="glass-card p-5 rounded-[2rem] border-white/60 shadow-sm ml-2">
                      <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">Inbox Sweeper</h4>
                      <p className="text-[12px] text-slate-500 mt-1 leading-relaxed font-medium">Sorted 14 threads into 'Read Later'.</p>
                    </div>
                  </div>
                </div>

                {/* Sleeping Agent */}
                <div className="relative pt-20 opacity-50 transform hover:translate-x-2 transition-transform cursor-pointer grayscale-[30%]">
                  <div className="absolute -left-[2px] top-26 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shadow-inner relative z-10">
                    <Dumbbell size={16} className="text-slate-400" />
                  </div>

                  <div className="pl-10 absolute top-24 left-4 w-full">
                    <div className="bg-transparent px-5 py-2 ml-2">
                      <h4 className="text-[14px] font-bold text-slate-600 tracking-tight flex items-center gap-2">Fit Scout <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /></h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-medium tracking-wide">Sleeping until 06:00 AM.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>

        {/* --- BOTTOM DOCK NAVIGATION --- */}
        {/* Soft fading gradient to mask bottom scroll cutoff */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent pointer-events-none z-30" />

        <nav className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-card p-1.5 rounded-[2rem] flex gap-1 shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-50 w-[90%] max-w-[360px] justify-between border border-white/80">
          <NavItem icon={<Eye size={22} strokeWidth={2.5} />} label="Diary" id="diary" activeTab={activeTab} onClick={setActiveTab} mode={mode} />
          <NavItem icon={<Activity size={22} strokeWidth={2.5} />} label="Flow" id="flow" activeTab={activeTab} onClick={setActiveTab} mode={mode} />
          <NavItem icon={<Brain size={22} strokeWidth={2.5} />} label="Mind" id="mind" activeTab={activeTab} onClick={setActiveTab} mode={mode} />
          <NavItem icon={<Users size={22} strokeWidth={2.5} />} label="Crew" id="crew" activeTab={activeTab} onClick={setActiveTab} mode={mode} />
        </nav>

        {/* iOS Home Indicator line */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[35%] h-[5px] bg-slate-900 rounded-full z-50 pointer-events-none opacity-80" />
      </div>
    </div>
  );
}

// Polished Nav Item Sub-component
function NavItem({ icon, label, id, activeTab, onClick, mode }) {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 ${isActive ? 'bg-white shadow-md text-slate-900 flex-grow' : 'text-slate-400 hover:text-slate-800 hover:bg-white/40 flex-grow-0'
        }`}
    >
      <div className="transition-colors duration-500 flex-shrink-0" style={{ color: isActive ? mode.c1 : 'currentColor' }}>
        {icon}
      </div>
      <div className={`overflow-hidden transition-all duration-500 flex items-center ${isActive ? 'max-w-[80px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}`}>
        <span className="text-[12px] font-bold font-sans tracking-wide truncate">{label}</span>
      </div>
    </button>
  );
}