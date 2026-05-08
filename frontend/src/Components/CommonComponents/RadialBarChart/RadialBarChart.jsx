import React from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Sector,
  Customized,
} from "recharts";
import { Card } from "antd";

const CommonRadialChart = ({
  value,
  size = { width: "100%", height: 196 },
  text,
}) => {
  const data = value;
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };
  return (
    <ResponsiveContainer width={size.width} height={size.height}>
      <RadialBarChart
        innerRadius="70%"
        outerRadius="110%"
        startAngle={180}
        endAngle={0}
        barSize={50}
        data={data}>
        <PolarAngleAxis
          type="number"
          domain={[0, 10]}
          angleAxisId={0}
          tickCount={3}
        />
        <RadialBar
          minAngle={15}
          background
          clockWise
          dataKey="value"
          fill="url(#gradient)"
          activeShape={renderActiveShape}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E90FF" />{" "}
            <stop offset="50%" stopColor="#4169E1" />{" "}
            <stop offset="100%" stopColor="#00008B" />{" "}
          </linearGradient>
        </defs>
        {data && data[0] && (
          <Customized
            component={({ cx, cy }) => (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                fontSize={24}
                fill="#333"
                fontWeight="bold">
                {data[0]?.value}
              </text>
            )}
          />
        )}
        <text
          x="50%"
          y="70%"
          textAnchor="middle"
          fontSize={14}
          fontWeight={500}
          fill="#333">
          {text}
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export default CommonRadialChart;
