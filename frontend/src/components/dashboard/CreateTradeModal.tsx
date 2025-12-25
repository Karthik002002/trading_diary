import React, { Fragment, useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Input,
  Switch,
  Typography,
  Collapse,
  Flex,
} from "antd";
import { UploadOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useForm, Controller, useFieldArray } from "react-hook-form";

import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateTrade,
  // useStrategies,
  useSymbols,
  useUpdateTrade,
  type Trade,
} from "../../hooks/useTrades";
import { tradeSchema, type TradeFormValues } from "./schema";
import { FaPaste } from "react-icons/fa";
import { CreateSymbolModal } from "../settings/CreateSymbolModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
  tradeToEdit?: Trade | null;
}

const CreateTradeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tradeToEdit,
}) => {
  const createMutation = useCreateTrade();
  const updateMutation = useUpdateTrade();
  // const { data: strategies } = useStrategies();
  const { data: symbols } = useSymbols();

  // State for symbol creation modal
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [pendingSymbolFieldChange, setPendingSymbolFieldChange] = useState<((id: number) => void) | null>(null);

  const { control, handleSubmit, reset } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema as any),
    defaultValues: {
      strategy_id: 1,
      symbol_id: 1,
      quantity: 10,
      confidence_level: 8,
      type: "buy",
      trade_date: dayjs().format("YYYY-MM-DD"),
      entry_price: 100,
      exit_price: 120,
      entry_reason: "",
      exit_reason: "",
      market_condition: "trending",
      entry_execution: "perfect",
      exit_execution: "perfect",
      emotional_state: "calm",
      outcome: "neutral",
      is_greed: false,
      target_price: 120,
      stop_loss_price: 100,
      is_fomo: false,
      post_trade_thoughts: "",
      tags: [],
      rule_violations: [],
      timeframe_photos: [{ type: "30m", photo: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "timeframe_photos",
  });



  /** Populate form on edit */
  useEffect(() => {
    if (isOpen && tradeToEdit) {
      reset({
        strategy_id: tradeToEdit.strategy_id,
        symbol_id: tradeToEdit.symbol_id,
        quantity: tradeToEdit.quantity,
        confidence_level: tradeToEdit.confidence_level ?? 8,
        type: tradeToEdit.type,
        trade_date: dayjs(tradeToEdit.trade_date).format("YYYY-MM-DD"),
        entry_price: tradeToEdit.entry_price,
        exit_price: tradeToEdit.exit_price,
        entry_reason: tradeToEdit.entry_reason ?? "",
        exit_reason: tradeToEdit.exit_reason ?? "",
        outcome: tradeToEdit.outcome ?? "neutral",
        is_greed: tradeToEdit.is_greed ?? false,
        is_fomo: tradeToEdit.is_fomo ?? false,
        tags: tradeToEdit.tags ?? [],
        rule_violations:
          (tradeToEdit.rule_violations as unknown as TradeFormValues["rule_violations"]) ??
          [],
        timeframe_photos: tradeToEdit.timeframe_photos?.length > 0
          ? tradeToEdit.timeframe_photos.map(tp => ({ type: tp.type, photo: tp.photo }))
          : [{ type: "30m", photo: null }],
      });
    }

    if (!tradeToEdit && isOpen) {
      reset();
    }
  }, [isOpen, tradeToEdit, reset]);

  /** Submit */
  const onSubmit = (values: TradeFormValues) => {
    const data = new FormData();
    console.log(data, values)

    // Skip these keys - they need special handling
    const skipKeys = ["tags", "rule_violations", "photo", "timeframe_photos"];

    Object.entries(values).forEach(([key, value]) => {
      if (skipKeys.includes(key)) return;

      if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });

    // Handle arrays
    data.append("tags", JSON.stringify(values.tags ?? []));
    data.append("rule_violations", JSON.stringify(values.rule_violations ?? []));

    // Handle main photo - support both File and Blob (from clipboard paste)
    if (values.photo instanceof File || values.photo instanceof Blob) {
      data.append("photo", values.photo, values.photo instanceof File ? values.photo.name : "clipboard-image.png");
    }

    // Handle timeframe photos - support both File and Blob
    if (Array.isArray(values.timeframe_photos)) {
      const photosForBody = values.timeframe_photos.map((tp) => {
        if (tp.photo instanceof File || tp.photo instanceof Blob) {
          const fileName = tp.photo instanceof File ? tp.photo.name : `${tp.type}-clipboard.png`;
          data.append(tp.type, tp.photo, fileName);
          return { type: tp.type, photo: "" }; // Backend will fill this
        }
        return tp; // Existing photo URL or null
      });
      data.append("timeframe_photos", JSON.stringify(photosForBody));
    }

    if (tradeToEdit) {
      updateMutation.mutate(
        { id: tradeToEdit._id, data },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={tradeToEdit ? "Edit Trade" : "Record New Trade"}
      footer={null}
      centered
      width={{
        xs: "90%",
        sm: "70%",
        md: "80%",
        lg: "80%",
        xl: "90%",
        xxl: "90%",
      }}
      styles={{ container: { maxHeight: "90vh", overflowY: "scroll" } }}
      destroyOnClose
    >
      <Form
        layout="vertical"
        onFinish={handleSubmit((data) => {
          onSubmit(data as unknown as TradeFormValues);
        }, (error) => { console.log(error) })}
      >
        <Collapse
          defaultActiveKey={["trade", "psychological", "photos"]}
          ghost
          expandIconPosition="end"
          styles={{ root: { maxHeight: "70vh", overflowY: "scroll" } }}
          items={[
            {
              key: "trade",
              label: <Typography.Title level={5} className="m-0 border-b-2 border-stone-700 pb-2">Trade Details</Typography.Title>,
              children: (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "12px 16px" }}>
                  <Form.Item label="Symbol" required style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="symbol_id"
                      render={({ field }) => (
                        <>
                          <Select
                            {...field}
                            placeholder="Select symbol"
                            options={[
                              ...(symbols?.map((val) => ({
                                label: val.symbol,
                                value: val.id,
                              })) ?? []),
                              {
                                label: (
                                  <span className="text-white flex items-center gap-1">
                                    <PlusOutlined /> Create New
                                  </span>
                                ),
                                value: -1,
                              },
                            ]}
                            showSearch
                            onChange={(value) => {
                              if (value === -1) {
                                setPendingSymbolFieldChange(() => field.onChange);
                                setIsSymbolModalOpen(true);
                              } else {
                                field.onChange(value);
                              }
                            }}
                          />
                          <CreateSymbolModal
                            isOpen={isSymbolModalOpen}
                            onClose={() => {
                              setIsSymbolModalOpen(false);
                              setPendingSymbolFieldChange(null);
                            }}
                            onSuccess={(newSymbol) => {
                              if (pendingSymbolFieldChange) {
                                pendingSymbolFieldChange(newSymbol.id);
                              }
                            }}
                          />
                        </>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Date" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="trade_date"
                      render={({ field }) => (
                        <DatePicker
                          className="w-full"
                          value={dayjs(field.value)}
                          onChange={(d) => field.onChange(d?.format("YYYY-MM-DD"))}
                        />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Type" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <Select {...field}>
                          <Select.Option value="buy">Buy</Select.Option>
                          <Select.Option value="sell">Sell</Select.Option>
                        </Select>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Quantity" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="quantity"
                      render={({ field }) => (
                        <InputNumber {...field} className="!w-full" />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Confidence" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="confidence_level"
                      render={({ field }) => (
                        <InputNumber {...field} className="!w-full" min={1} max={10} />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Entry Price" required style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="entry_price"
                      render={({ field }) => (
                        <InputNumber {...field} className="!w-full" step={0.01} />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Exit Price" required style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="exit_price"
                      render={({ field }) => (
                        <InputNumber {...field} className="!w-full" step={0.01} />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Target Price" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="target_price"
                      render={({ field }) => (
                        <InputNumber {...field} className="!w-full" step={0.01} />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Stop Loss Price" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="stop_loss_price"
                      render={({ field }) => (
                        <InputNumber {...field} className="!w-full" step={0.01} />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Outcome" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="outcome"
                      render={({ field }) => (
                        <Select {...field}>
                          <Select.Option value="win">Win</Select.Option>
                          <Select.Option value="loss">Loss</Select.Option>
                          <Select.Option value="neutral">Neutral</Select.Option>
                        </Select>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Market Condition" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="market_condition"
                      render={({ field }) => (
                        <Select {...field}>
                          <Select.Option value="trending">Trending</Select.Option>
                          <Select.Option value="ranging">Ranging</Select.Option>
                          <Select.Option value="volatile">Volatile</Select.Option>
                          <Select.Option value="choppy">Choppy</Select.Option>
                        </Select>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Tags" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="tags"
                      render={({ field }) => (
                        <Select
                          mode="tags"
                          {...field}
                          placeholder="Add tags"
                        />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Entry Reason" style={{ gridColumn: "span 2" }}>
                    <Controller
                      control={control}
                      name="entry_reason"
                      render={({ field }) => <Input.TextArea {...field} rows={3} />}
                    />
                  </Form.Item>

                  <Form.Item label="Exit Reason" style={{ gridColumn: "span 2" }}>
                    <Controller
                      control={control}
                      name="exit_reason"
                      render={({ field }) => <Input.TextArea {...field} rows={3} />}
                    />
                  </Form.Item>
                </div>
              ),
            },
            {
              key: "psychological",
              label: <Typography.Title level={5} className="m-0 border-b-2 border-stone-700 pb-2">Psychological & Rules</Typography.Title>,
              children: (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "12px 16px" }}>
                  <Form.Item label="Entry Execution" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="entry_execution"
                      render={({ field }) => (
                        <Select {...field}>
                          <Select.Option value="perfect">Perfect</Select.Option>
                          <Select.Option value="early">Early</Select.Option>
                          <Select.Option value="late">Late</Select.Option>
                        </Select>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Exit Execution" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="exit_execution"
                      render={({ field }) => (
                        <Select {...field}>
                          <Select.Option value="perfect">Perfect</Select.Option>
                          <Select.Option value="early">Early</Select.Option>
                          <Select.Option value="late">Late</Select.Option>
                        </Select>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Emotional State" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="emotional_state"
                      render={({ field }) => (
                        <Select {...field}>
                          <Select.Option value="calm">Calm</Select.Option>
                          <Select.Option value="anxious">Anxious</Select.Option>
                          <Select.Option value="overconfident">Overconfident</Select.Option>
                          <Select.Option value="fearful">Fearful</Select.Option>
                          <Select.Option value="tilted">Tilted</Select.Option>
                        </Select>
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Greed" style={{ gridColumn: "span 1" }} className="flex items-center justify-center">
                    <Controller
                      control={control}
                      name="is_greed"
                      render={({ field }) => <Switch {...field} checked={field.value} />}
                    />
                  </Form.Item>

                  <Form.Item label="FOMO" style={{ gridColumn: "span 1" }} className="flex items-center justify-center">
                    <Controller
                      control={control}
                      name="is_fomo"
                      render={({ field }) => <Switch {...field} checked={field.value} />}
                    />
                  </Form.Item>

                  <Form.Item label="Rule Violations" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="rule_violations"
                      render={({ field }) => (
                        <Select
                          mode="tags"
                          {...field}
                          placeholder="Add rule violations"
                          options={[
                            { value: "Early Exit", label: "Early Exit" },
                            { value: "Late Exit", label: "Late Exit" },
                            { value: "Overconfidence", label: "Overconfidence" },
                            { value: "Fear", label: "Fear" },
                            { value: "Tilt", label: "Tilt" },
                            { value: "Early Entry", label: "Early Entry" },
                            { value: "Late Entry", label: "Late Entry" },
                            { value: "Revenge Trade", label: "Revenge Trade" },
                          ]}
                        />
                      )}
                    />
                  </Form.Item>

                  <Form.Item label="Post Trade Thoughts" style={{ gridColumn: "span 2" }}>
                    <Controller
                      control={control}
                      name="post_trade_thoughts"
                      render={({ field }) => <Input.TextArea {...field} rows={3} className="!h-full" />}
                    />
                  </Form.Item>
                </div>
              ),
            },
            {
              key: "photos",
              label: <Typography.Title level={5} className="m-0 border-b-2 border-stone-700 pb-2">Photo Evidence</Typography.Title>,
              children: (
                <Flex gap={20}>
                  <Form.Item label="Main Result Photo">
                    <Controller
                      control={control}
                      name="photo"
                      render={({ field }) => (
                        <Flex>
                          <Upload
                            beforeUpload={(file) => {
                              field.onChange(file);
                              return false;
                            }}
                            maxCount={1}
                            accept=".png,.jpg,.jpeg"
                          >
                            <Button icon={<UploadOutlined />}>Upload Main Photo</Button>
                          </Upload>
                          {/* paste from clipboard only images */}
                          <Button icon={<FaPaste />} className="ml-2" onClick={async () => {
                            navigator.clipboard.read().then(async (items) => {
                              for (const item of items) {
                                const imageType = item.types.find(
                                  (type) => type === "image/png" || type === "image/jpeg"
                                );
                                if (imageType) {
                                  const blob = await item.getType(imageType);
                                  field.onChange(blob);
                                  break;
                                }
                              }
                            });

                          }}></Button>
                        </Flex>
                      )}
                    />
                  </Form.Item>

                  <div className="mt-4 pt-4 border-t border-stone-600">
                    <Typography.Text strong>Multi-Timeframe Screenshots</Typography.Text>
                    <div className="mt-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "80px 1fr 50px",
                            gap: 16,
                            alignItems: "end",
                            marginBottom: 12,
                          }}
                        >
                          <Form.Item style={{ marginBottom: 0 }}>
                            <Controller
                              control={control}
                              name={`timeframe_photos.${index}.type`}
                              render={({ field: selectField }) => (
                                <Select {...selectField} size="small" style={{ width: "100%" }}>
                                  {["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"].map(tf => (
                                    <Select.Option key={tf} value={tf}>{tf}</Select.Option>
                                  ))}
                                </Select>
                              )}
                            />
                          </Form.Item>

                          <Form.Item style={{ marginBottom: 0 }}>
                            <Controller
                              control={control}
                              name={`timeframe_photos.${index}.photo`}
                              render={({ field: uploadField }) => (
                                <Flex gap={16}>
                                  <Upload
                                    beforeUpload={(file) => {
                                      uploadField.onChange(file);
                                      return false;
                                    }}
                                    maxCount={1}
                                    accept=".png,.jpg,.jpeg"
                                  >
                                    <Button icon={<UploadOutlined />} size="small" className="w-full">
                                      {uploadField.value ? "Change" : "Select Photo"}
                                    </Button>
                                  </Upload>
                                  <Button icon={<FaPaste />} size="small" className="w-full" onClick={async () => {
                                    navigator.clipboard.read().then(async (items) => {
                                      for (const item of items) {
                                        const imageType = item.types.find(
                                          (type) => type === "image/png" || type === "image/jpeg"
                                        );
                                        if (imageType) {
                                          const blob = await item.getType(imageType);
                                          uploadField.onChange(blob);
                                          break;
                                        }
                                      }
                                    });

                                  }}></Button>
                                </Flex>
                              )}
                            />
                          </Form.Item>

                          {index > 0 && (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(index)}
                            />
                          )}
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => append({ type: "1h", photo: null })}
                        icon={<PlusOutlined />}
                        style={{ width: "100%", marginTop: 8 }}
                      >
                        Add Timeframe Screenshot
                      </Button>
                    </div>
                  </div>
                </Flex>
              ),
            },
          ]}
        />

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-stone-700">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {tradeToEdit ? "Update Trade Record" : "Save Trade Record"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTradeModal;
