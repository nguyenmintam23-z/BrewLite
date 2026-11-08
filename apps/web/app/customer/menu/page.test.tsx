import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CustomerMenuPage from './page';
import * as customerApi from '../customer-api';

vi.mock('../customer-api', () => ({
  customerRequest: vi.fn(),
  isRecordValue: (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value),
  formatCustomerMoney: (value: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value),
  getCustomerErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Lỗi không xác định',
}));

vi.mock('../customer-nav', () => ({
  default: () => <div>CustomerNav</div>,
}));

const mockCustomerRequest = vi.mocked(customerApi.customerRequest);

describe('CustomerMenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching menu', async () => {
    mockCustomerRequest.mockImplementation(() => new Promise(() => undefined));

    render(<CustomerMenuPage />);

    expect(screen.getByText(/Đang tải thực đơn/i)).toBeInTheDocument();
  });

  it('renders product cards after loading', async () => {
    mockCustomerRequest.mockResolvedValue([
      {
        id: 'p1',
        name: 'Bạc xỉu',
        description: 'Cà phê sữa đá',
        price: '35000',
        stockQuantity: 10,
      },
    ]);

    render(<CustomerMenuPage />);

    await waitFor(() => {
      expect(screen.getByText('Bạc xỉu')).toBeInTheDocument();
    });

    expect(screen.getByText(/Cà phê sữa đá/i)).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes('35.000') ?? false).length,
    ).toBeGreaterThan(0);
  });

  it('shows empty state when there are no products', async () => {
    mockCustomerRequest.mockResolvedValue([]);

    render(<CustomerMenuPage />);

    await waitFor(() => {
      expect(screen.getByText(/Thực đơn đang trống/i)).toBeInTheDocument();
    });
  });
});
