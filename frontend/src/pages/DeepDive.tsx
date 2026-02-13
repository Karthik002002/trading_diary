import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Spin, Table, Typography, Statistic, Tag, Input, AutoComplete } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { fetchDeepDiveAnalysis } from "../api/client";
import ChartComponent from "../components/ui/resuable/chart/ChartComponent";
import { useStrategies, useSymbols } from "../hooks/useTrades";
import { usePortfolios, useTags } from "../hooks/useResources";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// Field Definitions
const FILTER_FIELDS = [
    { label: "Strategy", value: "strategy_id", type: "select", source: "strategies" },
    { label: "Symbol", value: "symbol_id", type: "select", source: "symbols" },
    { label: "Portfolio", value: "portfolio_id", type: "select", source: "portfolios" },
    { label: "Outcome", value: "outcome", type: "select", options: ["win", "loss", "neutral", "missed"] },
    { label: "Status", value: "status", type: "select", options: ["IN", "NIN"] },
    { label: "Type", value: "type", type: "select", options: ["buy", "sell"] },
    { label: "Confidence", value: "confidence_level", type: "number" },
    { label: "P/L", value: "pl", type: "number" },
    { label: "RR", value: "actual_rr", type: "number" },
    { label: "Planned RR", value: "planned_rr", type: "number" },
    { label: "Returns %", value: "returns", type: "number" },
    { label: "Tags", value: "tags", type: "select", source: "tags" },
    { label: "Greed", value: "is_greed", type: "boolean" },
    { label: "FOMO", value: "is_fomo", type: "boolean" },
    { label: "Entry Exec", value: "entry_execution", type: "select", options: ["perfect", "early", "late"] },
    { label: "Exit Exec", value: "exit_execution", type: "select", options: ["perfect", "early", "late"] },
];

interface Chip {
    id: string;
    field: string;
    operator: string;
    value: any;
    label: string;
    displayValue: string;
}

