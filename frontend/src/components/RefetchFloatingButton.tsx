import { FloatButton, Popover, List, Button, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Database, TrendingUp, Calendar, BarChart3, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface RefetchOption {
    key: string;
    label: string;
    queryKey: string[];
    icon: React.ReactNode;
}

const RefetchFloatingButton = () => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());

    const refetchOptions: RefetchOption[] = [
        {
            key: 'trades',
            label: 'Trades',
            queryKey: ['trades'],
            icon: <TrendingUp size={16} />,
        },
        {
            key: 'strategies',
            label: 'Strategies',
            queryKey: ['strategies'],
            icon: <BarChart3 size={16} />,
        },
        {
            key: 'symbols',
            label: 'Symbols',
            queryKey: ['symbols'],
            icon: <Database size={16} />,
        },
        {
            key: 'pnlCalendar',
            label: 'PnL Calendar',
            queryKey: ['pnlCalendar'],
            icon: <Calendar size={16} />,
        },
        {
            key: 'portfolios',
            label: 'Portfolios',
            queryKey: ['portfolios'],
            icon: <Briefcase size={16} />,
        },
        {
            key: 'performance-metric',
            label: 'Performance Metrics',
            queryKey: ['performance-metric'],
            icon: <BarChart3 size={16} />,
        },
    ];

    const handleRefetch = async (option: RefetchOption) => {
        setLoadingKeys((prev) => new Set([...prev, option.key]));
        try {
            await queryClient.invalidateQueries({ queryKey: option.queryKey });
            message.success(`${option.label} refetched successfully`);
        } catch (error) {
            message.error(`Failed to refetch ${option.label}`);
        } finally {
            setLoadingKeys((prev) => {
                const newSet = new Set(prev);
                newSet.delete(option.key);
                return newSet;
            });
        }
    };

    const handleRefetchAll = async () => {
        setLoadingKeys(new Set(['all']));
        try {
            await queryClient.invalidateQueries();
            message.success('All queries refetched successfully');
        } catch (error) {
            message.error('Failed to refetch all queries');
        } finally {
            setLoadingKeys(new Set());
        }
    };

    useHotkeys("ctrl+r", (e) => {
        e.preventDefault();
        handleRefetchAll();
    });

    const popoverContent = (
        <div className="min-w-[200px]">
            <List
                size="small"
                dataSource={refetchOptions}
                renderItem={(item) => (
                    <List.Item
                        className="!px-0 !py-1 cursor-pointer hover:bg-gray-800 rounded transition-colors"
                        onClick={() => handleRefetch(item)}
                    >
                        <div className="flex items-center gap-2 px-2 py-1 w-full">
                            <span className="text-purple-400">{item.icon}</span>
                            <span className="flex-1 text-gray-200">{item.label}</span>
                            {loadingKeys.has(item.key) && (
                                <RefreshCw size={14} className="animate-spin text-purple-400" />
                            )}
                        </div>
                    </List.Item>
                )}
            />
            <div className="border-t border-gray-700 mt-2 pt-2">
                <Button
                    type="primary"
                    block
                    icon={<RefreshCw size={16} className={loadingKeys.has('all') ? 'animate-spin' : ''} />}
                    onClick={handleRefetchAll}
                    loading={loadingKeys.has('all')}
                    className="!bg-purple-600 hover:!bg-purple-700"
                >
                    Refetch All
                </Button>
            </div>
        </div>
    );

    return (
        <Popover
            content={popoverContent}
            title={
                <span className="text-gray-200 font-semibold flex items-center gap-2">
                    <RefreshCw size={16} className="text-purple-400" />
                    Refetch Options
                </span>
            }
            trigger={["hover"]}
            placement="topRight"
            open={open}

            onOpenChange={setOpen}
            overlayClassName="refetch-popover"
        >
            <FloatButton
                icon={<RefreshCw size={20} />}
                onClick={handleRefetchAll}
                type="primary"
                style={{
                    right: 24,
                    bottom: 24,
                    backgroundColor: '#7200ab',
                    boxShadow: '0 4px 20px rgba(114, 0, 171, 0.4)',
                }}
                className="hover:scale-110 transition-transform"
            />
        </Popover>
    );
};

export default RefetchFloatingButton;
