import React, { useEffect } from "react";
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
    console.log(values);
    const data = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "tags" || key === "rule_violations") {
        data.append(key, JSON.stringify(value ?? []));
      } else if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });

    if (values.photo instanceof File) {
      data.append("photo", values.photo);
    }

    if (Array.isArray(values.timeframe_photos)) {
      const photosForBody = values.timeframe_photos.map((tp) => {
        if (tp.photo instanceof File) {
          data.append(tp.type, tp.photo);
          return { type: tp.type, photo: "" }; // Backend will fill this
        }
        return tp; // Existing photo URL
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
          accordion
          defaultActiveKey={["trade"]}
          ghost
          expandIconPosition="end"
          items={[
            {
              key: "trade",
              label: <Typography.Title level={5} style={{ margin: 0 }}>Trade Details</Typography.Title>,
              children: (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px 16px" }}>
                  <Form.Item label="Symbol" required style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="symbol_id"
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder="Select symbol"
                          options={symbols?.map((val) => ({
                            label: val.symbol,
                            value: val.id,
                          })) ?? []}
                          showSearch
                        />
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

                  <Form.Item label="Tags" style={{ gridColumn: "span 3" }}>
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

                  <Form.Item label="Entry Reason" style={{ gridColumn: "span 3" }}>
                    <Controller
                      control={control}
                      name="entry_reason"
                      render={({ field }) => <Input.TextArea {...field} rows={3} />}
                    />
                  </Form.Item>

                  <Form.Item label="Exit Reason" style={{ gridColumn: "span 3" }}>
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
              label: <Typography.Title level={5} style={{ margin: 0 }}>Psychological & Rules</Typography.Title>,
              children: (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px 16px" }}>
                  <Form.Item label="Entry Execution" style={{ gridColumn: "span 2" }}>
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

                  <Form.Item label="Exit Execution" style={{ gridColumn: "span 2" }}>
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

                  <Form.Item label="Emotional State" style={{ gridColumn: "span 2" }}>
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

                  <Form.Item label="Greed" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="is_greed"
                      render={({ field }) => <Switch {...field} checked={field.value} />}
                    />
                  </Form.Item>

                  <Form.Item label="FOMO" style={{ gridColumn: "span 1" }}>
                    <Controller
                      control={control}
                      name="is_fomo"
                      render={({ field }) => <Switch {...field} checked={field.value} />}
                    />
                  </Form.Item>

                  <Form.Item label="Rule Violations" style={{ gridColumn: "span 4" }}>
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

                  <Form.Item label="Post Trade Thoughts" style={{ gridColumn: "span 6" }}>
                    <Controller
                      control={control}
                      name="post_trade_thoughts"
                      render={({ field }) => <Input.TextArea {...field} rows={3} />}
                    />
                  </Form.Item>
                </div>
              ),
            },
            {
              key: "photos",
              label: <Typography.Title level={5} style={{ margin: 0 }}>Photo Evidence</Typography.Title>,
              children: (
                <div>
                  <Form.Item label="Main Result Photo">
                    <Controller
                      control={control}
                      name="photo"
                      render={({ field }) => (
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
                </div>
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