const DeepDive: React.FC = () => {
    const [chips, setChips] = useState<Chip[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState<{ value: string; label: string; rawValue?: any }[]>([]);
    const inputRef = useRef<any>(null);

    // Fetch Resources
    const { data: strategies } = useStrategies();
    const { data: symbols } = useSymbols();
    const { data: portfolios } = usePortfolios();
    const { data: tags } = useTags();

    // Map for displaying names in table
    const strategyMap = React.useMemo(() => strategies?.reduce((acc: any, s: any) => ({ ...acc, [s.id]: s.name }), {}) || {}, [strategies]);
    const symbolMap = React.useMemo(() => symbols?.reduce((acc: any, s: any) => ({ ...acc, [s.id]: s.symbol }), {}) || {}, [symbols]);

    // Construct backend payload from chips
    const backendFilters = React.useMemo(() => chips.map(chip => ({
        field: chip.field,
        operator: chip.operator,
        value: chip.value
    })), [chips]);

    const { data, isLoading } = useQuery({
        queryKey: ["deep-dive", backendFilters],
        queryFn: () => fetchDeepDiveAnalysis(backendFilters),
        enabled: backendFilters.length > 0,
    });

    const getOptionsForInput = (searchText: string) => {
        const colonIndex = searchText.indexOf(":");

        if (colonIndex === -1) {
            // User is typing a key
            return FILTER_FIELDS
                .filter(f => f.label.toLowerCase().includes(searchText.toLowerCase()) || f.value.toLowerCase().includes(searchText.toLowerCase()))
                .map(f => ({ value: `${f.value}:`, label: f.label }));
        } else {
            // User is typing a value
            const keyPart = searchText.substring(0, colonIndex);
            const valuePart = searchText.substring(colonIndex + 1);

            const fieldDef = FILTER_FIELDS.find(f => f.value === keyPart || f.label.toLowerCase() === keyPart.toLowerCase());

            if (fieldDef) {
                let valueOptions: { value: string; label: string; rawValue?: any }[] = [];

                if (fieldDef.source === "strategies") valueOptions = strategies?.map((s: any) => ({ value: `${fieldDef.value}:${s.id}`, label: s.name, rawValue: s.id })) || [];
                else if (fieldDef.source === "symbols") valueOptions = symbols?.map((s: any) => ({ value: `${fieldDef.value}:${s.id}`, label: s.symbol, rawValue: s.id })) || [];
                else if (fieldDef.source === "portfolios") valueOptions = portfolios?.map((p: any) => ({ value: `${fieldDef.value}:${p.id}`, label: p.name, rawValue: p.id })) || [];
                else if (fieldDef.source === "tags") valueOptions = tags?.map((t: any) => ({ value: `${fieldDef.value}:${t._id}`, label: t.name, rawValue: t._id })) || [];
                else if (fieldDef.options) valueOptions = fieldDef.options.map((o: string) => ({ value: `${fieldDef.value}:${o}`, label: o, rawValue: o }));
                else if (fieldDef.type === "boolean") valueOptions = [{ value: `${fieldDef.value}:true`, label: "Yes", rawValue: true }, { value: `${fieldDef.value}:false`, label: "No", rawValue: false }];

                const filtered = valueOptions.filter(o => o.label.toLowerCase().includes(valuePart.toLowerCase()));
                if (filtered.length > 0) {
                    return filtered;
                } else {
                    return [{ value: searchText, label: `Custom: ${valuePart}`, rawValue: valuePart }];
                }
            } else {
                return [];
            }
        }
    };

    const handleSearch = (searchText: string) => {
        setInputValue(searchText);
        setOptions(getOptionsForInput(searchText));
    };

    const handleSelect = (value: string, option: any) => {
        if (value.endsWith(":")) {
            setInputValue(value);
            // Immediately show options for the selected key
            setOptions(getOptionsForInput(value));
            return;
        }

        const colonIndex = value.indexOf(":");
        if (colonIndex !== -1) {
            const fieldKey = value.substring(0, colonIndex);

            const fieldDef = FILTER_FIELDS.find(f => f.value === fieldKey);
            if (!fieldDef) return;

            let realValue = option.rawValue;
            let displayValue = option.label;

            if (realValue === undefined) {
                const rawValStr = value.substring(colonIndex + 1);
                realValue = rawValStr;
                displayValue = rawValStr;
            }

            const newChip: Chip = {
                id: Date.now().toString(),
                field: fieldDef.value,
                operator: fieldDef.type === "text" || fieldDef.type === "select" ? "eq" : "eq",
                value: realValue,
                label: fieldDef.label,
                displayValue: displayValue
            };

            setChips([...chips, newChip]);
            setInputValue("");
            setOptions(getOptionsForInput("")); // Reset options to keys list
            // Keep focus
            inputRef.current?.focus();
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && inputValue === '' && chips.length > 0) {
            const newChips = [...chips];
            newChips.pop();
            setChips(newChips);
            setOptions(getOptionsForInput(""));
        }
    };

    const removeChip = (id: string) => {
        setChips(chips.filter(c => c.id !== id));
    };

    // Columns for Table
    const columns = [
        { title: 'Date', dataIndex: 'trade_date', key: 'date', render: (val: string) => dayjs(val).format("YYYY-MM-DD") },
        { title: 'Symbol', dataIndex: 'symbol_id', key: 'symbol', render: (val: number) => symbolMap[val] || val },
        { title: 'Strategy', dataIndex: 'strategy_id', key: 'strategy', render: (val: number) => strategyMap[val] || val },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (val: string) => <Tag color={val === 'buy' ? 'green' : 'red'}>{val.toUpperCase()}</Tag> },
        {
            title: 'Outcome',
            dataIndex: 'outcome',
            key: 'outcome',
            render: (val: string) => {
                const color = val === 'win' ? 'green' : val === 'loss' ? 'red' : 'default';
                return <Tag color={color}>{val.toUpperCase()}</Tag>
            }
        },
        { title: 'P/L', dataIndex: 'pl', key: 'pl', render: (val: number) => <span className={val >= 0 ? "text-green-500" : "text-red-500"}>{val?.toFixed(2)}</span> },
        { title: 'RR', dataIndex: 'actual_rr', key: 'rr', render: (val: number) => val?.toFixed(2) },
    ];

    const equityData = data?.equityCurve?.map((pt: any) => ({
        x: new Date(pt.date).toLocaleDateString(),
        y: Number(pt.value.toFixed(2))
    })) || [];

    return (
        <div className="px-2 min-h-screen bg-transparent text-text">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ color: "white", marginBottom: 0 }}>Deep Dive Laboratory</Title>
                    <Text type="secondary">Uncover hidden patterns with advanced filtering</Text>
                </div>
            </div>

            {/* Smart Search Bar */}
            <Card className="!mb-6 bg-surface border-border p-2" bodyStyle={{ padding: '0px' }}>
                <div
                    className="flex flex-wrap items-center bg-[#141414] border border-[#303030] rounded-lg px-2 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary min-h-[42px]"
                    onClick={() => inputRef.current?.focus()}
                >
                    {chips.map(chip => (
                        <div key={chip.id} className="mr-2 my-1">
                            <Tag
                                closable
                                onClose={(e: any) => {
                                    e.preventDefault();
                                    removeChip(chip.id);
                                }}
                                color="blue"
                                className="text-sm py-0.5 px-2 rounded-md flex items-center m-0 select-none"
                            >
                                <span className="font-semibold mr-1 opacity-75">{chip.label}:</span>
                                <span>{chip.displayValue}</span>
                            </Tag>
                        </div>
                    ))}

                    <AutoComplete
                        options={options}
                        onSelect={handleSelect}
                        onSearch={handleSearch}
                        onFocus={() => {
                            if (!inputValue) setOptions(getOptionsForInput(""));
                        }}
                        value={inputValue}
                        style={{ minWidth: 200, flex: 1 }}
                        dropdownMatchSelectWidth={300}
                        backfill
                    >
                        <Input
                            ref={inputRef}
                            size="large"
                            placeholder={chips.length === 0 ? "Type 'Strategy:' or 'Outcome:win'..." : ""}
                            className="!bg-transparent !border-none !shadow-none !px-0 focus:!shadow-none hover:!bg-transparent text-white placeholder-gray-500"
                            onKeyDown={onKeyDown}
                            autoFocus
                        />
                    </AutoComplete>
                </div>
            </Card>

            {isLoading && (
                <div className="flex justify-center p-12">
                    <Spin size="large" tip="Crunching numbers..." />
                </div>
            )}

            {data ? (
                <div className="space-y-6 animate-slideUp">
                    {/* Stats & Graph Split */}
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={8}>
                            <div className="grid grid-cols-2 gap-4">
                                <Card size="small" className="bg-surface border-border">
                                    <Statistic title="Total Trades" value={data.stats.totalTrades} valueStyle={{ color: '#fff' }} />
                                </Card>
                                <Card size="small" className="bg-surface border-border">
                                    <Statistic
                                        title="Win Rate"
                                        value={data.stats.winRate}
                                        precision={2}
                                        suffix="%"
                                        valueStyle={{ color: data.stats.winRate > 50 ? '#3f8600' : '#cf1322' }}
                                    />
                                </Card>
                                <Card size="small" className="bg-surface border-border">
                                    <Statistic
                                        title="Total P/L"
                                        value={data.stats.totalPl}
                                        precision={2}
                                        valueStyle={{ color: data.stats.totalPl >= 0 ? '#3f8600' : '#cf1322' }}
                                    />
                                </Card>
                                <Card size="small" className="bg-surface border-border">
                                    <Statistic title="Avg RR" value={data.stats.avgRr} precision={2} valueStyle={{ color: '#fff' }} />
                                </Card>
                                <Card size="small" className="bg-surface border-border">
                                    <Statistic title="Profit Factor" value={data.stats.lossCount > 0 ? (Math.abs(data.stats.totalPl) / data.stats.lossCount).toFixed(2) : "∞"} valueStyle={{ color: '#fff' }} />
                                </Card>
                                <Card size="small" className="bg-surface border-border">
                                    <Statistic title="Total Returns" value={data.stats.totalReturns} suffix="%" valueStyle={{ color: data.stats.totalReturns >= 0 ? '#3f8600' : '#cf1322' }} />
                                </Card>
                            </div>
                        </Col>
                        <Col xs={24} lg={16}>
                            <div className="h-[300px] w-full bg-surface rounded-lg ">
                                <ChartComponent
                                    chartType="line"
                                    data={equityData}
                                    title="Filtered Equity Curve"
                                    xAxisKey="x"
                                    yAxisKey="y"
                                    seriesName="Equity"
                                    height="100%"
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Trades Table */}
                    <Card title={`Matched Trades (${data.trades.length})`} className="bg-surface border-border">
                        <Table
                            dataSource={data.trades}
                            columns={columns}
                            rowKey="_id"
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: true }}
                            size="small"
                        />
                    </Card>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <RobotOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                    <Title level={4} style={{ color: "#666" }}>Ready to Analyze</Title>
                    <Text>Add filters above to start your deep dive</Text>
                </div>
            )}
        </div>
    );
};

export default DeepDive;
