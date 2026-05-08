import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from "recharts";

const CommonBarChart = ({
  data,
  size = { width: "100%", height: 250 },
  xAxisDataKey = "range",
  yAxisDataKey = "count",
  xAxisLabel = "Score",
  yAxisLabel = "Count",
  onBarClick,
  gradientBars = false,
}) => {
  const GradientBar = (props) => {
    const { x, y, width, height, fill, payload } = props;
    const { range } = payload;

    let gradientId = `gradient-${range}`;

    return (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1E90FF" />
            <stop offset="50%" stopColor="#4169E1" />
            <stop offset="100%" stopColor="#00008B" />
          </linearGradient>
        </defs>

        <Rectangle
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#${gradientId})`}
          radius={[10, 10, 0, 0]}
        />
      </g>
    );
  };
  const allRanges = [];
  for (let i = 0; i <= 10; i += 2) {
    allRanges.push(`${i}-${i + 2}`);
  }
  return (
    <ResponsiveContainer
      width={size.width}
      height={size.height}
      style={{ padding: "10px" }}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisDataKey}
          label={{ value: xAxisLabel, position: "insideBottom", offset: -3 }}
          // interval={0}
        />
        <YAxis
          dataKey={yAxisDataKey}
          label={{
            value: yAxisLabel,
            position: "insideLeft",
            angle: -90,
            // offset: 1,
            style: { textAnchor: "middle" },
          }}
          width={30}
          tickFormatter={(value) => (Number.isInteger(value) ? value : " ")}
        />
        <Tooltip />
        <Bar
          dataKey={yAxisDataKey}
          onClick={
            onBarClick ? (barData) => onBarClick(barData.payload) : undefined
          }
          shape={gradientBars ? <GradientBar /> : null}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CommonBarChart;
