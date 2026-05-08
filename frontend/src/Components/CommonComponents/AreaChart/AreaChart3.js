import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "antd";
import "../AreaChart/Index.css";

const AreaChart3 = ({ item }) => {
  const [period, setPeriod] = useState("YEARLY");

  const getDataForPeriod = (selectedPeriod) => {
    if (item && item[selectedPeriod] && item[selectedPeriod].data) {
      return item[selectedPeriod].data.map((item) => ({
        name: item.xValue,
        value: item.yValue,
      }));
    }
    return [];
  };

  const data = getDataForPeriod(period);

  // const formatYAxis = (value) => {
  //   return `${Math.round(value / 1000000)}M`;
  // };

  return (
    <div className="chartContainer3">
      <div className="d-flex justify-content-between">
        <div style={{ fontSize: "24px", color: "#00C247" }}>Open</div>
        <div className="toolbar">
          {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((p) => (
            <Button
              key={p}
              onClick={() => setPeriod(p)}
              className={period === p ? "active" : ""}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientColor3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C247" stopOpacity={1} />
                <stop offset="50%" stopColor="#00C247" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00C247" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              horizontal={true}
              strokeDasharray="3 3"
              stroke="#ddd"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
              }}
              labelStyle={{ color: "#00C247" }}
              itemStyle={{ color: "#00C247" }}
              // formatter={(value) => [`${formatYAxis(value)}`, "Count"]}
              cursor={true}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00C247"
              fill="url(#gradientColor3)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AreaChart3;
