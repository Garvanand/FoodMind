import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock recharts to prevent ResizeObserver errors in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div data-testid="barchart" />,
  Bar: () => <div />,
  XAxis: () => <div />,
  Cell: () => <div />
}));

describe('App Core Integration', () => {
  it('renders standard navigation and defaults to Home tab', () => {
    render(<App />);
    
    // Ensure bottom navigation labels are present
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Log')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('navigates to Log tab when clicked', () => {
    render(<App />);
    
    // Default is home, daily summary is present
    expect(screen.getByText(/Daily Summary/i)).toBeInTheDocument();

    // Click Log tab
    const logTab = screen.getByText('Log');
    fireEvent.click(logTab);

    // Ensure Daily Progress from FoodLogTab is rendered
    expect(screen.getByText(/Daily Progress/i)).toBeInTheDocument();
  });
});
