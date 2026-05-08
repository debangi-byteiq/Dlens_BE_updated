import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, Col, Row, Table, Select, Empty } from "antd";
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
  CartesianGrid,
  Cell,
} from "recharts";
// import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import DataQualityCards from "../../CommonComponents/Cards/DataQualityCards";
import YearSelect from "../../CommonComponents/YearSelect";
import CommonRadialChart from "../../CommonComponents/RadialBarChart/RadialBarChart";
import "./DataShifting.css";
import { backendApi } from "../../../api/backend";
const { Option } = Select;

const DataShifting = () => {
  const [tableNames, setTableNames] = useState([]);
  const [selectedTable, setSelectedTable] = useState();
  const [gaugeValues, setGaugeValues] = useState({
    macroShift: 0,
    microShift: 0,
    shiftIndexation: 0,
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [fullDate, setFullDate] = useState("");
  const [categoricalData, setCategoricalData] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [numericalData, setNumericalData] = useState([]);
  const [selectedNumericalColumn, setSelectedNumericalColumn] = useState(null);
  const [macroData, setMacroData] = useState([]);
  const [filteredShiftData, setFilteredShiftData] = useState([]);
  useEffect(() => {
    const fetchDropDown = async () => {
      try {
        const response = await backendApi.getMasterTables();
        const data = response.data;
        const names = data.map(
          (item) => item.table_name.charAt(0) + item.table_name.slice(1)
        );
        setTableNames(names);
        if (names?.length > 0) setSelectedTable(names[0]);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropDown();
  }, []);
  const connection = useSelector((state) => state.connection);
  const shiftingData = async () => {
    try {
      const resp = await backendApi.getShifting(selectedTable);
      if (resp?.data) {
        const index = resp?.data?.ds_index;
        const trend = resp?.data?.shift_trend;
        const macro = resp?.data?.macro;
        const categorical = resp?.data?.categorical;
        const numerical = resp?.data?.numerical;
        const fulldate = index[0]?.full_date || "";
        const dateObj = fulldate ? new Date(fulldate) : null;
        const formattedDate =
          dateObj && !Number.isNaN(dateObj.getTime())
            ? new Intl.DateTimeFormat("en-US", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(dateObj)
            : "";
        setFullDate(formattedDate);
        const macroShift = index[0]?.macro_shift || 0;
        const microShift = index[0]?.micro_shift || 0;
        const shiftIndexation = index[0]?.shift_indexation || 0;
        setGaugeValues({
          macroShift,
          microShift,
          shiftIndexation,
        });
        const uniqueYears = [
          ...new Set(
            trend
              .map((item) => new Date(item.date).getFullYear())
              .filter((year) => !Number.isNaN(year))
          ),
        ];
        setAvailableYears(uniqueYears);
        const filteredData = trend.filter(
          (item) => new Date(item.date).getFullYear() === selectedYear
        );
        const transformedData = filteredData.map((item) => ({
          year_month: item.date.split("-").slice(0, 2).join("-"), // Format "2024-06"
          shift_indexation: item.shift,
          run: item.run_count,
        }));
        setFilteredShiftData(transformedData);
        setMacroData(macro);
        setCategoricalData(categorical);
        if (categorical.length > 0) {
          const firstColumn = categorical[0].column_name;
          setSelectedColumn(firstColumn);
        } else {
          setSelectedColumn(null);
        }
        setNumericalData(numerical);
        if (numerical.length > 0) {
          setSelectedNumericalColumn(numerical[0].column_name);
        } else {
          setSelectedNumericalColumn(null);
        }
      }
    } catch (err) {
      console.error("Error fetching shifting data:", err);
    }
  };
  useEffect(() => {
    if (selectedTable) {
      shiftingData();
    }
  }, [selectedTable, selectedYear]);
  const getCategoricalShiftData = () => {
    const uniqueColumns = [
      ...new Set(categoricalData.map((item) => item.column_name)),
    ];
    return uniqueColumns.map((column) => ({
      columnName: column,
      shift:
        categoricalData.find((item) => item.column_name === column)
          ?.cat_shift || "0",
    }));
  };

  const getSelectedColumnDetails = () => {
    return categoricalData
      .filter((item) => item.column_name === selectedColumn)
      .map((item) => ({
        characteristics: item.value,
        base: (item.proportion_base * 100).toFixed(2),
        new: (item.proportion_inc * 100).toFixed(2),
        change: item.change_percent,
      }))
      .sort((a, b) => parseFloat(b.base) - parseFloat(a.base));
  };

  const categoricalShiftColumns = [
    {
      title: "Column_Name",
      dataIndex: "columnName",
      key: "columnName",
    },
    {
      title: "Shift %",
      dataIndex: "shift",
      key: "shift",
    },
  ];

  const charateristicsColumns = [
    {
      title: "Characteristics",
      dataIndex: "characteristics",
      key: "characteristics",
    },
    {
      title: "Base",
      dataIndex: "base",
      key: "base",
    },
    {
      title: "New",
      dataIndex: "new",
      key: "new",
    },
    {
      title: "Change (%)",
      dataIndex: "change",
      key: "change",
    },
  ];

  const handleCategoricalRowClick = (record) => {
    setSelectedColumn(record.columnName);
  };

  const numericalShiftColumns = [
    {
      title: "Column_Name",
      dataIndex: "columnName",
      key: "columnName",
    },
    {
      title: "Shift %",
      dataIndex: "shift",
      key: "shift",
    },
  ];

  const numericalCharacteristicsColumns = [
    {
      title: "Characteristics",
      dataIndex: "characteristics",
      key: "characteristics",
    },
    {
      title: "Base",
      dataIndex: "base",
      key: "base",
    },
    {
      title: "New",
      dataIndex: "new",
      key: "new",
    },
    {
      title: "Change (%)",
      dataIndex: "change",
      key: "change",
    },
  ];

  const getNumericalShiftData = () => {
    return numericalData.map((item) => ({
      columnName: item.column_name,
      shift: item.numeric_shift,
    }));
  };

  const getSelectedNumericalDetails = () => {
    const selectedData = numericalData.find(
      (item) => item.column_name === selectedNumericalColumn
    );
    if (!selectedData) return [];

    return [
      {
        characteristics: "Mean",
        base: selectedData.mean_base,
        new: selectedData.mean_inc,
        change: selectedData.mean_shift,
      },
      {
        characteristics: "Median",
        base: selectedData.median_base,
        new: selectedData.median_inc,
        change: selectedData.median_shift,
      },
      {
        characteristics: "Standard Deviation",
        base: selectedData.std_base,
        new: selectedData.std_inc,
        change: selectedData.std_shift,
      },
      {
        characteristics: "Minimum Value",
        base: selectedData.min_base,
        new: selectedData.min_inc,
        change: selectedData.min_shift,
      },
      {
        characteristics: "Maximum Value",
        base: selectedData.max_base,
        new: selectedData.max_inc,
        change: selectedData.max_shift,
      },
    ];
  };

  const macroColumns = [
    {
      title: "Characteristics",
      dataIndex: "characteristics",
      key: "characteristics",
      width: "25%",
    },
    {
      title: "Base",
      dataIndex: "base",
      key: "base",
      width: "25%",
      render: (value) => Number(value).toFixed(2),
    },
    {
      title: "New",
      dataIndex: "increment",
      key: "increment",
      width: "25%",
      render: (value) => Number(value).toFixed(2),
    },
    {
      title: "Change (%)",
      dataIndex: "change",
      key: "change",
      width: "25%",
      render: (value) => `${Number(value).toFixed(2)}%`,
    },
  ];

  const handleNumericalRowClick = (record) => {
    setSelectedNumericalColumn(record.columnName);
  };

  const handleTableChange = (value) => {
    setSelectedTable(value);
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
  };

  return (
    <div className="body">
      <Select
        value={selectedTable}
        onChange={handleTableChange}
        style={{
          width: 200,
        }}>
        {tableNames.map((name) => (
          <Select.Option key={name} value={name}>
            {name}
          </Select.Option>
        ))}
      </Select>
      <p>{connection.progress} %</p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "10px",
        }}>
        <Row gutter={[12, 12]}>
          <Col
            span={11}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
            <Row>
              <Col span={24}>
                <Card
                  style={{
                    border: "none",
                    marginBottom: "10px",
                    boxShadow:
                      "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
                  }}
                  title={<span style={{ color: "black" }}>Date</span>}>
                  {fullDate && (
                    <div
                      style={{
                        // marginTop: "10px",
                        fontSize: 24,
                        fontWeight: 600,
                        // paddingLeft: "10px",
                        // paddingRight: "10px",
                        borderRadius: "10px",
                        // paddingTop: "3px",
                        // paddingBottom: "3px",
                      }}>
                      {fullDate}
                    </div>
                  )}
                </Card>
                <Card
                  title={
                    <span style={{ color: "black" }}> Shift Index Trend</span>
                  }
                  style={{
                    border: "none",
                    boxShadow:
                      "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}>
                    <YearSelect
                      selectedYear={selectedYear}
                      onYearChange={handleYearChange}
                      availableYears={availableYears}
                    />
                  </div>
                  <ResponsiveContainer width="100%" height={340}>
                    {filteredShiftData.length > 0 ? (
                      <BarChart
                        data={filteredShiftData}
                        style={{ padding: "10px" }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year_month" />
                        <YAxis />
                        <Legend />
                        <Tooltip
                          content={({ payload }) => {
                            if (payload && payload.length > 0) {
                              return (
                                <div
                                  style={{
                                    background: "white",
                                    border: "1px solid #ccc",
                                    padding: "10px",
                                  }}>
                                  <p>{`Run: ${payload[0].payload.run}`}</p>
                                  <p>{`Shift Indexation: ${payload[0].payload.shift_indexation}`}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <defs>
                          <linearGradient
                            id="barGradient"
                            x1="0%"
                            y1="100%"
                            x2="0%"
                            y2="0%">
                            <stop offset="0%" stopColor="#1E90FF" />
                            <stop offset="50%" stopColor="#4169E1" />
                            <stop offset="100%" stopColor="#00008B" />
                          </linearGradient>
                        </defs>
                        <Bar
                          dataKey="shift_indexation"
                          radius={[4, 4, 0, 0]}
                          barSize={50}
                          cursor="pointer"
                          shape={(props) => {
                            const { x, y, width, height, value } = props;
                            return (
                              <rect
                                x={x}
                                y={value < 0 ? y + height : y}
                                width={width}
                                height={Math.abs(height)}
                                fill="url(#barGradient)"
                              />
                            );
                          }}>
                          {filteredShiftData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill="url(#barGradient)"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <div>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        <p style={{ textAlign: "center", color: "#B6B6B6" }}>
                          Select a Year from the dropdown
                        </p>
                      </div>
                    )}
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span={13} style={{ display: "flex", flexDirection: "column" }}>
            <Card
              title={<span>Shift Indexation</span>}
              style={{
                border: "none",
                boxShadow:
                  "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
              }}
              height={420}>
              <Row>
                <Col span={24}>
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <ResponsiveContainer width={250} height={200}>
                      <RadialBarChart
                        innerRadius="80%"
                        outerRadius="140%"
                        startAngle={200}
                        endAngle={-20}
                        barSize={50}
                        data={[
                          {
                            value: Math.min(
                              Math.abs(gaugeValues.shiftIndexation),
                              100
                            ),
                          },
                        ]}>
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          angleAxisId={0}
                          tick={false}
                        />
                        <RadialBar
                          minAngle={15}
                          background
                          clockWise
                          dataKey="value"
                          fill="url(#gradient)"
                        />
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%">
                            <stop offset="0%" stopColor="#1E90FF" />{" "}
                            <stop offset="50%" stopColor="#4169E1" />{" "}
                            <stop offset="100%" stopColor="#00008B" />{" "}
                          </linearGradient>
                        </defs>
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="22px"
                          fontWeight="600">
                          {Math.abs(gaugeValues.shiftIndexation)}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "20%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#060992",
                      }}>
                      {gaugeValues.shiftIndexation < 0
                        ? "LEFT SHIFT"
                        : "RIGHT SHIFT"}
                    </div>
                  </div>
                </Col>
              </Row>
              <Card
                title={<span>Macro and Micro</span>}
                style={{ backgroundColor: "inherit", border: "none" }}>
                <Row
                  style={{
                    display: "flex",
                    justifyContent: "space-evenly",
                    alignItems: "center",
                  }}>
                  <Col span={12}>
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      <ResponsiveContainer width={250} height={200}>
                        <RadialBarChart
                          innerRadius="80%"
                          outerRadius="140%"
                          startAngle={200}
                          endAngle={-20}
                          barSize={50}
                          data={[
                            {
                              value: Math.min(
                                Math.abs(gaugeValues.macroShift),
                                100
                              ),
                            },
                          ]}>
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            fill="url(#gradient)"
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%">
                              <stop offset="0%" stopColor="#1E90FF" />{" "}
                              <stop offset="50%" stopColor="#4169E1" />{" "}
                              <stop offset="100%" stopColor="#00008B" />{" "}
                            </linearGradient>
                          </defs>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="22px"
                            fontWeight="600">
                            {Math.abs(gaugeValues.macroShift)}%
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "28%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#060992",
                        }}>
                        {gaugeValues.macroShift < 0
                          ? "LEFT SHIFT"
                          : "RIGHT SHIFT"}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 500,
                          color: "#060992",
                        }}>
                        MACRO SHIFT
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <ResponsiveContainer width={250} height={200}>
                        <RadialBarChart
                          innerRadius="80%"
                          outerRadius="140%"
                          startAngle={200}
                          endAngle={-20}
                          barSize={50}
                          data={[
                            {
                              value: Math.min(
                                Math.abs(gaugeValues.microShift),
                                100
                              ),
                            },
                          ]}>
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            fill="url(#gradient)"
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%">
                              <stop offset="0%" stopColor="#1E90FF" />{" "}
                              <stop offset="50%" stopColor="#4169E1" />{" "}
                              <stop offset="100%" stopColor="#00008B" />{" "}
                            </linearGradient>
                          </defs>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="22px"
                            fontWeight="600">
                            {Math.abs(gaugeValues.microShift)}%
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "28%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#060992",
                        }}>
                        {gaugeValues.microShift < 0
                          ? "LEFT SHIFT"
                          : "RIGHT SHIFT"}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 500,
                          color: "#060992",
                        }}>
                        MICRO SHIFT
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Card>
          </Col>
        </Row>
        <Row gutter={[12, 12]}>
          <Col span={24} style={{ display: "flex", flexDirection: "column" }}>
            <Card
              title="MACRO SHIFT"
              style={{
                marginTop: "10px",
                boxShadow:
                  "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
              }}>
              <Row style={{ display: "flex", gap: 12, marginTop: "10px" }}>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    // gap: 12,
                  }}>
                  <Card style={{ border: "none" }}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                      }}>
                      <ResponsiveContainer width={250} height={270}>
                        <RadialBarChart
                          innerRadius="80%"
                          outerRadius="140%"
                          startAngle={200}
                          endAngle={-20}
                          barSize={50}
                          data={[
                            {
                              value: Math.min(
                                macroData[0]?.macro_shift
                                  .toString()
                                  .startsWith("-")
                                  ? parseFloat(
                                      macroData[0]?.macro_shift
                                        .toString()
                                        .replace("-", "")
                                    )
                                  : parseFloat(macroData[0]?.macro_shift),
                                gaugeValues.shiftIndexation < 0
                                  ? gaugeValues.shiftIndexation * -1
                                  : gaugeValues.shiftIndexation,
                                100
                              ),
                            },
                          ]}>
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            fill="url(#gradient)"
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%">
                              <stop offset="0%" stopColor="#1E90FF" />{" "}
                              <stop offset="50%" stopColor="#4169E1" />{" "}
                              <stop offset="100%" stopColor="#00008B" />{" "}
                            </linearGradient>
                          </defs>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="20px"
                            fontWeight="600">
                            {Math.abs(macroData[0]?.macro_shift)}%
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "20%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#060992",
                        }}>
                        {macroData[0]?.macro_shift.toString().startsWith("-")
                          ? "LEFT SHIFT"
                          : "RIGHT SHIFT"}
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col
                  span={15}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}>
                  <Card style={{ border: "none" }}>
                    {" "}
                    <div style={{ height: "250px" }}>
                      <Table
                        columns={macroColumns}
                        dataSource={macroData}
                        pagination={false}
                        bordered
                        scroll={{ y: 230, x: "100%", sticky: true }}
                        size="large"
                        style={{
                          marginTop: 20,
                          width: "100%",
                        }}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
            <Card
              title="MICRO SHIFT - CATEGORICAL"
              style={{
                marginTop: "10px",
                boxShadow:
                  "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
              }}>
              <Row style={{ display: "flex", gap: 12 }}>
                <Col
                  span={7}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}>
                  <Card
                    style={{
                      border: "none",
                      marginBottom: "10px",
                    }}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                      }}>
                      <ResponsiveContainer width={200} height={200}>
                        <RadialBarChart
                          innerRadius="80%"
                          outerRadius="140%"
                          startAngle={200}
                          endAngle={-20}
                          barSize={50}
                          data={[
                            {
                              value:
                                selectedColumn &&
                                Math.min(
                                  parseFloat(
                                    categoricalData.find(
                                      (item) =>
                                        item.column_name === selectedColumn
                                    )?.cat_shift_indexation || "0"
                                  ),
                                  100
                                ),
                            },
                          ]}>
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            fill="url(#gradient)"
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%">
                              <stop offset="0%" stopColor="#1E90FF" />{" "}
                              <stop offset="50%" stopColor="#4169E1" />{" "}
                              <stop offset="100%" stopColor="#00008B" />{" "}
                            </linearGradient>
                          </defs>

                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="20px"
                            fontWeight="600">
                            {categoricalData.find(
                              (item) => item.column_name === selectedColumn
                            )?.cat_shift_indexation || "0"}
                            %
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "20%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#060992",
                        }}>
                        {(
                          categoricalData.find(
                            (item) => item.column_name === selectedColumn
                          )?.cat_shift_indexation || "0"
                        )
                          .toString()
                          .startsWith("-")
                          ? "LEFT SHIFT"
                          : "RIGHT SHIFT"}
                      </div>
                    </div>
                  </Card>
                  <div style={{ margin: "auto" }}>
                    <DataQualityCards
                      cards={[
                        {
                          name: "TOTAL CHANGES",
                          count: `${
                            categoricalData.find(
                              (item) => item.column_name === selectedColumn
                            )?.total_change
                          }`,
                          height: 90,
                          cusFontSize: 28,
                        },
                        {
                          name: "RANK CHANGES",
                          count: `${
                            categoricalData.find(
                              (item) => item.column_name === selectedColumn
                            )?.rank_chng
                          }`,
                          height: 90,
                          cusFontSize: 28,
                        },
                      ]}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <Card
                    style={{
                      border: "none",
                    }}>
                    <div style={{ height: "300px" }}>
                      <Table
                        columns={categoricalShiftColumns}
                        dataSource={getCategoricalShiftData()}
                        pagination={false}
                        bordered
                        scroll={{ y: 230, x: "100%", sticky: true }}
                        onRow={(record) => ({
                          onClick: () => handleCategoricalRowClick(record),
                          style: {
                            cursor: "pointer",
                            backgroundColor:
                              record.columnName === selectedColumn
                                ? "#f0fff4"
                                : "white",
                          },
                        })}
                      />
                    </div>
                  </Card>
                </Col>
                <Col
                  span={10}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}>
                  <Card
                    style={{
                      border: "none",
                      color: "black",
                    }}>
                    <div style={{ height: "300px" }}>
                      <Table
                        columns={charateristicsColumns}
                        dataSource={getSelectedColumnDetails()}
                        pagination={false}
                        bordered
                        scroll={{ y: 210, x: "100%", sticky: true }}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
            <Card
              title="MICRO SHIFT - NUMERICAL"
              style={{
                marginTop: "10px",
                boxShadow:
                  "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
              }}>
              <Row style={{ display: "flex", gap: 16 }}>
                <Col
                  span={7}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}>
                  <Card
                    style={{
                      border: "none",
                    }}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                      }}>
                      <ResponsiveContainer width={350} height={300}>
                        <RadialBarChart
                          innerRadius="80%"
                          outerRadius="140%"
                          startAngle={200}
                          endAngle={-20}
                          barSize={50}
                          data={[
                            {
                              value:
                                selectedNumericalColumn &&
                                Math.min(
                                  Math.abs(
                                    parseFloat(
                                      numericalData.find(
                                        (item) =>
                                          item.column_name ===
                                          selectedNumericalColumn
                                      )?.numerical_shift_index || "0"
                                    )
                                  ),
                                  100
                                ),
                            },
                          ]}>
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            minAngle={15}
                            background
                            clockWise
                            dataKey="value"
                            fill={
                              selectedNumericalColumn &&
                              (
                                numericalData.find(
                                  (item) =>
                                    item.column_name === selectedNumericalColumn
                                )?.numerical_shift_index || "0"
                              )
                                .toString()
                                .startsWith("-")
                                ? "blue"
                                : "url(#gradient2)"
                            }
                          />

                          {/* Gradient Definition for Orange Theme */}
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%">
                              <stop offset="0%" stopColor="#1E90FF" />{" "}
                              <stop offset="50%" stopColor="#4169E1" />{" "}
                              <stop offset="100%" stopColor="#00008B" />{" "}
                            </linearGradient>
                          </defs>

                          {/* Centered Percentage Text */}
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="36px"
                            fontWeight="600">
                            {numericalData.find(
                              (item) =>
                                item.column_name === selectedNumericalColumn
                            )?.numerical_shift_index || "0"}
                            %
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "20%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#060992",
                        }}>
                        {(
                          numericalData.find(
                            (item) =>
                              item.column_name === selectedNumericalColumn
                          )?.numerical_shift_index || "0"
                        )
                          .toString()
                          .startsWith("-")
                          ? "LEFT SHIFT"
                          : "RIGHT SHIFT"}
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={7}>
                  <Card
                    style={{
                      border: "none",
                      color: "black",
                    }}>
                    <div style={{ height: "300px" }}>
                      <Table
                        columns={numericalShiftColumns}
                        dataSource={getNumericalShiftData()}
                        pagination={false}
                        bordered
                        scroll={{ y: 230, x: "100%", sticky: true }}
                        onRow={(record) => ({
                          onClick: () => handleNumericalRowClick(record),
                          style: {
                            cursor: "pointer",
                            backgroundColor:
                              record.columnName === selectedNumericalColumn
                                ? "#f0fff4"
                                : "white",
                          },
                        })}
                      />
                    </div>
                  </Card>
                </Col>
                <Col
                  span={9}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}>
                  <Card
                    style={{
                      border: "none",
                    }}>
                    <div style={{ height: "300px" }}>
                      {" "}
                      <Table
                        columns={numericalCharacteristicsColumns}
                        dataSource={getSelectedNumericalDetails()}
                        pagination={false}
                        bordered
                        scroll={{ y: 210, x: "100%", sticky: true }}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <Row style={{ flexGrow: 1 }}>
          <Col span={24} style={{ height: "100%" }}>
            <Card
              title="EXPLANATION"
              style={{
                boxShadow:
                  "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
                height: "100%",
                border: "none",
                marginTop: "10px",
              }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 28,
                  }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                      }}>
                      What is Data Shift Indexation?
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                      Data Shift Indexation is our intellectual property which
                      quantifies the shift incremental data has undergone
                      compared to base data which is historical in nature; the
                      length of history is customizable based on nature of the
                      business; the process of indexing is a continuous learning
                      which engine has to undergo to determine benchmarks for
                      evaluation.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                      }}>
                      MICRO SHIFT:
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                      <strong>Categorical Shift Index:</strong> Represents the
                      overall shift w.r.t all the categorical data fields which
                      are in the data table. Higher the value higher is the
                      shift​.
                      <br />
                      <strong>Numerical Shift Index:</strong> Represents the
                      overall shift w.r.t all the numerical data fields which
                      are in the data table. Higher the value higher is the
                      shift.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                      }}>
                      MACRO SHIFT:
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                      Macro Shift determines the shift at an overall level which
                      includes Tuple, Completeness & Size.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DataShifting;
