import { Typography, Card } from "antd";

const { Title, Text } = Typography;

export const DhanPortfolio = () => {
    return (
        <div style={{ padding: "20px" }}>
            <Title level={3}>Dhan Portfolio</Title>
            <Text>Your portfolio summary goes here.</Text>
            <div style={{ marginTop: "20px" }}>
                {/* Placeholder for content */}
                <Card>
                    <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
                        Portfolio Visualization Placeholder
                    </div>
                </Card>
            </div>
        </div>
    );
};
