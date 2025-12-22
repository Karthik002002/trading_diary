import React, { useEffect, useState } from "react";

import TradeTable from "../components/TradeTable";
import CreateTradeModal from "../components/dashboard/CreateTradeModal";
import { useHotkeys } from "react-hotkeys-hook";
import PnlCalendar from "../components/PnlCalendar";
import { Button, Input, Select } from "antd";
import { useStrategies, useSymbols } from "../hooks/useTrades";
import { useSearch } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useFilterStore } from "../store/useFilterStore";
import { FaPlus } from "react-icons/fa";

const Dashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pastedFile, setPastedFile] = useState<File | null>(null);
  const search: any = useSearch({ from: "/" });
  const navigate = useNavigate();
  const setStoreFilters = useFilterStore((state) => state.setFilters);

  const filters = {
    strategy_id: search.strategy_id,
    outcome: search.outcome,
    symbol: search.symbol,
    search: search.search,
  };

  // Sync Zustand store with URL
  useEffect(() => {
    setStoreFilters(filters);
  }, [filters.strategy_id, filters.outcome, filters.symbol, filters.search, setStoreFilters]);

  const handleFilterChange = (key: string, value: any) => {

    navigate({
      search: {
        ...search,
        [key]: value,
      },
    });
  };

  const { data: strategies, isLoading: strategiesLoading } = useStrategies();
  const { data: symbols, isLoading: symbolsLoading } = useSymbols();

  useHotkeys("ctrl+m", (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              setPastedFile(blob);
              setIsOpen(true);
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return (
    <div className="container mx-auto p-0">


      <div className=" sticky top-2  z-[1000] grid grid-cols-12 gap-4 p-4 rounded-lg items-end bg-slate-900 ">
        <div className="col-span-2">
          <Select
            loading={strategiesLoading}
            options={
              strategies?.map((s: any) => ({ value: s.id, label: s.name })) || []
            }
            value={filters.strategy_id ? [{ value: filters.strategy_id }] : []}
            onChange={(params) =>
              handleFilterChange("strategy_id", params)
            }
            style={{ width: "100%" }}
            placeholder="All Strategies"
          />
        </div>
        <div className="col-span-2">

          <Select
            options={[
              { id: "win", label: "Win", value: "win" },
              { id: "loss", label: "Loss", value: "loss" },
              { id: "neutral", label: "Neutral", value: "neutral" },
            ]}
            value={filters.outcome ? [{ value: filters.outcome }] : []}

            onChange={(params) => {
              handleFilterChange("outcome", params)
            }}
            style={{ width: "100%" }}
            placeholder=" Outcomes"
          />
        </div>
        <div className="col-span-2">

          <Select
            loading={symbolsLoading}
            options={
              symbols?.map((s: any) => ({ value: s.id, label: s.name })) || []
            }
            value={filters.symbol ? [{ value: filters.symbol }] : []}

            onChange={(params) => {
              handleFilterChange("symbol", params)
            }}
            style={{ width: "100%" }}
            placeholder="Symbols"
          />
        </div>
        <div className="col-span-5">
          <Input
            value={filters.search || ""}
            onChange={(e) =>
              handleFilterChange(
                "search",
                (e.target as HTMLInputElement).value
              )
            }
            placeholder="Search reasons, notes..."
          />
        </div>
        <Button onClick={() => setIsOpen(true)} variant="solid" className="col-span-1">
          <FaPlus />
        </Button>
      </div>

      <div className="bg-surface rounded-2xl p-1  shadow-2xl overflow-hidden relative">
        <TradeTable />
      </div>

      <PnlCalendar />

      <CreateTradeModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setPastedFile(null);
        }}
        initialFile={pastedFile}
      />
    </div>
  );
};

export default Dashboard;
