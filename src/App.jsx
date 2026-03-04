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

import * as THREE from 'three';

export default function AuraMultiPersonaApp() {
  const [activeTab, setActiveTab] = useState('diary');
  const [showInnerVoice, setShowInnerVoice] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);
  const [shadowRevealed, setShadowRevealed] = useState(false);

  const containerRef = useRef(null);
  const uniformsRef = useRef(null);

  const mode = AURA_MODES[activeTab];
  const tClass = "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";

  // Initialize 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;

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
  }, []);

  // Interpolate Colors seamlessly on Tab Change
  useEffect(() => {
    if (!uniformsRef.current) return;
    const targetC1 = new THREE.Color(mode.c1);
    const targetC2 = new THREE.Color(mode.c2);
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

          {/* --- A: DIARY SCREEN (Home) --- */}
          {activeTab === 'diary' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">

              <div className="glass-card p-6 rounded-[2rem] transform transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-mono tracking-[0.15em] uppercase text-slate-500">Current Protocol</h2>
                  <div className="px-2 py-1 bg-white/50 rounded-md text-[10px] font-bold text-slate-600">ACTIVE</div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 bg-white/60 p-3.5 rounded-2xl border border-white/50 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2.5 py-1.5 rounded-lg shrink-0">Short</span>
                    <p className="text-[14px] font-semibold text-slate-700 leading-tight">Make your mornings calmer.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white/60 p-3.5 rounded-2xl border border-white/50 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-100 px-2.5 py-1.5 rounded-lg shrink-0">Long</span>
                    <p className="text-[14px] font-semibold text-slate-700 leading-tight">Ship V1 without burning out.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight mb-4 px-1 text-slate-800 flex items-center gap-2">
                  Today I learned <span className="text-slate-400 font-normal">...</span>
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="glass-card p-5 rounded-[1.5rem] flex gap-4 items-start group hover:bg-white/70 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <p className="text-[14px] leading-relaxed font-medium text-slate-700 group-hover:text-slate-900 transition-colors">I noticed you got stressed around 5–7 PM while working on the offline agent idea.</p>
                  </div>
                  <div className="glass-card p-5 rounded-[1.5rem] flex gap-4 items-start group hover:bg-white/70 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                    <p className="text-[14px] leading-relaxed font-medium text-slate-700 group-hover:text-slate-900 transition-colors">You lit up talking about privacy design—this seems very core to your values.</p>
                  </div>
                </div>
              </div>

              {/* Shadow Thoughts Collapsible */}
              <div className="glass-dark p-1.5 rounded-[2rem] shadow-xl border border-white/10 overflow-hidden transform transition-all mt-2">
                <button onClick={() => setShadowOpen(!shadowOpen)} className="w-full p-4 flex justify-between items-center text-white active:opacity-70 transition-opacity">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-1.5 rounded-full">
                      <Lock size={16} className="text-indigo-300" />
                    </div>
                    <span className="font-semibold text-[15px] tracking-wide">Shadow Thoughts (2)</span>
                  </div>
                  <ChevronRight size={18} className={`transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${shadowOpen ? 'rotate-90' : ''}`} />
                </button>

                <div className={`px-4 overflow-hidden ${tClass} ${shadowOpen ? 'max-h-72 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-white/50 mb-4 ml-1 font-medium tracking-wide">Raw hypotheses. Tap to uncover.</p>
                  <div className="bg-white/5 p-5 rounded-2xl relative overflow-hidden group border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setShadowRevealed(true)}>
                    <p className={`text-[15px] font-medium leading-relaxed transition-all duration-700 ${shadowRevealed ? 'text-white/90 blur-none' : 'text-transparent blur-[6px] select-none'}`}
                      style={{ textShadow: shadowRevealed ? 'none' : '0 0 16px rgba(255,255,255,0.6)' }}>
                      "I suspect you procrastinate more when you speak about the backend architecture. Are you anxious about it?"
                    </p>
                    {!shadowRevealed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 border border-white/20 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md shadow-xl">Reveal</span>
                      </div>
                    )}
                    {shadowRevealed && (
                      <div className="mt-5 flex gap-3 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-white/5">
                          <CheckCircle2 size={16} className="text-emerald-400" /> Accurate
                        </button>
                        <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-white/5">
                          <XCircle size={16} className="text-rose-400" /> Wrong
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Indicator */}
              <div className="flex justify-between items-center px-4 py-6 mt-2 opacity-50">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">W1</span>
                <span className="flex-1 h-px bg-slate-400/50 mx-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">1M</span>
                <span className="flex-1 h-px bg-slate-400/50 mx-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-600 font-bold">NOW</span>
              </div>
            </div>
          )}

          {/* --- B: FLOW SCREEN (Work/Tasks) --- */}
          {activeTab === 'flow' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">

              <div>
                <h2 className="text-xl font-bold tracking-tight mb-4 px-1 text-slate-800">Energy Topology</h2>
                <div className="flex gap-3">
                  <div className="flex-1 glass-card p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-transform bg-white/80 border-white">
                    <Sun size={20} className="text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Deep Work</span>
                  </div>
                  <div className="flex-1 glass-card p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-transform border-white/60">
                    <Coffee size={20} className="text-teal-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Catch Up</span>
                  </div>
                  <div className="flex-1 glass-card p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-transform opacity-60">
                    <Moon size={20} className="text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Wind Down</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-[2rem] relative">
                <div className="relative pl-8 flex flex-col gap-8">
                  {/* Vertical connecting line */}
                  <div className="absolute left-[5px] top-2 bottom-4 w-px bg-gradient-to-b from-slate-300 via-teal-400 to-blue-500" />

                  {/* Timeline Item 1 */}
                  <div className="relative">
                    <div className="absolute -left-[32px] top-1 w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                    <div>
                      <p className="text-[11px] font-mono text-slate-400 mb-1 tracking-wider">09:00 AM</p>
                      <p className="text-[15px] font-medium text-slate-500 line-through">Morning Sync</p>
                    </div>
                  </div>

                  {/* Timeline Item 2 (Active) */}
                  <div className="relative">
                    <div className="absolute -left-[32px] top-3 w-3.5 h-3.5 rounded-full bg-teal-400 border-2 border-white shadow-sm ring-4 ring-teal-100/50" />
                    <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        <p className="text-[10px] font-mono text-teal-600 font-bold tracking-[0.15em]">NOW</p>
                      </div>
                      <p className="text-[15px] font-bold text-slate-800">Focus Block: V1 Spec</p>
                    </div>
                  </div>

                  {/* Timeline Item 3 (Injected) */}
                  <div className="relative">
                    <div className="absolute -left-[32px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                    <div>
                      <p className="text-[10px] font-mono text-blue-600 mb-1 font-bold tracking-[0.15em]">AURA INTERVENTION</p>
                      <p className="text-[15px] font-medium text-slate-700">20-min Screen Break / Stretch</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 px-2">Task Lane</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 snap-x">
                  <div className="w-40 shrink-0 snap-center glass-card p-5 rounded-[2rem] flex flex-col gap-3 opacity-70">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inbox (3)</span>
                    <div className="h-14 bg-white/40 rounded-xl border border-white/20" />
                    <div className="h-14 bg-white/40 rounded-xl border border-white/20" />
                  </div>
                  <div className="w-44 shrink-0 snap-center glass-card p-5 rounded-[2rem] flex flex-col gap-3 ring-1 ring-teal-200 bg-white/80 shadow-md transform scale-[1.02]">
                    <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">In Progress</span>
                    <div className="h-20 bg-white rounded-xl border border-teal-100 p-3 shadow-sm flex flex-col justify-end">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-teal-400 h-2 rounded-full w-[65%]" />
                      </div>
                    </div>
                  </div>
                  <div className="w-40 shrink-0 snap-center glass-card p-5 rounded-[2rem] flex flex-col gap-3 opacity-60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Done Today</span>
                    <div className="h-10 bg-white/40 rounded-xl flex items-center px-3 border border-white/20">
                      <CheckSquare size={14} className="text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- C: MIND SCREEN (Mind Map / Trust) --- */}
          {activeTab === 'mind' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 items-center pt-2">

              <div className="w-full glass-card p-6 rounded-[2rem] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg tracking-tight">Understanding Level</h3>
                  <p className="text-[13px] text-slate-500 mt-1 font-medium">Tap nodes to correct drift</p>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke={mode.c1} strokeWidth="6" strokeDasharray="175" strokeDashoffset="52" className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <span className="absolute font-bold text-[15px] text-slate-800 tracking-tighter">7/10</span>
                </div>
              </div>

              {/* Responsive Simulated Bubble Map */}
              <div className="relative w-full h-[320px] flex items-center justify-center">

                {/* Center Node */}
                <div className="absolute w-36 h-36 glass-card rounded-full flex flex-col items-center justify-center shadow-xl ring-4 ring-emerald-100/50 z-20 active:scale-95 transition-all cursor-pointer hover:bg-white/80 group">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Brain size={24} className="text-emerald-600" />
                  </div>
                  <span className="font-bold text-[15px] text-slate-800">Career</span>
                </div>

                {/* Orbiting Nodes */}
                <div className="absolute top-[10%] left-[10%] w-24 h-24 glass-card rounded-full flex flex-col items-center justify-center opacity-90 z-10 hover:opacity-100 hover:scale-105 transition-all cursor-pointer">
                  <span className="font-semibold text-[13px] text-slate-700">Health</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shadow-[0_0_8px_#34d399]" />
                </div>

                <div className="absolute bottom-[5%] right-[10%] w-20 h-20 glass-card rounded-full flex flex-col items-center justify-center opacity-80 z-10 hover:opacity-100 hover:scale-105 transition-all cursor-pointer">
                  <span className="font-semibold text-[12px] text-slate-700">Social</span>
                </div>

                <div className="absolute top-[15%] right-[5%] w-16 h-16 glass-card rounded-full flex flex-col items-center justify-center opacity-60 z-10 hover:opacity-100 hover:scale-105 transition-all cursor-pointer">
                  <span className="font-semibold text-[11px] text-slate-700">Money</span>
                </div>

                {/* Decorative connecting lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" style={{ zIndex: 0 }}>
                  <line x1="50%" y1="50%" x2="25%" y2="25%" stroke={mode.c1} strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="80%" y2="80%" stroke={mode.c1} strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="85%" y2="25%" stroke={mode.c1} strokeWidth="1" strokeDasharray="4 4" />
                </svg>
              </div>

              <p className="text-[13px] text-center text-slate-500 px-8 font-medium leading-relaxed bg-white/40 py-3 rounded-2xl backdrop-blur-md">
                This is my current mental model of your life vectors. Size equals attention weight.
              </p>
            </div>
          )}

          {/* --- D: CREW SCREEN (Agents) --- */}
          {activeTab === 'crew' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-end justify-between px-1 mb-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">Background Agents</h2>
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">4 Deployed</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Active Agent 1 */}
                <div className="glass-dark p-5 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden group transform hover:-translate-y-1 transition-transform border border-white/10 shadow-lg">
                  <div className="absolute -top-10 -right-10 w-32 h-32 blur-[40px] opacity-40 transition-colors duration-1000" style={{ backgroundColor: mode.c1 }} />
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"><Shield size={18} className="text-white" /></div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399] mt-1" />
                  </div>
                  <div className="relative z-10 mt-1">
                    <h4 className="text-[15px] font-bold text-white tracking-wide">Focus Guardian</h4>
                    <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed font-medium">Intercepting non-urgent pings until 12 PM.</p>
                  </div>
                </div>

                {/* Active Background Agent 2 */}
                <div className="glass-dark p-5 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden group transform hover:-translate-y-1 transition-transform border border-white/10 shadow-lg">
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 blur-[40px] opacity-30 transition-colors duration-1000" style={{ backgroundColor: mode.c2 }} />
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"><Layers size={18} className="text-white" /></div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399] mt-1" />
                  </div>
                  <div className="relative z-10 mt-1">
                    <h4 className="text-[15px] font-bold text-white tracking-wide">Inbox Sweeper</h4>
                    <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed font-medium">Sorted 14 threads into 'Read Later'.</p>
                  </div>
                </div>

                {/* Paused Agent */}
                <div className="glass-dark p-5 rounded-[2rem] flex flex-col gap-4 opacity-50 grayscale-[50%]">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageSquare size={18} className="text-white" /></div>
                    <span className="px-2.5 py-1 rounded-full border border-white/20 text-[9px] font-mono text-white/60 uppercase tracking-widest mt-1">Paused</span>
                  </div>
                  <div className="mt-1">
                    <h4 className="text-[15px] font-bold text-white tracking-wide">Social Prod.</h4>
                    <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed font-medium">Awaiting manual approval for drafts.</p>
                  </div>
                </div>

                {/* Sleeping Agent */}
                <div className="glass-dark p-5 rounded-[2rem] flex flex-col gap-4 opacity-40 grayscale-[50%]">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Dumbbell size={18} className="text-white" /></div>
                    <span className="px-2.5 py-1 rounded-full border border-white/20 text-[9px] font-mono text-white/60 uppercase tracking-widest mt-1">Sleep</span>
                  </div>
                  <div className="mt-1">
                    <h4 className="text-[15px] font-bold text-white tracking-wide">Fit Scout</h4>
                    <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed font-medium">Resumes tracking at 06:00 AM.</p>
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