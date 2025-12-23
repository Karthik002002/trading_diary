import { useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";

import {
  useSymbols,
  useCreateSymbol,
  useUpdateSymbol,
  useDeleteSymbol,
} from "../../hooks/useResources";
import { FaTrash, FaPlus } from "react-icons/fa";
import { VirtualTable } from "../VirtualTable";
import { Icon } from "../ui/Icon";
import { Button, Input, Modal } from "antd";

const SymbolManager = () => {
  const { data: symbols, isLoading } = useSymbols();
  const createMutation = useCreateSymbol();
  const updateMutation = useUpdateSymbol();
  const deleteMutation = useDeleteSymbol();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ symbol: "", name: "" });

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ symbol: item.symbol, name: item.name });
    } else {
      setEditingId(null);
      setFormData({ symbol: "", name: "" });
    }
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: formData },
        { onSuccess: handleClose }
      );
    } else {
      createMutation.mutate(formData, { onSuccess: handleClose });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this symbol?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<any>();
    return [
      columnHelper.accessor("id", { header: "ID", size: 60 }),
      columnHelper.accessor("symbol", { header: "Symbol" }),
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (props) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleOpen(props.row.original)}
              className="text-blue-400 hover:text-blue-300"
            >
              <Icon name="edit" size={{ height: 20, width: 20 }} />
            </button>
            <button
              onClick={() => handleDelete(props.row.original.id)}
              className="text-red-400 hover:text-red-300"
            >
              <FaTrash />
            </button>
          </div>
        ),
        size: 100,
      }),
    ];
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manage Symbols</h2>
        <Button onClick={() => handleOpen()}>Add Symbol</Button>
      </div>

      <VirtualTable data={symbols || []} columns={columns} height="400px" />

      <Modal
        open={isOpen}
        onCancel={handleClose}
        closable
        title={editingId ? "Edit Symbol" : "New Symbol"}
        footer={
          <>
            <Button variant="filled" onClick={handleClose}>
              Cancel
            </Button>
            {/* @ts-ignore */}
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        {/* <FormControl label="Symbol"> */}
        <Input
          value={formData.symbol}
          placeholder="Enter symbol"
          onChange={(e) =>
            setFormData({ ...formData, symbol: e.currentTarget.value })
          }
          style={{ marginBottom: "10px" }}
        />
        {/* </FormControl> */}
        {/* <FormControl label="Name"> */}
        <Input
          value={formData.name}
          placeholder="Enter Name"
          onChange={(e) =>
            setFormData({ ...formData, name: e.currentTarget.value })
          }
        />
        {/* </FormControl> */}
        {/* </ModalBody>
        <ModalFooter> */}
        {/* @ts-ignore */}

        {/* </ModalFooter> */}
      </Modal>
    </div>
  );
};

export default SymbolManager;
