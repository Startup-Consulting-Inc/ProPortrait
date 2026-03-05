import { describe, it, expect } from 'vitest';
import { PLATFORM_PRESETS } from './platformPresets';

describe('PLATFORM_PRESETS', () => {
  it('has exactly 5 presets', () => {
    expect(PLATFORM_PRESETS).toHaveLength(5);
  });

  it('each preset has required non-empty fields', () => {
    for (const preset of PLATFORM_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.filename).toBeTruthy();
      expect(preset.color).toBeTruthy();
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    }
  });

  it('LinkedIn preset is 800×800 square', () => {
    const linkedin = PLATFORM_PRESETS.find(p => p.id === 'linkedin');
    expect(linkedin).toBeDefined();
    expect(linkedin!.width).toBe(800);
    expect(linkedin!.height).toBe(800);
    expect(linkedin!.aspect).toBe('1:1');
  });

  it('Resume preset is 600×800 portrait', () => {
    const resume = PLATFORM_PRESETS.find(p => p.id === 'resume');
    expect(resume).toBeDefined();
    expect(resume!.width).toBe(600);
    expect(resume!.height).toBe(800);
    expect(resume!.aspect).toBe('3:4');
  });

  it('all square presets have aspect 1:1', () => {
    const square = PLATFORM_PRESETS.filter(p => p.width === p.height);
    for (const preset of square) {
      expect(preset.aspect).toBe('1:1');
    }
  });
});
