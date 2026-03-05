import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComparisonSlider from './ComparisonSlider';

const defaultProps = {
  beforeSrc: 'before.jpg',
  afterSrc: 'after.jpg',
  beforeLabel: 'Original',
  afterLabel: 'AI Portrait',
};

describe('ComparisonSlider', () => {
  it('renders without crashing', () => {
    render(<ComparisonSlider {...defaultProps} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('slider has correct ARIA attributes', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-label', 'Compare original and AI portrait');
  });

  it('slider is keyboard focusable', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('tabindex', '0');
  });

  it('ArrowRight increases slider position', async () => {
    const user = userEvent.setup();
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');
    const valuenow = Number(slider.getAttribute('aria-valuenow'));
    expect(valuenow).toBeGreaterThan(50);
  });

  it('ArrowLeft decreases slider position', async () => {
    const user = userEvent.setup();
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowLeft}');
    const valuenow = Number(slider.getAttribute('aria-valuenow'));
    expect(valuenow).toBeLessThan(50);
  });

  it('renders before and after labels', () => {
    render(<ComparisonSlider {...defaultProps} />);
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('AI Portrait')).toBeInTheDocument();
  });
});
