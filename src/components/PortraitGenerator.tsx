import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Image as ImageIcon, Loader2, Download, Briefcase, Palette, Camera, Laptop,
  Sun, Moon, Film, Smile, Hexagon, Clock, Wand2, Shirt, Eraser, PaintBucket,
  Check, ChevronRight, ArrowLeft, Crop, FileType, Star, Zap, Lock, ShieldCheck,
  Undo, Redo, Eye, Droplets, Scissors, Glasses, SlidersHorizontal, Meh,
  SplitSquareHorizontal, Target, Mic, Heart, GraduationCap, Paintbrush, Linkedin, Github,
  Twitter, Globe, Package, Copy, CheckCheck, Shield, RefreshCw, FileText, Users,
} from 'lucide-react';
import { generateProfessionalPortrait, editProfessionalPortrait } from '../services/ai';
import type { IdentityLocks, ExpressionPreset, StyleOption } from '../services/ai';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ComparisonSlider from './ComparisonSlider';
import PrivacyNotice from './PrivacyNotice';
import { PLATFORM_PRESETS } from '../lib/platformPresets';

type EditMode = 'clothes' | 'background' | 'color' | 'region' | null;
type Step = 1 | 2 | 3 | 4;
type AspectRatio = '1:1' | '3:4';
type FileFormat = 'png' | 'jpg';
type NaturalnessPreset = 'natural' | 'polished' | 'studio';

const NATURALNESS_MAP: Record<NaturalnessPreset, number> = { natural: 15, polished: 50, studio: 85 };

