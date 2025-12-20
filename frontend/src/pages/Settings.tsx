import React, { useState, useEffect } from 'react';
import { Tabs, Input, Button, Form } from 'antd';

import PortfolioManager from '../components/settings/PortfolioManager';
import StrategyManager from '../components/settings/StrategyManager';
import SymbolManager from '../components/settings/SymbolManager';

const Settings = () => {
  const [activeKey, setActiveKey] = useState<string>('general');
  const [defaultQty, setDefaultQty] = useState('');

  useEffect(() => {
    const savedQty = localStorage.getItem('defaultQuantity');
    if (savedQty) setDefaultQty(savedQty);
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem('defaultQuantity', defaultQty);
    alert('Preferences saved!');
  };

  const items = [
    {
      key: 'general',
      label: 'General',
      children: (
        <div className="p-2 max-w-md">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>

          <Form layout="vertical">
            <Form.Item label="Default Trade Quantity">
              <Input
                value={defaultQty}
                onChange={(e) => setDefaultQty(e.target.value)}
                type="number"
                placeholder="Enter default quantity"
              />
            </Form.Item>

            <Button type="primary" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </Form>
        </div>
      ),
    },
    {
      key: 'portfolios',
      label: 'Portfolios',
      children: (
        <div className="p-2">
          <PortfolioManager />
        </div>
      ),
    },
    {
      key: 'strategies',
      label: 'Strategies',
      children: (
        <div className="p-2">
          <StrategyManager />
        </div>
      ),
    },
    {
      key: 'symbols',
      label: 'Symbols',
      children: (
        <div className="p-2">
          <SymbolManager />
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-2">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-secondary">
          Manage your preferences and trading resources.
        </p>
      </div>

      <div className="bg-surface rounded-2xl p-2 pt-3 border border-gray-700 shadow-2xl">
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={items}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default Settings;
