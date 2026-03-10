import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { TrendCharts } from './TrendCharts';

// Mock the recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
}));

// Mock the mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

const mockDailyStats = [
  {
    date: '2024-01-01',
    pageViews: 100,
    productViews: 50,
    cartAdds: 10,
  },
  {
    date: '2024-01-02',
    pageViews: 120,
    productViews: 60,
    cartAdds: 15,
  },
  {
    date: '2024-01-03',
    pageViews: 90,
    productViews: 45,
    cartAdds: 8,
  },
];

describe('TrendCharts', () => {
  it('should render loading state', () => {
    render(<TrendCharts dailyStats={[]} loading={true} />);
    
    expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    expect(screen.getByText('Visual trends and patterns in your storefront performance')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<TrendCharts dailyStats={[]} loading={false} />);
    
    expect(screen.getByText('No trend data available for the selected period')).toBeInTheDocument();
  });

  it('should render charts with data', () => {
    render(<TrendCharts dailyStats={mockDailyStats} loading={false} />);
    
    expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    expect(screen.getByText('7-day trend vs previous')).toBeInTheDocument();
    
    // Check that tabs are rendered
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
    expect(screen.getByText('Area Chart')).toBeInTheDocument();
    expect(screen.getByText('Bar Chart')).toBeInTheDocument();
  });

  it('should show trend indicators when sufficient data', () => {
    const extendedStats = [
      ...mockDailyStats,
      ...Array.from({ length: 11 }, (_, i) => ({
        date: `2024-01-${String(i + 4).padStart(2, '0')}`,
        pageViews: 100 + i * 10,
        productViews: 50 + i * 5,
        cartAdds: 10 + i * 2,
      })),
    ];

    render(<TrendCharts dailyStats={extendedStats} loading={false} />);
    
    // Check that trend indicators section exists
    expect(screen.getByText('7-day trend vs previous')).toBeInTheDocument();
    
    // Check that percentage indicators are shown (they should contain % symbol)
    const percentageElements = screen.getAllByText(/%/);
    expect(percentageElements.length).toBeGreaterThan(0);
  });
});