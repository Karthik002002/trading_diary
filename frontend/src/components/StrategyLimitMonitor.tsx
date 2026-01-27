import { Badge, Drawer, FloatButton, List, notification, Tag, Typography } from "antd";
import { useEffect, useState, useMemo } from "react";
import { useStrategyLimits } from "../hooks/useResources";
import { WarningOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const StrategyLimitMonitor = () => {
    const { data: limits } = useStrategyLimits();
    const [isOpen, setIsOpen] = useState(false);
    const [notifiedExceeded, setNotifiedExceeded] = useState<Set<string>>(new Set());
    const [notifiedWarning, setNotifiedWarning] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!limits) return;

        limits.forEach((s: any) => {
            // Weekly Check
            if (s.weeklyLossLimit) {
                const ratio = s.currentWeeklyLoss / s.weeklyLossLimit;
                const key = `${s.strategyId}-weekly`;

                if (ratio >= 1) {
                    // Exceeded
                    setNotifiedExceeded(prev => prev.has(key) ? prev : new Set(prev).add(key));
                    setNotifiedWarning(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                } else if (ratio >= 0.9) {
                    // Warning
                    setNotifiedWarning(prev => prev.has(key) ? prev : new Set(prev).add(key));
                    setNotifiedExceeded(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                } else {
                    // Neither
                    setNotifiedExceeded(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                    setNotifiedWarning(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                }
            }

            // Monthly Check
            if (s.monthlyLossLimit) {
                const ratio = s.currentMonthlyLoss / s.monthlyLossLimit;
                const key = `${s.strategyId}-monthly`;

                if (ratio >= 1) {
                    // Exceeded
                    setNotifiedExceeded(prev => prev.has(key) ? prev : new Set(prev).add(key));
                    setNotifiedWarning(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                } else if (ratio >= 0.9) {
                    // Warning
                    setNotifiedWarning(prev => prev.has(key) ? prev : new Set(prev).add(key));
                    setNotifiedExceeded(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                } else {
                    // Neither
                    setNotifiedExceeded(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                    setNotifiedWarning(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                }
            }

            // Consecutive Loss Check
            if (s.consecutiveLossLimit) {
                const streak = s.currentConsecutiveLosses;
                const key = `${s.strategyId}-consecutive`;

                if (streak >= s.consecutiveLossLimit) {
                    setNotifiedExceeded(prev => prev.has(key) ? prev : new Set(prev).add(key));
                } else {
                    setNotifiedExceeded(prev => {
                        if (!prev.has(key)) return prev;
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                }
            }
        });
    }, [limits]);

    const alertsCount = useMemo(() => {
        if (!limits) return 0;
        return limits.filter((s: any) => {
            const wRatio = s.weeklyLossLimit ? s.currentWeeklyLoss / s.weeklyLossLimit : 0;
            const mRatio = s.monthlyLossLimit ? s.currentMonthlyLoss / s.monthlyLossLimit : 0;
            const cExceeded = s.consecutiveLossLimit ? s.currentConsecutiveLosses >= s.consecutiveLossLimit : false;
            return wRatio >= 0.9 || mRatio >= 0.9 || cExceeded;
        }).length;
    }, [limits]);

    return (
        <>
            <FloatButton
                icon={notifiedExceeded.size > 0 || notifiedWarning.size > 0 ? <WarningOutlined /> : <InfoCircleOutlined />}
                type="primary"
                style={{ right: 24, bottom: 80, backgroundColor: notifiedExceeded.size > 0 ? "red" : notifiedWarning.size > 0 ? "orange" : "rgb(114, 0, 171)" }}
                badge={{ count: alertsCount, color: "red" }}
                onClick={() => setIsOpen(true)}
                tooltip={<div>Strategy Loss Limits</div>}
            />

            <Drawer
                title="Strategy Loss Limits Status"
                placement="right"
                onClose={() => setIsOpen(false)}
                open={isOpen}
                size={400}
            >
                <List
                    dataSource={limits || []}
                    renderItem={(s: any) => {
                        const wRatio = s.weeklyLossLimit ? s.currentWeeklyLoss / s.weeklyLossLimit : 0;
                        const mRatio = s.monthlyLossLimit ? s.currentMonthlyLoss / s.monthlyLossLimit : 0;

                        return (
                            <List.Item>
                                <div className="w-full">
                                    <Typography.Title level={5}>{s.strategyName}</Typography.Title>

                                    <div className="mt-2 space-y-2">
                                        {s.weeklyLossLimit && (
                                            <div className="flex justify-between items-center">
                                                <span>Weekly:</span>
                                                <div>
                                                    <Text delete={wRatio >= 1} type={wRatio >= 1 ? "danger" : (wRatio >= 0.9 ? "warning" : "secondary")}>
                                                        ₹{s.currentWeeklyLoss} / ₹{s.weeklyLossLimit}
                                                    </Text>
                                                    {wRatio >= 1 && <Tag color="error" className="ml-2">EXCEEDED</Tag>}
                                                    {wRatio >= 0.9 && wRatio < 1 && <Tag color="warning" className="ml-2">90%+</Tag>}
                                                </div>
                                            </div>
                                        )}

                                        {s.monthlyLossLimit && (
                                            <div className="flex justify-between items-center">
                                                <span>Monthly:</span>
                                                <div>
                                                    <Text delete={mRatio >= 1} type={mRatio >= 1 ? "danger" : (mRatio >= 0.9 ? "warning" : "secondary")}>
                                                        ₹{s.currentMonthlyLoss} / ₹{s.monthlyLossLimit}
                                                    </Text>
                                                    {mRatio >= 1 && <Tag color="error" className="ml-2">EXCEEDED</Tag>}
                                                    {mRatio >= 0.9 && mRatio < 1 && <Tag color="warning" className="ml-2">90%+</Tag>}
                                                </div>
                                            </div>
                                        )}
                                        {s.consecutiveLossLimit && (
                                            <div className="flex justify-between items-center">
                                                <span>Loss Streak:</span>
                                                <div>
                                                    <Text type={s.currentConsecutiveLosses >= s.consecutiveLossLimit ? "danger" : "secondary"}>
                                                        {s.currentConsecutiveLosses} / {s.consecutiveLossLimit}
                                                    </Text>
                                                    {s.currentConsecutiveLosses >= s.consecutiveLossLimit && <Tag color="error" className="ml-2">LIMIT REACHED</Tag>}
                                                </div>
                                            </div>
                                        )}
                                        {!s.weeklyLossLimit && !s.monthlyLossLimit && !s.consecutiveLossLimit && (
                                            <Text type="secondary" italic>No limits set</Text>
                                        )}
                                    </div>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            </Drawer>
        </>
    );
};

export default StrategyLimitMonitor;
