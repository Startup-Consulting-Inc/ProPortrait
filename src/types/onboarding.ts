// Onboarding types for ProPortrait AI

export type IcpSegment = 'career' | 'executive' | 'creative_tech' | 'service' | 'artist';
export type VibePreference = 'polished' | 'warm' | 'bold' | 'creative';

export interface OnboardingData {
  icpSegment: IcpSegment;
  industry: string;
  vibePreference: VibePreference;
  primaryUseCases: string[];
}

export interface PortraitDefaults {
  style: string;
  expression: string;
  identityLocks: {
    eyeColor: boolean;
    skinTone: boolean;
    hairLength: boolean;
    hairTexture: boolean;
    glasses: boolean;
  };
  likeness: number;
  naturalness: number;
  naturalnessPreset: 'natural' | 'polished' | 'studio';
  backgroundCategory: 'quick' | 'brand' | 'creative';
  preferredBackgrounds: string[];
  removeBlemishes: boolean;
}

export interface OnboardingStep1Data {
  purpose: IcpSegment;
  industry: string;
}

export interface OnboardingStep2Data {
  vibe: VibePreference;
  useCases: string[];
}

// Question options for UI
export const PURPOSE_OPTIONS: Array<{ id: IcpSegment; label: string; description: string; icon: string }> = [
  {
    id: 'career',
    label: 'Job Search & Career',
    description: 'LinkedIn, resumes, professional networking',
    icon: 'briefcase',
  },
  {
    id: 'executive',
    label: 'Executive Presence',
    description: 'Company website, press, investor materials',
    icon: 'crown',
  },
  {
    id: 'creative_tech',
    label: 'Creative & Tech',
    description: 'Portfolio, personal website, social media',
    icon: 'palette',
  },
  {
    id: 'service',
    label: 'Client Services',
    description: 'Consulting, coaching, bookings, services',
    icon: 'heart-handshake',
  },
  {
    id: 'artist',
    label: 'Creative Arts',
    description: 'Music, acting, entertainment, arts',
    icon: 'sparkles',
  },
];

// Industry options by purpose
export const INDUSTRY_OPTIONS: Record<IcpSegment, Array<{ id: string; label: string }>> = {
  career: [
    { id: 'finance_banking', label: 'Finance / Banking / Consulting' },
    { id: 'technology_saas', label: 'Technology / SaaS' },
    { id: 'healthcare_medical', label: 'Healthcare / Medical' },
    { id: 'legal', label: 'Law / Legal' },
    { id: 'marketing_sales', label: 'Marketing / Sales' },
    { id: 'operations', label: 'Operations / General Business' },
  ],
  executive: [
    { id: 'technology', label: 'Technology / SaaS' },
    { id: 'finance', label: 'Finance / Investment' },
    { id: 'healthcare', label: 'Healthcare / Biotech' },
    { id: 'consulting', label: 'Consulting / Advisory' },
    { id: 'retail', label: 'Retail / E-commerce' },
    { id: 'other', label: 'Other Industry' },
  ],
  creative_tech: [
    { id: 'design', label: 'Design (UI/UX, Graphic, Product)' },
    { id: 'software_engineering', label: 'Software Engineering' },
    { id: 'product_management', label: 'Product Management' },
    { id: 'marketing_content', label: 'Marketing / Content' },
    { id: 'photography_video', label: 'Photography / Videography' },
    { id: 'other_creative', label: 'Other Creative Field' },
  ],
  service: [
    { id: 'coaching_consulting', label: 'Coaching / Consulting' },
    { id: 'real_estate', label: 'Real Estate' },
    { id: 'healthcare_wellness', label: 'Healthcare / Wellness' },
    { id: 'legal_services', label: 'Legal Services' },
    { id: 'creative_services', label: 'Creative Services' },
    { id: 'other_service', label: 'Other Professional Service' },
  ],
  artist: [
    { id: 'music_performing', label: 'Music / Performing Arts' },
    { id: 'acting_entertainment', label: 'Acting / Entertainment' },
    { id: 'visual_arts', label: 'Visual Arts' },
    { id: 'content_creation', label: 'Content Creation / Influencer' },
    { id: 'writing_media', label: 'Writing / Media' },
    { id: 'other_arts', label: 'Other Creative Arts' },
  ],
};

