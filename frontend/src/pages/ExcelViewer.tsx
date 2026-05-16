import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Upload, Select, Button, Table, Empty, Typography, message } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import ChartComponent from "../components/ui/resuable/chart/ChartComponent";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";

// Reusable responsive width hook (same approach as Charts.tsx)
const useResponsiveWidth = () => {
  const [width, setWidth] = useState(1200);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measure = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    measure();
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return { width, containerRef };
};

type Rows = Array<Record<string, any>>;

const defaultLayout = [
  { i: "pl-chart", x: 0, y: 0, w: 6, h: 3 },
  { i: "returns-chart", x: 6, y: 0, w: 6, h: 3 },
  { i: "trades-chart", x: 0, y: 3, w: 6, h: 3 },
  { i: "metrics-chart", x: 6, y: 3, w: 6, h: 3 },
  { i: "treemap-chart", x: 0, y: 6, w: 12, h: 4 },
];

const ExcelViewer: React.FC = () => {
  const { width, containerRef } = useResponsiveWidth();

  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheets, setSheets] = useState<Record<string, Rows>>({});
  const [currentSheet, setCurrentSheet] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Rows>([]);

  // Mapping selections
  const [dateCol, setDateCol] = useState<string | null>(null);
  const [plCol, setPlCol] = useState<string | null>(null);
  const [returnsCol, setReturnsCol] = useState<string | null>(null);
  const [tradesCol, setTradesCol] = useState<string | null>(null);
  const [categoryCol, setCategoryCol] = useState<string | null>(null);
  const [outcomeCol, setOutcomeCol] = useState<string | null>(null);

  const [layout, setLayout] = useState(() => ({ lg: defaultLayout }));

  // parsed & aggregated chart data
  const [plChartData, setPlChartData] = useState<any[]>([]);
  const [returnsChartData, setReturnsChartData] = useState<any[]>([]);
  const [tradesChartData, setTradesChartData] = useState<any[]>([]);
  const [aggregateData, setAggregateData] = useState<any[]>([]);
  const [treemapData, setTreemapData] = useState<any[]>([]);
  const [winlossData, setWinlossData] = useState<any[]>([]);

  // Handle file upload (single file)
  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const names = wb.SheetNames;
      const parsedSheets: Record<string, Rows> = {};
      for (const name of names) {
        const ws = wb.Sheets[name];
        const json = XLSX.utils.sheet_to_json(ws, { defval: null });
        parsedSheets[name] = json as Rows;
      }
      setSheetNames(names);
      setSheets(parsedSheets);
      if (names.length > 0) {
        setCurrentSheet(names[0]);
      }
      message.success("File loaded successfully");
    } catch (e) {
      console.error(e);
      message.error("Failed to parse file");
    }

    // prevent Upload from auto uploading
    return false;
  };

  useEffect(() => {
    if (!currentSheet) return;
    const rows = sheets[currentSheet] || [];
    setPreviewRows(rows.slice(0, 50));
    // derive headers
    const cols = new Set<string>();
    for (const r of rows.slice(0, 20)) {
      Object.keys(r).forEach((k) => cols.add(k));
    }
    const hdrs = Array.from(cols);
    setHeaders(hdrs);
    // reset mappings that don't exist
    if (dateCol && !hdrs.includes(dateCol)) setDateCol(null);
    if (plCol && !hdrs.includes(plCol)) setPlCol(null);
    if (returnsCol && !hdrs.includes(returnsCol)) setReturnsCol(null);
    if (tradesCol && !hdrs.includes(tradesCol)) setTradesCol(null);
    if (categoryCol && !hdrs.includes(categoryCol)) setCategoryCol(null);
    if (outcomeCol && !hdrs.includes(outcomeCol)) setOutcomeCol(null);
  }, [currentSheet, sheets]);

  const generateCharts = () => {
    if (!currentSheet) return;
    const rows = sheets[currentSheet] || [];
    if (rows.length === 0) {
      message.warning("Selected sheet has no rows");
      return;
    }

    // Build a date-keyed map
    const dateMap: Record<string, any[]> = {};

    for (const r of rows) {
      let dateVal: any = null;
      if (dateCol) dateVal = r[dateCol];
      // Try to coerce Excel date or string
      let dateStr = null;
      if (dateVal === null || dateVal === undefined || dateVal === "") {
        // skip rows without date mapping
        continue;
      }
      // If dateVal is a Date object
      if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
        dateStr = dayjs(dateVal).format("YYYY-MM-DD");
      } else if (typeof dateVal === "number") {
        // Excel serialized date (days since 1899-12-31)
        const d = XLSX.SSF.parse_date_code(dateVal as any);
        if (d) {
          const jsDate = new Date(Date.UTC(d.y, d.m - 1, d.d));
          dateStr = dayjs(jsDate).format("YYYY-MM-DD");
        } else {
          dateStr = dayjs(dateVal).format("YYYY-MM-DD");
        }
      } else {
        // try parse string
        const parsed = dayjs(String(dateVal));
        if (parsed.isValid()) dateStr = parsed.format("YYYY-MM-DD");
        else dateStr = String(dateVal);
      }

      if (!dateStr) continue;
      if (!dateMap[dateStr]) dateMap[dateStr] = [];
      dateMap[dateStr].push(r);
    }

    const sortedDates = Object.keys(dateMap).sort((a, b) => (a > b ? 1 : -1));

    // pl, returns, trades series
    const plSeries = sortedDates.map((d) => {
      const items = dateMap[d];
      let value = 0;
      if (plCol) {
        value = items.reduce((s, it) => s + (Number(it[plCol]) || 0), 0);
      } else {
        // fallback: count rows as synthetic pl
        value = items.length;
      }
      return { x: d, y: Number(Number(value).toFixed(2)) };
    });

    const returnsSeries = sortedDates.map((d) => {
      const items = dateMap[d];
      let value = 0;
      if (returnsCol) {
        value = items.reduce((s, it) => s + (Number(it[returnsCol]) || 0), 0);
      }
      return { x: d, y: Number(Number(value).toFixed(2)) };
    });

    const tradesSeries = sortedDates.map((d) => {
      const items = dateMap[d];
      let value = 0;
      if (tradesCol) value = items.reduce((s, it) => s + (Number(it[tradesCol]) || 0), 0);
      else value = items.length;
      return { x: d, y: Number(value) };
    });

    // aggregate metrics
    const totalPL = plSeries.reduce((s, it) => s + Number(it.y || 0), 0);
    const totalReturns = returnsSeries.reduce((s, it) => s + Number(it.y || 0), 0);
    const totalTrades = tradesSeries.reduce((s, it) => s + Number(it.y || 0), 0);

    const agg = [
      { x: "Total P/L", y: Math.abs(totalPL) },
      { x: "Avg Returns", y: Math.abs(totalReturns / (sortedDates.length || 1)) },
      { x: "Total Trades", y: totalTrades },
    ];

    // treemap grouping by categoryCol
    let treemap: any[] = [];
    if (categoryCol) {
      const group: Record<string, number> = {};
      for (const d of sortedDates) {
        for (const it of dateMap[d]) {
          const key = String(it[categoryCol] ?? "(empty)");
          const amount = plCol ? Number(it[plCol]) || 0 : 1;
          group[key] = (group[key] || 0) + amount;
        }
      }
      treemap = Object.entries(group).map(([k, v]) => ({ name: k, value: Math.abs(Number(v)) }));
    }

    // win/loss pie (if outcomeCol available)
    let winloss: any[] = [];
    if (outcomeCol) {
      const counts: Record<string, number> = {};
      for (const d of sortedDates) {
        for (const it of dateMap[d]) {
          const k = String(it[outcomeCol] ?? "unknown");
          counts[k] = (counts[k] || 0) + 1;
        }
      }
      winloss = Object.entries(counts).map(([k, v]) => ({ x: k, y: v }));
    }

    setPlChartData(plSeries);
    setReturnsChartData(returnsSeries);
    setTradesChartData(tradesSeries);
    setAggregateData(agg);
    setTreemapData(treemap);
    setWinlossData(winloss);

    message.success("Charts generated from sheet data");
  };

  const columnsForPreview = useMemo(() => {
    if (!headers || headers.length === 0) return [];
    return headers.map((h) => ({ title: h, dataIndex: h, key: h }));
  }, [headers]);

  return (
    <div className="container mx-auto p-4" ref={containerRef}>
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-4">
          <Upload beforeUpload={(file) => handleFile(file as File)} showUploadList={false} accept=".xlsx,.xls,.csv">
            <Button>Import Excel / CSV</Button>
          </Upload>
        </div>

        <div className="col-span-8 flex gap-3">
          <Select
            placeholder="Select sheet"
            style={{ minWidth: 220 }}
            value={currentSheet || undefined}
            onChange={(v) => setCurrentSheet(v)}
            options={sheetNames.map((s) => ({ label: s, value: s }))}
          />

          <Select placeholder="Date Column" style={{ minWidth: 180 }} value={dateCol || undefined} onChange={(v) => setDateCol(v)} options={headers.map((c) => ({ label: c, value: c }))} allowClear />
          <Select placeholder="P/L Column" style={{ minWidth: 180 }} value={plCol || undefined} onChange={(v) => setPlCol(v)} options={headers.map((c) => ({ label: c, value: c }))} allowClear />
          <Select placeholder="Returns Column" style={{ minWidth: 180 }} value={returnsCol || undefined} onChange={(v) => setReturnsCol(v)} options={headers.map((c) => ({ label: c, value: c }))} allowClear />
          <Select placeholder="Trades Column" style={{ minWidth: 180 }} value={tradesCol || undefined} onChange={(v) => setTradesCol(v)} options={headers.map((c) => ({ label: c, value: c }))} allowClear />
        </div>

        <div className="col-span-12 mt-2 flex gap-3">
          <Select placeholder="Category Column (treemap)" style={{ minWidth: 240 }} value={categoryCol || undefined} onChange={(v) => setCategoryCol(v)} options={headers.map((c) => ({ label: c, value: c }))} allowClear />
          <Select placeholder="Outcome Column (win/loss)" style={{ minWidth: 240 }} value={outcomeCol || undefined} onChange={(v) => setOutcomeCol(v)} options={headers.map((c) => ({ label: c, value: c }))} allowClear />

          <Button type="primary" onClick={generateCharts} disabled={!currentSheet}>
            Generate Charts
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Typography.Title level={5}>Preview (first 50 rows)</Typography.Title>
        {previewRows.length === 0 ? (
          <Empty description="No preview available" />
        ) : (
          <Table dataSource={previewRows.map((r, idx) => ({ key: idx, ...r }))} columns={columnsForPreview} pagination={false} scroll={{ x: 800 }} />
        )}
      </div>

      <div>
        <ResponsiveGridLayout
          className="layout"
          layouts={layout}
          width={width}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={140}
        >
          <div key="pl-chart" className="cursor-move">
            <ChartComponent chartType="line" data={plChartData} title="Profit/Loss Over Time" xAxisKey="x" yAxisKey="y" seriesName="P/L" />
          </div>

          <div key="returns-chart" className="cursor-move">
            <ChartComponent chartType="area" data={returnsChartData} title="Returns Over Time" xAxisKey="x" yAxisKey="y" seriesName="Returns (%)" />
          </div>

          <div key="trades-chart" className="cursor-move">
            <ChartComponent chartType="bar" data={tradesChartData} title="Trades Per Day" xAxisKey="x" yAxisKey="y" seriesName="Number of Trades" />
          </div>

          <div key="metrics-chart" className="cursor-move">
            <ChartComponent chartType="pie" data={aggregateData} title="Metrics" xAxisKey="x" yAxisKey="y" seriesName="Metrics" />
          </div>

          <div key="treemap-chart" className="cursor-move">
            <ChartComponent chartType="treemap" data={treemapData} title="Category Treemap" seriesName="Category" />
          </div>

          <div key="winloss-chart" className="cursor-move">
            <ChartComponent chartType="pie" data={winlossData} title="Outcome Distribution" xAxisKey="x" yAxisKey="y" seriesName="Outcome" />
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default ExcelViewer;
