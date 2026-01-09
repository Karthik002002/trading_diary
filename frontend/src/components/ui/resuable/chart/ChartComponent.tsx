import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { Card, Spin, Typography } from "antd";

export interface ChartComponentProps {
    chartType: "line" | "bar" | "area" | "pie" | "scatter";
    data: any[];
    title?: string;
    height?: number | string;
    width?: number | string;
    options?: EChartsOption;
    loading?: boolean;
    xAxisKey?: string;
    yAxisKey?: string;
    seriesName?: string;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
    chartType,
    data,
    title,
    height = 400,
    width = "100%",
    options,
    loading = false,
    xAxisKey = "x",
    yAxisKey = "y",
    seriesName = "Data",
}) => {
    const getDefaultOptions = (): EChartsOption => {
        const baseOptions: EChartsOption = {
            backgroundColor: "transparent",
            textStyle: {
                color: "#e2e8f0",
            },
            tooltip: {
                trigger: "axis",
                backgroundColor: "rgba(30, 41, 59, 0.95)",
                borderColor: "#475569",
                textStyle: {
                    color: "#e2e8f0",
                },
            },
            grid: {
                left: "3%",
                right: "4%",
                bottom: "3%",
                top: "15%",
                containLabel: true,
            },
        };

        switch (chartType) {
            case "line":
                return {
                    ...baseOptions,
                    xAxis: {
                        type: "category",
                        data: data.map((item) => item[xAxisKey]),
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                    },
                    yAxis: {
                        type: "value",
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                        splitLine: { lineStyle: { color: "#334155" } },
                    },
                    series: [
                        {
                            name: seriesName,
                            type: "line",
                            data: data.map((item) => item[yAxisKey]),
                            smooth: true,
                            lineStyle: {
                                width: 3,
                                color: "#3b82f6",
                            },
                            itemStyle: {
                                color: "#3b82f6",
                            },
                            areaStyle: {
                                color: {
                                    type: "linear",
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [
                                        { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
                                        { offset: 1, color: "rgba(59, 130, 246, 0.05)" },
                                    ],
                                },
                            },
                        },
                    ],
                };

            case "bar":
                return {
                    ...baseOptions,
                    xAxis: {
                        type: "category",
                        data: data.map((item) => item[xAxisKey]),
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                    },
                    yAxis: {
                        type: "value",
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                        splitLine: { lineStyle: { color: "#334155" } },
                    },
                    series: [
                        {
                            name: seriesName,
                            type: "bar",
                            data: data.map((item) => item[yAxisKey]),
                            itemStyle: {
                                color: {
                                    type: "linear",
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [
                                        { offset: 0, color: "#8b5cf6" },
                                        { offset: 1, color: "#6366f1" },
                                    ],
                                },
                                borderRadius: [4, 4, 0, 0],
                            },
                        },
                    ],
                };

            case "area":
                return {
                    ...baseOptions,
                    xAxis: {
                        type: "category",
                        data: data.map((item) => item[xAxisKey]),
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                    },
                    yAxis: {
                        type: "value",
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                        splitLine: { lineStyle: { color: "#334155" } },
                    },
                    series: [
                        {
                            name: seriesName,
                            type: "line",
                            data: data.map((item) => item[yAxisKey]),
                            smooth: true,
                            lineStyle: {
                                width: 2,
                                color: "#10b981",
                            },
                            itemStyle: {
                                color: "#10b981",
                            },
                            areaStyle: {
                                color: {
                                    type: "linear",
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [
                                        { offset: 0, color: "rgba(16, 185, 129, 0.5)" },
                                        { offset: 1, color: "rgba(16, 185, 129, 0.1)" },
                                    ],
                                },
                            },
                        },
                    ],
                };

            case "pie":
                return {
                    ...baseOptions,
                    tooltip: {
                        trigger: "item",
                        backgroundColor: "rgba(30, 41, 59, 0.95)",
                        borderColor: "#475569",
                        textStyle: {
                            color: "#e2e8f0",
                        },
                    },
                    legend: {
                        orient: "vertical",
                        right: "10%",
                        top: "center",
                        textStyle: {
                            color: "#94a3b8",
                        },
                    },
                    series: [
                        {
                            name: seriesName,
                            type: "pie",
                            radius: ["40%", "70%"],
                            avoidLabelOverlap: false,
                            itemStyle: {
                                borderRadius: 8,
                                borderColor: "#1e293b",
                                borderWidth: 2,
                            },
                            label: {
                                show: true,
                                color: "#e2e8f0",
                            },
                            emphasis: {
                                label: {
                                    show: true,
                                    fontSize: 16,
                                    fontWeight: "bold",
                                },
                            },
                            data: data.map((item) => ({
                                name: item[xAxisKey],
                                value: item[yAxisKey],
                            })),
                        },
                    ],
                };

            case "scatter":
                return {
                    ...baseOptions,
                    xAxis: {
                        type: "value",
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                        splitLine: { lineStyle: { color: "#334155" } },
                    },
                    yAxis: {
                        type: "value",
                        axisLine: { lineStyle: { color: "#475569" } },
                        axisLabel: { color: "#94a3b8" },
                        splitLine: { lineStyle: { color: "#334155" } },
                    },
                    series: [
                        {
                            name: seriesName,
                            type: "scatter",
                            data: data.map((item) => [item[xAxisKey], item[yAxisKey]]),
                            symbolSize: 10,
                            itemStyle: {
                                color: "#f59e0b",
                                shadowBlur: 10,
                                shadowColor: "rgba(245, 158, 11, 0.5)",
                            },
                        },
                    ],
                };

            default:
                return baseOptions;
        }
    };

    const mergedOptions = {
        ...getDefaultOptions(),
        ...options,
    };

    if (loading) {
        return (
            <Card
                style={{
                    height,
                    width,
                    background: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid #334155",
                }}
                className="flex items-center justify-center"
            >
                <Spin size="large" />
            </Card>
        );
    }

    return (
        <Card
            style={{
                height: "100%",
                width,
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
            }}
            styles={{
                body: {
                    padding: "16px",
                    flex: 1,
                    minHeight: 0, // Crucial for nested flex scrolling/sizing
                    display: "flex",
                    flexDirection: "column",
                },
            }}
        >
            {title && (
                <Typography.Title level={5} style={{ color: "#e2e8f0" }}>
                    {title}
                </Typography.Title>
            )}
            <ReactECharts
                option={mergedOptions}
                style={{ height: "100%", width: "100%", flex: 1 }}
                notMerge={true}
                lazyUpdate={true}
            />
        </Card>
    );
};

export default ChartComponent;
