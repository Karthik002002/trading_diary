import React, { useState, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Pagination } from 'baseui/pagination';
import { useTrades, type Trade } from '../hooks/useTrades';
import { Spinner } from 'baseui/spinner';
import { VirtualTable } from './VirtualTable';
import { Icon } from './ui/Icon';
import CreateTradeModal from './CreateTradeModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useDeleteTrade } from '../hooks/useTrades';
import { Select } from 'baseui/select';
import { Input } from 'baseui/input';
import { useStrategies } from '../hooks/useTrades';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useFilterStore } from '../store/useFilterStore';

const columnHelper = createColumnHelper<Trade>();

const TradeTable: React.FC = () => {
  const search: any = useSearch({ from: '/' });
  const navigate = useNavigate();
  const setStoreFilters = useFilterStore((state) => state.setFilters);

  const page = search.page || 1;
  const limit = search.limit || 20;
  const filters = {
    strategy_id: search.strategy_id,
    outcome: search.outcome,
    search: search.search,
  };

  // Sync Zustand store with URL
  useEffect(() => {
    setStoreFilters(filters);
  }, [filters.strategy_id, filters.outcome, filters.search, setStoreFilters]);

  const { data, isLoading, error } = useTrades(page, limit, filters);
  const { data: strategies } = useStrategies();
  const deleteMutation = useDeleteTrade();

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);

  const handleFilterChange = (key: string, value: any) => {
    navigate({
      search: {
        ...search,
        [key]: value,
        page: 1,
      },
    });
  };

  const handleDeleteClick = (trade: Trade) => {
    setTradeToDelete(trade);
  };
  // ... existing handlers ...

  const handleEditClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (tradeToDelete) {
      deleteMutation.mutate(tradeToDelete._id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setTradeToDelete(null);
        }
      });
    }
  };

  const columns = React.useMemo(() => [
    // ... existing columns ...
    columnHelper.accessor(row => new Date(row.trade_date).toLocaleDateString(), {
      id: 'date',
      header: 'Date',
    }),
    columnHelper.accessor('strategy_id', {
      header: 'Strategy',
    }),
    columnHelper.accessor('symbol_id', {
      header: 'Symbol',
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => info.getValue().toUpperCase(),
    }),
    columnHelper.accessor('quantity', {
      header: 'Qty',
    }),
    columnHelper.accessor('entry_price', {
      header: 'Entry',
    }),
    columnHelper.accessor('exit_price', {
      header: 'Exit',
    }),
    columnHelper.accessor(row => row.pl?.toFixed(2), {
      id: 'pl',
      header: 'P/L',
    }),
    columnHelper.accessor('outcome', {
      header: 'Outcome',
      cell: info => info.getValue().toUpperCase(),
    }),
    columnHelper.accessor('photo', {
      header: 'Photo',
      cell: info => info.getValue() ? <a href={`http://localhost:5000/${info.getValue()}`} target="_blank" className="text-blue-400 underline" rel="noreferrer">View</a> : 'N/A',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: props => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditClick(props.row.original)}
            className="p-1 hover:text-blue-400 transition-colors"
            title="Edit"
          >
            <Icon name="edit" size={{ width: 16, height: 16 }} />
          </button>
          <button
            onClick={() => handleDeleteClick(props.row.original)}
            className="p-1 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Icon name="delete" size={{ width: 16, height: 16 }} />
          </button>
        </div>
      ),
    }),
  ], []);

  if (isLoading) return <Spinner />;
  if (error) return <div className="text-red-500">Error loading trades</div>;

  const trades = data?.trades || [];
  const pagination = data?.pagination;

  return (
    <div className="">
      <div className="mb-4 flex gap-4 bg-gray-50 p-4 rounded-lg items-end">
        <div className="w-1/4">
          <span className="text-sm font-semibold mb-1 block">Strategy</span>
          <Select
            options={strategies?.map((s: any) => ({ id: s.id, label: s.name })) || []}
            value={filters.strategy_id ? [{ id: filters.strategy_id }] : []}
            onChange={params => handleFilterChange('strategy_id', params.value[0]?.id)}
            placeholder="All Strategies"
            clearable
          />
        </div>
        <div className="w-1/4">
          <span className="text-sm font-semibold mb-1 block">Outcome</span>
          <Select
            options={[{ id: 'win', label: 'Win' }, { id: 'loss', label: 'Loss' }, { id: 'neutral', label: 'Neutral' }]}
            value={filters.outcome ? [{ id: filters.outcome }] : []}
            onChange={params => handleFilterChange('outcome', params.value[0]?.id)}
            placeholder="All Outcomes"
            clearable
          />
        </div>
        <div className="w-1/2">
          <span className="text-sm font-semibold mb-1 block">Search</span>
          <Input
            value={filters.search || ''}
            onChange={e => handleFilterChange('search', (e.target as HTMLInputElement).value)}
            placeholder="Search reasons, notes..."
            clearable
          />
        </div>
      </div>

      <VirtualTable
        data={trades}
        columns={columns}
        height="450px"
      />

      {pagination && (
        <div className="mt-4 flex justify-end">
          <Pagination
            numPages={pagination.pages}
            currentPage={page}
            onPageChange={({ nextPage }) => {
              navigate({
                search: {
                  ...search,
                  page: Math.min(Math.max(nextPage, 1), pagination.pages)
                }
              });
            }}
          />
        </div>
      )}

      {isEditModalOpen && (
        <CreateTradeModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedTrade(null); }}
          tradeToEdit={selectedTrade}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default TradeTable;
