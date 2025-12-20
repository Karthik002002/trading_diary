import React, { useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";

import {
  usePortfolios,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
} from "../../hooks/useResources";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { VirtualTable } from "../VirtualTable";
import { Icon } from "../ui/Icon";
import { Button, Input, Modal } from "antd";

const PortfolioManager = () => {
  const { data: portfolios, isLoading } = usePortfolios();
  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, description: item.description || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", description: "" });
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
    if (confirm("Are you sure you want to delete this portfolio?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<any>();
    return [
      columnHelper.accessor("id", { header: "ID", size: 60 }),
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (props) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleOpen(props.row.original)}
              className="text-blue-400 hover:text-blue-300"
            >
              <Icon name="edit" size={{ height: 14, width: 14 }} />
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
        <h2 className="text-xl font-semibold">Manage Portfolios</h2>
        <Button onClick={() => handleOpen()}>Add Portfolio</Button>
      </div>

      <VirtualTable data={portfolios || []} columns={columns} height="400px" />

      <Modal
        open={isOpen}
        onCancel={handleClose}
        closable
        footer={
          <>
            <Button variant="link" onClick={handleClose}>
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
        title={editingId ? "Edit Portfolio" : "New Portfolio"}
      >
        <Input
          value={formData.name}
          placeholder="Enter Name"
          onChange={(e) =>
            setFormData({ ...formData, name: e.currentTarget.value })
          }
        />

        <Input
          value={formData.description}
          placeholder="Enter description"
          onChange={(e) =>
            setFormData({ ...formData, description: e.currentTarget.value })
          }
        />
      </Modal>
    </div>
  );
};

export default PortfolioManager;
