import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTrades, createTrade, updateTrade, deleteTrade, fetchStrategies, fetchSymbols, fetchPnlCalendar } from '../api/client';

export interface Trade {
  _id: string;
  strategy_id: number;
  symbol_id: number;
  quantity: number;
  type: 'buy' | 'sell';
  trade_date: string;
  entry_price: number;
  exit_price: number;
  pl?: number;
  outcome: 'win' | 'loss' | 'neutral';
  photo?: string;
  [key: string]: any;
}

export interface TradeResponse {
  trades: Trade[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const useTrades = (page: number, limit: number, filters?: { strategy_id?: string; outcome?: string; search?: string }) => {
  return useQuery<TradeResponse>({
    queryKey: ['trades', page, limit, filters],
    queryFn: () => fetchTrades(page, limit, filters),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['pnlCalendar'] });
    },
  });
};

export const useUpdateTrade = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: FormData }) => updateTrade(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        queryClient.invalidateQueries({ queryKey: ['pnlCalendar'] });
      },
    });
};

export const useDeleteTrade = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: deleteTrade,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        queryClient.invalidateQueries({ queryKey: ['pnlCalendar'] });
      },
    });
};

export const useStrategies = () => {
  return useQuery({
    queryKey: ['strategies'],
    queryFn: fetchStrategies,
  });
};

export const useSymbols = () => {
  return useQuery({
    queryKey: ['symbols'],
    queryFn: fetchSymbols,
  });
};

export const usePnlCalendar = (month: number, year: number) => {
    return useQuery({
        queryKey: ['pnlCalendar', month, year],
        queryFn: () => fetchPnlCalendar(month, year),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
