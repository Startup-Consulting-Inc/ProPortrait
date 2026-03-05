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
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import ComparisonSlider from './ComparisonSlider';
import GenerationProgress from './GenerationProgress';
import PricingModal from './PricingModal';
import EmailCapture from './EmailCapture';
import { useAuthContext } from '../contexts/AuthContext';
import { capture } from '../services/analytics';
import FeatureTour from './FeatureTour';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { PLATFORM_PRESETS } from '../lib/platformPresets';

type EditMode = 'clothes' | 'background' | 'color' | 'region' | null;
type Step = 1 | 2 | 3 | 4;
type AspectRatio = '1:1' | '3:4';
type FileFormat = 'png' | 'jpg';
type NaturalnessPreset = 'natural' | 'polished' | 'studio';

const NATURALNESS_MAP: Record<NaturalnessPreset, number> = { natural: 15, polished: 50, studio: 85 };

export default function PortraitGenerator() {
  const { isPro, refreshProfile } = useAuthContext();
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
  const variantCountFlag = useFeatureFlag<number>('variant-count', 2);
  const [numVariations, setNumVariations] = useState<number>(variantCountFlag);

  // Group photo — which person to use
  const [selectedPersonHint, setSelectedPersonHint] = useState<string | null>(null);
  const [customPersonDescription, setCustomPersonDescription] = useState('');

  // Phase 3 — Edit Studio
  const [compareMode, setCompareMode] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  // Clothes sub-wizard
  const [clothesStyle, setClothesStyle] = useState('');
  const [clothesColor, setClothesColor] = useState('');
  // BG sub-wizard
  const [bgCategory, setBgCategory] = useState('');

  // Phase 4 — Export
  const [exportRatio, setExportRatio] = useState<AspectRatio>('3:4');
  const [exportFormat, setExportFormat] = useState<FileFormat>('jpg');
  const [exportMode, setExportMode] = useState<'fill' | 'fit'>('fill');
  const [cropPosition, setCropPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [hasTransparentBackground, setHasTransparentBackground] = useState(false);
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  // Phase 5 — Presets
  const [presetCopied, setPresetCopied] = useState(false);

  // Quick / Advanced mode
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generationStartRef = useRef<number>(0);

  const getCurrentImage = (index: number = selectedResultIndex): string | undefined => {
    if (!history[index] || history[index].length === 0) return generatedImages[index];
    return history[index][historyStep[index]];
  };

  useEffect(() => { setCropPosition({ x: 50, y: 50 }); }, [exportRatio]);

  // Track paywall impression when reaching Step 4 as free user
  useEffect(() => {
    if (step === 4 && !isPro) capture('paywall_shown', { trigger: 'step4' });
  }, [step, isPro]);

  // Feature tour state
  const [showTour, setShowTour] = useState(false);

  // WCAG 2.1 AA: announce step changes to screen readers
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  useEffect(() => {
    const labels = [
      '', 'Step 1 of 4: Upload your photo', 'Step 2 of 4: Configure style',
      'Step 3 of 4: Review and edit', 'Step 4 of 4: Export portrait',
    ];
    setStepAnnouncement(labels[step] ?? '');
  }, [step]);

  // WCAG 2.1 AA: respect prefers-reduced-motion
  const shouldReduceMotion = useReducedMotion();
  const slideAnim = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };
  const collapseAnim = shouldReduceMotion
    ? {}
    : { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.');
      event.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      event.target.value = '';
      return;
    }
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
      capture('photo_uploaded', {
        fileSizeMB: +(file.size / 1024 / 1024).toFixed(2),
        fileType: file.type,
      });
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
    generationStartRef.current = Date.now();
    capture('generation_started', { style: selectedStyle, numVariations, isPro });

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
      if (!localStorage.getItem('pp_tour_done')) setShowTour(true);
      capture('generation_completed', {
        durationMs: Date.now() - generationStartRef.current,
        style: selectedStyle,
        success: true,
      });
      // Show email capture once per browser session
      if (!sessionStorage.getItem('pp_email_captured')) setShowEmailCapture(true);
    } catch (err) {
      capture('generation_failed', {
        error: err instanceof Error ? err.message : 'unknown',
        durationMs: Date.now() - generationStartRef.current,
      });
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
      // R2 signed URLs start with https:// — pass as-is; server fetches them.
      // Local data URLs: strip the data:...;base64, prefix before sending.
      const imageData = currentImage.startsWith('http')
        ? currentImage
        : (currentImage.split(',')[1] ?? currentImage);
      const result = await editProfessionalPortrait(
        imageData,
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

      setPromptHistory(prev => [instruction, ...prev.filter(p => p !== instruction)].slice(0, 15));
      setCustomEditPrompt('');
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

  // Keyboard shortcuts: Cmd/Ctrl+Z → undo, Cmd/Ctrl+Shift+Z → redo (Step 3 only)
  useEffect(() => {
    if (step !== 3) return;
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, selectedResultIndex, historyStep, history]);

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
      capture('portrait_downloaded', { platform: 'custom', isPro });
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
      capture('platform_downloaded', { platform: presetId, isPro });
    };
  };

  const handleDownloadAll = async () => {
    const JSZip = (await import('jszip')).default;
    const currentImage = getCurrentImage();
    if (!currentImage || !canvasRef.current) return;
    setDownloadingPlatform('all');
    const zip = new JSZip();
    const img = new Image();
    img.src = currentImage;
    img.crossOrigin = 'anonymous';
    await new Promise<void>(r => { img.onload = () => r(); });
    for (const preset of PLATFORM_PRESETS) {
      const dataUrl = renderToCanvas(img, preset.width, preset.height);
      const base64 = dataUrl.split(',')[1];
      zip.file(preset.filename, base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proportrait-all-platforms.zip';
    a.click();
    URL.revokeObjectURL(url);
    setDownloadingPlatform(null);
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

  // Quick mode style subset
  const QUICK_STYLE_IDS: StyleOption[] = ['corporate', 'linkedin', 'studio', 'tech', 'creative', 'bw', 'vintage', 'cinematic'];

  // Reset sub-wizards when switching edit mode
  useEffect(() => {
    if (editMode !== 'clothes') { setClothesStyle(''); setClothesColor(''); }
    if (editMode !== 'background') { setBgCategory(''); }
  }, [editMode]);

  const BG_CATEGORIES: Array<{ name: string; emoji: string; options: string[]; pro?: boolean }> = [
    { name: 'Solid Color',      emoji: '⬜', options: ['Pure White', 'Light Grey', 'Dark Charcoal', 'Soft Cream', 'Muted Slate', 'Jet Black'] },
    { name: 'Soft Gradient',    emoji: '🌫️', options: ['White to Light Grey', 'Sky Blue Fade', 'Warm Peach', 'Purple Dusk', 'Neutral Beige', 'Seafoam Green'] },
    { name: 'Modern Office',    emoji: '🏢', options: ['Open Plan', 'Executive Suite', 'Conference Room', 'Co-working Space', 'Minimalist Desk', 'Glass Walls'] },
    { name: 'Natural Outdoors', emoji: '🌿', options: ['Park & Green Lawn', 'Autumn Forest', 'Cherry Blossoms', 'Mountain View', 'Beach & Ocean', 'Garden Path', 'Snowy Woods', 'Rocky Cliff'] },
    { name: 'Urban & City',     emoji: '🌆', options: ['City Skyline (Day)', 'City Skyline (Night)', 'Rooftop Terrace', 'Street Café', 'Modern Architecture', 'Brick Wall Alley'] },
    { name: 'Indoor Spaces',    emoji: '📚', options: ['Library', 'Home Study', 'Art Gallery', 'Luxury Hotel Lobby', 'Coffee Shop', 'Cozy Living Room'] },
    { name: 'Abstract Studio',  emoji: '🎨', options: ['Abstract Blue', 'Abstract Warm', 'Dark Studio', 'Light Studio', 'Bokeh Blur', 'Geometric Pattern'] },
    { name: 'Transparent',      emoji: '🔲', options: [], pro: true },
  ];

  const CLOTHES_STYLES = [
    'Business Suit', 'Tuxedo', 'Blazer', 'Dress Shirt',
    'Leather Jacket', 'Turtleneck', 'Hoodie', 'Casual T-Shirt',
    'Polo Shirt', 'Cardigan', 'Denim Jacket', 'Sweater',
  ];

  const CLOTHES_COLORS = [
    { name: 'Black',        hex: '#1c1c1c' },
    { name: 'Charcoal',     hex: '#4a4a4a' },
    { name: 'Navy',         hex: '#1e3a5f' },
    { name: 'White',        hex: '#f5f5f5' },
    { name: 'Light Blue',   hex: '#6fa8dc' },
    { name: 'Grey',         hex: '#8a8a8a' },
    { name: 'Burgundy',     hex: '#800020' },
    { name: 'Brown',        hex: '#6b3a2a' },
    { name: 'Olive',        hex: '#5a5a2a' },
    { name: 'Forest Green', hex: '#2d5a27' },
    { name: 'Camel',        hex: '#c19a6b' },
    { name: 'Cream',        hex: '#f5f0dc' },
  ];

  const CLOTHES_PATTERNS = [
    { name: 'Solid',          desc: 'Plain, no pattern' },
    { name: 'Pinstripe',      desc: 'Thin vertical lines' },
    { name: 'Plaid',          desc: 'Checkered pattern' },
    { name: 'Houndstooth',    desc: 'Classic broken check' },
    { name: 'Herringbone',    desc: 'V-shaped weave' },
    { name: 'Subtle Texture', desc: 'Woven, understated' },
    { name: 'Floral',         desc: 'Floral motif' },
    { name: 'Geometric',      desc: 'Abstract shapes' },
  ];

  const PATTERN_SWATCHES: Record<string, React.CSSProperties> = {
    Solid: {
      background: '#374151',
    },
    Pinstripe: {
      background: '#1e3a5f',
      backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 8px)',
    },
    Plaid: {
      background: '#2d5a27',
      backgroundImage: [
        'repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 10px)',
        'repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 10px)',
      ].join(', '),
    },
    Houndstooth: {
      background: '#4a4a4a',
      backgroundImage: [
        'linear-gradient(135deg, rgba(255,255,255,0.3) 25%, transparent 25%)',
        'linear-gradient(225deg, rgba(255,255,255,0.3) 25%, transparent 25%)',
        'linear-gradient(315deg, rgba(255,255,255,0.3) 25%, transparent 25%)',
        'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%)',
      ].join(', '),
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 5px 0, 5px -5px, 0px 5px',
    },
    Herringbone: {
      background: '#2c2c2c',
      backgroundImage: [
        'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 8px)',
        'repeating-linear-gradient(-45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 8px)',
      ].join(', '),
    },
    'Subtle Texture': {
      background: '#5a5a4a',
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)',
      backgroundSize: '4px 4px',
    },
    Floral: {
      background: '#800020',
      backgroundImage: [
        'radial-gradient(circle at 25% 30%, rgba(255,200,200,0.5) 4px, transparent 4px)',
        'radial-gradient(circle at 70% 65%, rgba(255,180,180,0.4) 5px, transparent 5px)',
        'radial-gradient(circle at 55% 20%, rgba(255,220,200,0.35) 3px, transparent 3px)',
        'radial-gradient(circle at 15% 75%, rgba(255,200,180,0.4) 4px, transparent 4px)',
      ].join(', '),
    },
    Geometric: {
      background: '#1e3a5f',
      backgroundImage: [
        'linear-gradient(60deg, rgba(255,255,255,0.15) 25%, transparent 25%)',
        'linear-gradient(-60deg, rgba(255,255,255,0.15) 25%, transparent 25%)',
      ].join(', '),
      backgroundSize: '12px 12px',
    },
  };

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
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/logo.svg" alt="ProPortrait AI" className="w-11 h-11 rounded-xl shadow-md" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            ProPortrait <span className="text-indigo-600">AI</span>
          </h1>
        </div>
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

      {/* WCAG: announce step changes to screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {stepAnnouncement}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[600px]">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: UPLOAD ── */}
          {step === 1 && (
            <motion.div key="step1" {...slideAnim}
              className="p-10 flex flex-col items-center justify-center min-h-[580px]">

              {/* Social Proof Strip */}
              <div className="flex items-center justify-center gap-5 mb-5 flex-wrap">
                {['10,000+ portraits generated', 'Identity-locked AI', 'Works in 30 seconds'].map(chip => (
                  <span key={chip} className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block shrink-0" />
                    {chip}
                  </span>
                ))}
              </div>

              {/* Upload Zone */}
              <button
                type="button"
                aria-label="Upload your photo — click to browse files"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xl min-h-[200px] h-48 md:h-72 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/40 transition-all group mb-8"
              >
                <div className="w-18 h-18 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform w-20 h-20">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload your photo</h3>
                <p className="text-slate-500 mb-5 text-sm">Drag & drop or click to browse</p>
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-500 shadow-sm">
                  JPG, PNG, WEBP
                </div>
              </button>

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
                <div role="alert" aria-live="assertive" className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />{error}
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: STYLE ── */}
          {step === 2 && (
            <motion.div key="step2" {...slideAnim}
              className="p-8 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-2xl font-bold">{showAdvanced ? 'Style & Settings' : 'Choose Your Style'}</h2>
                <div className="w-20" />
              </div>

              {/* Quick / Advanced mode toggle */}
              <div className="flex justify-center mb-5">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setShowAdvanced(false)}
                    className={cn('px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
                      !showAdvanced ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700')}>
                    <Zap className="w-3.5 h-3.5" /> Quick
                  </button>
                  <button onClick={() => setShowAdvanced(true)}
                    className={cn('px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
                      showAdvanced ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700')}>
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Advanced
                  </button>
                </div>
              </div>

              {/* Uploaded photo preview (Quick: thumbnail only) + person selection for group photos (Advanced only) */}
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="shrink-0">
                  {selectedImage && (
                    <img src={selectedImage} alt="Your photo" className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  )}
                </div>
                {showAdvanced && (
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
                )}
              </div>

              {/* Style Grid */}
              <div className={cn('gap-2.5 mb-6', showAdvanced ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8' : 'grid grid-cols-4')}>
                {(showAdvanced ? STYLES : STYLES.filter(s => QUICK_STYLE_IDS.includes(s.id))).map((style) => (
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

              {/* Expression Presets — Advanced only */}
              {showAdvanced && <div className="mb-5 p-5 bg-amber-50 rounded-2xl border border-amber-100">
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
              </div>}

              {/* Identity Locks — hero position, Advanced only */}
              {showAdvanced && <div data-tour="identity-locks" className="mb-5 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-500" /> Identity Locks
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Lock features so AI never changes them — your biggest differentiator
                </p>
                <div className="flex flex-wrap gap-2">
                  {IDENTITY_LOCK_ITEMS.map(({ key, icon: Icon, label }) => (
                    <button key={key} onClick={() => toggleLock(key)}
                      aria-pressed={identityLocks[key]}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                        identityLocks[key]
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-indigo-300')}>
                      <Icon className="w-3 h-3" />
                      {label}
                      {identityLocks[key] && <Lock className="w-2.5 h-2.5" />}
                    </button>
                  ))}
                </div>
              </div>}

              {/* Advanced Settings — Advanced mode only */}
              {showAdvanced && <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Advanced Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  {/* Likeness */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Likeness Strength</label>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900 px-2 py-0.5 rounded-full">{likenessStrength}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="10" value={likenessStrength}
                      onChange={(e) => setLikenessStrength(parseInt(e.target.value))}
                      aria-label="Likeness Strength"
                      aria-valuemin={0} aria-valuemax={100} aria-valuenow={likenessStrength}
                      aria-valuetext={`${likenessStrength}%`}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                      <span>Creative</span><span>Balanced</span><span>Exact</span>
                    </div>
                  </div>

                  {/* Variations */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Number of Variations</label>
                      {!isPro && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"><Lock className="w-2.5 h-2.5" /> Pro: up to 8</span>}
                    </div>
                    <div className="flex gap-2">
                      {[2, 4].map(num => (
                        <button key={num} onClick={() => setNumVariations(num)}
                          className={cn('flex-1 py-2 rounded-lg border text-sm font-medium transition-all relative',
                            numVariations === num ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-200')}>
                          {num} Images
                          {num === 4 && <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">BEST</span>}
                        </button>
                      ))}
                    </div>
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
                        className={cn('flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all relative',
                          naturalnessPreset === preset
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200')}>
                        {preset === 'natural' ? '🌿 Natural' : preset === 'polished' ? '✨ Polished' : '📸 Studio'}
                        {preset === 'studio' && !isPro && (
                          <span className="absolute -top-2 -right-2 flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-full leading-none">
                            <Lock className="w-2 h-2" /> PRO
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <input type="range" min="0" max="100" step="5" value={naturalness}
                    onChange={(e) => { setNaturalness(parseInt(e.target.value)); setNaturalnessPreset('polished'); }}
                    aria-label="Skin Smoothness"
                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={naturalness}
                    aria-valuetext={`${naturalness} out of 100`}
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
              </div>}

              {/* Copy Preset — Advanced mode only */}
              {showAdvanced && (
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={handleCopyPreset}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-all">
                    {presetCopied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {presetCopied ? 'Copied!' : 'Copy Settings JSON'}
                  </button>
                  <span className="text-xs text-slate-400">Share settings with your team for consistent results</span>
                </div>
              )}

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
              <GenerationProgress isGenerating={isGenerating} numVariations={numVariations} />
              {error && (
                <div role="alert" aria-live="assertive" className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">{error}</div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: EDIT ── */}
          {step === 3 && (
            <motion.div key="step3" {...slideAnim}
              className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-2xl font-bold">Review & Edit</h2>
                <button onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm">
                  Export <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Main Image */}
                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-3 relative overflow-hidden group min-h-[480px]">
                  {generatedImages.length > 0 && (
                    compareMode && selectedImage ? (
                      <div data-tour="comparison-slider" className="w-full h-full">
                        <ComparisonSlider
                          beforeSrc={selectedImage}
                          afterSrc={getCurrentImage()!}
                          beforeLabel="Original"
                          afterLabel="AI Portrait"
                        />
                      </div>
                    ) : (
                      <img src={getCurrentImage()} alt={`AI-generated ${selectedStyle} portrait, variation ${selectedResultIndex + 1} of ${generatedImages.length}`} className="max-h-full max-w-full object-contain shadow-lg rounded-lg" referrerPolicy="no-referrer" />
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
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-slate-200">
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
                <div className="w-full lg:w-72 flex flex-col gap-4 overflow-y-auto lg:max-h-full max-h-64">
                  {/* Variations */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Variations</h3>
                    <div className="grid grid-cols-4 gap-1.5">
                      {generatedImages.map((img, idx) => (
                        <button key={idx} onClick={() => { setSelectedResultIndex(idx); setCompareMode(false); capture('portrait_selected', { variantIndex: idx, style: selectedStyle }); }}
                          className={cn('aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                            selectedResultIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 opacity-60 hover:opacity-100')}>
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* History Strip — Phase 3 */}
                  {history[selectedResultIndex] && history[selectedResultIndex].length > 1 && (
                    <div data-tour="history">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Edit History</h3>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {history[selectedResultIndex].map((img, idx) => (
                          <button key={idx} onClick={() => setHistoryStep(prev => ({ ...prev, [selectedResultIndex]: idx }))}
                            title={`Step ${idx + 1}`}
                            className={cn('shrink-0 w-16 aspect-[3/4] rounded-md overflow-hidden border-2 transition-all',
                              historyStep[selectedResultIndex] === idx ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-slate-200 opacity-50 hover:opacity-80')}>
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Editor */}
                  <div className="flex-1">
                    {(!showAdvanced && !showEditPanel) ? (
                      <button onClick={() => setShowEditPanel(true)}
                        className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                        <Wand2 className="w-4 h-4" /> Edit Portrait
                      </button>
                    ) : (<>
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
                          className={cn('py-2 rounded-lg text-[10px] font-medium border transition-all flex flex-col items-center gap-0.5',
                            editMode === mode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')}>
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                          {mode === 'region' && <span className="text-[8px] opacity-60 leading-tight">Targeted</span>}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {editMode && (
                        <motion.div data-tour="regional-edit" {...collapseAnim}
                          className="bg-slate-50 rounded-xl p-2.5 mb-3 overflow-hidden">
                          <div className={cn('grid grid-cols-1 gap-1 overflow-y-auto', (editMode === 'clothes' || editMode === 'background') ? 'max-h-56' : 'max-h-44')}>

                            {/* ── Clothes 3-step sub-wizard ── */}
                            {editMode === 'clothes' && !clothesStyle && (
                              <>
                                <p className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">Step 1 — Select style</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {CLOTHES_STYLES.map(s => (
                                    <button key={s} onClick={() => setClothesStyle(s)}
                                      className="text-left text-xs py-1.5 px-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors text-slate-700 font-medium">
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}

                            {editMode === 'clothes' && clothesStyle && !clothesColor && (
                              <>
                                <div className="flex items-center gap-2 px-1 mb-1">
                                  <button onClick={() => setClothesStyle('')} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">← Back</button>
                                  <span className="text-[10px] text-slate-400">Style: <strong className="text-slate-600">{clothesStyle}</strong></span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">Step 2 — Select color</p>
                                <div className="grid grid-cols-4 gap-1.5 px-0.5">
                                  {CLOTHES_COLORS.map(c => (
                                    <button key={c.name} onClick={() => setClothesColor(c.name)} title={c.name}
                                      className="flex flex-col items-center gap-1 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-all">
                                      <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ background: c.hex }} />
                                      <span className="text-[8px] text-slate-500 font-medium text-center leading-tight px-0.5">{c.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}

                            {editMode === 'clothes' && clothesStyle && clothesColor && (
                              <>
                                <div className="flex items-center gap-2 px-1 mb-1">
                                  <button onClick={() => setClothesColor('')} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">← Back</button>
                                  <span className="text-[10px] text-slate-400">
                                    <strong className="text-slate-600">{clothesStyle}</strong> · {clothesColor}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">Step 3 — Select pattern</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {CLOTHES_PATTERNS.map(p => (
                                    <button key={p.name} disabled={isEditing}
                                      onClick={() => handleEdit(
                                        `Change clothing to: ${clothesColor} ${p.name === 'Solid' ? '' : p.name + ' '}${clothesStyle}`.replace(/\s+/g, ' ').trim()
                                      )}
                                      className="text-left bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 rounded-lg transition-colors overflow-hidden disabled:opacity-50 flex flex-col">
                                      <div className="w-full h-9 rounded-t-lg" style={PATTERN_SWATCHES[p.name]} />
                                      <div className="px-2 py-1.5">
                                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 block">{p.name}</span>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight block">{p.desc}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            {/* ── Background 2-step sub-wizard ── */}
                            {editMode === 'background' && !bgCategory && (
                              <>
                                <p className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">Step 1 — Select category</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {BG_CATEGORIES.map(cat => (
                                    <button key={cat.name}
                                      onClick={() => {
                                        if (cat.pro && !isPro) { setShowPricingModal(true); return; }
                                        if (cat.options.length === 0) { handleEdit('Remove the background completely and make it transparent.'); return; }
                                        setBgCategory(cat.name);
                                      }}
                                      className="text-left text-xs py-1.5 px-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors flex items-center gap-1.5">
                                      <span>{cat.emoji}</span>
                                      <span className="font-medium text-slate-700 leading-tight">{cat.name}</span>
                                      {cat.pro && !isPro && <span className="ml-auto flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-full leading-none shrink-0"><Lock className="w-2 h-2" /> PRO</span>}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}

                            {editMode === 'background' && bgCategory && (
                              <>
                                <div className="flex items-center gap-2 px-1 mb-1">
                                  <button onClick={() => setBgCategory('')} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">← Back</button>
                                  <span className="text-[10px] text-slate-400">
                                    {BG_CATEGORIES.find(c => c.name === bgCategory)?.emoji} <strong className="text-slate-600">{bgCategory}</strong>
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold px-1 mb-0.5">Step 2 — Select setting</p>
                                {(BG_CATEGORIES.find(c => c.name === bgCategory)?.options ?? []).map(opt => (
                                  <button key={opt} disabled={isEditing}
                                    onClick={() => handleEdit(`Change the background to: ${opt}`)}
                                    className="text-left text-xs py-1.5 px-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors text-slate-700 font-medium disabled:opacity-50">
                                    {opt}
                                  </button>
                                ))}
                              </>
                            )}
                            {editMode === 'color' && ['Black and White', 'Warm Golden Tones', 'Cool Blue Tones', 'Cinematic Teal & Orange', 'Vintage Sepia', 'Soft Pastel', 'High Contrast'].map(item => (
                              <button key={item} onClick={() => handleEdit(`Apply ${item} color grading to the entire image`)} disabled={isEditing}
                                className="text-left text-xs py-1.5 px-2.5 hover:bg-white rounded-lg transition-colors text-slate-700 font-medium">{item}</button>
                            ))}
                            {editMode === 'region' && (
                              <>
                                <p className="text-[10px] text-slate-400 px-2 mb-1">Pick an area to lock, then describe the change below:</p>
                                {['background only', 'clothing only', 'lighting only', 'hair only', 'color grading only'].map(region => (
                                  <button key={region} onClick={() => { const t = region === regionTarget ? null : region; setRegionTarget(t); if (t) capture('regional_edit_used', { editType: t }); }}
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

                    {/* Prompt History */}
                    {promptHistory.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1.5">Recent prompts</p>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                          {promptHistory.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCustomEditPrompt(prompt)}
                              title="Click to reuse"
                              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 transition-colors truncate"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                    </>)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: EXPORT ── */}
          {step === 4 && (
            <motion.div key="step4" {...slideAnim}
              className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setStep(3)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-2xl font-bold">Export Portrait</h2>
                <div className="w-20" />
              </div>

              <div className="flex flex-col xl:flex-row gap-8 flex-1">
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
                <div className="w-full xl:w-80 flex flex-col gap-5 overflow-y-auto xl:max-h-full max-h-72">
                  {/* Aspect Ratio — always visible */}
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

                  {/* Advanced export options — collapsed in Quick mode */}
                  {(showAdvanced || showExportOptions) && (<>
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
                  </>)}

                  {/* Pro Banner — always visible */}
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
                      <button onClick={() => setShowPricingModal(true)} className="w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50">
                        See Plans
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <Star className="w-5 h-5 fill-green-500 text-green-500" />
                      <div><div className="font-bold text-sm text-green-800">Pro Active</div><div className="text-xs text-green-600">High Res & PNG Unlocked</div></div>
                    </div>
                  )}

                  {/* Standard Download — always visible */}
                  <button onClick={handleExport}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download {isPro ? '(Pro)' : '(Free)'}
                  </button>

                  {/* More Export Options toggle — Quick mode only */}
                  {!showAdvanced && (
                    <button onClick={() => setShowExportOptions(v => !v)}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 transition-colors">
                      <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showExportOptions && 'rotate-90')} />
                      {showExportOptions ? 'Hide Options' : 'More Export Options'}
                    </button>
                  )}

                  {/* Share + Platform — in advanced mode always, in quick mode when expanded */}
                  {(showAdvanced || showExportOptions) && (<>
                    {/* Share */}
                    <div className="flex gap-2">
                      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent((import.meta.env.VITE_APP_URL as string) || 'https://proportrait.ai')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={() => capture('share_intent', { platform: 'linkedin' })}
                        className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center gap-1.5 transition-all">
                        <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
                      </a>
                      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Just created my AI professional portrait with @ProPortraitAI')}&url=${encodeURIComponent((import.meta.env.VITE_APP_URL as string) || 'https://proportrait.ai')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={() => capture('share_intent', { platform: 'twitter' })}
                        className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-sky-50 hover:border-sky-300 flex items-center justify-center gap-1.5 transition-all">
                        <Twitter className="w-3.5 h-3.5 text-sky-500" /> Twitter
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText((import.meta.env.VITE_APP_URL as string) || 'https://proportrait.ai'); capture('share_intent', { platform: 'copy' }); }}
                        className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-1.5 transition-all">
                        <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy
                      </button>
                    </div>

                    {/* Platform Export */}
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
                        {downloadingPlatform === 'all'
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Building ZIP&hellip;</>
                          : <><Package className="w-3.5 h-3.5" /> Download All Platforms</>}
                      </button>
                    </div>
                  </>)}
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <PricingModal
        open={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onProActivated={() => { void refreshProfile(); setShowPricingModal(false); capture('paywall_converted', { plan: 'unknown' }); }}
      />
      <EmailCapture
        open={showEmailCapture}
        onClose={() => setShowEmailCapture(false)}
      />
      <FeatureTour
        active={showTour}
        onDone={() => {
          setShowTour(false);
          localStorage.setItem('pp_tour_done', '1');
          capture('feature_tour_completed');
        }}
      />
    </div>
  );
}