export const VIBE_OPTIONS: Array<{ id: VibePreference; label: string; description: string; emoji: string }> = [
  {
    id: 'polished',
    label: 'Polished & Professional',
    description: 'Clean, corporate, timeless',
    emoji: '✨',
  },
  {
    id: 'warm',
    label: 'Warm & Approachable',
    description: 'Friendly, inviting, relatable',
    emoji: '🤝',
  },
  {
    id: 'bold',
    label: 'Bold & Distinctive',
    description: 'Memorable, unique, stands out',
    emoji: '🚀',
  },
  {
    id: 'creative',
    label: 'Creative & Artistic',
    description: 'Expressive, unconventional, artsy',
    emoji: '🎨',
  },
];

export const USE_CASE_OPTIONS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'linkedin', label: 'LinkedIn / Professional networks', icon: 'linkedin' },
  { id: 'website', label: 'Company website / About page', icon: 'globe' },
  { id: 'portfolio', label: 'Personal website / Portfolio', icon: 'layout' },
  { id: 'social', label: 'Social media (Instagram, X, etc.)', icon: 'share-2' },
  { id: 'email', label: 'Email signature / Slack', icon: 'mail' },
  { id: 'events', label: 'Speaking engagements / Events', icon: 'mic' },
];

// Helper to get default configurations based on onboarding answers
export function generateDefaultsFromOnboarding(data: OnboardingData): PortraitDefaults {
  const { icpSegment, vibePreference, industry } = data;

  // Default style based on ICP + vibe
  let style: string;
  if (icpSegment === 'career') {
    style = 'editorial';
  } else if (icpSegment === 'executive') {
    style = vibePreference === 'bold' ? 'environmental' : 'editorial';
  } else if (icpSegment === 'creative_tech') {
    if (vibePreference === 'creative') style = 'watercolor';
    else if (vibePreference === 'bold') style = 'cyberpunk';
    else style = 'candid';
  } else if (icpSegment === 'service') {
    style = vibePreference === 'warm' ? 'environmental' : 'editorial';
  } else {
    // artist
    if (vibePreference === 'creative') style = 'watercolor';
    else if (vibePreference === 'bold') style = 'cyberpunk';
    else style = 'vintage';
  }

  // Expression based on ICP
  const expression =
    icpSegment === 'career' || icpSegment === 'executive'
      ? 'confident'
      : icpSegment === 'creative_tech' || icpSegment === 'service'
        ? 'warm_smile'
        : 'natural';

  // Identity locks based on industry
  const identityLocks = {
    eyeColor: true,
    skinTone: true,
    hairLength: true,
    hairTexture: industry === 'healthcare_medical' || industry === 'legal' || industry === 'legal_services',
    glasses: industry === 'legal' || industry === 'legal_services' || industry === 'finance_banking',
  };

  // Naturalness based on ICP
  let naturalness: number;
  let naturalnessPreset: 'natural' | 'polished' | 'studio';
  if (icpSegment === 'career' || icpSegment === 'executive') {
    naturalness = 50;
    naturalnessPreset = 'polished';
  } else if (icpSegment === 'creative_tech' || icpSegment === 'service') {
    naturalness = 30;
    naturalnessPreset = 'polished';
  } else {
    naturalness = 15;
    naturalnessPreset = 'natural';
  }

  // Background preferences
  let backgroundCategory: 'quick' | 'brand' | 'creative';
  let preferredBackgrounds: string[];

  if (icpSegment === 'career') {
    backgroundCategory = 'quick';
    preferredBackgrounds = ['charcoal_dark', 'warm_gray'];
  } else if (icpSegment === 'executive') {
    backgroundCategory = 'brand';
    preferredBackgrounds = ['charcoal_dark', 'deep_burgundy'];
  } else if (icpSegment === 'creative_tech') {
    backgroundCategory = 'creative';
    preferredBackgrounds = ['blurred_office', 'urban_blur', 'charcoal_dark'];
  } else if (icpSegment === 'service') {
    backgroundCategory = 'quick';
    preferredBackgrounds = ['soft_cream', 'warm_gray'];
  } else {
    backgroundCategory = 'creative';
    preferredBackgrounds = ['natural_outdoors', 'cozy_workspace'];
  }

  return {
    style,
    expression,
    identityLocks,
    likeness: 75,
    naturalness,
    naturalnessPreset,
    backgroundCategory,
    preferredBackgrounds,
    removeBlemishes: true,
  };
}

// Human-readable summary for the user
export function getOnboardingSummary(data: OnboardingData): string {
  const purpose = PURPOSE_OPTIONS.find((p) => p.id === data.icpSegment);
  const vibe = VIBE_OPTIONS.find((v) => v.id === data.vibePreference);
  return `${purpose?.label || 'Professional'} portrait with a ${vibe?.label.toLowerCase() || 'polished'} vibe`;
}
