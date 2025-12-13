import React, { useState } from 'react';
import { Button } from 'baseui/button';
import TradeTable from '../components/TradeTable';
import CreateTradeModal from '../components/CreateTradeModal';
import { Icon } from '../components/ui/Icon';

import PnlCalendar from '../components/PnlCalendar';


const Dashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pastedFile, setPastedFile] = useState<File | null>(null);

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              setPastedFile(blob);
              setIsOpen(true);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);


  return (
    <div className="container mx-auto p-2">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-600 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your trading performance.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} startEnhancer={<Icon name='add' size={{ height: 24, width: 24 }} />} className='' overrides={{
          BaseButton: {
            style: {
              backgroundColor: '#616161ff',
              ':hover': { backgroundColor: '#5e5e5eff' },
              borderRadius: '12px',
              height: '48px',
              fontWeight: 600,
            }
          },
          StartEnhancer: {
            style: {
              margin: '0',
            }
          }
        }}>
        </Button>
      </div>

      <div className="bg-surface rounded-2xl p-1 border border-gray-700 shadow-2xl overflow-hidden relative">
        <TradeTable />
      </div>

      <PnlCalendar />

      <CreateTradeModal isOpen={isOpen} onClose={() => { setIsOpen(false); setPastedFile(null); }} initialFile={pastedFile} />
    </div>
  );
};

export default Dashboard;
