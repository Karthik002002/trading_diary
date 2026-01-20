import { Typography, Table } from "antd";

const { Title } = Typography;

export const DhanTrades = () => {
    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Symbol',
            dataIndex: 'symbol',
            key: 'symbol',
        },
        {
            title: 'Side',
            dataIndex: 'side',
            key: 'side',
        },
        {
            title: 'Quantity',
            dataIndex: 'qty',
            key: 'qty',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
        },
    ];

    return (
        <div style={{ padding: "20px" }}>
            <Title level={3}>List of Trades</Title>
            <Table columns={columns} dataSource={[]} locale={{ emptyText: 'No recent trades fetched' }} />
        </div>
    );
};