export default function PortraitGenerator() {
  const [step, setStep] = useState<Step>(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('corporate');
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [customEditPrompt, setCustomEditPrompt] = useState('');
  const [regionTarget, setRegionTarget] = useState<string | null>(null);

  // Edit History
  const [history, setHistory] = useState<Record<number, string[]>>({});
  const [historyStep, setHistoryStep] = useState<Record<number, number>>({});

  // Phase 1 — Identity & Realism
  const [identityLocks, setIdentityLocks] = useState<IdentityLocks>({
    eyeColor: true,
    skinTone: true,
    hairLength: true,
    hairTexture: false,
    glasses: false,
  });
  const [naturalness, setNaturalness] = useState<number>(50);
  const [naturalnessPreset, setNaturalnessPreset] = useState<NaturalnessPreset>('polished');
  const [removeBlemishes, setRemoveBlemishes] = useState<boolean>(true);

  // Phase 2 — Styles & Expression
  const [expressionPreset, setExpressionPreset] = useState<ExpressionPreset>('confident_neutral');
  const [likenessStrength, setLikenessStrength] = useState<number>(70);
  const [numVariations, setNumVariations] = useState<number>(2);

  // Group photo — which person to use
  const [selectedPersonHint, setSelectedPersonHint] = useState<string | null>(null);
  const [customPersonDescription, setCustomPersonDescription] = useState('');

  // Phase 3 — Edit Studio
  const [compareMode, setCompareMode] = useState(false);

  // Phase 4 — Export
  const [exportRatio, setExportRatio] = useState<AspectRatio>('3:4');
  const [exportFormat, setExportFormat] = useState<FileFormat>('jpg');
  const [exportMode, setExportMode] = useState<'fill' | 'fit'>('fill');
  const [cropPosition, setCropPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPro, setIsPro] = useState(false);
  const [hasTransparentBackground, setHasTransparentBackground] = useState(false);
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);

  // Phase 5 — Privacy & Presets
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [presetCopied, setPresetCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCurrentImage = (index: number = selectedResultIndex): string | undefined => {
    if (!history[index] || history[index].length === 0) return generatedImages[index];
    return history[index][historyStep[index]];
  };

  useEffect(() => { setCropPosition({ x: 50, y: 50 }); }, [exportRatio]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setGeneratedImages([]);
      setHistory({});
      setHistoryStep({});
      setHasTransparentBackground(false);
      setSelectedResultIndex(0);
      setError(null);
      setCompareMode(false);
      setSelectedPersonHint(null);
      setCustomPersonDescription('');
      setStep(2);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setHistory({});
    setHistoryStep({});
    setHasTransparentBackground(false);
    setCompareMode(false);

    try {
      const [header, base64Data] = selectedImage.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      const personHint = selectedPersonHint === 'custom'
        ? customPersonDescription.trim() || null
        : selectedPersonHint;
      const results = await generateProfessionalPortrait(
        base64Data,
        mimeType,
        selectedStyle,
        likenessStrength,
        numVariations,
        identityLocks,
        naturalness,
        expressionPreset,
        personHint,
        removeBlemishes,
      );

      setGeneratedImages(results);
      const initialHistory: Record<number, string[]> = {};
      const initialSteps: Record<number, number> = {};
      results.forEach((img, idx) => { initialHistory[idx] = [img]; initialSteps[idx] = 0; });
      setHistory(initialHistory);
      setHistoryStep(initialSteps);
      setSelectedResultIndex(0);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError('Failed to generate portrait. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (instruction: string) => {
    if (generatedImages.length === 0) return;
    setIsEditing(true);
    setError(null);
    const isTransparent = instruction.toLowerCase().includes('transparent');

    try {
      const currentImage = getCurrentImage();
      if (!currentImage) return;
      const base64Data = currentImage.split(',')[1];
      const result = await editProfessionalPortrait(
        base64Data,
        instruction,
        regionTarget ?? undefined,
      );

      setHistory(prev => {
        const currentHist = prev[selectedResultIndex] || [generatedImages[selectedResultIndex]];
        const currentStep = historyStep[selectedResultIndex] || 0;
        const newHist = currentHist.slice(0, currentStep + 1);
        newHist.push(result);
        return { ...prev, [selectedResultIndex]: newHist };
      });
      setHistoryStep(prev => ({ ...prev, [selectedResultIndex]: (prev[selectedResultIndex] || 0) + 1 }));

      if (isTransparent) { setHasTransparentBackground(true); setExportFormat('png'); }
      else if (instruction.toLowerCase().includes('background')) setHasTransparentBackground(false);

      setEditMode(null);
      setRegionTarget(null);
    } catch (err) {
      console.error(err);
      setError('Failed to edit portrait. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndo = () => {
    const cur = historyStep[selectedResultIndex] || 0;
    if (cur > 0) setHistoryStep(prev => ({ ...prev, [selectedResultIndex]: cur - 1 }));
  };

  const handleRedo = () => {
    const cur = historyStep[selectedResultIndex] || 0;
    const hist = history[selectedResultIndex];
    if (hist && cur < hist.length - 1) setHistoryStep(prev => ({ ...prev, [selectedResultIndex]: cur + 1 }));
  };

  const renderToCanvas = (img: HTMLImageElement, width: number, height: number): string => {
    const canvas = canvasRef.current!;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (exportMode === 'fill') {
      const scale = Math.max(width / img.width, height / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const x = (width - sw) * (cropPosition.x / 100);
      const y = (height - sh) * (cropPosition.y / 100);
      ctx.drawImage(img, x, y, sw, sh);
    } else {
      const fillScale = Math.max(width / img.width, height / img.height);
      ctx.filter = 'blur(20px) brightness(0.8)';
      ctx.drawImage(img, (width - img.width * fillScale) / 2, (height - img.height * fillScale) / 2, img.width * fillScale, img.height * fillScale);
      ctx.filter = 'none';
      const scale = Math.min(width / img.width, height / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 20;
      ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
    }

    return canvas.toDataURL(exportFormat === 'png' ? 'image/png' : 'image/jpeg', 0.95);
  };

  const handleExport = () => {
    const currentImage = getCurrentImage();
    if (!currentImage || !canvasRef.current) return;
    if (exportFormat === 'png' && !isPro) { alert('PNG export is a Pro feature. Please upgrade or select JPG.'); return; }
    const baseSize = isPro ? 2048 : 1024;
    const [rW, rH] = exportRatio.split(':').map(Number);
    const ratio = rW / rH;
    const width = ratio > 1 ? baseSize : Math.round(baseSize * ratio);
    const height = ratio > 1 ? Math.round(baseSize / ratio) : baseSize;

    const img = new Image();
    img.src = currentImage;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const dataUrl = renderToCanvas(img, width, height);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `portrait-${selectedStyle}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  };

  const handlePlatformDownload = (presetId: string) => {
    const preset = PLATFORM_PRESETS.find(p => p.id === presetId);
    const currentImage = getCurrentImage();
    if (!preset || !currentImage || !canvasRef.current) return;

    setDownloadingPlatform(presetId);
    const img = new Image();
    img.src = currentImage;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const dataUrl = renderToCanvas(img, preset.width, preset.height);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = preset.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadingPlatform(null);
    };
  };

  const handleDownloadAll = () => {
    PLATFORM_PRESETS.forEach((preset, i) => {
      setTimeout(() => handlePlatformDownload(preset.id), i * 400);
    });
  };

  const handleCopyPreset = () => {
    const preset = {
      style: selectedStyle,
      likenessStrength,
      naturalness,
      naturalnessPreset,
      expressionPreset,
      identityLocks,
      numVariations,
      removeBlemishes,
    };
    navigator.clipboard.writeText(JSON.stringify(preset, null, 2));
    setPresetCopied(true);
    setTimeout(() => setPresetCopied(false), 2000);
  };

  const toggleLock = (key: keyof IdentityLocks) => {
    setIdentityLocks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setNaturalnessFromPreset = (preset: NaturalnessPreset) => {
    setNaturalnessPreset(preset);
    setNaturalness(NATURALNESS_MAP[preset]);
  };

  // Identity confidence score (visual, based on settings)
  const identityScore = Math.round(
    (likenessStrength * 0.4) +
    (Object.values(identityLocks).filter(Boolean).length / 5 * 40) +
    ((100 - naturalness) * 0.2)
  );

  const steps = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Style' },
    { num: 3, label: 'Edit' },
    { num: 4, label: 'Export' },
  ];

  const STYLES: Array<{ id: StyleOption; icon: React.ComponentType<{ className?: string }>; label: string; desc: string; isNew?: boolean }> = [
    { id: 'corporate', icon: Briefcase, label: 'Corporate', desc: 'Professional & Trustworthy' },
    { id: 'creative', icon: Palette, label: 'Creative', desc: 'Modern & Artistic' },
    { id: 'studio', icon: Camera, label: 'Studio', desc: 'High-End & Dramatic' },
    { id: 'tech', icon: Laptop, label: 'Tech', desc: 'Modern & Approachable' },
    { id: 'outdoor', icon: Sun, label: 'Outdoor', desc: 'Natural & Bright' },
    { id: 'bw', icon: Moon, label: 'B&W', desc: 'Timeless & Classic' },
    { id: 'vintage', icon: Clock, label: 'Vintage', desc: 'Retro Film Look' },
    { id: 'cinematic', icon: Film, label: 'Cinematic', desc: 'Movie Star Look' },
    { id: 'cartoon', icon: Smile, label: 'Cartoon', desc: '3D Pixar Style' },
    { id: 'art_deco', icon: Hexagon, label: 'Art Deco', desc: 'Elegant & Geometric' },
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', desc: 'Profile Optimized', isNew: true },
    { id: 'resume', icon: FileText, label: 'Resume', desc: 'Clean & Conservative', isNew: true },
    { id: 'speaker', icon: Mic, label: 'Speaker', desc: 'Stage Presence', isNew: true },
    { id: 'dating', icon: Heart, label: 'Dating', desc: 'Warm & Authentic', isNew: true },
    { id: 'academic', icon: GraduationCap, label: 'Academic', desc: 'Scholarly Authority', isNew: true },
    { id: 'creative_industry', icon: Paintbrush, label: 'Creative Pro', desc: 'Portfolio Style', isNew: true },
  ];

  const EXPRESSIONS: Array<{ id: ExpressionPreset; label: string; emoji: string; desc: string }> = [
    { id: 'confident_neutral', label: 'Confident Neutral', emoji: '😐', desc: 'Relaxed, focused — 2026\'s #1 trend' },
    { id: 'warm_smile', label: 'Warm Smile', emoji: '😊', desc: 'Genuine, approachable' },
    { id: 'serious_authority', label: 'Authority', emoji: '😤', desc: 'Executive presence' },
    { id: 'approachable_expert', label: 'Expert', emoji: '🙂', desc: 'Competent yet warm' },
    { id: 'natural', label: 'Natural', emoji: '✨', desc: 'AI decides naturally' },
  ];

  const IDENTITY_LOCK_ITEMS: Array<{ key: keyof IdentityLocks; icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { key: 'eyeColor', icon: Eye, label: 'Eye Color' },
    { key: 'skinTone', icon: Droplets, label: 'Skin Tone' },
    { key: 'hairLength', icon: Scissors, label: 'Hair Length' },
    { key: 'hairTexture', icon: RefreshCw, label: 'Hair Texture' },
    { key: 'glasses', icon: Glasses, label: 'Glasses' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
          ProPortrait <span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto">
          The only AI portrait tool that actually looks like you — identity-locked, skin-tone guaranteed, platform-ready.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-3">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className={cn('flex items-center gap-2', step === s.num ? 'text-indigo-600 font-semibold' : step > s.num ? 'text-green-600' : 'text-slate-400')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm border-2',
                  step === s.num ? 'border-indigo-600 bg-indigo-50' : step > s.num ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white')}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-sm">{s.label}</span>
              </div>
              {idx < steps.length - 1 && <div className={cn('w-10 h-0.5', step > s.num ? 'bg-green-600' : 'bg-slate-200')} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px]">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: UPLOAD ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-10 flex flex-col items-center justify-center min-h-[580px]">

              {/* Privacy Notice */}
              {showPrivacyNotice && <PrivacyNotice onDismiss={() => setShowPrivacyNotice(false)} />}

              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xl h-72 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/40 transition-all group mb-8"
              >
                <div className="w-18 h-18 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform w-20 h-20">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload your photo</h3>
                <p className="text-slate-500 mb-5 text-sm">Drag & drop or click to browse</p>
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-500 shadow-sm">
                  JPG, PNG, WEBP
                </div>
              </div>

              <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" /> Best Results
                  </h4>
                  <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                    <li>Good lighting (natural or indoor)</li>
                    <li>Face clearly visible, front-facing</li>
                    <li>Show natural hair (not tied up if keeping length)</li>
                    <li>Wear or remove glasses depending on preference</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4" /> Avoid
                  </h4>
                  <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                    <li>Blurry, dark, or heavily filtered photos</li>
                    <li>Extreme angles (group photos OK — select which person)</li>
                    <li>Hats or heavy shadows over face</li>
                    <li>Very low resolution images</li>
                  </ul>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />{error}
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: STYLE ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-8 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-2xl font-bold">Style & Settings</h2>
                <div className="w-20" />
              </div>

              {/* Uploaded photo preview + person selection for group photos */}
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="shrink-0">
                  {selectedImage && (
                    <img src={selectedImage} alt="Your photo" className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" /> Group photo?
                    <span className="text-xs font-normal text-slate-400">Select which person to use</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { id: null, label: 'Single person / Just me' },
                      { id: 'left', label: 'Person on left' },
                      { id: 'center', label: 'Person in center' },
                      { id: 'right', label: 'Person on right' },
                      { id: 'custom', label: 'Describe...' },
                    ].map(({ id, label }) => (
                      <button key={id ?? 'single'} onClick={() => setSelectedPersonHint(id)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          selectedPersonHint === id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200')}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {selectedPersonHint === 'custom' && (
                    <input type="text" placeholder="e.g. person in red shirt, woman with glasses"
                      value={customPersonDescription}
                      onChange={(e) => setCustomPersonDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                </div>
              </div>

              {/* Style Grid — 16 styles, 4 columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
                {STYLES.map((style) => (
                  <button key={style.id} onClick={() => setSelectedStyle(style.id)}
                    className={cn('flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center relative',
                      selectedStyle === style.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50')}>
                    {style.isNew && (
                      <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                    )}
                    <style.icon className={cn('w-6 h-6 mb-2', selectedStyle === style.id ? 'text-indigo-600' : 'text-slate-400')} />
                    <div className="font-semibold text-xs mb-0.5">{style.label}</div>
                    <div className="text-[10px] opacity-60 leading-tight">{style.desc}</div>
                  </button>
                ))}
              </div>

              {/* Expression Presets */}
              <div className="mb-5 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Meh className="w-4 h-4 text-amber-500" /> Expression Control
                  <span className="text-xs font-normal text-amber-600 ml-1">Fix the "blank stare" problem</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {EXPRESSIONS.map((expr) => (
                    <button key={expr.id} onClick={() => setExpressionPreset(expr.id)}
                      className={cn('p-2.5 rounded-xl border-2 text-center transition-all',
                        expressionPreset === expr.id ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300')}>
                      <div className="text-2xl mb-1">{expr.emoji}</div>
                      <div className="font-semibold text-xs">{expr.label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5 leading-tight">{expr.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Advanced Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  {/* Likeness */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Likeness Strength</label>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{likenessStrength}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="10" value={likenessStrength}
                      onChange={(e) => setLikenessStrength(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                      <span>Creative</span><span>Balanced</span><span>Exact</span>
                    </div>
                  </div>

                  {/* Variations */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Number of Variations</label>
                    <div className="flex gap-2">
                      {[2, 4].map(num => (
                        <button key={num} onClick={() => setNumVariations(num)}
                          className={cn('flex-1 py-2 rounded-lg border text-sm font-medium transition-all relative',
                            numVariations === num ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200')}>
                          {num} Images
                          {num === 4 && <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">BEST</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Identity Locks — Phase 1 */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" /> Identity Locks
                    <span className="text-xs font-normal text-slate-400">Lock features so AI never changes them</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {IDENTITY_LOCK_ITEMS.map(({ key, icon: Icon, label }) => (
                      <button key={key} onClick={() => toggleLock(key)}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          identityLocks[key]
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300')}>
                        <Icon className="w-3 h-3" />
                        {label}
                        {identityLocks[key] && <Lock className="w-2.5 h-2.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin Smoothness — Phase 1 */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" /> Skin Smoothness
                    <span className="text-xs font-normal text-slate-400">Control texture vs polished look</span>
                  </h4>
                  <div className="flex gap-2 mb-2">
                    {(['natural', 'polished', 'studio'] as NaturalnessPreset[]).map((preset) => (
                      <button key={preset} onClick={() => setNaturalnessFromPreset(preset)}
                        className={cn('flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all',
                          naturalnessPreset === preset
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200')}>
                        {preset === 'natural' ? '🌿 Natural' : preset === 'polished' ? '✨ Polished' : '📸 Studio'}
                      </button>
                    ))}
                  </div>
                  <input type="range" min="0" max="100" step="5" value={naturalness}
                    onChange={(e) => { setNaturalness(parseInt(e.target.value)); setNaturalnessPreset('polished'); }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                    <span>Real texture</span><span>Balanced</span><span>Max smooth</span>
                  </div>
                </div>

                {/* Remove Blemishes Toggle */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Eraser className="w-3.5 h-3.5 text-indigo-500" /> Blemishes & Imperfections
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={() => setRemoveBlemishes(true)}
                      className={cn('flex-1 py-2 rounded-lg border text-xs font-medium transition-all',
                        removeBlemishes ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200')}>
                      Remove spots & blemishes
                    </button>
                    <button onClick={() => setRemoveBlemishes(false)}
                      className={cn('flex-1 py-2 rounded-lg border text-xs font-medium transition-all',
                        !removeBlemishes ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200')}>
                      Keep natural (preserve all)
                    </button>
                  </div>
                </div>

                {/* Identity Confidence Score */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">Identity Confidence</span>
                      <span className={cn('font-bold', identityScore >= 70 ? 'text-green-600' : identityScore >= 40 ? 'text-amber-600' : 'text-red-500')}>
                        {identityScore}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all',
                        identityScore >= 70 ? 'bg-green-500' : identityScore >= 40 ? 'bg-amber-400' : 'bg-red-400')}
                        style={{ width: `${identityScore}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{identityScore >= 70 ? 'High' : identityScore >= 40 ? 'Medium' : 'Low'}</span>
                </div>
              </div>

              {/* Copy Preset */}
              <div className="flex items-center gap-3 mb-6">
                <button onClick={handleCopyPreset}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-all">
                  {presetCopied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {presetCopied ? 'Copied!' : 'Copy Settings JSON'}
                </button>
                <span className="text-xs text-slate-400">Share settings with your team for consistent results</span>
              </div>

              <div className="flex justify-center">
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-3">
                  {isGenerating ? (
                    <><Loader2 className="w-6 h-6 animate-spin" />Generating {numVariations} Portraits...</>
                  ) : (
                    <><Zap className="w-5 h-5" />Generate Portraits <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
              {isGenerating && (
                <p className="text-center text-slate-400 mt-4 text-sm animate-pulse">
                  This may take 20–40 seconds · Generating {numVariations} identity-locked portraits
                </p>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">{error}</div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: EDIT ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-2xl font-bold">Review & Edit</h2>
                <button onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm">
                  Export <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 flex gap-6 min-h-0">
                {/* Main Image */}
                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-3 relative overflow-hidden group min-h-[480px]">
                  {generatedImages.length > 0 && (
                    compareMode && selectedImage ? (
                      <div className="w-full h-full">
                        <ComparisonSlider
                          beforeSrc={selectedImage}
                          afterSrc={getCurrentImage()!}
                          beforeLabel="Original"
                          afterLabel="AI Portrait"
                        />
                      </div>
                    ) : (
                      <img src={getCurrentImage()} alt="Portrait" className="max-h-full max-w-full object-contain shadow-lg rounded-lg" referrerPolicy="no-referrer" />
                    )
                  )}

                  {/* Compare Toggle */}
                  <button
                    onClick={() => setCompareMode(c => !c)}
                    className={cn('absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shadow-sm',
                      compareMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300')}
                  >
                    <SplitSquareHorizontal className="w-3.5 h-3.5" />
                    {compareMode ? 'Exit Compare' : 'Compare Original'}
                  </button>

                  {/* Undo/Redo */}
                  {!compareMode && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={handleUndo} disabled={!historyStep[selectedResultIndex]}
                        className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 text-slate-700 transition-colors" title="Undo">
                        <Undo className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-slate-400 px-1">
                        {(historyStep[selectedResultIndex] || 0) + 1} / {history[selectedResultIndex]?.length || 1}
                      </span>
                      <button onClick={handleRedo}
                        disabled={!history[selectedResultIndex] || historyStep[selectedResultIndex] >= history[selectedResultIndex].length - 1}
                        className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 text-slate-700 transition-colors" title="Redo">
                        <Redo className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isEditing && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                      <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        <span className="font-medium text-slate-900 text-sm">Applying edit{regionTarget ? ` (${regionTarget} only)` : ''}...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="w-72 flex flex-col gap-4 overflow-y-auto">
                  {/* Variations */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Variations</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                      {generatedImages.map((img, idx) => (
                        <button key={idx} onClick={() => { setSelectedResultIndex(idx); setCompareMode(false); }}
                          className={cn('aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                            selectedResultIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 opacity-60 hover:opacity-100')}>
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* History Strip — Phase 3 */}
                  {history[selectedResultIndex] && history[selectedResultIndex].length > 1 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Edit History</h3>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {history[selectedResultIndex].map((img, idx) => (
                          <button key={idx} onClick={() => setHistoryStep(prev => ({ ...prev, [selectedResultIndex]: idx }))}
                            className={cn('shrink-0 w-12 aspect-[3/4] rounded-md overflow-hidden border-2 transition-all',
                              historyStep[selectedResultIndex] === idx ? 'border-indigo-600' : 'border-slate-200 opacity-50 hover:opacity-80')}>
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Editor */}
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600" /> AI Editor
                    </h3>

                    {/* Edit Mode Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {[
                        { mode: 'clothes' as EditMode, icon: Shirt, label: 'Clothes' },
                        { mode: 'background' as EditMode, icon: ImageIcon, label: 'BG' },
                        { mode: 'color' as EditMode, icon: PaintBucket, label: 'Color' },
                        { mode: 'region' as EditMode, icon: Target, label: 'Region' },
                      ].map(({ mode, icon: Icon, label }) => (
                        <button key={mode} onClick={() => { setEditMode(editMode === mode ? null : mode); setRegionTarget(null); }}
                          className={cn('py-2 rounded-lg text-[10px] font-medium border transition-all flex flex-col items-center gap-1',
                            editMode === mode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')}>
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {editMode && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="bg-slate-50 rounded-xl p-2.5 mb-3 overflow-hidden">
                          <div className="grid grid-cols-1 gap-1 max-h-44 overflow-y-auto">
                            {editMode === 'clothes' && ['Dark Business Suit', 'Tuxedo', 'Casual T-Shirt', 'Leather Jacket', 'Turtleneck', 'White Dress Shirt', 'Navy Blazer', 'Hoodie'].map(item => (
                              <button key={item} onClick={() => handleEdit(`Change clothing to: ${item}`)} disabled={isEditing}
                                className="text-left text-xs py-1.5 px-2.5 hover:bg-white rounded-lg transition-colors text-slate-700 font-medium">{item}</button>
                            ))}
                            {editMode === 'background' && ['Solid White', 'Solid Grey', 'Soft Gradient', 'Modern Office', 'Brick Wall', 'Abstract Studio', 'City Skyline', 'Natural Outdoors', 'Library', 'Transparent'].map(item => (
                              <button key={item} onClick={() => handleEdit(item === 'Transparent' ? 'Remove the background completely and make it transparent.' : `Change the background to: ${item}`)} disabled={isEditing}
                                className="text-left text-xs py-1.5 px-2.5 hover:bg-white rounded-lg transition-colors text-slate-700 font-medium">{item}</button>
                            ))}
                            {editMode === 'color' && ['Black and White', 'Warm Golden Tones', 'Cool Blue Tones', 'Cinematic Teal & Orange', 'Vintage Sepia', 'Soft Pastel', 'High Contrast'].map(item => (
                              <button key={item} onClick={() => handleEdit(`Apply ${item} color grading to the entire image`)} disabled={isEditing}
                                className="text-left text-xs py-1.5 px-2.5 hover:bg-white rounded-lg transition-colors text-slate-700 font-medium">{item}</button>
                            ))}
                            {editMode === 'region' && (
                              <>
                                <p className="text-[10px] text-slate-400 px-2 mb-1">Select what to change, then type your instruction:</p>
                                {['background only', 'clothing only', 'lighting only', 'hair only', 'color grading only'].map(region => (
                                  <button key={region} onClick={() => setRegionTarget(region === regionTarget ? null : region)}
                                    className={cn('text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors font-medium border',
                                      regionTarget === region ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')}>
                                    {regionTarget === region ? '✓ ' : ''}{region}
                                  </button>
                                ))}
                                {regionTarget && (
                                  <p className="text-[10px] text-indigo-600 px-2 mt-1 font-medium">
                                    Locked to: {regionTarget} — type instruction below
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Custom Prompt */}
                    <div className="relative">
                      <input type="text" placeholder={regionTarget ? `Describe change (${regionTarget})...` : 'Custom edit prompt...'}
                        className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={customEditPrompt}
                        onChange={(e) => setCustomEditPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && customEditPrompt && handleEdit(customEditPrompt)} />
                      <button onClick={() => customEditPrompt && handleEdit(customEditPrompt)} disabled={!customEditPrompt || isEditing}
                        className="absolute right-1.5 top-1.5 p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: EXPORT ── */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setStep(3)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-2xl font-bold">Export Portrait</h2>
                <div className="w-20" />
              </div>

              <div className="flex gap-8 flex-1">
                {/* Preview */}
                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-8 min-h-[400px] overflow-hidden">
                  <div className="relative shadow-2xl overflow-hidden bg-white transition-all"
                    style={{ aspectRatio: exportRatio.replace(':', '/'), maxHeight: '480px', maxWidth: '100%', width: 'auto', height: '100%' }}>
                    {exportMode === 'fit' && (
                      <div className="absolute inset-0 bg-cover bg-center blur-lg opacity-50 scale-110" style={{ backgroundImage: `url(${getCurrentImage()})` }} />
                    )}
                    <img src={getCurrentImage()} alt="Export Preview" className="w-full h-full"
                      style={{ objectFit: exportMode === 'fill' ? 'cover' : 'contain', objectPosition: `${cropPosition.x}% ${cropPosition.y}%` }}
                      referrerPolicy="no-referrer" />
                  </div>
                </div>

                {/* Controls */}
                <div className="w-80 flex flex-col gap-5 overflow-y-auto">
                  {/* Aspect Ratio */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Crop className="w-4 h-4 text-indigo-600" /> Aspect Ratio
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(['1:1', '3:4'] as AspectRatio[]).map((ratio) => (
                        <button key={ratio} onClick={() => setExportRatio(ratio)}
                          className={cn('py-2 px-3 rounded-lg border text-sm font-medium transition-all',
                            exportRatio === ratio ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200')}>
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Layout Mode</h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setExportMode('fill')}
                        className={cn('flex-1 py-2 text-xs font-medium rounded-md transition-all', exportMode === 'fill' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500')}>
                        Fill Frame
                      </button>
                      <button onClick={() => setExportMode('fit')}
                        className={cn('flex-1 py-2 text-xs font-medium rounded-md transition-all', exportMode === 'fit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500')}>
                        Fit Image
                      </button>
                    </div>
                  </div>

                  {/* Position Sliders */}
                  {exportMode === 'fill' && (
                    <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {(['x', 'y'] as const).map(axis => (
                        <div key={axis}>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{axis === 'x' ? 'Horizontal' : 'Vertical'} Position</span>
                            <span>{cropPosition[axis]}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={cropPosition[axis]}
                            onChange={(e) => setCropPosition(prev => ({ ...prev, [axis]: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Format */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <FileType className="w-4 h-4 text-indigo-600" /> Format
                    </h3>
                    {hasTransparentBackground && (
                      <p className="text-xs text-indigo-600 mb-2 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Transparent background — PNG required
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {(['png', 'jpg'] as FileFormat[]).map((fmt) => (
                        <button key={fmt} onClick={() => { if (hasTransparentBackground && fmt === 'jpg') return; setExportFormat(fmt); }}
                          disabled={hasTransparentBackground && fmt === 'jpg'}
                          className={cn('py-2 px-3 rounded-lg border text-sm font-medium transition-all uppercase relative overflow-hidden',
                            exportFormat === fmt ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-600',
                            fmt === 'png' && !isPro && 'opacity-70',
                            hasTransparentBackground && fmt === 'jpg' && 'opacity-30 cursor-not-allowed')}>
                          {fmt}
                          {fmt === 'png' && !isPro && !hasTransparentBackground && (
                            <div className="absolute inset-0 bg-slate-100/50 flex items-center justify-center backdrop-blur-[1px]">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pro Banner */}
                  {!isPro ? (
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <h3 className="font-bold text-sm">Upgrade to Pro</h3>
                      </div>
                      <ul className="text-xs space-y-1 mb-3 opacity-90">
                        <li className="flex items-center gap-1"><Check className="w-3 h-3" /> High Resolution (2048px)</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3" /> PNG Lossless Format</li>
                        <li className="flex items-center gap-1"><Check className="w-3 h-3" /> All platform exports</li>
                      </ul>
                      <button onClick={() => setIsPro(true)} className="w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50">
                        Unlock for $9.99
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <Star className="w-5 h-5 fill-green-500 text-green-500" />
                      <div><div className="font-bold text-sm text-green-800">Pro Active</div><div className="text-xs text-green-600">High Res & PNG Unlocked</div></div>
                    </div>
                  )}

                  {/* Standard Download */}
                  <button onClick={handleExport}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download {isPro ? '(Pro)' : '(Free)'}
                  </button>

                  {/* Platform Export — Phase 4 */}
                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-600" /> Platform Export
                      <span className="text-xs font-normal text-slate-400">Optimized sizes</span>
                    </h3>
                    <div className="space-y-1.5">
                      {PLATFORM_PRESETS.map((preset) => {
                        const icons: Record<string, React.ComponentType<{ className?: string }>> = {
                          linkedin: Linkedin, github: Github, twitter: Twitter,
                          instagram: Globe, resume: FileText,
                        };
                        const Icon = icons[preset.id] || Globe;
                        return (
                          <button key={preset.id} onClick={() => handlePlatformDownload(preset.id)}
                            disabled={!!downloadingPlatform}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-50 text-xs">
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-medium text-slate-700">{preset.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">{preset.description}</span>
                              {downloadingPlatform === preset.id ? (
                                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleDownloadAll} disabled={!!downloadingPlatform}
                      className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                      <Package className="w-3.5 h-3.5" /> Download All Platforms
                    </button>
                  </div>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
