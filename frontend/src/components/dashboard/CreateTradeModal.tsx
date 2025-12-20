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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useForm, Controller } from "react-hook-form";

import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateTrade,
  useStrategies,
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
  const { data: strategies } = useStrategies();
  const { data: symbols } = useSymbols();

  const { control, handleSubmit, reset, watch } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      strategy_id: undefined,
      symbol_id: "",
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
    },
  });

  const watchedData = watch()


  /** Populate form on edit */
  useEffect(() => {
    if (isOpen && tradeToEdit) {

      reset({
        strategy_id: tradeToEdit.strategy_id.toString(),
        symbol_id: tradeToEdit.symbol_id.toString(),
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
        rule_violations: tradeToEdit.rule_violations as unknown as TradeFormValues["rule_violations"] ?? [],
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
      if (key === "tags") {
        data.append("tags", JSON.stringify(value ?? []));
      } else if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });

    if (values.photo instanceof File) {
      data.append("photo", values.photo);
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
        xs: '90%',
        sm: '70%',
        md: '80%',
        lg: '80%',
        xl: '60%',
        xxl: '60%',
      }}
      destroyOnClose
    >
      <Form
        layout="vertical"
        onFinish={handleSubmit((data) => {
          onSubmit(data as unknown as TradeFormValues);
        })}
        styles={{
          content: {
            // display: "grid",
            // gridTemplateColumns: "repeat(3, 1fr)",
            // gap: 16,
          },
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 16,

          }}
        >
          <Form.Item label="Symbol" style={{ gridColumn: "span 2" }}>
            <Controller
              control={control}
              name="symbol_id"
              render={({ field }) => (
                <Select {...field} placeholder="Select symbol">
                  {symbols?.map((s) => (
                    <Select.Option key={s.id} value={String(s.id)}>
                      {s.symbol}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>

          <Form.Item label="Quantity" style={{ gridColumn: "span 1" }}>
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <InputNumber {...field} className="w-full" styles={{ root: { width: "100%" } }} />
              )}
            />
          </Form.Item>
          <Form.Item label="Confidence" style={{ gridColumn: "span 1" }}>
            <Controller
              control={control}
              name="confidence_level"
              render={({ field }) => (
                <InputNumber {...field} className="w-full" styles={{ root: { width: "100%" } }} min={1} max={10} />
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

          <Form.Item label="Date" style={{ gridColumn: "span 2" }}>
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

          <Form.Item label="Entry Price">
            <Controller
              control={control}
              name="entry_price"
              render={({ field }) => (
                <InputNumber {...field} className="w-full" step={0.01} />
              )}
            />
          </Form.Item>

          <Form.Item label="Exit Price">
            <Controller
              control={control}
              name="exit_price"
              render={({ field }) => (
                <InputNumber {...field} className="w-full" step={0.01} />
              )}
            />
          </Form.Item>
          <Form.Item label="Outcome">
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
          <Form.Item label="Market" style={{ gridColumn: "span 1" }}>
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


          <Form.Item label="Photo Evidence" style={{ gridColumn: "span 1", placeSelf: "center" }}>
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
                >
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
              )}
            />
          </Form.Item>
          <Form.Item label="Entry Reason" style={{ gridColumn: "span 3" }}>
            <Controller
              control={control}
              name="entry_reason"
              render={({ field }) => (
                <Input.TextArea {...field} rows={4} />
              )}
            />
          </Form.Item>
          <Form.Item label="Exit Reason" style={{ gridColumn: "span 3" }}>
            <Controller
              control={control}
              name="exit_reason"
              render={({ field }) => (
                <Input.TextArea {...field} rows={4} />
              )}
            />
          </Form.Item>
          <Form.Item label="Greed" style={{ gridColumn: "span 1", placeSelf: "center" }}>
            <Controller
              control={control}
              name="is_greed"
              render={({ field }) => (
                <Switch {...field} />
              )}
            />
          </Form.Item>
          <Form.Item label="FOMO" style={{ gridColumn: "span 1", placeSelf: "center" }}>
            <Controller
              control={control}
              name="is_fomo"
              render={({ field }) => (
                <Switch {...field} />
              )}
            />
          </Form.Item>
          <Form.Item label="Rule Violations" style={{ gridColumn: "span 1" }}>
            <Controller
              control={control}
              name="rule_violations"
              render={({ field }) => (
                <Select mode="tags" {...field} placeholder="Add rule violations" options={[{ value: "Early Exit", label: "Early Exit" }, { value: "Late Exit", label: "Late Exit" }, { value: "Overconfidence", label: "Overconfidence" }, { value: "Fear", label: "Fear" }, { value: "Tilt", label: "Tilt" }, { value: "Early Entry", label: "Early Entry" }, { value: "Late Entry", label: "Late Entry" }, { value: "Revenge Trade", label: "Revenge Trade" }]} style={{ maxHeight: "100px", overflowY: "scroll" }} />
              )}
            />
          </Form.Item>
          <Form.Item label="Post Trade Thoughts" style={{ gridColumn: "span 2" }}>
            <Controller
              control={control}
              name="post_trade_thoughts"
              render={({ field }) => (
                <Input.TextArea {...field} rows={4} />
              )}
            />
          </Form.Item>



          <Form.Item label="Tags" style={{ gridColumn: "span 2" }}>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Select mode="tags" {...field} placeholder="Add tags" style={{ minHeight: "100px", maxHeight: "200px" }} />
              )}
            />
          </Form.Item>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {tradeToEdit ? "Update Trade" : "Save Trade"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTradeModal;
