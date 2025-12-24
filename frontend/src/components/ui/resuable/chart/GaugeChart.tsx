import ReactECharts from "echarts-for-react";

const SpeedoGauge = ({ value = 70, height = 120, width = 220 }: { value: number, height?: number, width?: number }) => {
  const win = value;
  const loss = (100 - value).toFixed(2);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c}%",
    },
    series: [
      {
        type: "pie",
        radius: ["60%", "75%"],
        center: ["50%", "70%"], // push down for speedo look
        startAngle: 180,
        clockwise: true,
        label: { show: false },
        data: [
          {
            value: win,
            name: "Win",
            itemStyle: { color: "#22c55e" },
          },
          {
            value: loss,
            name: "Loss",
            itemStyle: { color: "#ef4444" },
          },
          {
            // 👇 hides bottom half
            value: 100,
            name: "hidden",
            itemStyle: {
              color: "transparent",
            },
            tooltip: { show: false },
            emphasis: { disabled: true },
          },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col items-center">
      <ReactECharts option={option} style={{ height, width }} />
    </div>
  );
};

export default SpeedoGauge;
