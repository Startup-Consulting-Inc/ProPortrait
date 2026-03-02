export type PlatformPreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  filename: string;
  aspect: string;
  color: string;
  description: string;
};

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    width: 800,
    height: 800,
    filename: 'linkedin-profile.jpg',
    aspect: '1:1',
    color: '#0077B5',
    description: 'Profile photo (800×800)',
  },
  {
    id: 'github',
    name: 'GitHub',
    width: 500,
    height: 500,
    filename: 'github-avatar.jpg',
    aspect: '1:1',
    color: '#24292e',
    description: 'Avatar (500×500)',
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    width: 400,
    height: 400,
    filename: 'twitter-profile.jpg',
    aspect: '1:1',
    color: '#000000',
    description: 'Profile photo (400×400)',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    width: 320,
    height: 320,
    filename: 'instagram-profile.jpg',
    aspect: '1:1',
    color: '#E1306C',
    description: 'Profile photo (320×320)',
  },
  {
    id: 'resume',
    name: 'Resume / CV',
    width: 600,
    height: 800,
    filename: 'resume-portrait.jpg',
    aspect: '3:4',
    color: '#374151',
    description: 'Portrait (600×800)',
  },
];
