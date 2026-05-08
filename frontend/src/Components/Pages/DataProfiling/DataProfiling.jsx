import React, { useEffect, useRef, useState } from "react";
import { Card, Col, Row, Select, Table } from "antd";
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import DataQualityCards from "../../CommonComponents/Cards/DataQualityCards";
// import YearSelect from "../../Components/YearSelect";
import data from "../../../assets/Images/data.png";
import { backendApi } from "../../../api/backend";
import "./DataProfiling.css";
import CommonBarChart from "../../CommonComponents/Barchart/Barchart";
import CommonLineChart from "../../CommonComponents/Linechart/LineChart";
import CommonRadialChart from "../../CommonComponents/RadialBarChart/RadialBarChart";
const { Option } = Select;

const COLORS = [
  "#144874", // Dark Orange
  "#FF4500", // Orange-Red
  "#FFD700", // Gold
  "#FF6347", // Tomato
  "#B22222", // Firebrick
  "#8B0000", // Dark Red
  "#DC143C", // Crimson
  "#A52A2A", // Brown
  "#D2691E", // Chocolate
  "#CD853F", // Peru
  "#8B4513", // SaddleBrown
  "#C71585", // MediumVioletRed
  "#FF1493", // DeepPink
  "#FA8072", // Salmon
  "#E9967A", // Dark Salmon
  "#FF7F50", // Coral
  "#FFB6C1", // LightPink
  "#F4A460", // SandyBrown
  "#FFA07A", // Light Salmon
  "#DDA0DD", // Plum
];

const formatYAxis = (tickItem) => {
  if (tickItem >= 1000) {
    return `${tickItem / 1000}k`;
  }
  return tickItem;
};

const columns = [
  {
    title: "Data Field Name",
    dataIndex: "dataFieldName",
    key: "dataFieldName",
    width: 300,
  },
  {
    title: "Completeness %",
    dataIndex: "completeness",
    key: "completeness",
    width: 100,
  },
];

const monthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const CustomLegend = (props) => {
  const { payload } = props;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ marginBottom: 5 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 10,
                height: 10,
                backgroundColor: entry.color,
                marginRight: 5,
              }}
            />
            <span>{entry.value}</span>
            <span style={{ marginLeft: 5 }}>
              ({entry.payload.value?.toFixed(2)}%)
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

