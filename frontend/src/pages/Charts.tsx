import React, { useState } from "react";
import { Spin, Typography, Empty, Select, DatePicker, Button } from "antd";
import { useTimeseries } from "../hooks/useTimeseries";
import { useFilterStore } from "../store/useFilterStore";
import ChartComponent from "../components/ui/resuable/chart/ChartComponent";
import type { TimeseriesDataPoint } from "../types/api";
import { useStrategies, useSymbols } from "../hooks/useTrades";
import { usePortfolios } from "../hooks/useResources";
import dayjs, { Dayjs } from "dayjs";
import ReactGridLayout, { useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
// import "react-grid-layout/css/resizable.css";

const { RangePicker } = DatePicker;



const Charts: React.FC = () => {
    const { width, containerRef } = useContainerWidth();
    const filters = useFilterStore((state) => state);
    const setFilters = useFilterStore((state) => state.setFilters);
    const resetFilters = useFilterStore((state) => state.resetFilters);

    // Default layout configuration
    const defaultLayout = [
        { i: "pl-chart", x: 0, y: 0, w: 6, h: 2 },
        { i: "returns-chart", x: 6, y: 0, w: 6, h: 2 },
        { i: "trades-chart", x: 0, y: 2, w: 6, h: 2 },
        { i: "metrics-chart", x: 6, y: 2, w: 6, h: 2 },
    ];

    // Load layout from localStorage or use default
    const getInitialLayout = () => {
        const savedLayout = localStorage.getItem("charts-layout");
        if (savedLayout) {
            try {
                return JSON.parse(savedLayout);
            } catch (e) {
                console.error("Failed to parse saved layout:", e);
                return defaultLayout;
            }
        }
        return defaultLayout;
    };

    const [layout, setLayout] = useState(getInitialLayout);

    // Save layout to localStorage whenever it changes
    const handleLayoutChange = (newLayout: any) => {
        setLayout(newLayout);
        localStorage.setItem("charts-layout", JSON.stringify(newLayout));
    };

    const { data, isLoading, error } = useTimeseries(filters);
    const { data: strategies, isLoading: strategiesLoading } = useStrategies();
    const { data: symbols, isLoading: symbolsLoading } = useSymbols();
    const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();

    const handleFilterChange = (key: string, value: any) => {
        setFilters({ [key]: value });
    };

    const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates) {
            setFilters({
                from: dates[0] ? dates[0].format("YYYY-MM-DD") : undefined,
                to: dates[1] ? dates[1].format("YYYY-MM-DD") : undefined,
            });
        } else {
            setFilters({ from: undefined, to: undefined });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-8">
                <Empty
                    description={
                        <Typography.Text style={{ color: "#94a3b8" }}>
                            Failed to load chart data. Please try again.
                        </Typography.Text>
                    }
                />
            </div>
        );
    }

    const timeseriesData = data?.timeseries || [];

    // Transform data for different chart types
    const plChartData = timeseriesData.map((item: TimeseriesDataPoint) => ({
        x: new Date(item._id).toLocaleDateString(),
        y: Number(item.pl.toFixed(2)),
    }));

    const returnsChartData = timeseriesData.map((item: TimeseriesDataPoint) => ({
        x: new Date(item._id).toLocaleDateString(),
        y: Number(item.returns.toFixed(2)),
    }));

    const tradesChartData = timeseriesData.map((item: TimeseriesDataPoint) => ({
        x: new Date(item._id).toLocaleDateString(),
        y: item.total_trades,
    }));

    // Calculate aggregate data for pie chart
    const totalPL = timeseriesData.reduce(
        (sum: number, item: TimeseriesDataPoint) => sum + item.pl,
        0,
    );
    const totalReturns = timeseriesData.reduce(
        (sum: number, item: TimeseriesDataPoint) => sum + item.returns,
        0,
    );
    const totalTrades = timeseriesData.reduce(
        (sum: number, item: TimeseriesDataPoint) => sum + item.total_trades,
        0,
    );

    const aggregateData = [
        { x: "Total P/L", y: Math.abs(totalPL) },
        { x: "Avg Returns", y: Math.abs(totalReturns / (timeseriesData.length || 1)) },
        { x: "Total Trades", y: totalTrades },
    ];

    if (timeseriesData.length === 0) {
        return (
            <div className="container mx-auto p-0">
                {/* Sticky Filter Bar */}
                <div className="sticky top-2 z-1000 grid grid-cols-16 sm:grid-cols-8 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4 p-4 rounded-lg items-end bg-slate-800 mb-6">
                    <div className="col-span-2">
                        <Select
                            loading={portfoliosLoading}
                            allowClear
                            options={
                                portfolios?.map((p: any) => ({ value: p.id, label: p.name })) ||
                                []
                            }
                            value={filters.portfolio_id ? Number(filters.portfolio_id) : undefined}
                            onChange={(value) => handleFilterChange("portfolio_id", value)}
                            style={{ width: "100%" }}
                            placeholder="Portfolios"
                        />
                    </div>
                    <div className="col-span-2">
                        <Select
                            loading={strategiesLoading}
                            allowClear
                            options={
                                strategies?.map((s: any) => ({ value: s.id, label: s.name })) ||
                                []
                            }
                            value={filters.strategy_id ? Number(filters.strategy_id) : undefined}
                            onChange={(value) => handleFilterChange("strategy_id", value)}
                            style={{ width: "100%" }}
                            placeholder="All Strategies"
                        />
                    </div>
                    <div className="col-span-2">
                        <Select
                            loading={symbolsLoading}
                            allowClear
                            options={
                                symbols?.map((s: any) => ({ value: s.id, label: s.name })) || []
                            }
                            value={filters.symbol ? Number(filters.symbol) : undefined}
                            onChange={(value) => handleFilterChange("symbol", value)}
                            style={{ width: "100%" }}
                            placeholder="Symbols"
                        />
                    </div>
                    <div className="col-span-4">
                        <RangePicker
                            value={[
                                filters.from ? dayjs(filters.from) : null,
                                filters.to ? dayjs(filters.to) : null,
                            ]}
                            onChange={handleDateRangeChange}
                            style={{ width: "100%" }}
                            placeholder={["From Date", "To Date"]}
                        />
                    </div>
                    <div className="col-span-2">
                        <Button style={{ width: "100%" }} onClick={resetFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>

                <Empty
                    description={
                        <Typography.Text style={{ color: "#94a3b8" }}>
                            No data available. Try adjusting your filters or add some trades.
                        </Typography.Text>
                    }
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-0" ref={containerRef}>
            {/* Sticky Filter Bar */}
            <div className="sticky top-2 z-1000 grid grid-cols-16 sm:grid-cols-8 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4 p-4 rounded-lg items-end bg-slate-800 mb-6">
                <div className="col-span-2">
                    <Select
                        loading={portfoliosLoading}
                        allowClear
                        options={
                            portfolios?.map((p: any) => ({ value: p.id, label: p.name })) ||
                            []
                        }
                        value={filters.portfolio_id ? Number(filters.portfolio_id) : undefined}
                        onChange={(value) => handleFilterChange("portfolio_id", value)}
                        style={{ width: "100%" }}
                        placeholder="Portfolios"
                    />
                </div>
                <div className="col-span-2">
                    <Select
                        loading={strategiesLoading}
                        allowClear
                        options={
                            strategies?.map((s: any) => ({ value: s.id, label: s.name })) ||
                            []
                        }
                        value={filters.strategy_id ? Number(filters.strategy_id) : undefined}
                        onChange={(value) => handleFilterChange("strategy_id", value)}
                        style={{ width: "100%" }}
                        placeholder="All Strategies"
                    />
                </div>
                <div className="col-span-2">
                    <Select
                        loading={symbolsLoading}
                        allowClear
                        options={
                            symbols?.map((s: any) => ({ value: s.id, label: s.name })) || []
                        }
                        value={filters.symbol ? Number(filters.symbol) : undefined}
                        onChange={(value) => handleFilterChange("symbol", value)}
                        style={{ width: "100%" }}
                        placeholder="Symbols"
                    />
                </div>
                <div className="col-span-4">
                    <RangePicker
                        value={[
                            filters.from ? dayjs(filters.from) : null,
                            filters.to ? dayjs(filters.to) : null,
                        ]}
                        onChange={handleDateRangeChange}
                        style={{ width: "100%" }}
                        placeholder={["From Date", "To Date"]}
                    />
                </div>
                <div className="col-span-2">
                    <Button style={{ width: "100%" }} onClick={resetFilters}>
                        Clear Filters
                    </Button>
                </div>
            </div>

            <ReactGridLayout
                className="layout"
                layout={layout}
                width={width}
                // @ts-ignore - cols is a valid prop for RGL but types might be mismatching
                cols={12}
                rowHeight={150}
                onLayoutChange={handleLayoutChange}
                isDraggable={true}
                isResizable={true}
                draggableHandle=".cursor-move"
            >
                {/* Profit/Loss Line Chart */}
                <div key="pl-chart" className="cursor-move">
                    <ChartComponent
                        chartType="line"
                        data={plChartData}
                        title="Profit/Loss Over Time"
                        height={"100%"}
                        xAxisKey="x"
                        yAxisKey="y"
                        seriesName="P/L"
                    />
                </div>

                {/* Returns Area Chart */}
                <div key="returns-chart" className="cursor-move">
                    <ChartComponent
                        chartType="area"
                        data={returnsChartData}
                        title="Returns Over Time"
                        height={"100%"}
                        xAxisKey="x"
                        yAxisKey="y"
                        seriesName="Returns (%)"
                    />
                </div>

                {/* Total Trades Bar Chart */}
                <div key="trades-chart" className="cursor-move">
                    <ChartComponent
                        chartType="bar"
                        data={tradesChartData}
                        title="Trades Per Day"
                        height={"100%"}
                        xAxisKey="x"
                        yAxisKey="y"
                        seriesName="Number of Trades"
                    />
                </div>

                {/* Trading Metrics Pie Chart */}
                <div key="metrics-chart" className="cursor-move">
                    <ChartComponent
                        chartType="pie"
                        data={aggregateData}
                        title="Trading Metrics Distribution"
                        height={"100%"}
                        xAxisKey="x"
                        yAxisKey="y"
                        seriesName="Metrics"
                    />
                </div>
            </ReactGridLayout>
        </div>
    );
};

export default Charts;
