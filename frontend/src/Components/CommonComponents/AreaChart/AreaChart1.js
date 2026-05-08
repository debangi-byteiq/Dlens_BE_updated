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

const AreaChart1 = ({ item }) => {
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

  // if (data.length === 0) {
  //   return <div>No data available for the selected period.</div>;
  // }

  // const formatYAxis = (value) => {
  //   return `${Math.round(value / 1000000)}M`;
  // };

  return (
    <div className="chartContainer1">
      <div className="d-flex justify-content-between">
        <div style={{ fontSize: "24px", color: "#0096FF" }}>Incoming</div>
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
              <linearGradient id="gradientColor1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0096FF" stopOpacity={1} />
                <stop offset="50%" stopColor="#0096FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0096FF" stopOpacity={0.1} />
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
              labelStyle={{ color: "#0096FF" }}
              itemStyle={{ color: "#0096FF" }}
              // formatter={(value) => [`${formatYAxis(value)}`, "Count"]}
              cursor={true}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0096FF"
              fill="url(#gradientColor1)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AreaChart1;
