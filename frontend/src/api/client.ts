import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

const BASE_URL = 'http://localhost:5000/api';

export const fetchTrades = async (page = 1, limit = 20, filters?: { strategy_id?: string; outcome?: string; search?: string }) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.strategy_id) params.append('strategy_id', filters.strategy_id);
  if (filters?.outcome) params.append('outcome', filters.outcome);
  if (filters?.search) params.append('search', filters.search);

  const response = await fetch(`${BASE_URL}/trades?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const updateTrade = async (id: string, tradeData: FormData) => {
  const response = await fetch(`${BASE_URL}/trades/${id}`, {
    method: 'PUT',
    body: tradeData,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update trade');
  }
  return response.json();
};

export const deleteTrade = async (id: string) => {
  const response = await fetch(`${BASE_URL}/trades/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete trade');
  return response.json();
};

export const createTrade = async (tradeData: FormData) => {
  const response = await fetch(`${BASE_URL}/trades`, {
    method: 'POST',
    body: tradeData,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create trade');
  }
  return response.json();
};

export const fetchStrategies = async () => {
  const response = await fetch(`${BASE_URL}/strategies`);
  if (!response.ok) throw new Error('Failed to fetch strategies');
  return response.json();
};

export const fetchSymbols = async () => {
  const response = await fetch(`${BASE_URL}/symbols`);
  if (!response.ok) throw new Error('Failed to fetch symbols');
  return response.json();
};

export const fetchPnlCalendar = async (month: number, year: number) => {
    const response = await fetch(`${BASE_URL}/trades/pnl/calendar?month=${month}&year=${year}`);
    if (!response.ok) {
        throw new Error('Failed to fetch PnL calendar data');
    }
    return response.json();
};
