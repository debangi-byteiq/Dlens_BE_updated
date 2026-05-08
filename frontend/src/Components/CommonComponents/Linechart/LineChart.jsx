import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  Line,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import React from "react";
import { Card } from "antd";
import file from "../../../assets/Images/folder.png";

const CommonLineChart = ({
  title = " ",
  data,
  dataKeyX,
  dataKeyLine,
  height = 245,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card
        title={title}
        style={{
          height: "353px",
          borderRadius: "4px",
          boxShadow:
            "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
        }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <img src={file} width={80}></img>
          <p> No data available</p>
        </div>
      </Card>
    );
  }
  return (
    <Card
      title={title}
      style={{
        borderRadius: "4px",
        boxShadow:
          "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
      }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          margin={{
            top: 50,
            right: 20,
            left: 0,
            bottom: 0,
          }}
          data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={dataKeyX}
            // tickFormatter={(tick) =>
            //   tick ? new Date(tick).toLocaleDateString() : ""
            // }
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={dataKeyLine} stroke="#4169E1" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default CommonLineChart;
