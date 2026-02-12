import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    Progress,
    Button,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Typography,
    Tabs,
    Tag,
    Row,
    Col,
    Statistic,
    Empty,
    Popconfirm,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import {
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
} from "../api/client";
import type { Goal } from "../types/api";
import dayjs from "dayjs";
import { useForm } from "antd/es/form/Form";
import { usePortfolios } from "../hooks/useResources";
import { usePreferenceStore } from "../store/preferenceStore";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Goals = () => {
    const queryClient = useQueryClient();
    const { currency } = usePreferenceStore();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<"REAL" | "TESTING">("REAL");
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [form] = useForm();
    // Fetch Portfolios
    const { data: portfolios } = usePortfolios();

    const { data: goals, isLoading } = useQuery({
        queryKey: ["goals", activeTab],
        queryFn: () => fetchGoals(activeTab),
    });

    const createMutation = useMutation({
        mutationFn: createGoal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            setIsModalVisible(false);
            form.resetFields();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; goal: Partial<Goal> }) =>
            updateGoal(data.id, data.goal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            setIsModalVisible(false);
            setEditingGoal(null);
            form.resetFields();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteGoal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
        },
    });

    const handleCreateOrUpdate = (values: any) => {
        const goalData = {
            ...values,
            goal_type: activeTab,
            start_date: values.dateRange[0].toISOString(),
            end_date: values.dateRange[1].toISOString(),
            // Ensure portfolio_ids is an array of numbers
            portfolio_ids: values.portfolio_ids
        };
        delete goalData.dateRange;

        if (editingGoal) {
            updateMutation.mutate({ id: editingGoal.id, goal: goalData });
        } else {
            createMutation.mutate(goalData);
        }
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoal(goal);
        form.setFieldsValue({
            ...goal,
            dateRange: [dayjs(goal.start_date), dayjs(goal.end_date)],
        });
        setIsModalVisible(true);
    };

    const filteredPortfolios = portfolios?.filter((p: any) =>
        activeTab === "REAL" ? !p.is_testing : p.is_testing
    ) || [];

    return (
        <div className="p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <Title level={2} className="!mb-0">
                    Goals
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingGoal(null);
                        form.resetFields();
                        setIsModalVisible(true);
                    }}
                >
                    Create Goal
                </Button>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as "REAL" | "TESTING")}
                className="mb-6"
                type="card"
            >
                <Tabs.TabPane tab="Real Trading" key="REAL" />
                <Tabs.TabPane tab="Testing / Backtesting" key="TESTING" />
            </Tabs>

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <Row gutter={[16, 16]}>
                    {goals?.map((goal) => (
                        <Col xs={24} sm={12} lg={8} key={goal.id}>
                            <Card
                                title={
                                    <div className="flex justify-between items-center">
                                        <span className="truncate" title={goal.name}>{goal.name}</span>
                                        <Tag color={goal.status === "COMPLETED" ? "green" : "blue"}>{goal.status}</Tag>
                                    </div>
                                }
                                actions={[
                                    <EditOutlined key="edit" onClick={() => openEditModal(goal)} />,
                                    <Popconfirm
                                        title="Delete this goal?"
                                        onConfirm={() => deleteMutation.mutate(goal.id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <DeleteOutlined key="delete" className="text-red-500" />
                                    </Popconfirm>,
                                ]}
                                hoverable
                                className="h-full flex flex-col"
                                styles={{ body: { flex: 1 } }}
                            >
                                <div className="mb-4">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span>{Math.round(goal.progress_percentage || 0)}%</span>
                                    </div>
                                    <Progress
                                        percent={Math.round(goal.progress_percentage || 0)}
                                        status={goal.progress_percentage >= 100 ? "success" : "active"}
                                        showInfo={false}
                                        strokeColor={goal.progress_percentage >= 100 ? "#52c41a" : "#1890ff"}
                                    />
                                </div>

                                <div className="flex justify-between items-end mb-4">
                                    <Statistic
                                        title="Current"
                                        value={goal.current_amount}
                                        precision={2}
                                        prefix={currency}
                                        valueStyle={{ fontSize: '1.25rem' }}
                                    />
                                    <div className="text-gray-400 text-xl font-light">/</div>
                                    <Statistic
                                        title="Target"
                                        value={goal.target_amount}
                                        precision={2}
                                        prefix={currency}
                                        valueStyle={{ fontSize: '1.25rem' }}
                                    />
                                </div>

                                <div className="text-xs text-gray-400 flex flex-col gap-1 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <ClockCircleOutlined />
                                        <span>{dayjs(goal.end_date).diff(dayjs(), 'day')} days remaining</span>
                                    </div>
                                    <div>
                                        {dayjs(goal.start_date).format("MMM D")} - {dayjs(goal.end_date).format("MMM D, YYYY")}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                    {!isLoading && (!goals || goals.length === 0) && (
                        <Col span={24}>
                            <Empty description={`No ${activeTab.toLowerCase()} goals found.`} />
                        </Col>
                    )}
                </Row>
            )}

            <Modal
                title={`${editingGoal ? "Edit" : "Create"} ${activeTab === "REAL" ? "Real" : "Testing"} Goal`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={form.submit}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
                    <Form.Item
                        name="name"
                        label="Goal Name"
                        rules={[{ required: true, message: "Please enter a goal name" }]}
                    >
                        <Input placeholder="e.g. Feb 2026 Monthly Target" />
                    </Form.Item>

                    <Form.Item
                        name="target_amount"
                        label={`Target Amount (${currency})`}
                        rules={[{ required: true, message: "Please enter a target amount" }]}
                    >
                        <Input type="number" prefix={currency} />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">


                        <Form.Item
                            name="status"
                            label="Status"
                            initialValue="ACTIVE"
                        >
                            <Select>
                                <Option value="ACTIVE">Active</Option>
                                <Option value="COMPLETED">Completed</Option>
                                <Option value="ARCHIVED">Archived</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="dateRange"
                        label="Duration"
                        rules={[{ required: true, message: "Please select date range" }]}
                    >
                        <RangePicker className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="portfolio_ids"
                        label="Linked Portfolios"
                        extra={`Only showing ${activeTab.toLowerCase()} portfolios`}
                        rules={[{ required: true, message: "Please select at least one portfolio" }]}
                    >
                        <Select mode="multiple" placeholder="Select portfolios">
                            {filteredPortfolios.map((p: any) => (
                                <Option key={p.id} value={p.id}>
                                    {p.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Goals;
