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

                if (ratio >= 1 && !notifiedExceeded.has(key)) {
                    // notification.error({
                    //     message: "Weekly Loss Limit Exceeded",
                    //     description: `Strategy "${s.strategyName}" has exceeded its weekly loss limit (₹${s.currentWeeklyLoss} / ₹${s.weeklyLossLimit}).`,
                    //     duration: 0,
                    // });
                    setNotifiedExceeded(prev => new Set(prev).add(key));
                } else if (ratio >= 0.9 && ratio < 1 && !notifiedWarning.has(key)) {
                    // notification.warning({
                    //     message: "Weekly Loss Limit Warning",
                    //     description: `Strategy "${s.strategyName}" is close to 90% of its weekly loss limit.`,
                    //     duration: 5,
                    // });
                    setNotifiedWarning(prev => new Set(prev).add(key));
                } else {
                    setNotifiedExceeded(prev => { prev.delete(key); return prev });
                    setNotifiedWarning(prev => { prev.delete(key); return prev });
                }
            }

            // Monthly Check
            if (s.monthlyLossLimit) {
                const ratio = s.currentMonthlyLoss / s.monthlyLossLimit;
                const key = `${s.strategyId}-monthly`;

                if (ratio >= 1 && !notifiedExceeded.has(key)) {
                    // notification.error({
                    //     message: "Monthly Loss Limit Exceeded",
                    //     description: `Strategy "${s.strategyName}" has exceeded its monthly loss limit (₹${s.currentMonthlyLoss} / ₹${s.monthlyLossLimit}).`,
                    //     duration: 0,
                    // });
                    setNotifiedExceeded(prev => new Set(prev).add(key));
                } else if (ratio >= 0.9 && ratio < 1 && !notifiedWarning.has(key)) {
                    // notification.warning({
                    //     message: "Monthly Loss Limit Warning",
                    //     description: `Strategy "${s.strategyName}" is close to 90% of its monthly loss limit.`,
                    //     duration: 5,
                    // });
                    setNotifiedWarning(prev => new Set(prev).add(key));
                } else {
                    setNotifiedExceeded(prev => { prev.delete(key); return prev });
                    setNotifiedWarning(prev => { prev.delete(key); return prev });
                }
            }
        });
    }, [limits, notifiedExceeded, notifiedWarning]);

    const alertsCount = useMemo(() => {
        if (!limits) return 0;
        return limits.filter((s: any) => {
            const wRatio = s.weeklyLossLimit ? s.currentWeeklyLoss / s.weeklyLossLimit : 0;
            const mRatio = s.monthlyLossLimit ? s.currentMonthlyLoss / s.monthlyLossLimit : 0;
            return wRatio >= 0.9 || mRatio >= 0.9;
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
                                        {!s.weeklyLossLimit && !s.monthlyLossLimit && (
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
