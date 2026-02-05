import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Type, 
  Palette,
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Smartphone, 
  MoveHorizontal, 
  LayoutTemplate,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Ruler,
  Upload, 
  Maximize2,
  Droplets,
  Layers,
  Eye,
  EyeOff,
  Loader2, 
  Minus,
  Plus as PlusIcon,
  Save, 
  LogOut, 
  CheckCircle2, 
  Bold,
  Italic,
  Underline,
  Highlighter,
  X,
  ArrowUpDown,
  ArrowLeftRight,
  Crop,
  Home,
  Copy,
  FolderOpen
} from 'lucide-react';

// --- TIPOS ---
interface Position { x: number; y: number; }

interface TextLayer {
  id: string;
  content: string;
  x: number; y: number; w: number; 
  fontFamily: string; fontSize: number; color: string; backgroundColor: string; 
  align: 'left' | 'center' | 'right';
  isBold: boolean; isItalic: boolean; isUnderline: boolean;
  lineHeight: number; letterSpacing: number; 
}

interface Slide {
  id: string;
  textLayers: TextLayer[];
  backgroundColor: string;
  overlayEnabled: boolean; overlayColor: string; overlayOpacity: number;
  imageUrl: string;
  imgBoxX: number; imgBoxY: number; imgBoxW: number; imgBoxH: number; 
  imgZoom: number; imgPanX: number; imgPanY: number; 
  template: 'text-only' | 'image-bottom' | 'image-top' | 'split';
}

interface Project {
  id: string;
  name: string;
  lastModified: number;
  slides: Slide[];
}

declare global { interface Window { html2canvas: any; } }

// --- CONSTANTES ---
const fontOptions = [
  { name: 'Elegante (Playfair)', value: "'Playfair Display', serif" },
  { name: 'Moderna (Inter)', value: "'Inter', sans-serif" },
  { name: 'Robusta (Montserrat)', value: "'Montserrat', sans-serif" },
  { name: 'Clássica (Lora)', value: "'Lora', serif" },
  { name: 'Padrão (Roboto)', value: "'Roboto', sans-serif" },
  { name: 'Manuscrita (Dancing)', value: "'Dancing Script', cursive" }
];

