import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { Input } from 'baseui/input';
import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';

import PortfolioManager from '../components/settings/PortfolioManager';
import StrategyManager from '../components/settings/StrategyManager';
import SymbolManager from '../components/settings/SymbolManager';

const Settings = () => {
  const [activeKey, setActiveKey] = useState<React.Key>('0');
  const [defaultQty, setDefaultQty] = useState('');

  useEffect(() => {
    const savedQty = localStorage.getItem('defaultQuantity');
    if (savedQty) setDefaultQty(savedQty);
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem('defaultQuantity', defaultQty);
    alert('Preferences saved!');
  };

  return (
    <div className="container mx-auto p-2">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-2">Settings</h1>
        <p className="text-secondary">Manage your preferences and trading resources.</p>
      </div>
      
      <div className="bg-surface rounded-2xl p-2 pt-3 border border-gray-700 shadow-2xl relative overflow-hidden">
        <Tabs
            activeKey={activeKey}
            onChange={({ activeKey }) => setActiveKey(activeKey)}
            activateOnFocus
            className="w-full"
        >
            <Tab title="General">
                <div className="p-2 max-w-md">
                    <h2 className="text-xl font-semibold mb-4">Preferences</h2>
                    <FormControl label="Default Trade Quantity">
                        <Input 
                            value={defaultQty}
                            onChange={(e) => setDefaultQty(e.currentTarget.value)}
                            type="number"
                            placeholder="Enter default quantity"
                        />
                    </FormControl>
                    <Button onClick={handleSavePreferences}>Save Preferences</Button>
                </div>
            </Tab>
            <Tab title="Portfolios">
                <div className="p-2">
                     <PortfolioManager />
                </div>
            </Tab>
            <Tab title="Strategies">
                <div className="p-2">
                     <StrategyManager />
                </div>
            </Tab>
            <Tab title="Symbols">
                <div className="p-2">
                     <SymbolManager />
                </div>
            </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
