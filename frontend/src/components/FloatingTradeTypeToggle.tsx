import { useFilterStore } from '../store/useFilterStore';
import { Coins, LayoutDashboard } from 'lucide-react';
import { useMarketTypeQueryParam } from '../hooks/useMarketTypeQueryParam';

const FloatingTradeTypeToggle = () => {
    const { setFilters } = useFilterStore();
    const { marketType, setMarketType } = useMarketTypeQueryParam();

    const handleToggle = (type: 'equity' | 'forex') => {
        setFilters({ trade_type: type });
        setMarketType(type);
    };

    return (
        <div className="fixed bottom-6 right-24 z-50 bg-gray-900/80 backdrop-blur-md border border-gray-800 p-1 rounded-full shadow-2xl flex items-center gap-1">
            <button
                onClick={() => handleToggle('equity')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${marketType === 'equity'
                    ? 'bg-purple-700 text-white shadow-lg shadow-blue-900/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
            >
                <LayoutDashboard size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Equity</span>
            </button>
            <button
                onClick={() => handleToggle('forex')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${marketType === 'forex'
                    ? 'bg-white text-purple-600 shadow-lg shadow-orange-900/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
            >
                <Coins size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Forex</span>
            </button>
        </div>
    );
};

export default FloatingTradeTypeToggle;
