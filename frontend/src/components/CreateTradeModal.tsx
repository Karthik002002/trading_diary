import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton } from 'baseui/modal';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Select } from 'baseui/select';
import { useCreateTrade, useStrategies, useSymbols, useUpdateTrade, type Trade } from '../hooks/useTrades';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
  tradeToEdit?: Trade | null;
}

const CreateTradeModal: React.FC<Props> = ({ isOpen, onClose, initialFile, tradeToEdit }) => {
  const mutation = useCreateTrade();
  const updateMutation = useUpdateTrade();
  const { data: strategies } = useStrategies();
  const { data: symbols } = useSymbols();

  const [formData, setFormData] = useState({
    strategy_id: '1',
    symbol_id: '101',
    quantity: '',
    type: 'buy',
    trade_date: new Date().toISOString().split('T')[0],
    entry_price: '',
    exit_price: '',
    entry_reason: '',
    exit_reason: '',
    outcome: 'neutral',
  });
  const [file, setFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (tradeToEdit) {
        setFormData({
          strategy_id: tradeToEdit.strategy_id.toString(),
          symbol_id: tradeToEdit.symbol_id.toString(),
          quantity: tradeToEdit.quantity.toString(),
          type: tradeToEdit.type,
          trade_date: new Date(tradeToEdit.trade_date).toISOString().split('T')[0],
          entry_price: tradeToEdit.entry_price.toString(),
          exit_price: tradeToEdit.exit_price.toString(),
          entry_reason: tradeToEdit.entry_reason || '',
          exit_reason: tradeToEdit.exit_reason || '',
          outcome: tradeToEdit.outcome || 'neutral',
        });
        // We can't set file from URL easily back for re-upload, but we can show it exists or just handle new files.
        // If creating new from paste:
      } else {
        // Reset to default for new trade
        setFormData({
          strategy_id: '1',
          symbol_id: '101',
          quantity: '',
          type: 'buy',
          trade_date: new Date().toISOString().split('T')[0],
          entry_price: '',
          exit_price: '',
          entry_reason: '',
          exit_reason: '',
          outcome: 'neutral',
        });
      }

      if (initialFile) {
        setFile(initialFile);
      } else {
        setFile(null);
      }
    } else {
      setFile(null);
    }
  }, [isOpen, initialFile, tradeToEdit]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (params: any, name: string) => {
    if (params.value.length > 0) {
      setFormData(prev => ({ ...prev, [name]: params.value[0].id }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (file) {
      data.append('photo', file);
    }

    if (tradeToEdit) {
      updateMutation.mutate({ id: tradeToEdit._id, data }, {
        onSuccess: () => {
          onClose();
          console.log("Trade updated successfully");
        },
        onError: (err) => {
          console.error("Failed to update trade", err);
        }
      });
    } else {
      mutation.mutate(data, {
        onSuccess: () => {
          onClose();
          console.log("Trade created successfully");
        },
        onError: (err) => {
          console.error("Failed to create trade", err);
        }
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeable
      overrides={{
        Root: {
          style: {
            zIndex: 9999,
          }
        },
        Dialog: {
          style: {
            width: '80vw',
            maxWidth: '80vw',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <ModalHeader>{tradeToEdit ? 'Edit Trade' : 'Record New Trade'}</ModalHeader>
      <ModalBody className="flex-1">
        <div className="grid grid-cols-6 gap-4 w-full">
          <div className="col-span-2">
            <FormControl label="Strategy ID">
              <Select
                options={strategies?.map((s: any) => ({ id: s.id, label: s.name })) || []}
                value={formData.strategy_id ? [{ id: formData.strategy_id }] : []}
                onChange={params => handleSelectChange(params, 'strategy_id')}
                searchable
                labelKey="label"
                valueKey="id"
              />
            </FormControl>
          </div>
          <div className="col-span-2">
            <FormControl label="Symbol ID">
              <Select
                options={symbols?.map((s: any) => ({ id: s.id, label: s.symbol })) || []}
                value={formData.symbol_id ? [{ id: formData.symbol_id }] : []}
                onChange={params => handleSelectChange(params, 'symbol_id')}
                searchable
                labelKey="label"
                valueKey="id"
              />
            </FormControl>
          </div>
          <div className="col-span-2">
            <FormControl label="Quantity">
              <Input name="quantity" value={formData.quantity} onChange={handleChange} type="number" />
            </FormControl>
          </div>
          <div className="col-span-2">
            <FormControl label="Type">
              <Select
                options={[{ id: 'buy', label: 'Buy' }, { id: 'sell', label: 'Sell' }]}
                value={[{ id: formData.type }]}
                onChange={params => handleSelectChange(params, 'type')}
              />
            </FormControl>
          </div>
          <div className="col-span-2">
            <FormControl label="Date">
              <Input name="trade_date" value={formData.trade_date} onChange={handleChange} type="date" />
            </FormControl>
          </div>
          <div className="col-span-2">
            <FormControl label="Entry Price">
              <Input name="entry_price" value={formData.entry_price} onChange={handleChange} type="number" step={0.01} />
            </FormControl>
          </div>
          <div className="col-span-2">
            <FormControl label="Exit Price">
              <Input name="exit_price" value={formData.exit_price} onChange={handleChange} type="number" step={0.01} />
            </FormControl>
          </div>
          <div className="col-span-2">
            <FormControl label="Outcome">
              <Select
                options={[{ id: 'win', label: 'Win' }, { id: 'loss', label: 'Loss' }, { id: 'neutral', label: 'Neutral' }]}
                value={[{ id: formData.outcome }]}
                onChange={params => handleSelectChange(params, 'outcome')}
              />
            </FormControl>
          </div>
          <div className="col-span-3">
            <FormControl label="Entry Reason">
              <Input name="entry_reason" value={formData.entry_reason} onChange={handleChange} />
            </FormControl>
          </div>
          <div className="col-span-3">
            <FormControl label="Exit Reason">
              <Input name="exit_reason" value={formData.exit_reason} onChange={handleChange} />
            </FormControl>
          </div>
          <div className="col-span-4">
            <FormControl label="Photo Evidence">
              <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </FormControl>
            {file && <div className="text-xs text-gray-500 mt-1">Selected: {file.name}</div>}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind="tertiary" onClick={onClose} className="mr-2 bg-gray-500">Cancel</ModalButton>
        <ModalButton onClick={handleSubmit} isLoading={mutation.isPending || updateMutation.isPending}>
          {tradeToEdit ? 'Update Trade' : 'Save Trade'}
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default CreateTradeModal;
