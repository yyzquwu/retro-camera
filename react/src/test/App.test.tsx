import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders landing page by default', () => {
    render(<App />);
    // Check for logo text
    const logos = screen.getAllByText(/Retro Room/i);
    expect(logos.length).toBeGreaterThan(0);
    expect(logos[0]).toBeInTheDocument();
    
    // Check for hero button
    expect(screen.getByText(/Open Studio/i)).toBeInTheDocument();
  });
});
