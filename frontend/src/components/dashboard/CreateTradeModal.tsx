import {
	DeleteOutlined,
	PlusOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Collapse,
	DatePicker,
	Flex,
	Form,
	Input,
	InputNumber,
	Modal,
	message,
	Select,
	type SelectProps,
	Switch,
	Typography,
	Upload,
} from "antd";
import dayjs from "dayjs";
import { debounce } from "lodash";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { FaPaste } from "react-icons/fa";
import { fetchClipboardData, queryClient } from "../../api/client";
import {
	usePortfolios,
	useStrategies,
	useTags,
} from "../../hooks/useResources";
import {
	type Trade,
	useCreateTrade,
	useSymbols,
	useUpdateTrade,
} from "../../hooks/useTrades";
import { usePreferenceStore } from "../../store/preferenceStore";
import { CreateSymbolModal } from "../settings/CreateSymbolModal";
import { type TradeFormValues, tradeSchema } from "./schema";
import { useHotkeys } from "react-hotkeys-hook";

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
	const { data: portfolios } = usePortfolios();
	const { data: symbols } = useSymbols();
	const { data: tagsData } = useTags();

	// State for symbol creation modal
	const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
	const [pendingSymbolFieldChange, setPendingSymbolFieldChange] = useState<
		((id: number) => void) | null
	>(null);
	const { maxLoss } = usePreferenceStore();
	const maxLossNumber = Number(maxLoss);
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { isDirty },
		getValues,
	} = useForm({
		resolver: zodResolver(tradeSchema),
		defaultValues: {
			strategy_id: 1,
			portfolio_id: null,
			symbol_id: 1,
			quantity: 10,
			confidence_level: 8,
			type: "buy",
			trade_date: dayjs().format("YYYY-MM-DD"),
			entry_price: 100,
			exit_price: 120,
			take_profit: 150,
			stop_loss: 110,
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
			status: "NIN", // Default to completed
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "timeframe_photos",
	});
	const stop_loss = Number(useWatch({ control, name: "stop_loss" }));
	const entry_price = Number(useWatch({ control, name: "entry_price" }));

	const debouncedValidate = useMemo(
		() =>
			debounce((stop: number, entry: number) => {
				if (!stop || !entry) return;

				const stopLossDiff = ((stop - entry) / entry) * 100;

				if (stopLossDiff < -maxLossNumber) {
					message.error({
						content: "Stop loss exceeds max loss percentage",
						key: "stop-loss-error", // prevents stacking
					});
				}
			}, 500),
		[maxLossNumber],
	);

	useEffect(() => {
		debouncedValidate(stop_loss, entry_price);

		return () => {
			debouncedValidate.cancel();
		};
	}, [stop_loss, entry_price, debouncedValidate]);

	/** Populate form on edit */
	useEffect(() => {
		if (isOpen && tradeToEdit) {
			reset({
				strategy_id: tradeToEdit.strategy_id,
				portfolio_id: tradeToEdit.portfolio_id,
				symbol_id: tradeToEdit.symbol_id,
				quantity: tradeToEdit.quantity,
				confidence_level: tradeToEdit.confidence_level ?? 8,
				type: tradeToEdit.type,
				trade_date: dayjs(tradeToEdit.trade_date).format("YYYY-MM-DD"),
				entry_price: tradeToEdit.entry_price,
				exit_price: tradeToEdit.exit_price,
				take_profit: tradeToEdit.take_profit,
				stop_loss: tradeToEdit.stop_loss,
				entry_reason: tradeToEdit.entry_reason ?? "",
				exit_reason: tradeToEdit.exit_reason ?? "",
				outcome: tradeToEdit.outcome ?? "neutral",
				is_greed: tradeToEdit.is_greed ?? false,
				is_fomo: tradeToEdit.is_fomo ?? false,
				tags:
					tradeToEdit.tags?.map((t: any) =>
						typeof t === "string" ? t : t.name,
					) ?? [],
				rule_violations:
					(tradeToEdit.rule_violations as unknown as TradeFormValues["rule_violations"]) ??
					[],
				timeframe_photos:
					tradeToEdit.timeframe_photos?.length > 0
						? tradeToEdit.timeframe_photos.map((tp) => ({
							type: tp.type,
							photo: tp.photo,
						}))
						: [{ type: "4h", photo: null }],
				status: (tradeToEdit as any).status ?? "NIN",
			});
		}

		if (!tradeToEdit && isOpen) {
			reset();
		}
	}, [isOpen, tradeToEdit, reset]);

	const onSubmit = (values: TradeFormValues) => {
		const data = new FormData();
		console.log(data, values);

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
		data.append(
			"rule_violations",
			JSON.stringify(values.rule_violations ?? []),
		);

		// Handle main photo - support both File and Blob (from clipboard paste)
		if (values.photo instanceof File || values.photo instanceof Blob) {
			data.append(
				"photo",
				values.photo,
				values.photo instanceof File
					? values.photo.name
					: "clipboard-image.png",
			);
		}
		if (
			values.before_photo instanceof File ||
			values.before_photo instanceof Blob
		) {
			data.append(
				"before_photo",
				values.before_photo,
				values.before_photo instanceof File
					? values.before_photo.name
					: "before-clipboard-image.png",
			);
		}

		// Handle timeframe photos - support both File and Blob
		// Only include entries that have an actual photo (new upload or existing URL)
		if (Array.isArray(values.timeframe_photos)) {
			const photosForBody: { type: string; photo: string }[] = [];

			values.timeframe_photos.forEach((tp) => {
				if (tp.photo instanceof File || tp.photo instanceof Blob) {
					// New file upload
					const fileName =
						tp.photo instanceof File
							? tp.photo.name
							: `${tp.type}-clipboard.png`;
					data.append(tp.type, tp.photo, fileName);
					photosForBody.push({ type: tp.type, photo: "" }); // Backend will fill this path
				} else if (typeof tp.photo === "string" && tp.photo.length > 0) {
					// Existing photo URL (when editing)
					photosForBody.push({ type: tp.type, photo: tp.photo });
				}
				// Skip entries where photo is null/undefined/empty - don't include them
			});

			data.append("timeframe_photos", JSON.stringify(photosForBody));
		}

		if (tradeToEdit) {
			updateMutation.mutate(
				{ id: tradeToEdit._id, data },
				{
					onSuccess: () => {
						queryClient.invalidateQueries({ queryKey: ["pnlCalendar"] });
						onClose();
					},
				},
			);
		} else {
			createMutation.mutate(data, { onSuccess: onClose });
		}
	};

	const handleClose = () => {
		if (!isDirty) {
			reset();
			onClose();
			return;
		}

		Modal.confirm({
			title: "Discard changes?",
			content: "You have unsaved changes. Are you sure you want to close?",
			okText: "Discard",
			cancelText: "Continue editing",
			okType: "danger",
			onOk: () => {
				reset();
				onClose();
			},
		});
	};
	const customSymbolFilter: SelectProps["filterOption"] = (input, option) => {
		if (!option) return false;

		const search = input.toLowerCase();

		// Extract text from label (string | ReactNode)
		const labelText =
			typeof option.label === "string"
				? option.label
				: typeof option.label === "number"
					? option.label.toString()
					: // ReactNode case (e.g. <span>...</span>)
					((option.label as any)?.props?.children?.toString?.() ?? "");

		const valueText = option.value?.toString?.() ?? "";

		return (
			labelText.toLowerCase().includes(search) ||
			valueText.toLowerCase().includes(search)
		);
	};

	const handlePasteData = async () => {
		try {
			const res = await fetchClipboardData();

			// Ensure we have at least the 3 data points
			if (!res.stoploss || !res.target || !res.entry) {
				message.error(
					"Clipboard history needs 3 data points (SL, TP, Entry).",
				);
				return;
			}

			// Parse as numbers
			const slNum = Number(res.stoploss);
			const tpNum = Number(res.target);
			const entryNum = Number(res.entry);

			if (Number.isNaN(slNum) || Number.isNaN(tpNum) || Number.isNaN(entryNum)) {
				message.error("Clipboard data contains invalid numbers");
				return;
			}

			setValue("stop_loss", slNum);
			setValue("take_profit", tpNum);
			setValue("entry_price", entryNum);
			setValue("exit_price", slNum);

			// Populate timeframe photos if present
			if (res.images && res.images.length > 0) {
				const photos = res.images.map((img) => ({
					type: img.type,
					photo: img.image, // URL string
				}));
				setValue("timeframe_photos", photos);
			}

			message.success(
				res.images.length > 0
					? `Pasted Data & ${res.images.length} Image(s)`
					: "Pasted Trade Data (SL, TP, Entry)",
			);
		} catch (error) {
			console.error("Failed to fetch clipboard data:", error);
			message.error("Failed to fetch clipboard data from backend.");
		}
	};

	useHotkeys("alt+v", async (e) => {
		e.preventDefault()
		e.stopPropagation()
		await handlePasteData()
	})
	return (
		<Modal
			open={isOpen}
			onCancel={handleClose}
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
				onFinish={handleSubmit(
					(data) => {
						onSubmit(data as unknown as TradeFormValues);
					},
					(error) => {
						console.log(error);
					},
				)}
			>


				<Collapse
					defaultActiveKey={["trade", "psychological", "photos"]}
					ghost
					expandIconPosition="end"
					styles={{ root: { maxHeight: "70vh", overflowY: "scroll" } }}
					items={[
						{
							key: "trade",
							label: (
								<Typography.Title
									level={5}
									className="m-0 border-b-2 border-stone-700 pb-2"
								>
									Trade Details
								</Typography.Title>
							),
							children: (
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
										gap: "12px 16px",
									}}
									className="auto-cols-auto"
								>
									<Form.Item
										label="Strategy"
										required
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="strategy_id"
											render={({ field }) => (
												<Select
													{...field}
													placeholder="Select strategy"
													showSearch
													optionFilterProp="label"
													options={
														strategies?.map((val: any) => ({
															label: val.name,
															value: val.id,
														})) ?? []
													}
												/>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Portfolio"
										required
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="portfolio_id"
											render={({ field }) => (
												<Select
													{...field}
													placeholder="Select portfolio"
													showSearch
													allowClear
													optionFilterProp="label"
													options={
														portfolios?.map((val: any) => ({
															label: val.name,
															value: val.id,
														})) ?? []
													}
													style={{ maxWidth: "150px" }}
												/>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Symbol"
										required
										style={{ gridColumn: "span 1" }}
									>
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
														showSearch={{ filterOption: customSymbolFilter }}
														onChange={(value) => {
															if (value === -1) {
																setPendingSymbolFieldChange(
																	() => field.onChange,
																);
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
													onChange={(d) =>
														field.onChange(d?.format("YYYY-MM-DD"))
													}
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

									<Form.Item
										label="Entry Price"
										required
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="entry_price"
											render={({ field }) => (
												<InputNumber
													{...field}
													className="!w-full"
													step={0.01}
												/>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Exit Price"
										required
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="exit_price"
											render={({ field }) => (
												<InputNumber
													{...field}
													className="!w-full"
													step={0.01}
												/>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Target Price"
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="take_profit"
											render={({ field }) => (
												<InputNumber
													{...field}
													className="!w-full"
													step={0.01}
												/>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Stop Loss Price"
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="stop_loss"
											render={({ field }) => (
												<InputNumber
													{...field}
													className="!w-full"
													step={0.01}
												/>
											)}
										/>
									</Form.Item>

									<Form.Item label="Status" style={{ gridColumn: "span 1" }}>
										<Controller
											control={control}
											name="status"
											render={({ field }) => (
												<div className="flex items-center gap-2 mt-1">
													<Switch
														checked={field.value === "IN"}
														onChange={(checked) =>
															field.onChange(checked ? "IN" : "NIN")
														}
													/>
													<span>
														{field.value === "IN" ? "Ongoing" : "Completed"}
													</span>
												</div>
											)}
										/>
									</Form.Item>
									<Form.Item
										label="Confidence"
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="confidence_level"
											render={({ field }) => (
												<InputNumber
													{...field}
													className="!w-full"
													min={1}
													max={10}
												/>
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
													<Select.Option value="missed">Missed</Select.Option>
												</Select>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Market Condition"
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="market_condition"
											render={({ field }) => (
												<Select {...field}>
													<Select.Option value="trending">
														Trending
													</Select.Option>
													<Select.Option value="ranging">Ranging</Select.Option>
													<Select.Option value="volatile">
														Volatile
													</Select.Option>
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
													options={tagsData?.map((t: any) => ({
														label: t.name,
														value: t.name,
													}))}
												/>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Entry Reason"
										style={{ gridColumn: "span 2" }}
									>
										<Controller
											control={control}
											name="entry_reason"
											render={({ field }) => (
												<Input.TextArea {...field} rows={3} />
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Exit Reason"
										style={{ gridColumn: "span 2" }}
									>
										<Controller
											control={control}
											name="exit_reason"
											render={({ field }) => (
												<Input.TextArea {...field} rows={3} />
											)}
										/>
									</Form.Item>
								</div>
							),
						},
						{
							key: "psychological",
							label: (
								<Typography.Title
									level={5}
									className="m-0 border-b-2 border-stone-700 pb-2"
								>
									Psychological & Rules
								</Typography.Title>
							),
							children: (
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
										gap: "12px 16px",
									}}
									className="auto-cols-auto"
								>
									<Form.Item
										label="Entry Execution"
										style={{ gridColumn: "span 1" }}
									>
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

									<Form.Item
										label="Exit Execution"
										style={{ gridColumn: "span 1" }}
									>
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

									<Form.Item
										label="Emotional State"
										style={{ gridColumn: "span 1" }}
									>
										<Controller
											control={control}
											name="emotional_state"
											render={({ field }) => (
												<Select {...field}>
													<Select.Option value="calm">Calm</Select.Option>
													<Select.Option value="anxious">Anxious</Select.Option>
													<Select.Option value="overconfident">
														Overconfident
													</Select.Option>
													<Select.Option value="fearful">Fearful</Select.Option>
													<Select.Option value="tilted">Tilted</Select.Option>
												</Select>
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Greed"
										style={{ gridColumn: "span 1" }}
										className="flex items-center justify-center"
									>
										<Controller
											control={control}
											name="is_greed"
											render={({ field }) => (
												<Switch {...field} checked={field.value} />
											)}
										/>
									</Form.Item>

									<Form.Item
										label="FOMO"
										style={{ gridColumn: "span 1" }}
										className="flex items-center justify-center"
									>
										<Controller
											control={control}
											name="is_fomo"
											render={({ field }) => (
												<Switch {...field} checked={field.value} />
											)}
										/>
									</Form.Item>

									<Form.Item
										label="Rule Violations"
										style={{ gridColumn: "span 1" }}
									>
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
														{
															value: "Overconfidence",
															label: "Overconfidence",
														},
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

									<Form.Item
										label="Post Trade Thoughts"
										style={{ gridColumn: "span 2" }}
									>
										<Controller
											control={control}
											name="post_trade_thoughts"
											render={({ field }) => (
												<Input.TextArea
													{...field}
													rows={3}
													className="!h-full"
												/>
											)}
										/>
									</Form.Item>
								</div>
							),
						},
						{
							key: "photos",
							label: (
								<Typography.Title
									level={5}
									className="m-0 border-b-2 border-stone-700 pb-2"
								>
									Photo Evidence
								</Typography.Title>
							),
							children: (
								<Flex gap={20}>
									<Form.Item label="Before Photo">
										<Controller
											control={control}
											name="before_photo"
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
														<Button icon={<UploadOutlined />}>
															Upload Before Photo
														</Button>
													</Upload>
													{/* paste from clipboard only images */}
													<Button
														icon={<FaPaste />}
														className="ml-2"
														onClick={async () => {
															navigator.clipboard.read().then(async (items) => {
																for (const item of items) {
																	const imageType = item.types.find(
																		(type) =>
																			type === "image/png" ||
																			type === "image/jpeg",
																	);
																	if (imageType) {
																		const blob = await item.getType(imageType);
																		field.onChange(blob);
																		break;
																	}
																}
															});
														}}
													></Button>
												</Flex>
											)}
										/>
									</Form.Item>
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
														<Button icon={<UploadOutlined />}>
															Upload Main Photo
														</Button>
													</Upload>
													{/* paste from clipboard only images */}
													<Button
														icon={<FaPaste />}
														className="ml-2"
														onClick={async () => {
															navigator.clipboard.read().then(async (items) => {
																for (const item of items) {
																	const imageType = item.types.find(
																		(type) =>
																			type === "image/png" ||
																			type === "image/jpeg",
																	);
																	if (imageType) {
																		const blob = await item.getType(imageType);
																		field.onChange(blob);
																		break;
																	}
																}
															});
														}}
													></Button>
												</Flex>
											)}
										/>
									</Form.Item>

									<div className="mt-4 pt-4 border-t border-stone-600">
										<Typography.Text strong>
											Multi-Timeframe Screenshots
										</Typography.Text>
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
																<Select
																	{...selectField}
																	size="small"
																	style={{ width: "100%" }}
																>
																	{[
																		"1m",
																		"5m",
																		"15m",
																		"30m",
																		"1h",
																		"4h",
																		"1D",
																		"1W",
																		"1M",
																	].map((tf) => (
																		<Select.Option key={tf} value={tf}>
																			{tf}
																		</Select.Option>
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
																		<Button
																			icon={<UploadOutlined />}
																			size="small"
																			className="w-full"
																		>
																			{uploadField.value
																				? "Change"
																				: "Select Photo"}
																		</Button>
																	</Upload>
																	<Button
																		icon={<FaPaste />}
																		size="small"
																		className="w-full"
																		onClick={async () => {
																			navigator.clipboard
																				.read()
																				.then(async (items) => {
																					for (const item of items) {
																						const imageType = item.types.find(
																							(type) =>
																								type === "image/png" ||
																								type === "image/jpeg",
																						);
																						if (imageType) {
																							const blob =
																								await item.getType(imageType);
																							uploadField.onChange(blob);
																							break;
																						}
																					}
																				});
																		}}
																	></Button>
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
												onClick={() => {
													const existingValues =
														getValues().timeframe_photos?.map(
															(val) => val.type,
														);
													const is30MExist = existingValues?.find(
														(val) => val === "30m",
													);
													const is1HExist = existingValues?.find(
														(val) => val === "1h",
													);
													const is4HExist = existingValues?.find(
														(val) => val === "4h",
													);

													append({
														type: is4HExist
															? "1d"
															: is1HExist
																? "4h"
																: is30MExist
																	? "1h"
																	: "30m",
														photo: null,
													});
												}}
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
					<Button onClick={handleClose}>Cancel</Button>
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
