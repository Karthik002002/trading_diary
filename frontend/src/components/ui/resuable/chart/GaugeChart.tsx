import ReactECharts from "echarts-for-react";

const SpeedoGauge = ({ value = 70 }) => {
  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 225,
        endAngle: -45, // 👉 ~270° arc (speedometer look)
        min: 0,
        max: 100,
        progress: {
          show: true,
          width: 18,
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, "#292929ff"]], // background arc
          },
        },
        pointer: {
          show: false, // ❌ no needle
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: "{value}%",
          color: "#bbbbbbff",
          fontSize: 21,
          offsetCenter: [0, "10%"],
        },
        data: [
          {
            value,
            itemStyle: {
              color: "#22c55e", // filled arc color
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-row items-center">
      <h4>Win Ratio</h4>
      <ReactECharts option={option} style={{ height: 150, width: "200px" }} />
    </div>
  );
};

export default SpeedoGauge;
