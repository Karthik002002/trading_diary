import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Col,
	Form,
	Input,
	InputNumber,
	Modal,
	Radio,
	Row,
	Select,
	Switch,
	Typography,
} from "antd";
import type { FC } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { useDhanInstruments } from "../../hooks/useDhanData";

const { Text } = Typography;

const orderSchema = z
	.object({
		transactionType: z.enum(["BUY", "SELL"]),
		productType: z.enum(["INTRADAY", "CNC"]),
		exchangeSegment: z.enum([
			"NSE_EQ",
			"BSE_EQ",
			"NSE_FNO",
			"BSE_FNO",
			"MCX_COMM",
		]),
		orderType: z.enum(["LIMIT", "MARKET", "STOP_LOSS", "STOP_LOSS_MARKET"]),
		validity: z.enum(["DAY", "IOC"]),
		securityId: z.string().min(1, "Security ID is required"),
		quantity: z.coerce
			.number()
			.int()
			.positive("Quantity must be a positive integer"),
		price: z.coerce.number().min(0, "Price must be non-negative"),
		triggerPrice: z.coerce.number().optional(),
		disclosedQuantity: z.coerce.number().int().min(0).optional(),
		correlationId: z
			.string()
			.max(30)
			.regex(/^[a-zA-Z0-9 _-]*$/, "Only alphanumeric, space, _ or - allowed")
			.optional()
			.or(z.literal("")),
		afterMarketOrder: z.boolean().default(false),
		amoTime: z.enum(["PRE_OPEN", "OPEN", "OPEN_30", "OPEN_60"]).optional(),
		isSuperOrder: z.boolean().default(false),
		targetPrice: z.coerce.number().optional(),
		stopLossPrice: z.coerce.number().optional(),
		trailingJump: z.coerce.number().min(0).optional(),
	})
	.superRefine((data, ctx) => {
		if (
			["STOP_LOSS", "STOP_LOSS_MARKET"].includes(data.orderType) &&
			!data.triggerPrice
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Trigger price required for SL orders",
				path: ["triggerPrice"],
			});
		}
		if (data.afterMarketOrder && !data.amoTime) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "AMO time is required for AMO orders",
				path: ["amoTime"],
			});
		}
		if (data.isSuperOrder) {
			if (!data.targetPrice || data.targetPrice <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Target price is required for Super Orders",
					path: ["targetPrice"],
				});
			}
			if (!data.stopLossPrice || data.stopLossPrice <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Stop loss price is required for Super Orders",
					path: ["stopLossPrice"],
				});
			}
		}
	});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderModalProps {
	isOpen?: boolean;
	onClose?: () => void;
	dhanClientId?: string;
}