const DataProfiling = () => {
  const [tableNames, setTableNames] = useState([]);
  const [currentSelectedTable, setCurrentSelectedTable] = useState(null);
  const [tableMetaData, setTableMetaData] = useState(null);
  const [kdeIndexData, setKdeIndexData] = useState([]);
  const [numericalTableData, setNumericalTableData] = useState([]);
  const [categoricalTableData, setCategoricalTableData] = useState([]);
  const [dateTableData, setDateTableData] = useState([]);
  const [selectedRank, setSelectedRank] = useState(null);
  const [originalData, setOriginalData] = useState([]);
  const [numericalDetails, setNumericalDetails] = useState([]);
  const [selectedNumericalField, setSelectedNumericalField] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState([]);
  const [selectedCategoricalField, setSelectedCategoricalField] =
    useState(null);
  const [dateDetails, setDateDetails] = useState([]);
  const [selectedDateField, setSelectedDateField] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [activeCard, setActiveCard] = useState({
    numerical: false,
    categorical: false,
    date: false,
  });
  const numericalCardRef = useRef(null);
  const categoricalCardRef = useRef(null);
  const dateCardRef = useRef(null);
  const [filteredCategoryDetails, setFilteredCategoryDetails] = useState([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [personidState, setPersonidState] = useState({});
  const [selectedTable, setSelectedTable] = useState();
  const [totalRevenueState, setTotalRevenueState] = useState({});
  const [totalPassengersState, setTotalPassengersState] = useState({});
  const [uniqueClientsState, setUniqueClientsState] = useState({});
  const [selectedScatterData, setSelectedScatterData] = useState("");
  //   useEffect(() => {
  //     fetchTableMetaData(currentSelectedTable);
  //     fetchKdeIndexData(currentSelectedTable);
  //     fetchNumericalDetails(currentSelectedTable);
  //     fetchCategoryDetails(currentSelectedTable);
  //     fetchDateDetails(currentSelectedTable);
  //   }, [currentSelectedTable]);

  //   useEffect(() => {
  //     if (numericalTableData.length > 0 && !selectedNumericalField) {
  //       setSelectedNumericalField(numericalTableData[0].dataFieldName);
  //     }
  //     if (categoricalTableData.length > 0 && !selectedCategoricalField) {
  //       setSelectedCategoricalField(categoricalTableData[0].dataFieldName);
  //     }
  //     if (dateTableData.length > 0 && !selectedDateField) {
  //       setSelectedDateField(dateTableData[0].dataFieldName);
  //     }
  //   }, [numericalTableData, categoricalTableData, dateTableData]);

  useEffect(() => {
    const scrollToCard = () => {
      let ref;
      switch (activeCard) {
        case "numerical":
          ref = numericalCardRef;
          break;
        case "categorical":
          ref = categoricalCardRef;
          break;
        case "date":
          ref = dateCardRef;
          break;
        default:
          ref = null;
      }
      if (ref && ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    scrollToCard();
  }, [
    activeCard,
    selectedNumericalField,
    selectedCategoricalField,
    selectedDateField,
  ]);

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

  //   const fetchTableMetaData = async (table) => {
  //     try {
  //       const response = await axios.get(
  //         `${process.env.REACT_APP_API_URL}/table_meta/${table.toLowerCase()}`
  //       );
  //       // console.log("Table metadata:", response.data[0]);
  //       setTableMetaData(response.data[0]);
  //     } catch (error) {
  //       console.error("Error fetching table metadata:", error);
  //     }
  //   };

  //   const fetchKdeIndexData = async (table) => {
  //     try {
  //       const response = await axios.get(
  //         `${process.env.REACT_APP_API_URL}/kde_index/${table.toLowerCase()}`
  //       );
  //       const processedData = processKdeIndexData(response.data);
  //       setKdeIndexData(processedData);
  //       setOriginalData(response.data);
  //       updateTableData(response.data);
  //     } catch (error) {
  //       console.error("Error fetching KDE index data:", error);
  //     }
  //   };

  //   const fetchNumericalDetails = async (table) => {
  //     try {
  //       const response = await axios.get(
  //         `${
  //           process.env.REACT_APP_API_URL
  //         }/numerical_details/${table.toLowerCase()}`
  //       );
  //       setNumericalDetails(response.data);

  //       if (response.data.length > 0) {
  //         setSelectedNumericalField(response.data[0].column_name);
  //       }
  //       response.data.forEach((column) => {
  //         const columnDetails = {
  //           mean: column.mean,
  //           first: column.first,
  //           second: column.second,
  //           third: column.third,
  //           fourth: column.fourth,
  //           fifth: column.fifth,
  //         };

  //         switch (column.column_name) {
  //           case "personid":
  //             setPersonidState(columnDetails);
  //             break;
  //           case "totalrevenue":
  //             setTotalRevenueState(columnDetails);
  //             break;
  //           case "totalpassengers":
  //             setTotalPassengersState(columnDetails);
  //             break;
  //           case "uniqueclients":
  //             setUniqueClientsState(columnDetails);
  //             break;
  //           default:
  //             console.warn("Unexpected column name:", column.column_name);
  //         }
  //       });
  //     } catch (error) {
  //       console.error("Error fetching numerical details:", error);
  //     }
  //   };

  //   const fetchCategoryDetails = async (table) => {
  //     try {
  //       const response = await axios.get(
  //         `${
  //           process.env.REACT_APP_API_URL
  //         }/category_details/${table.toLowerCase()}`
  //       );
  //       setCategoryDetails(response.data);
  //       if (response.data.length > 0) {
  //         setSelectedCategoricalField(response.data[0].column_name);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching category details:", error);
  //     }
  //   };

  //   const fetchDateDetails = async (table) => {
  //     try {
  //       const response = await axios.get(
  //         `${process.env.REACT_APP_API_URL}/date_details/${table.toLowerCase()}`
  //       );
  //       setDateDetails(response.data);
  //       if (response.data.length > 0) {
  //         setSelectedDateField(response.data[0].column_name);
  //         setSelectedYear(response.data[0].year);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching date details:", error);
  //     }
  //   };
  const profilingData = async () => {
    try {
      const resp = await backendApi.getProfiling(selectedTable);
      //   console.log(resp.data, "profiling response");
      if (resp?.data) {
        const meta = resp?.data?.table_meta;
        const category = resp?.data?.category_details;
        const date = resp?.data?.date_details;
        const numerical = resp?.data?.numerical_details;
        const kde_index = resp?.data?.kde_index;
        setTableMetaData(meta[0]);
        const processedData = processKdeIndexData(kde_index);
        setKdeIndexData(processedData);
        setOriginalData(kde_index);
        updateTableData(kde_index);
        setNumericalDetails(numerical);
        if (numerical.length > 0) {
          setSelectedNumericalField(numerical[0].column_name);
        }
        numerical.forEach((column) => {
          const columnDetails = {
            mean: column.mean,
            first: column.first,
            second: column.second,
            third: column.third,
            fourth: column.fourth,
            fifth: column.fifth,
          };

          switch (column.column_name) {
            case "personid":
              setPersonidState(columnDetails);
              break;
            case "totalrevenue":
              setTotalRevenueState(columnDetails);
              break;
            case "totalpassengers":
              setTotalPassengersState(columnDetails);
              break;
            case "uniqueclients":
              setUniqueClientsState(columnDetails);
              break;
            default:
              console.warn("Unexpected column name:", column.column_name);
          }
        });
        setCategoryDetails(category);
        if (category.length > 0) {
          setSelectedCategoricalField(category[0].column_name);
        }
        setDateDetails(date);
        if (date.length > 0) {
          setSelectedDateField(date[0].column_name);
          setSelectedYear(date[0].year);
        }
      }
    } catch (err) {
      console.error("Error fetching profiling data:", err);
    }
  };
  useEffect(() => {
    if (selectedTable) {
      profilingData();
    }
  }, [selectedTable]);
  useEffect(() => {
    if (selectedCategoricalField) {
      const newFilteredData = categoryDetails.filter(
        (item) => item.column_name === selectedCategoricalField
      );
      setFilteredCategoryDetails(newFilteredData);
    }
  }, [selectedCategoricalField, categoryDetails]);

  const handleDateRowClick = (record) => {
    setSelectedDateField(record.dataFieldName);
    const selectedFieldData = dateDetails.find(
      (item) => item.column_name === record.dataFieldName
    );
    if (selectedFieldData) {
      setSelectedYear(selectedFieldData.year);
    }
    setActiveCard((prevState) => ({
      ...prevState,
      date:
        prevState.date && prevState.date === record.dataFieldName
          ? false
          : record.dataFieldName,
    }));
    setHasInteracted(true);
  };

  const getCardStyle = (cardType) => ({
    borderRadius: "4px",
    boxShadow:
      "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    height: "100%",
    transition: "filter 0.3s ease",
    position: "relative",
    overflow: "hidden",
    filter: hasInteracted && !activeCard[cardType] ? "blur(4px)" : "none",
  });

  const getOverlayStyle = (cardType) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(245, 245, 245, 0.3)",
    backdropFilter: "blur(4px)",
    transition: "opacity 0.3s ease",
    opacity: hasInteracted && !activeCard[cardType] ? 1 : 0,
    pointerEvents: hasInteracted && !activeCard[cardType] ? "auto" : "none",
    zIndex: 1000,
  });

  const categoricalDetailsColumns = [
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Value Count",
      dataIndex: "value_counts",
      key: "value_counts",
    },
    {
      title: "Distribution (%)",
      dataIndex: "category_distribution",
      key: "category_distribution",
      render: (text) => parseFloat(text).toFixed(2) + "%",
    },
  ];

  const getSelectedDateDetails = () => {
    return dateDetails.filter((item) => item.column_name === selectedDateField);
  };

  const getAvailableYears = () => {
    const years = new Set(getSelectedDateDetails().map((item) => item.year));
    return Array.from(years).sort((a, b) => b - a);
  };

  const getDateGraphData = () => {
    return getSelectedDateDetails()
      .filter((item) => item.year === selectedYear)
      .map((item) => {
        const [month, year] = item.mon_yr.split("-");
        return {
          month: monthNames[parseInt(month) - 1],
          count: item.mon_yr_count,
          fullDate: `${monthNames[parseInt(month) - 1]}-${year}`,
        };
      })
      .sort((a, b) => {
        return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
      });
  };

  const getMinMaxDates = () => {
    const selectedData = getSelectedDateDetails().filter(
      (item) => item.year === selectedYear
    );
    if (selectedData.length > 0) {
      return {
        minDate: selectedData[0].min_date,
        maxDate: selectedData[0].max_date,
      };
    }
    return { minDate: "N/A", maxDate: "N/A" };
  };

  const handleCategoricalRowClick = (record) => {
    setSelectedCategoricalField(record.dataFieldName);
    setActiveCard((prevState) => ({
      ...prevState,
      categorical:
        prevState.categorical && prevState.categorical === record.dataFieldName
          ? false
          : record.dataFieldName,
    }));
    setHasInteracted(true);
  };

  const getSelectedCategoryDetails = () => {
    return categoryDetails.filter(
      (item) => item.column_name === selectedCategoricalField
    );
  };

  const getPieChartData = () => {
    const selected = getSelectedCategoryDetails();
    const data = selected.map((item) => ({
      name: item.category,
      value: parseFloat(item.category_distribution),
    }));

    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total < 100) {
      data.push({
        name: "Others",
        value: 100 - total,
      });
    }

    return data;
  };

  const processKdeIndexData = (data) => {
    const rankCounts = {};
    let maxRank = 0;

    data.forEach((item) => {
      const rank = parseInt(item.rank);
      if (rankCounts[rank]) {
        rankCounts[rank]++;
      } else {
        rankCounts[rank] = 1;
      }
      maxRank = Math.max(maxRank, rank);
    });

    const processedData = [];
    for (let i = 1; i <= 5; i++) {
      if (i === 1) {
        processedData.push({
          rank: `[0-20]%`,
          count: rankCounts[i] || 0,
        });
      } else {
        processedData.push({
          rank: `[${(i - 1) * 20 + 1}-${i * 20}]%`,
          count: rankCounts[i] || 0,
        });
      }
    }

    return processedData;
  };

  const updateTableData = (data) => {
    const numerical = [];
    const categorical = [];
    const date = [];

    data.forEach((item) => {
      const tableRow = {
        dataFieldName: item.column_name,
        completeness: item.fill_rate.toFixed(2),
      };

      if (
        item.d_type === "LongType()" ||
        item.d_type === "DoubleType()" ||
        item.d_type === "IntegerType()"
      ) {
        numerical.push(tableRow);
      } else if (item.d_type === "StringType()") {
        categorical.push(tableRow);
      } else if (
        item.d_type === "DateType()" ||
        item.d_type === "TimestampType()"
      ) {
        date.push(tableRow);
      }
    });

    setNumericalTableData(numerical);
    setCategoricalTableData(categorical);
    setDateTableData(date);
  };

  const handleTableChange = (value) => {
    setSelectedTable(value);
    setSelectedRank(null);
    setSelectedNumericalField(null);
  };

  const handleBarClick = (data) => {
    const clickedRankRange = data.rank;
    let clickedRank;
    switch (clickedRankRange) {
      case "[0-20]%":
        clickedRank = 1;
        break;
      case "[21-40]%":
        clickedRank = 2;
        break;
      case "[41-60]%":
        clickedRank = 3;
        break;
      case "[61-80]%":
        clickedRank = 4;
        break;
      case "[81-100]%":
        clickedRank = 5;
        break;
      default:
        clickedRank = null;
        break;
    }

    if (selectedRank === clickedRank) {
      setSelectedRank(null);
      updateTableData(originalData);
    } else {
      setSelectedRank(clickedRank);
      const filteredData = originalData.filter(
        (item) => item.rank === clickedRank
      );
      updateTableData(filteredData);
    }
  };

  //   const getBarFill = (rankRange) => {
  //     if (selectedRank === null) {
  //       return "url(#colorGradient)";
  //     }
  //     let rank;
  //     switch (rankRange) {
  //       case "[0-20]%":
  //         rank = 1;
  //         break;
  //       case "[21-40]%":
  //         rank = 2;
  //         break;
  //       case "[41-60]%":
  //         rank = 3;
  //         break;
  //       case "[61-80]%":
  //         rank = 4;
  //         break;
  //       case "[81-100]%":
  //         rank = 5;
  //         break;
  //       default:
  //         rank = null;
  //     }

  //     return rank === selectedRank ? "url(#colorGradient)" : "#D3D3D3";
  //   };

  const handleNumericalRowClick = (record) => {
    setSelectedNumericalField(record.dataFieldName);
    setActiveCard((prevState) => ({
      ...prevState,
      numerical:
        prevState.numerical && prevState.numerical === record.dataFieldName
          ? false
          : record.dataFieldName,
    }));
    setHasInteracted(true);

    const updatedScatterData = numericalDetails
      .filter((item) => item.column_name === record.dataFieldName)
      .map((item) => {
        return {
          column_name: item.column_name,
          first: item.first,
          second: item.second,
          third: item.third,
          fourth: item.fourth,
          fifth: item.fifth,
          mean: item.mean,
        };
      });

    setSelectedScatterData(updatedScatterData);
  };

  useEffect(() => {
    if (numericalDetails.length > 0) {
      const initialScatterData = numericalDetails
        .filter((item) => item.column_name === numericalDetails[0].column_name)
        .map((item) => ({
          column_name: item.column_name,
          first: item.first,
          second: item.second,
          third: item.third,
          fourth: item.fourth,
          fifth: item.fifth,
          mean: item.mean,
        }));
      setSelectedScatterData(initialScatterData);
    }
  }, [numericalDetails]);

  const getNumericalScatterChartData = () => {
    return numericalDetails.map((item) => ({
      column_name: item.column_name,
      first: item.first,
      second: item.second,
      third: item.third,
      fourth: item.fourth,
      fifth: item.fifth,
      mean: item.mean,
    }));
  };
  //   const scatterData = getNumericalScatterChartData();

  const getSelectedNumericalDetails = () => {
    return (
      numericalDetails.find(
        (item) => item.column_name === selectedNumericalField
      ) || {}
    );
  };

  const formatYAxis = (value) => {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}>
          <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
            {data.column_name}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ color: "#EA4648" }}>
              ● First: <strong>{data.first}</strong>
            </div>
            <div style={{ color: "#3D8B37" }}>
              ● Second: <strong>{data.second}</strong>
            </div>
            <div style={{ color: "#1F77B4" }}>
              ● Third: <strong>{data.third}</strong>
            </div>
            <div style={{ color: "#FF7F0E" }}>
              ● Fourth: <strong>{data.fourth}</strong>
            </div>
            <div style={{ color: "#9467BD" }}>
              ● Fifth: <strong>{data.fifth}</strong>
            </div>
            <div style={{ color: "#204496" }}>
              ● Mean: <strong>{data.mean}</strong>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };
  return (
    <div className="body">
      <Select
        value={selectedTable}
        onChange={handleTableChange}
        style={{
          width: 200,
          marginBottom: "10px",
        }}>
        {tableNames.map((name) => (
          <Select.Option key={name} value={name}>
            {name}
          </Select.Option>
        ))}
      </Select>
      {tableMetaData && (
        <Row gutter={8}>
          <Col span={20}>
            <DataQualityCards
              isMetaCard={true}
              cards={[
                // {
                //   name: "TABLE NAME",
                //   count: currentSelectedTable,
                //   height: 100,
                //   cusFontSize: 20,
                // },
                {
                  name: "DATA FIELD",
                  count: tableMetaData.data_field,
                  icon: data,
                  cusFontSize: 22,
                },
                {
                  name: "RECORD",
                  count: tableMetaData.record,
                  icon: data,
                  cusFontSize: 22,
                },
                {
                  name: "DUPLICATE",
                  count: tableMetaData.duplicates,
                  icon: data,
                  cusFontSize: 22,
                },
                {
                  name: "NUMERICAL",
                  count: tableMetaData.numerical,
                  icon: data,
                  cusFontSize: 22,
                },
                {
                  name: "CATEGORICAL",
                  count: tableMetaData.categorical,
                  icon: data,
                  cusFontSize: 22,
                },
                {
                  name: "DATE",
                  count: tableMetaData.date,
                  icon: data,
                  cusFontSize: 22,
                },
              ]}
            />
          </Col>
          <Col span={4}>
            <Card></Card>
          </Col>
        </Row>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          className="heading-container"
          style={{ textAlign: "center", fontSize: "20px" }}>
          KDE Summary
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card
                title={<span>KDE Index</span>}
                style={{
                  borderRadius: "4px",
                  boxShadow:
                    "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
                }}>
                <CommonBarChart
                  size={{ height: 450, width: "100%" }}
                  data={kdeIndexData}
                  xAxisDataKey="rank"
                  xAxisLabel="Completeness"
                  yAxisLabel="Column count"
                  gradientBars={true}
                  onBarClick={handleBarClick}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={<span>Numerical</span>}
                style={{
                  borderRadius: "4px",
                  boxShadow:
                    "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
                }}>
                <div style={{ height: "450px", overflowY: "auto" }}>
                  <Table
                    style={{ margin: "25px" }}
                    columns={columns}
                    dataSource={numericalTableData}
                    rowKey="dataFieldName"
                    pagination={false}
                    bordered
                    onRow={(record) => {
                      return {
                        onClick: () => {
                          handleNumericalRowClick(record);
                        },
                        style: {
                          cursor: "pointer",
                          backgroundColor:
                            selectedNumericalField === record.dataFieldName
                              ? "#c9cff0"
                              : "",
                        },
                      };
                    }}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Row gutter={[0, 6]}>
                <Col span={24}>
                  <Card
                    title={<span>Categorical</span>}
                    style={{
                      borderRadius: "4px",
                      boxShadow:
                        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
                    }}>
                    <div style={{ height: "170px", overflowY: "auto" }}>
                      <Table
                        style={{ marginTop: "20px" }}
                        columns={columns}
                        dataSource={categoricalTableData}
                        rowKey="dataFieldName"
                        pagination={false}
                        bordered
                        onRow={(record) => {
                          return {
                            onClick: () => handleCategoricalRowClick(record),
                            style: {
                              cursor: "pointer",
                              backgroundColor:
                                selectedCategoricalField ===
                                record.dataFieldName
                                  ? "#c9cff0"
                                  : "",
                            },
                          };
                        }}
                      />
                    </div>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card
                    title={<span>Date</span>}
                    style={{
                      borderRadius: "4px",
                      boxShadow:
                        "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
                    }}>
                    <div style={{ height: "170px", overflowY: "auto" }}>
                      <Table
                        style={{ marginTop: "20px" }}
                        columns={columns}
                        dataSource={dateTableData}
                        rowKey="dataFieldName"
                        pagination={false}
                        bordered
                        onRow={(record) => {
                          return {
                            onClick: () => handleDateRowClick(record),
                            style: {
                              cursor: "pointer",
                              backgroundColor:
                                selectedDateField === record.dataFieldName
                                  ? "#c9cff0"
                                  : "",
                            },
                          };
                        }}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
        <div
          className="heading-container"
          style={{ textAlign: "center", fontSize: "20px" }}>
          KDE Profiling
        </div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              ref={numericalCardRef}
              style={getCardStyle("numerical")}
              title={<span style={{ fontSize: "18px" }}>Numerical Based</span>}>
              {/* <div style={getOverlayStyle("numerical")}></div> */}
              {(selectedNumericalField || activeCard.numerical) && (
                <Row gutter={[20, 20]} className="mx-4 mt-4">
                  <Col
                    xs={24}
                    lg={12}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "rgb(174, 106, 4)",
                      }}>
                      {selectedNumericalField || "Select a numerical field"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 24,
                      }}>
                      <div>
                        <DataQualityCards
                          style={{
                            flexDirection: "column",
                            flexWrap: "wrap",
                            width: 240,
                          }}
                          isMetaCard={false}
                          cards={[
                            {
                              name: "MEAN",
                              count:
                                getSelectedNumericalDetails().mean?.toFixed(
                                  2
                                ) || 0,
                              height: 80,
                              width: 100,
                              cusFontSize: 20,
                            },
                            {
                              name: "MEDIAN",
                              count:
                                getSelectedNumericalDetails().median?.toFixed(
                                  2
                                ) || 0,
                              height: 80,
                              width: 100,
                              cusFontSize: 20,
                            },
                            {
                              name: "VARIANCE",
                              count:
                                getSelectedNumericalDetails().variance?.toFixed(
                                  2
                                ) || 0,
                              height: 80,
                              width: 100,
                              cusFontSize: 20,
                            },
                          ]}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}>
                        <DataQualityCards
                          style={{
                            flexDirection: "column",
                            flexWrap: "wrap",
                            width: 230,
                          }}
                          isMetaCard={false}
                          cards={[
                            {
                              name: "SD",
                              count:
                                getSelectedNumericalDetails().std_dev?.toFixed(
                                  2
                                ) || 0,
                              height: 150,
                              cusFontSize: 24,
                            },
                            {
                              name: "SKEWNESS",
                              count:
                                getSelectedNumericalDetails().skewness?.toFixed(
                                  2
                                ) || 0,
                              height: 150,
                              cusFontSize: 24,
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Card
                      style={{
                        height: "100%",
                        borderRadius: "4px",
                      }}>
                      <div className="flex flex-col justify-between border-r border-[#D0D5DD]">
                        <ResponsiveContainer width="100%" height={350}>
                          <ScatterChart
                            data={selectedScatterData}
                            margin={{
                              right: 20,
                              left: 20,
                              top: 20,
                              bottom: 10,
                            }}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              label={{
                                value:
                                  selectedScatterData[0]?.column_name ||
                                  "X-Axis",
                                position: "insideBottom",
                                offset: -5,
                                dy: -10,
                              }}
                              dataKey="x"
                              domain={[
                                (dataMin) => (dataMin > 0 ? dataMin : 1), // Ensure the minimum value is greater than 0
                                (dataMax) => dataMax,
                              ]}
                            />
                            <YAxis
                              tickFormatter={formatYAxis}
                              label={{
                                value: "Values",
                                angle: -90,
                                offset: 0,
                                position: "insideLeft",
                              }}
                            />
                            <ZAxis range={[150, 150]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Scatter
                              name="First"
                              dataKey="first"
                              fill="#EA4648"
                              shape="circle"
                            />
                            <Scatter
                              name="Second"
                              dataKey="second"
                              fill="#3D8B37"
                              shape="circle"
                            />
                            <Scatter
                              name="Third"
                              dataKey="third"
                              fill="#1F77B4"
                              shape="circle"
                            />
                            <Scatter
                              name="Fourth"
                              dataKey="fourth"
                              fill="#FF7F0E"
                              shape="circle"
                            />
                            <Scatter
                              name="Fifth"
                              dataKey="fifth"
                              fill="#9467BD"
                              shape="circle"
                            />
                            <Scatter
                              name="Mean"
                              dataKey="mean"
                              fill="#204496"
                              shape="circle"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Col>
                </Row>
              )}
            </Card>
          </Col>
        </Row>
        {selectedCategoricalField || activeCard.categorical ? (
          <Row gutter={[16, 16]}>
            <Col span={24} style={{ height: "auto" }}>
              <Card
                title={<span>Categorical Based</span>}
                ref={categoricalCardRef}
                style={getCardStyle("categorical")}>
                {/* <div style={getOverlayStyle("categorical")}></div> */}
                <Row gutter={[20, 20]} className="mx-4 mt-4">
                  <Col span={12}>
                    <Card
                      style={{
                        height: "100%",

                        border: "none",
                      }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#144874",
                          marginBottom: 10,
                        }}>
                        {selectedCategoricalField || "Select a category field"}
                      </div>
                      <Table
                        dataSource={filteredCategoryDetails}
                        columns={categoricalDetailsColumns}
                        pagination={false}
                        bordered
                      />
                    </Card>
                  </Col>
                  <Col
                    xs={24}
                    lg={12}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                    <Card
                      style={{
                        height: "100%",
                        borderRadius: "4px",
                        border: "none",
                      }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#144874",
                          marginBottom: 12,
                        }}>
                        {`${selectedCategoricalField} Distribution`}
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getPieChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            // label={renderCustomizedLabel}
                          >
                            {getPieChartData().map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `${value.toFixed(2)}%`}
                          />
                          <Legend
                            content={<CustomLegend />}
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        ) : (
          <p>Select a categorical field to view details</p>
        )}
        {selectedDateField || activeCard.date ? (
          <Row gutter={16}>
            <Col span={24}>
              <Card
                ref={dateCardRef}
                style={getCardStyle("date")}
                title={<span>Date Based</span>}>
                {/* <div style={getOverlayStyle("date")}></div> */}
                <Row gutter={[20, 20]} className="mx-4 mt-4">
                  <Col span={6} style={{ height: "auto" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#144874",
                        }}>
                        Date Range
                      </div>
                    </div>
                    <div>
                      <DataQualityCards
                        isMetaCard={false}
                        style={{
                          flexDirection: "column",
                          flexWrap: "wrap",
                          height: "100%",
                          width: "200px",
                          gap: 24,
                          borderRadius: "4px",
                          marginTop: "10px",
                        }}
                        cards={[
                          {
                            name: "MIN DATE",
                            count: getMinMaxDates().minDate,
                            height: 80,
                            width: 100,
                            cusFontSize: 24,
                          },
                          {
                            name: "MAX DATE",
                            count: getMinMaxDates().maxDate,
                            height: 80,
                            width: 100,
                            cusFontSize: 24,
                          },
                        ]}
                      />
                    </div>
                  </Col>
                  <Col span={18}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#144874",
                        }}>
                        {selectedDateField || "Select a date field"}
                      </div>
                      <Select
                        style={{
                          width: 120,
                          backgroundColor: "#333", // Dark background for the select dropdown
                          // White text for the dropdown options
                          border: "1px solid #444", // Slight border for contrast
                        }}
                        value={selectedYear}
                        onChange={setSelectedYear}
                        placeholder="Select Year">
                        {getAvailableYears().map((year) => (
                          <Option key={year} value={year}>
                            {year}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 10,
                      }}>
                      <ResponsiveContainer
                        width="100%"
                        height={250}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                        }}>
                        <LineChart data={getDateGraphData()}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            allowDuplicatedCategory={false}
                            label={{
                              value: "Month",
                              position: "insideBottom",
                              offset: -5,
                              fill: "white",
                            }}
                          />
                          <YAxis
                            tickFormatter={formatYAxis}
                            label={{
                              value: "Count",
                              angle: -90,
                              position: "insideLeft",
                              fill: "white",
                            }}
                          />
                          <Tooltip
                            formatter={(value, name, props) => [
                              new Intl.NumberFormat("en").format(value),
                              `${props.payload.fullDate}`,
                            ]}
                            // contentStyle={{
                            //   backgroundColor: "#333",
                            // }}
                          />
                          <Line
                            dataKey="count"
                            stroke="blue"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        ) : (
          <p>Select a date field to view details</p>
        )}
        <Card
          title="EXPLANATION"
          style={{
            borderRadius: "4px",
            boxShadow:
              "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
            height: "100%",
            // border: "none",
          }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                  What is KDE?
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                  KDE is Key Data Element are those data fields in a data table
                  which are of higher value from analytics perspective. KDE in a
                  segment based on index is broken down into three major data
                  type categories- Numerical, Categorical and Date.
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
                  What is KDE Index?​
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                  KDE Index is based on the completeness of a data field, higher
                  the completeness higher is the index, completeness is a key
                  indicator of the usability of the data field for analytical
                  need.
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
                  KDE Profiling
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                  <strong>Numerical:</strong> Depicts Key statistics of the
                  numeric field, these metrics can be studied to evaluate the
                  profile of the data field and any outliers of significance​.
                  <br />
                  <strong>Categorical:</strong> Presents the top K values
                  distribution for the categorical data field, this would help
                  to analyze the reasonableness of the KDE.
                  <br />
                  <strong>Date:</strong> Demonstrate about Min and Max. date of
                  selected Year.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DataProfiling;