const createTextLayer = (type: 'title' | 'body' | 'subtitle' | 'caption'): TextLayer => {
  const base = {
    id: Math.random().toString(36).substr(2, 9),
    backgroundColor: 'transparent',
    align: 'left' as const,
    isBold: false, isItalic: false, isUnderline: false,
    lineHeight: 1.2, letterSpacing: 0, w: 80,
  };

  switch (type) {
    case 'title': return { ...base, content: 'Título Principal', x: 10, y: 10, fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#5A3A29', isBold: true };
    case 'subtitle': return { ...base, content: 'Subtítulo Atrativo', x: 10, y: 25, fontFamily: "'Montserrat', sans-serif", fontSize: 20, color: '#D4AF37' };
    case 'body': return { ...base, content: 'Seu texto principal vai aqui.', x: 10, y: 35, fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: '#5A3A29' };
    case 'caption': return { ...base, content: 'Legenda / Detalhe', x: 10, y: 90, fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#000000', backgroundColor: '#FFFFFF' };
    default: return { ...base, content: 'Novo Texto', x: 10, y: 50, fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#000000' };
  }
};

const createInitialSlide = (): Slide => ({
  id: Math.random().toString(36).substr(2, 9),
  textLayers: [createTextLayer('title'), createTextLayer('body')],
  backgroundColor: '#F7F3E8',
  overlayEnabled: false, overlayColor: '#000000', overlayOpacity: 20,
  imageUrl: '',
  imgBoxX: 0, imgBoxY: 0, imgBoxW: 100, imgBoxH: 50,
  imgZoom: 1, imgPanX: 50, imgPanY: 50,
  template: 'text-only'
});

// --- COMPONENTE SLIDE CANVAS ---
interface SlideCanvasProps {
  slide: Slide;
  scale?: number;
  isEditing?: boolean;
  showSafeZone?: boolean;
  selectedTextId?: string | null;
  onSelectText?: (id: string) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onInteractionStart?: (type: string, id: string | null, e: React.MouseEvent) => void;
}

const SlideCanvas: React.FC<SlideCanvasProps> = ({ 
  slide, scale = 1, isEditing = false, showSafeZone = false, selectedTextId, onSelectText, canvasRef, onInteractionStart 
}) => {
  const handleMouseDown = (type: string, id: string | null, e: React.MouseEvent) => {
    if (isEditing && onInteractionStart) {
      e.preventDefault(); e.stopPropagation();
      if (type === 'text' && id && onSelectText) onSelectText(id);
      onInteractionStart(type, id, e);
    }
  };

  return (
    <div ref={canvasRef} className="relative overflow-hidden shadow-2xl transition-all duration-300 flex flex-col select-none bg-white" 
      style={{ width: `${320 * scale}px`, height: `${400 * scale}px`, backgroundColor: slide.backgroundColor }}
      onMouseDown={() => isEditing && onSelectText && onSelectText('')} 
    >
      {slide.imageUrl && (
        <div className={`absolute overflow-hidden group ${isEditing ? 'hover:outline hover:outline-2 hover:outline-purple-400 hover:outline-dashed' : ''}`}
            style={{ left: `${slide.imgBoxX}%`, top: `${slide.imgBoxY}%`, width: `${slide.imgBoxW}%`, height: `${slide.imgBoxH}%`, zIndex: 1 }}
            onMouseDown={(e) => handleMouseDown('img_box_move', null, e)}
        >
             <img src={slide.imageUrl} alt="Conteúdo" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${slide.imgPanX}% ${slide.imgPanY}%`, transform: `scale(${slide.imgZoom})`, pointerEvents: 'none' }} />
             {isEditing && (
                <div onMouseDown={(e) => handleMouseDown('img_box_resize', null, e)} className="absolute bottom-0 right-0 w-6 h-6 bg-white border-2 border-purple-600 rounded-tl-lg cursor-nwse-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Crop size={12} className="text-purple-600"/>
                </div>
             )}
        </div>
      )}
      {slide.overlayEnabled && <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundColor: slide.overlayColor, opacity: slide.overlayOpacity / 100 }} />}
      
      {slide.textLayers.map((layer) => (
        <div key={layer.id} onMouseDown={(e) => handleMouseDown('text', layer.id, e)} 
            className={`absolute z-20 cursor-move group ${isEditing && selectedTextId === layer.id ? 'outline outline-2 outline-cyan-400 outline-dashed rounded p-1 bg-cyan-50/10' : 'hover:outline hover:outline-1 hover:outline-cyan-400/50 hover:outline-dashed p-1'}`} 
            style={{ left: `${layer.x}%`, top: `${layer.y}%`, width: `${layer.w}%`, textAlign: layer.align, minWidth: '20px', fontFamily: layer.fontFamily, fontSize: `${layer.fontSize * scale}px`, color: layer.color, fontWeight: layer.isBold ? 'bold' : 'normal', fontStyle: layer.isItalic ? 'italic' : 'normal', textDecoration: layer.isUnderline ? 'underline' : 'none', lineHeight: layer.lineHeight, letterSpacing: `${layer.letterSpacing * scale}px`, backgroundColor: layer.backgroundColor !== 'transparent' ? layer.backgroundColor : undefined, padding: layer.backgroundColor !== 'transparent' ? '4px 8px' : '0', borderRadius: layer.backgroundColor !== 'transparent' ? '4px' : '0' }}
        >
            <p className="whitespace-pre-wrap pointer-events-none break-words">{layer.content || "Digite algo..."}</p>
            {isEditing && selectedTextId === layer.id && (
                <div onMouseDown={(e) => handleMouseDown('text_box_resize', layer.id, e)} className="absolute top-1/2 -right-2 w-3 h-6 bg-cyan-400 rounded-r cursor-ew-resize shadow-md z-30 pointer-events-auto flex items-center justify-center hover:scale-125 transition-transform"></div>
            )}
        </div>
      ))}
      
      {showSafeZone && <div className="absolute inset-0 pointer-events-none z-40"><div className="absolute inset-[10%] border-2 border-dashed border-cyan-400/30 rounded-sm"></div></div>}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  
  const [currentProjectName, setCurrentProjectName] = useState('Carrossel');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>([createInitialSlide()]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [showGuides, setShowGuides] = useState(true); 
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [customFontInput, setCustomFontInput] = useState(''); 
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<{ type: string; id: string | null; startX: number; startY: number; initialVal: any; } | null>(null);
  const [view, setView] = useState<'auth' | 'dashboard' | 'editor'>('auth');

  const slideRef = useRef<HTMLDivElement | null>(null);
  const activeSlide = slides[activeSlideIndex];
  const activeTextLayer = activeSlide.textLayers.find(t => t.id === selectedTextId);

  // --- INICIALIZAÇÃO SEGURA ---
  useEffect(() => {
    const initApp = () => {
      try {
        const savedUser = localStorage.getItem('app_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setView('dashboard');
          const data = localStorage.getItem('my_projects');
          if (data) setMyProjects(JSON.parse(data));
        }
      } catch (e) {
        console.warn("Storage reset");
      } finally {
        setAuthLoading(false);
      }
    };
    initApp();
  }, []);

  const createNewProject = () => {
    const newId = Date.now().toString();
    setCurrentProjectId(newId);
    setCurrentProjectName('Novo Carrossel');
    setSlides([createInitialSlide()]);
    setActiveSlideIndex(0);
    setView('editor');
  };

  const openProject = (project: Project) => {
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setSlides(project.slides);
    setActiveSlideIndex(0);
    setView('editor');
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este carrossel?')) {
        const updated = myProjects.filter(p => p.id !== id);
        setMyProjects(updated);
        localStorage.setItem('my_projects', JSON.stringify(updated));
    }
  };

  const handleSaveProject = () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage('');
    
    setTimeout(() => {
        try {
            const newProject: Project = {
                id: currentProjectId || Date.now().toString(),
                name: currentProjectName,
                lastModified: Date.now(),
                slides: slides
            };
            let updatedProjects = [...myProjects];
            const existingIndex = updatedProjects.findIndex(p => p.id === newProject.id);
            if (existingIndex >= 0) updatedProjects[existingIndex] = newProject;
            else updatedProjects.push(newProject);
            setMyProjects(updatedProjects);
            localStorage.setItem('my_projects', JSON.stringify(updatedProjects));
            if (!currentProjectId) setCurrentProjectId(newProject.id);
            setSaveMessage('Salvo!');
        } catch (e) {
            setSaveMessage('Erro!');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 2000);
        }
    }, 400);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { email: email || "visitante@demo.com" };
    localStorage.setItem('app_user', JSON.stringify(newUser));
    setUser(newUser);
    setView('dashboard');
    const data = localStorage.getItem('my_projects');
    if (data) setMyProjects(JSON.parse(data));
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user');
    setUser(null);
    setView('auth');
  };

  // --- EDITOR FUNCTIONS ---
  const addSlide = () => {
    const newSlide = createInitialSlide();
    newSlide.backgroundColor = activeSlide.backgroundColor;
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const duplicateSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const slideToCopy = slides[index];
    const newSlide = {
        ...JSON.parse(JSON.stringify(slideToCopy)),
        id: Math.random().toString(36).substr(2, 9),
        textLayers: slideToCopy.textLayers.map(layer => ({ ...layer, id: Math.random().toString(36).substr(2, 9) }))
    };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIndex(index + 1);
  };

  const removeSlide = (index: number) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (activeSlideIndex >= newSlides.length) setActiveSlideIndex(newSlides.length - 1);
  };

  const addTextLayer = () => {
      const newSlides = [...slides];
      const newLayer = createTextLayer('subtitle');
      newSlides[activeSlideIndex].textLayers.push(newLayer);
      setSlides(newSlides);
      setSelectedTextId(newLayer.id); 
  };

  const removeTextLayer = (id: string) => {
      const newSlides = [...slides];
      newSlides[activeSlideIndex].textLayers = newSlides[activeSlideIndex].textLayers.filter(t => t.id !== id);
      setSlides(newSlides);
      if (selectedTextId === id) setSelectedTextId(null);
  };

  const updateTextLayer = (id: string, field: keyof TextLayer, value: any) => {
      const newSlides = [...slides];
      const layerIndex = newSlides[activeSlideIndex].textLayers.findIndex(t => t.id === id);
      if (layerIndex !== -1) {
          newSlides[activeSlideIndex].textLayers[layerIndex] = { ...newSlides[activeSlideIndex].textLayers[layerIndex], [field]: value };
          setSlides(newSlides);
      }
  };

  const updateSlide = (field: keyof Slide, value: any) => {
    const newSlides = [...slides];
    if (field === 'template') {
        const current = newSlides[activeSlideIndex];
        if (value === 'image-top') { 
            current.imgBoxX = 0; current.imgBoxY = 0; current.imgBoxW = 100; current.imgBoxH = 50;
        } else if (value === 'image-bottom') {
            current.imgBoxX = 0; current.imgBoxY = 50; current.imgBoxW = 100; current.imgBoxH = 50;
        } else if (value === 'split') {
             current.imgBoxX = 0; current.imgBoxY = 0; current.imgBoxW = 100; current.imgBoxH = 100;
        }
        newSlides[activeSlideIndex] = { ...current, template: value };
    } else {
        newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], [field]: value };
    }
    setSlides(newSlides);
  };

  const loadCustomFont = () => {
    if (!customFontInput.trim() || !selectedTextId) return;
    const fontName = customFontInput.trim();
    const fontId = `font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(fontId)) {
        const link = document.createElement('link'); link.id = fontId; link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
        document.head.appendChild(link);
    }
    updateTextLayer(selectedTextId, 'fontFamily', `'${fontName}', sans-serif`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateSlide('imageUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setSelectedTextId(null);
    try {
        if (!window.html2canvas) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            document.head.appendChild(script);
            await new Promise(r => script.onload = r);
        }
        for (let i = 0; i < slides.length; i++) {
            const element = document.getElementById(`export-slide-${i}`);
            if (element) {
                const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
                const link = document.createElement('a');
                link.download = `${currentProjectName}-${i + 1}.png`;
                link.href = canvas.toDataURL('image/png'); 
                link.click();
            }
        }
    } catch (error) { console.error(error); } 
    finally { setIsExporting(false); }
  };

  // --- INTERAÇÕES MOUSE ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!interaction || !slideRef.current) return;
      const rect = slideRef.current.getBoundingClientRect();
      const scaleX = 100 / rect.width;
      const scaleY = 100 / rect.height;
      const dX = e.clientX - interaction.startX;
      const dY = e.clientY - interaction.startY;

      if (interaction.type === 'text' && interaction.id) {
        const init = interaction.initialVal;
        updateTextLayer(interaction.id, 'x', Math.max(0, Math.min(100, init.x + (dX * scaleX))));
        updateTextLayer(interaction.id, 'y', Math.max(0, Math.min(100, init.y + (dY * scaleY))));
      } else if (interaction.type === 'text_box_resize' && interaction.id) {
          updateTextLayer(interaction.id, 'w', Math.max(10, Math.min(100, interaction.initialVal + (dX * scaleX))));
      } else if (interaction.type === 'img_box_move') {
          const init = interaction.initialVal;
          const newSlides = [...slides];
          newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], imgBoxX: init.x + (dX * scaleX), imgBoxY: init.y + (dY * scaleY) };
          setSlides(newSlides);
      } else if (interaction.type === 'img_box_resize') {
          const init = interaction.initialVal;
          const newSlides = [...slides];
          newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], imgBoxW: Math.max(10, init.w + (dX * scaleX)), imgBoxH: Math.max(10, init.h + (dY * scaleY)) };
          setSlides(newSlides);
      }
    };
    const handleMouseUp = () => setInteraction(null);
    if (interaction) { 
        window.addEventListener('mousemove', handleMouseMove); 
        window.addEventListener('mouseup', handleMouseUp); 
    }
    return () => { 
        window.removeEventListener('mousemove', handleMouseMove); 
        window.removeEventListener('mouseup', handleMouseUp); 
    };
  }, [interaction, activeSlideIndex, slides]);

  const onInteractionStart = (type: string, id: string | null, e: React.MouseEvent) => {
      let initialVal;
      if (type === 'text' && id) { const layer = activeSlide.textLayers.find(t => t.id === id); initialVal = { x: layer?.x || 0, y: layer?.y || 0 }; }
      else if (type === 'text_box_resize' && id) { initialVal = activeSlide.textLayers.find(t => t.id === id)?.w || 80; }
      else if (type === 'img_box_move') { initialVal = { x: activeSlide.imgBoxX, y: activeSlide.imgBoxY }; }
      else if (type === 'img_box_resize') { initialVal = { w: activeSlide.imgBoxW, h: activeSlide.imgBoxH }; }
      setInteraction({ type, id, startX: e.clientX, startY: e.clientY, initialVal });
  };

  // --- RENDERS ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-slate-400 font-medium animate-pulse text-sm uppercase tracking-widest text-center">Abrindo Laboratório...</p>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-purple-50 p-4 font-sans text-slate-800">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex justify-center mb-6"><div className="bg-gradient-to-tr from-purple-600 to-pink-600 text-white p-3 rounded-xl shadow-lg"><Grid size={32} /></div></div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Image Laboratory</h1>
          <form onSubmit={handleAuth} className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-200" placeholder="seu@email.com" />
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all shadow-lg">Entrar (Acesso Livre)</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
           <div className="flex items-center gap-2"><div className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white p-2 rounded-lg"><Smartphone size={20} /></div><h1 className="text-xl font-bold">Dashboard</h1></div>
           <div className="flex items-center gap-4">
             <div className="text-sm text-slate-500">Olá, <strong>{user?.email}</strong></div>
             <button onClick={handleLogout} className="p-2 hover:bg-slate-100 rounded-lg"><LogOut size={18}/></button>
           </div>
        </header>
        <main className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-end mb-8">
                <div><h2 className="text-3xl font-bold">Seus Projetos</h2><p className="text-slate-500 mt-1">Gerencie seus carrosséis salvos.</p></div>
                <button onClick={createNewProject} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700 shadow-lg transition-all font-medium"><Plus size={20} /> Criar Novo Carrossel</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                         <FolderOpen className="mx-auto text-slate-300 mb-4" size={48} />
                         <p className="text-slate-500">Nenhum projeto encontrado. Comece agora!</p>
                    </div>
                )}
                {myProjects.map(proj => (
                    <div key={proj.id} onClick={() => openProject(proj)} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group relative">
                        <div className="h-40 bg-slate-100 flex items-center justify-center"><div className="w-20 h-28 shadow-sm" style={{ backgroundColor: proj.slides[0].backgroundColor }}></div></div>
                        <div className="p-4"><h3 className="font-bold text-slate-800">{proj.name}</h3><p className="text-xs text-slate-400 mt-1">Atualizado em {new Date(proj.lastModified).toLocaleDateString()}</p></div>
                        <button onClick={(e) => deleteProject(proj.id, e)} className="absolute top-2 right-2 p-2 bg-white text-red-500 rounded-lg shadow opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </main>
      </div>
    );
  }

  // --- EDITOR VIEW ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;700;900&family=Lora:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Playfair+Display:wght@400;700;900&family=Roboto:wght@400;700;900&display=swap');`}</style>
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Voltar ao Dashboard"><Home size={20}/></button>
            <div className="h-6 w-px bg-slate-200"></div>
            <input type="text" value={currentProjectName} onChange={(e) => setCurrentProjectName(e.target.value)} className="font-bold text-lg text-slate-800 bg-transparent outline-none focus:bg-slate-50 px-2 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setShowGuides(!showGuides)} className={`p-2 rounded-md ${showGuides ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400'}`} title="Guias de Segurança"><Ruler size={18} /></button>
            <div className="w-px bg-slate-200 mx-1"></div>
            <button onClick={() => setViewMode('single')} className={`p-2 rounded-md ${viewMode === 'single' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}><Smartphone size={18} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}><MoveHorizontal size={18} /></button>
          </div>
          <button onClick={handleSaveProject} disabled={isSaving} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-sm font-medium min-w-[100px] justify-center">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : saveMessage ? <><CheckCircle2 size={16}/> {saveMessage}</> : <><Save size={16} /> Salvar</>}
          </button>
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all text-sm font-medium">
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> Exportar</>}
          </button>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sair"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'single' && (
          <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto h-full z-20 shadow-lg md:shadow-none absolute md:relative custom-scrollbar">
            <div className="p-5 space-y-6">
              {/* TEXTOS */}
              <section>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Type size={14} /> Textos</label>
                    <button onClick={addTextLayer} className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-medium hover:bg-purple-200 transition-colors"><Plus size={12}/> Adicionar</button>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                        {activeSlide.textLayers.map(layer => (
                            <div key={layer.id} onClick={() => setSelectedTextId(layer.id)} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs ${selectedTextId === layer.id ? 'bg-purple-50 border-purple-300 text-purple-800 font-medium' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-600'}`}>
                                <span className="truncate max-w-[150px]">{layer.content || "(Vazio)"}</span>
                                <button onClick={(e) => { e.stopPropagation(); removeTextLayer(layer.id); }} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                    {activeTextLayer ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            <textarea value={activeTextLayer.content} onChange={(e) => updateTextLayer(activeTextLayer.id, 'content', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-purple-500 outline-none" rows={3} autoFocus />
                            <div className="flex items-center justify-between">
                                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    <button onClick={() => updateTextLayer(activeTextLayer.id, 'isBold', !activeTextLayer.isBold)} className={`p-1.5 hover:bg-slate-50 border-r ${activeTextLayer.isBold ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}><Bold size={14}/></button>
                                    <button onClick={() => updateTextLayer(activeTextLayer.id, 'isItalic', !activeTextLayer.isItalic)} className={`p-1.5 hover:bg-slate-50 border-r ${activeTextLayer.isItalic ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}><Italic size={14}/></button>
                                    <button onClick={() => updateTextLayer(activeTextLayer.id, 'isUnderline', !activeTextLayer.isUnderline)} className={`p-1.5 hover:bg-slate-50 ${activeTextLayer.isUnderline ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}><Underline size={14}/></button>
                                </div>
                                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    <button onClick={() => updateTextLayer(activeTextLayer.id, 'align', 'left')} className={`p-1.5 hover:bg-slate-50 border-r ${activeTextLayer.align === 'left' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}><AlignLeft size={14}/></button>
                                    <button onClick={() => updateTextLayer(activeTextLayer.id, 'align', 'center')} className={`p-1.5 hover:bg-slate-50 border-r ${activeTextLayer.align === 'center' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}><AlignCenter size={14}/></button>
                                    <button onClick={() => updateTextLayer(activeTextLayer.id, 'align', 'right')} className={`p-1.5 hover:bg-slate-50 ${activeTextLayer.align === 'right' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}><AlignRight size={14}/></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400">Tamanho</span>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                                        <button onClick={() => updateTextLayer(activeTextLayer.id, 'fontSize', Math.max(8, activeTextLayer.fontSize - 1))} className="px-2 py-1.5 hover:bg-slate-50"><Minus size={12}/></button>
                                        <span className="flex-1 text-center text-xs">{Math.round(activeTextLayer.fontSize)}</span>
                                        <button onClick={() => updateTextLayer(activeTextLayer.id, 'fontSize', Math.min(200, activeTextLayer.fontSize + 1))} className="px-2 py-1.5 hover:bg-slate-50"><PlusIcon size={12}/></button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400">Fonte</span>
                                    <select value={activeTextLayer.fontFamily} onChange={(e) => updateTextLayer(activeTextLayer.id, 'fontFamily', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                                        {fontOptions.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* ESPAÇAMENTO */}
                            <div className="bg-slate-100/50 p-2 rounded-lg border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between"><span className="text-[10px] text-slate-500 flex items-center gap-1"><ArrowUpDown size={10}/> Altura Linha</span><span className="text-[10px] text-slate-400">{activeTextLayer.lineHeight.toFixed(1)}</span></div>
                                <input type="range" min="0.8" max="2.5" step="0.1" value={activeTextLayer.lineHeight} onChange={(e) => updateTextLayer(activeTextLayer.id, 'lineHeight', parseFloat(e.target.value))} className="w-full h-1 bg-slate-300 rounded-lg accent-purple-600 cursor-pointer"/>
                                <div className="flex items-center justify-between mt-1"><span className="text-[10px] text-slate-500 flex items-center gap-1"><ArrowLeftRight size={10}/> Espaçamento</span><span className="text-[10px] text-slate-400">{activeTextLayer.letterSpacing}px</span></div>
                                <input type="range" min="-2" max="20" step="0.5" value={activeTextLayer.letterSpacing} onChange={(e) => updateTextLayer(activeTextLayer.id, 'letterSpacing', parseFloat(e.target.value))} className="w-full h-1 bg-slate-300 rounded-lg accent-purple-600 cursor-pointer"/>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                                    <input type="color" value={activeTextLayer.color} onChange={(e) => updateTextLayer(activeTextLayer.id, 'color', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"/>
                                    <span className="text-[10px] text-slate-500">Cor Texto</span>
                                </div>
                                <div className="flex-1 flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                                    <div className="relative">
                                        <input type="color" value={activeTextLayer.backgroundColor === 'transparent' ? '#ffffff' : activeTextLayer.backgroundColor} onChange={(e) => updateTextLayer(activeTextLayer.id, 'backgroundColor', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"/>
                                        {activeTextLayer.backgroundColor === 'transparent' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-full h-px bg-red-500 rotate-45"></div></div>}
                                    </div>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Highlighter size={10}/> Fundo</span>
                                    {activeTextLayer.backgroundColor !== 'transparent' && <button onClick={() => updateTextLayer(activeTextLayer.id, 'backgroundColor', 'transparent')} className="ml-auto text-slate-400 hover:text-red-500"><X size={10}/></button>}
                                </div>
                            </div>
                        </div>
                    ) : <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">Selecione um texto para editar</div>}
                </div>
              </section>

              {/* LAYOUT */}
              <section>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><LayoutTemplate size={14} /> Layout</label>
                <div className="grid grid-cols-2 gap-2">
                    {(['text-only', 'image-top', 'image-bottom', 'split'] as const).map((t) => (
                        <button key={t} onClick={() => updateSlide('template', t)} className={`p-2 text-[10px] border rounded-lg transition-all ${activeSlide.template === t ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{t.replace('-', ' ')}</button>
                    ))}
                </div>
              </section>

              {/* IMAGEM */}
              <section>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><ImageIcon size={14} /> Imagem</label>
                <div className="space-y-3">
                    <label className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors group">
                        <Upload size={16} className="text-slate-400 group-hover:text-purple-500" />
                        <span className="text-xs text-slate-500 group-hover:text-purple-700 font-medium">Carregar Arquivo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                    </label>
                    {activeSlide.imageUrl && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                            <div className="flex items-center gap-2 text-slate-500 mb-1"><Maximize2 size={12} /><span className="text-[10px] uppercase font-bold tracking-wider">Ajuste Interno</span></div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500"><span>Zoom</span><span>{activeSlide.imgZoom.toFixed(1)}x</span></div>
                                <input type="range" min="1" max="3" step="0.1" value={activeSlide.imgZoom} onChange={(e) => updateSlide('imgZoom', parseFloat(e.target.value))} className="w-full h-1 bg-slate-300 rounded-lg accent-purple-600 cursor-pointer"/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500">Pan X</span>
                                    <input type="range" min="0" max="100" value={activeSlide.imgPanX} onChange={(e) => updateSlide('imgPanX', parseFloat(e.target.value))} className="w-full h-1 bg-slate-300 rounded-lg accent-purple-600"/>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-500">Pan Y</span>
                                    <input type="range" min="0" max="100" value={activeSlide.imgPanY} onChange={(e) => updateSlide('imgPanY', parseFloat(e.target.value))} className="w-full h-1 bg-slate-300 rounded-lg accent-purple-600"/>
                                </div>
                            </div>
                            <button onClick={() => updateSlide('imageUrl', '')} className="w-full py-1 text-[10px] text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors font-medium">Remover Imagem</button>
                        </div>
                    )}
                </div>
              </section>

              {/* CORES E ESTILO */}
              <section>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Palette size={14} /> Cores e Estilo</label>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Fundo do Slide</span>
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <input type="color" value={activeSlide.backgroundColor} onChange={(e) => updateSlide('backgroundColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"/>
                            <span className="text-xs font-mono text-slate-500 uppercase">{activeSlide.backgroundColor}</span>
                        </div>
                    </div>
                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-purple-700"><Layers size={14} /><span className="text-[10px] uppercase font-bold tracking-wider">Sobreposição</span></div>
                            <button onClick={() => updateSlide('overlayEnabled', !activeSlide.overlayEnabled)} className={`p-1.5 rounded-md transition-all ${activeSlide.overlayEnabled ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>{activeSlide.overlayEnabled ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                        </div>
                        {activeSlide.overlayEnabled && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-purple-400 uppercase font-semibold">Cor da Camada</span>
                                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-purple-100">
                                        <input type="color" value={activeSlide.overlayColor} onChange={(e) => updateSlide('overlayColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"/>
                                        <span className="text-xs font-mono text-slate-500 uppercase">{activeSlide.overlayColor}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><Droplets size={10}/> Opacidade</span><span>{activeSlide.overlayOpacity}%</span></div>
                                    <input type="range" min="0" max="100" value={activeSlide.overlayOpacity} onChange={(e) => updateSlide('overlayOpacity', parseInt(e.target.value))} className="w-full h-1 bg-slate-300 rounded-lg accent-purple-600 cursor-pointer"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
              </section>

              {/* FONTE PERSONALIZADA */}
              <section>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Plus size={14} /> Fonte Externa</label>
                <div className="flex flex-col gap-2">
                    <input type="text" value={customFontInput} onChange={(e) => setCustomFontInput(e.target.value)} placeholder="Nome no Google Fonts (Ex: Oswald)" className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] outline-none" />
                    <button onClick={loadCustomFont} className="w-full px-2 py-1.5 bg-slate-200 hover:bg-purple-500 hover:text-white rounded-lg text-[10px] font-medium transition-colors">Aplicar ao Selecionado</button>
                </div>
              </section>
            </div>
          </aside>
        )}

        <section className="flex-1 bg-slate-100 relative flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-12 relative custom-scrollbar">
            {viewMode === 'single' ? (
              <div className="flex items-center gap-6 z-10 animate-in fade-in zoom-in-95 duration-500">
                <button onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))} disabled={activeSlideIndex === 0} className="p-3 rounded-full bg-white shadow-md disabled:opacity-30 hover:bg-slate-50 transition-colors text-slate-600"><ChevronLeft size={28} /></button>
                <div className="relative group p-4">
                  <SlideCanvas 
                    slide={activeSlide} 
                    scale={1.2} 
                    isEditing={true} 
                    showSafeZone={showGuides} 
                    selectedTextId={selectedTextId} 
                    onSelectText={setSelectedTextId} 
                    canvasRef={slideRef} 
                    onInteractionStart={onInteractionStart} 
                  />
                  {/* BARRA DE AÇÕES FLUTUANTE DO SLIDE */}
                  <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    <button onClick={(e) => duplicateSlide(activeSlideIndex, e)} className="p-3 bg-white text-purple-600 rounded-xl shadow-xl hover:scale-110 transition-all border border-purple-100 group" title="Duplicar Este Slide">
                        <Copy size={24}/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeSlide(activeSlideIndex); }} disabled={slides.length === 1} className="p-3 bg-white text-red-500 rounded-xl shadow-xl hover:scale-110 transition-all border border-red-100 disabled:opacity-50 disabled:scale-100" title="Excluir">
                        <Trash2 size={24}/>
                    </button>
                  </div>
                </div>
                <button onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))} disabled={activeSlideIndex === slides.length - 1} className="p-3 rounded-full bg-white shadow-md disabled:opacity-30 hover:bg-slate-50 transition-colors text-slate-600"><ChevronRight size={28} /></button>
              </div>
            ) : (
              <div className="flex items-center h-full gap-6 overflow-x-auto px-10 pb-8 custom-scrollbar">
                {slides.map((slide, idx) => (
                  <div key={slide.id} className="flex-shrink-0 group relative p-2 transition-transform hover:-translate-y-2 duration-300">
                    <SlideCanvas slide={slide} scale={0.8} />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => duplicateSlide(idx, e)} className="p-2 bg-white text-purple-600 rounded-lg shadow-lg border border-purple-100 hover:bg-purple-50"><Copy size={18}/></button>
                       <button onClick={(e) => { e.stopPropagation(); removeSlide(idx); }} disabled={slides.length === 1} className="p-2 bg-white text-red-500 rounded-lg shadow-lg border border-red-100 hover:bg-red-50"><Trash2 size={18}/></button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Slide {idx + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {viewMode === 'single' && (
            <div className="h-32 bg-white border-t border-slate-200 flex items-center px-4 gap-4 overflow-x-auto z-10 custom-scrollbar shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
              {slides.map((slide, idx) => (
                <div key={slide.id} className={`relative group flex-shrink-0 cursor-pointer transition-all ${idx === activeSlideIndex ? 'ring-4 ring-purple-500 ring-offset-2' : 'opacity-60 hover:opacity-100'}`} onClick={() => setActiveSlideIndex(idx)}>
                  <div className="w-16 h-20 bg-slate-200 rounded overflow-hidden relative shadow-sm"><div className="absolute inset-0" style={{ backgroundColor: slide.backgroundColor }}></div>{slide.imageUrl && <img src={slide.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />}</div>
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={(e) => duplicateSlide(idx, e)} className="bg-purple-600 text-white rounded-full p-1.5 shadow-lg border border-white hover:scale-110 transition-transform"><Copy size={12} /></button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-0.5">{idx + 1}</div>
                </div>
              ))}
              <button onClick={addSlide} className="w-16 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600 transition-all gap-1 flex-shrink-0"><Plus size={24} /><span className="text-[10px] font-bold">NOVO</span></button>
            </div>
          )}
        </section>
      </main>
      
      {/* CAMADA INVISÍVEL PARA EXPORTAÇÃO (HD) */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        {slides.map((slide, index) => (
          <div key={slide.id} id={`export-slide-${index}`} style={{ width: '1080px', height: '1350px' }}>
            <SlideCanvas slide={slide} scale={3.375} />
          </div>
        ))}
      </div>
    </div>
  );
}