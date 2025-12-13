import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchStrategies, 
  fetchSymbols, 
} from '../api/client';

const BASE_URL = 'http://localhost:5000/api';

// --- Generic Helper ---
async function fetchData(endpoint: string) {
  const response = await fetch(`${BASE_URL}/${endpoint}`);
  if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return response.json();
}

async function createItem(endpoint: string, data: any) {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
     const error = await response.json();
     throw new Error(error.message || `Failed to create item in ${endpoint}`);
  }
  return response.json();
}

async function updateItem(endpoint: string, id: number, data: any) {
  const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
     const error = await response.json();
     throw new Error(error.message || `Failed to update item in ${endpoint}`);
  }
  return response.json();
}

async function deleteItem(endpoint: string, id: number) {
  const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`Failed to delete item in ${endpoint}`);
  return response.json();
}

// --- Strategies ---
export const useStrategies = () => useQuery({ queryKey: ['strategies'], queryFn: fetchStrategies });

export const useCreateStrategy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createItem('strategies', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategies'] }),
    });
};

export const useUpdateStrategy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateItem('strategies', id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategies'] }),
    });
};

export const useDeleteStrategy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteItem('strategies', id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategies'] }),
    });
};

// --- Symbols ---
export const useSymbols = () => useQuery({ queryKey: ['symbols'], queryFn: fetchSymbols });

export const useCreateSymbol = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createItem('symbols', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['symbols'] }),
    });
};

export const useUpdateSymbol = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateItem('symbols', id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['symbols'] }),
    });
};

export const useDeleteSymbol = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteItem('symbols', id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['symbols'] }),
    });
};

// --- Portfolios ---
export const usePortfolios = () => useQuery({ 
  queryKey: ['portfolios'], 
  queryFn: () => fetchData('portfolios') 
});

export const useCreatePortfolio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createItem('portfolios', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
    });
};

export const useUpdatePortfolio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateItem('portfolios', id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
    });
};

export const useDeletePortfolio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteItem('portfolios', id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
    });
};