const OrderModal: FC<OrderModalProps> = ({
	isOpen = true,
	onClose = () => {},
	dhanClientId = "2508141541",
}) => {
	const [form] = Form.useForm<OrderFormData>();
	const [instrumentSearch, setInstrumentSearch] = useState<string>("");

	const { data: instruments, isLoading: instrumentsLoading } =
		useDhanInstruments(instrumentSearch);

	const transactionType = Form.useWatch("transactionType", form);
	const productType = Form.useWatch("productType", form);
	const orderType = Form.useWatch("orderType", form);
	const isSuperOrder = Form.useWatch("isSuperOrder", form);
	const afterMarketOrder = Form.useWatch("afterMarketOrder", form);

	const isBuy = transactionType === "BUY";
	const needsTrigger = orderType
		? ["STOP_LOSS", "STOP_LOSS_MARKET"].includes(orderType)
		: false;
	const isMarket = orderType === "MARKET" || orderType === "STOP_LOSS_MARKET";

	const exchangeOptions = [
		{ value: "NSE_EQ", label: "NSE EQ" },
		{ value: "BSE_EQ", label: "BSE EQ" },
		{ value: "NSE_FNO", label: "NSE F&O" },
		{ value: "BSE_FNO", label: "BSE F&O" },
		{ value: "MCX_COMM", label: "MCX COMM" },
	];

	const orderTypeOptions = isSuperOrder
		? [
				{ value: "LIMIT", label: "LIMIT" },
				{ value: "MARKET", label: "MARKET" },
			]
		: [
				{ value: "LIMIT", label: "LIMIT" },
				{ value: "MARKET", label: "MARKET" },
				{ value: "STOP_LOSS", label: "SL (LIMIT)" },
				{ value: "STOP_LOSS_MARKET", label: "SL-M" },
			];

	const amoTimeOptions = [
		{ value: "PRE_OPEN", label: "Pre-Open (9:00 AM)" },
		{ value: "OPEN", label: "Open (9:15 AM)" },
		{ value: "OPEN_30", label: "Open + 30 min" },
		{ value: "OPEN_60", label: "Open + 60 min" },
	];

	const onSubmit = (values: OrderFormData) => {
		const needsTriggerPrice = ["STOP_LOSS", "STOP_LOSS_MARKET"].includes(
			values.orderType,
		);

		const payload = values.isSuperOrder
			? {
					dhanClientId,
					correlationId: values.correlationId || undefined,
					transactionType: values.transactionType,
					exchangeSegment: values.exchangeSegment,
					productType: values.productType,
					orderType: values.orderType,
					securityId: values.securityId,
					quantity: values.quantity,
					price: isMarket ? 0 : values.price,
					targetPrice: values.targetPrice,
					stopLossPrice: values.stopLossPrice,
					trailingJump: values.trailingJump || 0,
				}
			: {
					dhanClientId,
					correlationId: values.correlationId || undefined,
					transactionType: values.transactionType,
					exchangeSegment: values.exchangeSegment,
					productType: values.productType,
					orderType: values.orderType,
					validity: values.validity,
					securityId: values.securityId,
					quantity: values.quantity,
					disclosedQuantity: values.disclosedQuantity || undefined,
					price: isMarket ? 0 : values.price,
					triggerPrice: needsTriggerPrice ? values.triggerPrice : undefined,
					afterMarketOrder: values.afterMarketOrder,
					amoTime: values.afterMarketOrder ? values.amoTime : undefined,
				};

		const cleanPayload = Object.fromEntries(
			Object.entries(payload).filter(
				([, v]) => v !== undefined && v !== "" && v !== 0,
			),
		);

		console.log("Order Payload:", JSON.stringify(cleanPayload, null, 2));
		console.log(
			"Endpoint:",
			values.isSuperOrder ? "POST /super/orders" : "POST /orders",
		);
	};

	const handleValuesChange = (
		changed: Partial<OrderFormData>,
		all: OrderFormData,
	) => {
		if (changed.productType && changed.productType === "CNC") {
			form.setFieldValue("productType", "CNC");
		}
		if (changed.isSuperOrder !== undefined) {
			if (changed.isSuperOrder === true && all.orderType) {
				const currentOrderType = all.orderType;
				if (
					currentOrderType === "STOP_LOSS" ||
					currentOrderType === "STOP_LOSS_MARKET"
				) {
					form.setFieldValue("orderType", "LIMIT");
				}
			}
		}
	};

	return (
		<Modal
			open={isOpen}
			onCancel={onClose}
			footer={null}
			title={
				<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
					<div
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: isBuy ? "#22c55e" : "#ef4444",
						}}
					/>
					<Text strong style={{ fontFamily: "IBM Plex Mono, monospace" }}>
						NEW ORDER
					</Text>
					{isSuperOrder && (
						<Text style={{ fontSize: 10, color: "#f59e0b" }}>SUPER</Text>
					)}
				</div>
			}
			width={window.innerWidth * 0.8}
			styles={{
				header: { background: "#080c12", borderBottom: "1px solid #1e2d3d" },
				body: { background: "#0a0f16", padding: 16 },
				// content: { background: "#0a0f16" },
			}}
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={onSubmit}
				onValuesChange={handleValuesChange}
				initialValues={{
					transactionType: "BUY",
					productType: "INTRADAY",
					exchangeSegment: "NSE_EQ",
					orderType: "LIMIT",
					validity: "DAY",
					securityId: "",
					quantity: 5,
					price: 0,
					triggerPrice: 0,
					disclosedQuantity: 0,
					correlationId: "",
					afterMarketOrder: false,
					amoTime: "OPEN",
					isSuperOrder: false,
					targetPrice: 0,
					stopLossPrice: 0,
					trailingJump: 0,
				}}
			>
				<Form.Item name="transactionType">
					<Radio.Group
						optionType="button"
						buttonStyle="solid"
						options={[
							{ value: "BUY", label: "BUY" },
							{ value: "SELL", label: "SELL" },
						]}
					/>
				</Form.Item>

				<Form.Item name="productType">
					<Radio.Group
						optionType="button"
						buttonStyle="solid"
						options={[
							{ value: "INTRADAY", label: "INTRADAY" },
							{ value: "CNC", label: "DELIVERY (CNC)" },
						]}
					/>
				</Form.Item>

				<Row gutter={10}>
					<Col span={8}>
						<Form.Item
							name="exchangeSegment"
							label={<Text type="secondary">Exchange</Text>}
							rules={[{ required: true }]}
						>
							<Select options={exchangeOptions} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							name="orderType"
							label={<Text type="secondary">Order Type</Text>}
							rules={[{ required: true }]}
						>
							<Select options={orderTypeOptions} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							name="securityId"
							label={<Text type="secondary">Stock</Text>}
							rules={[{ required: true, message: "Select a stock" }]}
						>
							<Select
								showSearch
								placeholder="Search stock..."
								loading={instrumentsLoading}
								allowClear
								onSearch={setInstrumentSearch}
								onChange={(value) => {
									form.setFieldValue("securityId", value || "");
								}}
								options={(instruments || []).map((inst) => ({
									value: inst.securityId,
									label: `${inst.tradingSymbol} - ${inst.companyName || inst.exchange}`,
								}))}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={10}>
					<Col span={12}>
						<Form.Item
							name="quantity"
							label={<Text type="secondary">Quantity</Text>}
							rules={[{ required: true, type: "number", min: 1 }]}
						>
							<InputNumber min={1} style={{ width: "100%" }} />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="price"
							label={
								<Text type="secondary">
									{isMarket ? "Price (Auto – Market)" : "Entry Price (₹)"}
								</Text>
							}
						>
							<InputNumber
								min={0}
								step={0.05}
								disabled={isMarket}
								style={{ width: "100%" }}
							/>
						</Form.Item>
					</Col>
				</Row>

				{needsTrigger && (
					<Form.Item
						name="triggerPrice"
						label={<Text type="secondary">Trigger Price (₹)</Text>}
						rules={[
							{
								required: true,
								message: "Trigger price required for SL orders",
							},
						]}
					>
						<InputNumber min={0} step={0.05} style={{ width: "100%" }} />
					</Form.Item>
				)}

				<Form.Item name="isSuperOrder" valuePropName="checked">
					<Switch />
					<Text style={{ marginLeft: 10 }}>Make it a Super Order</Text>
				</Form.Item>

				{isSuperOrder && (
					<div
						style={{
							background: "#0d1117",
							border: "1px solid #f59e0b30",
							borderRadius: 8,
							padding: 12,
							marginBottom: 12,
						}}
					>
						<Text
							strong
							style={{ color: "#f59e0b", display: "block", marginBottom: 12 }}
						>
							Super Order Config
						</Text>

						<Form.Item
							name="targetPrice"
							label={<Text type="secondary">Target Price (₹)</Text>}
							rules={[{ required: true }]}
						>
							<InputNumber min={0} step={0.05} style={{ width: "100%" }} />
						</Form.Item>

						<Form.Item
							name="stopLossPrice"
							label={<Text type="secondary">Stop Loss Price (₹)</Text>}
							rules={[{ required: true }]}
						>
							<InputNumber min={0} step={0.05} style={{ width: "100%" }} />
						</Form.Item>

						<Form.Item
							name="trailingJump"
							label={<Text type="secondary">Trailing Stop Loss Jump (₹)</Text>}
						>
							<InputNumber min={0} step={0.05} style={{ width: "100%" }} />
						</Form.Item>
					</div>
				)}

				{!isSuperOrder && (
					<>
						<Text
							type="secondary"
							style={{ display: "block", marginBottom: 8 }}
						>
							Optional Fields
						</Text>

						<Row gutter={10}>
							<Col span={12}>
								<Form.Item
									name="disclosedQuantity"
									label={<Text type="secondary">Disclosed Qty</Text>}
								>
									<InputNumber min={0} style={{ width: "100%" }} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="validity"
									label={<Text type="secondary">Validity</Text>}
								>
									<Select
										options={[
											{ value: "DAY", label: "DAY" },
											{ value: "IOC", label: "IOC" },
										]}
									/>
								</Form.Item>
							</Col>
						</Row>

						<Form.Item
							name="correlationId"
							label={<Text type="secondary">Correlation ID</Text>}
						>
							<Input
								maxLength={30}
								placeholder="Your tracking reference (max 30 chars)"
							/>
						</Form.Item>

						<Form.Item name="afterMarketOrder" valuePropName="checked">
							<Switch />
							<Text style={{ marginLeft: 10 }}>After Market Order (AMO)</Text>
						</Form.Item>

						{afterMarketOrder && (
							<Form.Item
								name="amoTime"
								label={<Text type="secondary">AMO Timing</Text>}
								rules={[{ required: true }]}
							>
								<Select options={amoTimeOptions} />
							</Form.Item>
						)}
					</>
				)}

				<Button
					type="primary"
					htmlType="submit"
					block
					style={{
						background: isBuy
							? "linear-gradient(135deg, #16a34a, #22c55e)"
							: "linear-gradient(135deg, #dc2626, #ef4444)",
						fontWeight: 700,
						fontFamily: "'IBM Plex Mono', monospace",
					}}
				>
					{isBuy ? "BUY" : "SELL"}{" "}
					{isSuperOrder
						? "PLACE SUPER ORDER"
						: `${productType === "CNC" ? "DELIVERY" : "INTRADAY"}`}
				</Button>
			</Form>
		</Modal>
	);
};

export default OrderModal;
