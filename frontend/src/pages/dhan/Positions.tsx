import { Typography, Table } from "antd";

const { Title } = Typography;

export const DhanPositions = () => {
    const columns = [
        {
            title: 'Symbol',
            dataIndex: 'symbol',
            key: 'symbol',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Qty',
            dataIndex: 'qty',
            key: 'qty',
        },
        {
            title: 'Avg Price',
            dataIndex: 'avgPrice',
            key: 'avgPrice',
        },
        {
            title: 'P&L',
            dataIndex: 'pnl',
            key: 'pnl',
        }
    ];

    return (
        <div style={{ padding: "20px" }}>
            <Title level={3}>Active Positions</Title>
            <Table columns={columns} dataSource={[]} locale={{ emptyText: 'No active positions' }} />
        </div>
    );
};
