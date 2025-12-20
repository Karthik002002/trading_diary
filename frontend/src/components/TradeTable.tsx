import React, { useState, useEffect, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  useInfiniteTrades,
  useStrategies,
  useSymbols,
  type Trade,
} from "../hooks/useTrades";
import { VirtualTable } from "./VirtualTable";
import { Icon } from "./ui/Icon";
import CreateTradeModal from "./dashboard/CreateTradeModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ImageViewerModal from "./ImageViewerModal";
import { useDeleteTrade } from "../hooks/useTrades";
import { useSearch } from "@tanstack/react-router";
import { Circles } from "react-loader-spinner";
import { Button, Modal, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { BACKEND_URL } from "../api/client";
const columnHelper = createColumnHelper<Trade>();

const TradeTable: React.FC = () => {
  const search: any = useSearch({ from: "/" });
  const { data: strategies } = useStrategies();
  const { data: symbols } = useSymbols();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const limit = search.limit || 20;
  const filters = {
    strategy_id: search.strategy_id,
    outcome: search.outcome,
    search: search.search,
  };

  const strategyMapped: Record<number, string> = {};

  if (strategies) {
    strategies.forEach((strategy) => {
      strategyMapped[strategy.id] = strategy.name;
    });
  }
  const symbolMapped: Record<number, string> = {};

  if (symbols) {
    symbols.forEach((symbol) => {
      symbolMapped[symbol.id] = symbol.symbol;
    });
  }

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTrades(limit, filters);

  const deleteMutation = useDeleteTrade();

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<Trade | null>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeleteClick = (trade: Trade) => {
    setTradeToDelete(trade);
  };

  const handleViewPhoto = (trade: Trade) => {
    setSelectedImageUrl(trade);
    setIsImageModalOpen(true);
  };

  const handleViewClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsViewModalOpen(true);
  };

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
        },
      });
    }
  };

  const columns = React.useMemo(
    () => [
      // ... existing columns ...
      columnHelper.accessor(
        (row) => new Date(row.trade_date).toLocaleDateString(),
        {
          id: "date",
          header: "Date",
        }
      ),
      columnHelper.accessor("strategy_id", {
        header: "Strategy",
        cell: (info) => strategyMapped[info.getValue()] ?? "-",
      }),
      columnHelper.accessor("symbol_id", {
        header: "Symbol",
        cell: (info) => symbolMapped[info.getValue()] ?? "-",
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => info.getValue().toUpperCase(),
      }),
      columnHelper.accessor("quantity", {
        header: "Qty",
      }),
      columnHelper.accessor("entry_price", {
        header: "Entry",
      }),
      columnHelper.accessor("exit_price", {
        header: "Exit",
      }),
      columnHelper.accessor((row) => row.pl?.toFixed(2), {
        id: "pl",
        header: "P/L",
      }),
      columnHelper.accessor("outcome", {
        header: "Outcome",
        cell: (info) => info.getValue().toUpperCase(),
      }),
      columnHelper.accessor("photo", {
        header: "Photo",
        cell: (info) => {
          const photoValue = info.getValue();
          return photoValue ? (
            <button
              onClick={() => handleViewPhoto(info.row.original)}
              className="text-blue-400 underline hover:text-blue-300 transition-colors"
            >
              View
            </button>
          ) : (
            "N/A"
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (props) => (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleViewClick(props.row.original)}
              variant="outlined"
              className=" !p-1 !min-h-[10px] !h-[26px]"
              title="View"
            >
              <Icon name="eye" size={{ width: 16, height: 16 }} />
            </Button>
            <Button
              onClick={() => handleEditClick(props.row.original)}
              className="!p-1 !min-h-[10px] !h-[26px] hover:text-blue-400 transition-colors"
              title="Edit"
            >
              <Icon name="edit" size={{ width: 16, height: 16 }} />
            </Button>
            <Button
              onClick={() => handleDeleteClick(props.row.original)}
              className="!p-1 !min-h-[10px] !h-[26px] hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Icon name="delete" size={{ width: 16, height: 16 }} />
            </Button>
          </div>
        ),
        size: 100
      }),
    ],
    [strategyMapped, symbolMapped]
  );

  if (isLoading) { return <div className="min-h-[300px] flex items-center justify-center"><Spin indicator={<LoadingOutlined />} size="large" /></div>; }
  if (error) return <div className="text-red-500">Error loading trades</div>;

  // Flatten all pages into a single array
  const trades = data?.pages.flatMap((page) => page.trades) || [];

  return (
    <div className="">
      <VirtualTable data={trades} columns={columns} height="450px" />

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-0 " />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Circles height={20} />
        </div>
      )}

      {isEditModalOpen && (
        <CreateTradeModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTrade(null);
          }}
          tradeToEdit={selectedTrade}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {selectedImageUrl && selectedImageUrl.photo && (
        <ImageViewerModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={selectedImageUrl?.photo}
          instance={selectedImageUrl}
        />
      )}

      <ViewTradeModal trade={selectedTrade} open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} />
    </div>
  );
};

export default TradeTable;
const ViewTradeModal = ({ trade, open, onClose }: { trade: Trade | null, open: boolean, onClose: () => void }) => {
  const displaKeyMap: { key: string, value: keyof Trade }[] = [{ key: "Strategy", value: "strategy_id" }, { key: "Symbol", value: "symbol_id" }, { key: "Type", value: "type" }, { key: "Quantity", value: "quantity" }, { key: "Entry Price", value: "entry_price" }, { key: "Exit Price", value: "exit_price" }, { key: "P/L", value: "pl" }, { key: "Outcome", value: "outcome" }]
  if (!trade) return null;
  return <Modal title="View Trade" open={open} onCancel={onClose} footer={null} width={{ xs: '90%', sm: '90%', md: '90%', lg: '90%', xl: '90%' }}>
    {/* 2 rows left side image and right side key value like table of data to show */}
    <div className="flex gap-4">
      <div className="w-1/2">
        {trade.photo && <img src={`${BACKEND_URL}/${trade.photo}`} alt="trade" />}
      </div>
      <div className="w-1/2">
        <div className="flex flex-col gap-1">
          {displaKeyMap.map((item) => (
            <div className="flex">
              <div className="w-1/2 font-bold border py-1 px-2">{item.key}</div>
              <div className="w-1/2 border border-l-0 px-2 py-1">{trade[item.value]}</div>
            </div>
          ))}

        </div>
      </div>
    </div>

  </Modal>
};