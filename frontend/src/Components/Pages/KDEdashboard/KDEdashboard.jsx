import React, { useEffect, useState } from "react";
import { Row, Col, Card, Select, Menu, Button, Table, Tabs } from "antd";
import "./KDEdashboard.css";
import {
  CaretLeftOutlined,
  CaretRightOutlined,
  XFilled,
  CheckSquareOutlined,
} from "@ant-design/icons";
// import HeaderComponent from "../../CommonComponents/Header/Header";
import CommonBarChart from "../../CommonComponents/Barchart/Barchart";
import CommonRadialChart from "../../CommonComponents/RadialBarChart/RadialBarChart";
import CommonLineChart from "../../CommonComponents/Linechart/LineChart";
import arrow from "../../../assets/Images/arrow.png";
import { backendApi } from "../../../api/backend";

const chunkArray = (arr, size) => {
  return arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);
};
function KDEDashboard() {
  const [tableNames, setTableNames] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [overallData, setOverallData] = useState();
  const [dataSource, setDataSource] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState();
  const [filteredRow, setFilteredRow] = useState(null);
  const [radialChartDataDomain, setRadialChartDataDomain] = useState([]);
  const [radialChartDataFormat, setRadialChartDataFormat] = useState([]);
  const [radialChartDataComplete, setRadialChartDataFormatComplete] = useState(
    []
  );
  const [completenessData, setCompletenessData] = useState();
  const [selectedScore, setSelectedScore] = useState(null);
  const [boxValues, setBoxValues] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [selectedTrendData, setSelectedTrendData] = useState([]);
  const [selectedNumericData, setSelectedNumericData] = useState([]);
  const [selectedScoreForNumeric, setSelectedScoreForNumeric] = useState();
  const [numericData, setNumericData] = useState();
  const [dateData, setDateData] = useState();
  const [selectedDateData, setSelectedDateData] = useState();
  const [selectedScoreForDate, setSelectedScoreForDate] = useState();
  const [categoryData, setCategoryData] = useState();
  const [selecetdScoreForCategory, setSelectedScoreForCategory] = useState();
  const [selectedCategortData, setSelectedCategoryData] = useState();
  const [numericalDataSource, setNumericalDataSource] = useState([]);
  const [categoricalDataSource, setCategoricalDataSource] = useState([]);
  const [dateDataSource, setDateDataSource] = useState([]);
  const [selectedDomainNumericalData, setSelectedDomainNumericalData] =
    useState([]);
  const [domainNumericalData, setDomainNumericalData] = useState([]);
  const [selectedScoreForDomainNumerical, setSelectedScoreForDomainNumerical] =
    useState(null);
  const [selectedDomainCategoryData, setSelectedDomainCategoryData] = useState(
    []
  );
  const [selectedScoreForDomainCategory, setSelectedScoreForDomainCategory] =
    useState(null);
  const [selectedDateDomainDataGrowing, setSelectedDateDomainDataGrowing] =
    useState([]);
  const [
    selectedDateDomainDataNonGrowing,
    setSelectedDateDomainDataNonGrowing,
  ] = useState([]);
  const [domainCategoryData, setdomainCategoryData] = useState([]);
  const [domainDateData, setDomainDateData] = useState([]);
  const [selectedScoreForDomainDate, setSelectedScoreForDomainDate] =
    useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 4;

  // If data exists, chunk it into pages
  const totalCards = selectedDomainNumericalData.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const currentData = selectedDomainNumericalData.slice(
    currentPage * cardsPerPage,
    (currentPage + 1) * cardsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
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

  const fetchTableData = async () => {
    try {
      const response = await backendApi.getKde(selectedTable);
      if (response?.data) {
        setOverallData(response?.data.overall);
        const dataWithKeys = response.data.overall.map((item, index) => ({
          key: index,
          ...item,
        }));
        setDataSource(dataWithKeys);

        // // Filter and create separate data sources
        // const numericalData = dataWithKeys.filter(
        //   (item) => item?.data_type === "numerical"
        // );
        // const categoricalData = dataWithKeys.filter(
        //   (item) => item?.data_type === "categorical"
        // );
        // const dateData = dataWithKeys.filter(
        //   (item) => item?.data_type === "date"
        // );
        // setNumericalDataSource(numericalData);
        // setCategoricalDataSource(categoricalData);
        // setDateDataSource(dateData);
        setSelectedScore(0);
        setFilteredTableData(dataSource);
        setRadialChartDataFormatComplete([{ score: "Completeness", value: 0 }]);
        setRadialChartDataFormat([{ score: "Format", value: 0 }]);
        setRadialChartDataDomain([{ score: "Domain", value: 0 }]);
        setCompletenessData(response?.data?.completeness);
        setTrendData(response?.data?.trend);
        setNumericData(response?.data?.numerical_format);
        setSelectedScoreForNumeric(0);
        setSelectedNumericData([]);
        setCategoryData(response?.data.categorical_format);
        setSelectedScoreForCategory(0);
        setSelectedCategoryData([]);
        setDateData(response?.data.date_format);
        setSelectedScoreForDate(0);
        setSelectedDateData([]);
        setDomainNumericalData(response?.data?.numerical_domain);
        setSelectedScoreForDomainNumerical(0);
        setSelectedDomainNumericalData([]);
        setSelectedDomainCategoryData(response?.data?.categorical_domain);
        setSelectedScoreForDomainCategory(0);
        setDomainDateData(response?.data?.date_domain);
        setSelectedScoreForDomainDate(0);
        const data = response?.data?.date_domain;
        data?.forEach((row) => {
          if (row?.growing !== "NON-Growing") {
            setSelectedDateDomainDataGrowing([]);
          } else {
            setSelectedDateDomainDataGrowing([]);
          }
        });
        data?.forEach((row) => {
          if (row?.growing === "NON-Growing") {
            setSelectedDateDomainDataNonGrowing([]);
          } else {
            setSelectedDateDomainDataNonGrowing([]);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };
  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [selectedTable]);
  useEffect(() => {
    setFilteredTableData(dataSource);
  }, [dataSource]);

  const handleTableChange = (value) => {
    setSelectedTable(value);
  };
  const chunkedNumericData = chunkArray(selectedNumericData || [], 2);
  const chunkedCategoryData = chunkArray(selectedCategortData || [], 2);
  const chunkedDateData = chunkArray(selectedDateData || [], 2);
  const chunkedDomainGrowingData = chunkArray(
    selectedDateDomainDataGrowing || [],
    2
  );
  const chunkedDomainNonGrowingData = chunkArray(
    selectedDateDomainDataNonGrowing || [],
    2
  );
  const columns = [
    {
      title: (
        <div className="text-overflow-ellipsis" title="Column Name">
          Column Name
        </div>
      ),
      dataIndex: "column_name",
      key: "column_name",
      render: (text) => (
        <div className="text-overflow-ellipsis" title={text}>
          {text}
        </div>
      ),
    },
    {
      // title: "Data Type",
      dataIndex: "data_type",
      key: "data_type",
      render: (text) => (
        <div
          className="text-overflow-ellipsis"
          title={text}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: " rgb(227 237 243)",
            padding: "6px 4px",
            borderRadius: "5px",
          }}>
          {text}
        </div>
      ),
      title: (
        <div
          className="text-overflow-ellipsis"
          title="Data Type"
          style={{ textAlign: "center" }}>
          Data Type
        </div>
      ),
    },
    {
      title: (
        <div
          className="text-overflow-ellipsis"
          title="Score"
          style={{ textAlign: "center" }}>
          Score
        </div>
      ),
      dataIndex: "score",
      key: "score",
      render: (score) => score.toFixed(1),
    },
  ];
  const columnsForDateCategory = [
    {
      title: "New Values",
      dataIndex: "values",
      key: "values",
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
    },
    {
      title: "%",
      dataIndex: "pct",
      key: "pct",
    },
  ];
  const handleRefresh = () => {
    setFilteredRow(null);
    setRadialChartDataFormatComplete(0);
    setRadialChartDataFormat(0);
    setRadialChartDataDomain(0);
    setBoxValues([]);
    setSelectedScore(0);
    setSelectedTrendData([]);
    setSelectedNumericData([]);
    setSelectedScoreForNumeric(0);
    setSelectedScoreForCategory(0);
    setSelectedCategoryData([]);
    setSelectedScoreForDate(0);
    setSelectedDateData([]);
    setSelectedScoreForDomainNumerical(0);
    setSelectedDomainNumericalData([]);
    setSelectedDateDomainDataGrowing([]);
    setSelectedDateDomainDataNonGrowing([]);
    setSelectedScoreForDomainDate(0);
    setSelectedScoreForDomainCategory(0);
  };
  const onRowClick = (record) => {
    setFilteredRow(record);
    setRadialChartDataFormatComplete([
      { score: "Completeness", value: record?.completeness_score },
    ]);
    setRadialChartDataFormat([
      { score: "Format", value: record?.format_score },
    ]);
    setRadialChartDataDomain([
      { score: "Domain", value: record?.domain_score },
    ]);
    const completenessScore = completenessData?.find(
      (item) => item?.column_name === record?.column_name
    );
    setSelectedScore(completenessScore?.completeness_score);
    const matchingItem = completenessData?.find(
      (item) => item?.column_name === record?.column_name
    );
    setBoxValues(matchingItem);
    const matchingItemForTrend = trendData?.filter(
      (item) => item?.column_name === record?.column_name
    );

    if (matchingItemForTrend && matchingItemForTrend.length > 0) {
      let newData = matchingItemForTrend.map((ele) => ({
        date: ele?.date,
        completeness: ele?.completeness,
      }));
      setSelectedTrendData(newData);
    }
    const matchingItemForNumeric = numericData?.find(
      (item) => item?.column_name === record?.column_name
    );

    if (matchingItemForNumeric) {
      setSelectedScoreForNumeric(matchingItemForNumeric?.score);
      setSelectedNumericData([
        {
          key: " Base Int Value",
          value: matchingItemForNumeric?.int_count_base,
        },
        {
          key: " Base Float Value",
          value: matchingItemForNumeric?.float_count_base,
        },
        {
          key: " Increment Int Value",
          value: matchingItemForNumeric?.int_count_inc,
        },
        {
          key: " Increment Float Value",
          value: matchingItemForNumeric?.float_count_inc,
        },
        {
          key: " Change",
          value: matchingItemForNumeric?.change,
        },
      ]);
    } else {
      setSelectedScoreForNumeric(null);
      setSelectedNumericData([]);
    }
    const matchingItemForCategory = categoryData?.find(
      (item) => item?.column_name === record?.column_name
    );

    if (matchingItemForCategory) {
      setSelectedScoreForCategory(matchingItemForCategory?.score);
      setSelectedCategoryData([
        {
          key: "Max. Base Value",
          value: matchingItemForCategory?.max_len_main,
        },
        {
          key: "Min. Base Value",
          value: matchingItemForCategory?.min_len_main,
        },
        {
          key: "Max. Increment Value",
          value: matchingItemForCategory?.max_len_inc,
        },
        {
          key: "Min. Increment Value",
          value: matchingItemForCategory?.min_len_inc,
        },
        {
          key: "Max. Change",
          value: matchingItemForCategory?.chng_max,
        },
        {
          key: "Min. Change",
          value: matchingItemForCategory?.chng_min,
        },
      ]);
    } else {
      setSelectedScoreForCategory(null);
      setSelectedCategoryData([]);
    }

    const matchingItemForDate = dateData?.find(
      (item) => item?.column_name === record?.column_name
    );
    if (matchingItemForDate) {
      setSelectedScoreForDate(matchingItemForDate?.score);
      setSelectedDateData([
        {
          key: "Base Value",
          value: matchingItemForDate?.main_col_format,
        },
        {
          key: "Increment Value",
          value: matchingItemForDate?.inc_col_format,
        },
        {
          key: "Change",
          value: matchingItemForDate?.status,
        },
      ]);
    } else {
      setSelectedScoreForDate(null);
      setSelectedDateData([]);
    }
    const matchingItemForDomainNumerical = domainNumericalData?.find(
      (item) => item?.column_name === record?.column_name
    );
    if (matchingItemForDomainNumerical) {
      setSelectedScoreForDomainNumerical(matchingItemForDomainNumerical?.score);

      setSelectedDomainNumericalData([
        {
          key: "Maximum Base Value",
          value: matchingItemForDomainNumerical?.max_main,
        },
        {
          key: "Minimum Base Value",
          value: matchingItemForDomainNumerical?.min_main,
        },
        {
          key: "Max Increment Value",
          value: matchingItemForDomainNumerical?.max_inc,
        },
        {
          key: "Minimun Increment Value",
          value: matchingItemForDomainNumerical?.min_inc,
        },
        {
          key: "Maximum Change",
          value: matchingItemForDomainNumerical?.chng_max,
        },
        {
          key: "Minimum Change",
          value: matchingItemForDomainNumerical?.chng_min,
        },
        {
          key: "90% above Base Value",
          value: matchingItemForDomainNumerical?.pct90_count_main,
        },
        {
          key: "90% above Increment Value",
          value: matchingItemForDomainNumerical?.pct90_count_inc,
        },
        {
          key: "90% above Change",
          value: matchingItemForDomainNumerical?.chng_90,
        },
      ]);
    } else {
      setSelectedScoreForDomainNumerical(null);
      setSelectedDomainNumericalData([]);
    }
    const matchingItemForDomainCategory = selectedDomainCategoryData?.find(
      (item) => item?.column_name === record?.column_name
    );
    if (matchingItemForDomainCategory) {
      setSelectedScoreForDomainCategory(matchingItemForDomainCategory?.score);
      const data = selectedDomainCategoryData?.filter(
        (item) => item?.column_name === record?.column_name
      );
      setdomainCategoryData(data);
    } else {
      setSelectedScoreForDomainCategory(null);
      setdomainCategoryData([]);
    }
    const matchingItemForDomainDate = domainDateData?.find(
      (item) => item?.column_name === record?.column_name
    );
    if (matchingItemForDomainDate) {
      setSelectedScoreForDomainDate(matchingItemForDomainDate?.score);
      if (matchingItemForDomainDate?.growing == "Growing") {
        setSelectedDateDomainDataGrowing([
          {
            key: "Max. Base Value",
            value: matchingItemForDomainDate?.base_max,
          },
          {
            key: "Max. Increment Value",
            value: matchingItemForDomainDate?.increment_min,
          },
          {
            key: "Fault",
            value:
              matchingItemForDomainDate?.fault === "None"
                ? "2024-01"
                : matchingItemForDomainDate?.fault,
          },
        ]);
      } else if (matchingItemForDomainDate?.growing === "NON-Growing") {
        setSelectedDateDomainDataNonGrowing([
          {
            key: "Max. Base Value",
            value: matchingItemForDomainDate?.base_max,
          },
          {
            key: "Max. Increment Value",
            value: matchingItemForDomainDate?.increment_min,
          },
          {
            key: "Fault",
            value:
              matchingItemForDomainDate?.fault === "None"
                ? "2024-01"
                : matchingItemForDomainDate?.fault,
          },
        ]);
      } else {
        setSelectedDateDomainDataNonGrowing([]);
      }
    } else {
      setSelectedScoreForDomainDate(null);
      setSelectedDateDomainDataNonGrowing([]);
      setSelectedDateDomainDataGrowing([]);
    }
  };

  const groupByRange = (score, rangeSize) => {
    const max = Math.ceil(score / rangeSize) * rangeSize;
    const min = max - rangeSize;
    return `${min}-${max}`;
  };

  const groupedBarChartData = dataSource?.reduce((acc, item) => {
    const rangeLabel = groupByRange(item?.score, 2);
    const existing = acc.find((entry) => entry.range === rangeLabel);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ range: rangeLabel, count: 1 });
    }
    return acc;
  }, []);

  const sortedBarChartData = groupedBarChartData.sort((a, b) => {
    const minA = parseInt(a.range.split("-")[0], 10);
    const minB = parseInt(b.range.split("-")[0], 10);
    return minA - minB;
  });
  // const filteredBarChartData =
  //   filteredRow !== null
  //     ? sortedBarChartData?.filter(
  //         (entry) => groupByRange(filteredRow?.score, 2) === entry?.range
  //       )
  //     : sortedBarChartData;

  const handleBarClick = (data) => {
    const filtered = dataSource.filter(
      (item) => groupByRange(item.score, 2) === data.range
    );
    setFilteredTableData(filtered);
  };

  const completenessRadialData = [{ name: "Score", value: selectedScore ?? 0 }];
  const allRanges = [];
  for (let i = 0; i < 10; i += 2) {
    allRanges.push(`${i}-${i + 2}`);
  }
  const formattedData = selectedTrendData?.length
    ? selectedTrendData.map((item) => ({
        date: new Date(item?.date).toISOString().split("T")[0],
        completeness: item?.completeness,
      }))
    : [];
  const ensureAllRangesExist = (data, allRanges) => {
    const dataMap = new Map(data.map((item) => [item.range, item.count]));
    return allRanges.map((range) => ({
      range,
      count: dataMap.get(range) || 0,
    }));
  };
  const processedData = ensureAllRangesExist(sortedBarChartData, allRanges);

  return (
    <>
      <div className="body">
        <Row style={{ marginBottom: 10 }}>
          <Col span={4}>
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
          </Col>
        </Row>
        <Col span={24}>
          <div className="heading-container">KDE Analyzer</div>
        </Col>
        <Row gutter={8}>
          <Col span={10}>
            <Card
              title="KDE Score Distribution"
              style={{
                borderRadius: "4px",
                height: "350px",
                  boxShadow:
                    "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
              }}>
              <CommonBarChart
                data={processedData}
                onBarClick={handleBarClick}
                gradientBars={true}
                // ticks={allRanges}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card
              style={{
                borderRadius: "4px",
                height: "350px",
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
              }}
              title="KDE Order"
              extra={
                <Button
                  onClick={handleRefresh}
                  type="primary"
                  style={{ backgroundColor: "  #228CFC" }}>
                  Refresh
                </Button>
              }>
              <Table
                dataSource={filteredTableData}
                columns={columns}
                pagination={false}
                style={{
                  maxHeight: "250px",
                  maxWidth: "100%",
                  overflowY: "auto",
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                }}
                // scroll={{ y: "220px" }}
                rowClassName={(record) =>
                  record === filteredRow ? "highlighted-row" : ""
                }
                onRow={(record) => ({
                  onClick: () => onRowClick(record),
                })}
                className="my-table"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card
              title="Completeness Score"
              style={{
                borderRadius: "4px",
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
              }}>
              <CommonRadialChart value={completenessRadialData} />
              <Row>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <XFilled style={{ color: "yellow" }} />
                      <div style={{ color: "#a1a1af" }}>Base</div>
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#4d4d4d",
                      }}>
                      {boxValues?.fill_rate_base?.toFixed(2)
                        ? boxValues?.fill_rate_base?.toFixed(2)
                        : "-"}
                    </div>
                  </div>
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <XFilled style={{ color: "blue" }} />{" "}
                      <div style={{ color: "#a1a1af" }}>Increment</div>
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#4d4d4d",
                      }}>
                      {boxValues?.fill_rate_increment?.toFixed(2)
                        ? boxValues?.fill_rate_increment?.toFixed(2)
                        : "-"}
                    </div>
                  </div>
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    // justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <XFilled style={{ color: "pink" }} />
                      <div style={{ color: "#a1a1af" }}>Change</div>
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#4d4d4d",
                      }}>
                      {boxValues?.difference?.toFixed(2)
                        ? boxValues?.difference?.toFixed(2)
                        : "-"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <Row gutter={8} style={{ marginTop: "8px" }}>
          <Col span={10}>
            <Card
              style={{
                borderRadius: "4px",
                height: "350px",
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
              }}
              title={
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>KDE Score Dimensions</span>
                  <span style={{ fontSize: "12px", color: "blue" }}>
                    {filteredRow?.column_name} - {filteredRow?.data_type}
                  </span>
                </div>
              }>
              <Row>
                <Col span={12}>
                  <CommonRadialChart
                    size={{ width: "100%", height: 140 }}
                    value={radialChartDataComplete}
                    text="Completeness"
                  />
                </Col>
                <Col span={12}>
                  <CommonRadialChart
                    size={{ width: "100%", height: 140 }}
                    value={radialChartDataFormat}
                    text="Format"
                  />
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <CommonRadialChart
                    size={{ width: "100%", height: 140 }}
                    value={radialChartDataDomain}
                    text="Domain of Values"
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={14}>
            <CommonLineChart
              title={
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Completeness Trend Analysis</span>
                  <span style={{ fontSize: "12px", color: "blue" }}>
                    {filteredRow?.column_name} - {filteredRow?.data_type}
                  </span>
                </div>
              }
              data={formattedData}
              dataKeyX="date"
              dataKeyLine="completeness"
            />
          </Col>
        </Row>
        <Row gutter={8} style={{ marginTop: "8px" }}>
          <Col span={12}>
            <Card
              style={{
                borderRadius: "4px",
                height: "300px",
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
              }}
              title={
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Format</span>
                  <span style={{ fontSize: "12px", color: "blue" }}>
                    {filteredRow?.column_name} - {filteredRow?.data_type}
                  </span>
                </div>
              }>
              {filteredRow?.data_type === "numerical" ? (
                <Row gutter={24}>
                  <Col span={10}>
                    <CommonRadialChart
                      value={[{ value: selectedScoreForNumeric }]}
                      size={{
                        height: 180,
                        width: "100%",
                      }}
                    />
                  </Col>
                  <Col
                    span={14}
                    style={{
                      display: "flex",
                      // flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "50px",
                    }}>
                    {selectedNumericData && selectedNumericData.length > 0 ? (
                      chunkedNumericData.map((rowItems, rowIndex) => (
                        <Row
                          gutter={20}
                          key={rowIndex}
                          style={{ width: "100%" }}>
                          {rowItems.map((item, index) => (
                            <Col
                              key={index}
                              span={24}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                marginBottom: "20px",
                              }}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <XFilled style={{ color: "blue" }} />
                                  <div
                                    style={{
                                      color: "#a1a1af",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      fontSize: "12px",
                                      textOverflow: "ellipsis",
                                    }}>
                                    {item.key}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#4d4d4d",
                                    cursor: "pointer",
                                  }}
                                  title={item.value}>
                                  {typeof item.value !== "string" &&
                                  item.value != null
                                    ? item.value.toFixed(2)
                                    : item.value}
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      ))
                    ) : (
                      <></>
                    )}
                  </Col>
                </Row>
              ) : filteredRow?.data_type === "categorical" ? (
                <Row gutter={8}>
                  <Col span={10}>
                    <CommonRadialChart
                      value={[{ value: selecetdScoreForCategory }]}
                      title="Categorical"
                      size={{
                        height: 180,
                        width: "100%",
                      }}
                    />
                  </Col>
                  <Col
                    span={14}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                    }}>
                    {selectedCategortData && selectedCategortData.length > 0 ? (
                      chunkedCategoryData.map((rowItems, rowIndex) => (
                        <Row
                          gutter={[8, 8]}
                          key={rowIndex}
                          style={{ width: "100%" }}>
                          {rowItems.map((item, colIndex) => (
                            <Col
                              span={12}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <XFilled style={{ color: "blue" }} />
                                  <div
                                    style={{
                                      color: "#a1a1af",
                                      fontSize: "12px",
                                    }}>
                                    {item.key}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#4d4d4d",
                                  }}
                                  title={item.value}>
                                  {typeof item.value !== "string" &&
                                  item.value != null
                                    ? item.value.toFixed(2)
                                    : item.value}
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      ))
                    ) : (
                      <></>
                    )}
                  </Col>
                </Row>
              ) : filteredRow?.data_type === "date" ? (
                <Row gutter={8}>
                  <Col span={10}>
                    <CommonRadialChart
                      value={[{ value: selectedScoreForDate }]}
                      title="Date"
                      size={{
                        height: 180,
                        width: "100%",
                      }}
                    />
                  </Col>
                  <Col
                    span={14}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                    }}>
                    {selectedDateData && selectedDateData.length > 0 ? (
                      chunkedDateData.map((rowItems, rowIndex) => (
                        <Row
                          gutter={6}
                          key={rowIndex}
                          style={{ width: "100%" }}>
                          {rowItems.map((item, colIndex) => (
                            <Col
                              span={12}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <XFilled style={{ color: "blue" }} />
                                  <div
                                    style={{
                                      color: "#a1a1af",
                                      fontSize: "12px",
                                    }}>
                                    {item.key}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#4d4d4d",
                                  }}>
                                  {item.value}
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      ))
                    ) : (
                      <></>
                    )}
                  </Col>
                </Row>
              ) : (
                <div style={{ textAlign: "center" }}>
                  Select a Row from the above table
                </div>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card
              style={{
                borderRadius: "4px",
                height: "300px",
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
              }}
              title={
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Domain of Values</span>
                  <span style={{ fontSize: "12px", color: "blue" }}>
                    {filteredRow?.column_name} - {filteredRow?.data_type}
                  </span>
                </div>
              }>
              {filteredRow?.data_type === "numerical" ? (
                <Row>
                  <Col span={10}>
                    <CommonRadialChart
                      value={[{ value: selectedScoreForDomainNumerical }]}
                      title="Numerical"
                      size={{
                        height: 180,
                        width: "100%",
                      }}
                    />
                  </Col>
                  <Col span={14}>
                    {totalCards > 0 ? (
                      <>
                        <Row gutter={8} style={{ width: "100%" }}>
                          {currentData.map((item, index) => (
                            <Col
                              key={index}
                              span={12}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                marginTop: "20px",
                                justifyContent: "space-between",
                              }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <XFilled style={{ color: "blue" }} />
                                <div
                                  style={{
                                    color: "#a1a1af",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    fontSize: "12px",
                                  }}>
                                  {item.key}
                                </div>
                              </div>
                              <div
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  color: "#4d4d4d",
                                  cursor: "pointer",
                                }}
                                title={item.value}>
                                {item.value != null
                                  ? item.value.toFixed(2)
                                  : null}
                              </div>
                            </Col>
                          ))}
                        </Row>
                        {/* Pagination Controls */}
                        <Row
                          gutter={18}
                          style={{
                            display: "flex",
                            gap: "20px",
                            marginTop: "30px",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <CaretLeftOutlined
                            title="Previous"
                            onClick={handlePrevPage}
                            disabled={currentPage === 0}
                          />
                          <CaretRightOutlined
                            title="Next"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages - 1}
                          />
                        </Row>
                      </>
                    ) : (
                      <></>
                    )}
                  </Col>
                </Row>
              ) : filteredRow?.data_type === "categorical" ? (
                <Row>
                  <Col span={10}>
                    <CommonRadialChart
                      value={[{ value: selectedScoreForDomainCategory }]}
                      title="Categorical"
                      size={{
                        height: 180,
                        width: "100%",
                      }}
                    />
                  </Col>
                  <Col span={14}>
                    <Row>
                      {selectedDomainCategoryData &&
                      selectedDomainCategoryData.length > 0 ? (
                        <Card
                          style={{
                            marginTop: "20px",
                            width: "100%",
                            // height: "365px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}>
                          <Table
                            dataSource={domainCategoryData}
                            style={{
                              maxHeight: "200px",
                              maxWidth: "100%",
                              overflowY: "auto",
                              msOverflowStyle: "none",
                              scrollbarWidth: "none",
                              "&::-webkit-scrollbar": {
                                display: "none",
                              },
                            }}
                            columns={columnsForDateCategory}
                            pagination={false}
                            rowClassName={(record) =>
                              record.score === filteredRow
                                ? "highlighted-row"
                                : ""
                            }
                          />
                        </Card>
                      ) : (
                        <></>
                      )}
                    </Row>
                  </Col>
                </Row>
              ) : filteredRow?.data_type === "date" ? (
                <Row>
                  <Col span={10}>
                    <CommonRadialChart
                      value={[{ value: selectedScoreForDomainDate }]}
                      title="Date"
                      size={{
                        height: 180,
                        width: "100%",
                      }}
                    />
                  </Col>
                  <Col span={14}>
                    <Col
                      span={24}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                      {selectedDateDomainDataGrowing &&
                      selectedDateDomainDataGrowing.length > 0 ? (
                        chunkedDomainGrowingData.map((rowItems, rowIndex) => (
                          <Row
                            gutter={[8, 8]}
                            key={rowIndex}
                            style={{ width: "100%" }}>
                            {rowItems.map((item, colIndex) => (
                              <Col key={colIndex} span={12}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <XFilled style={{ color: "blue" }} />
                                  <div style={{ color: "#a1a1af" }}>
                                    {item.key}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#4d4d4d",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "100%",
                                  }}
                                  title={item.value}>
                                  {Array.isArray(item.value) &&
                                  item.value.length > 0 ? (
                                    <div
                                      style={{
                                        maxHeight: "80px",
                                        maxWidth: "120px",
                                        overflowY: "auto",
                                        // msOverflowStyle: "none",
                                        // scrollbarWidth: "none",
                                        padding: "2px 20px",
                                        border: "1px solid rgb(225, 223, 223)",
                                        cursor: "pointer",
                                        // "&::-webkit-scrollbar": {
                                        //   display: "none",
                                        // }
                                      }}
                                      title="Scroll for more">
                                      {item.value.map((val, index) => (
                                        <div key={index}>{val}</div>
                                      ))}
                                    </div>
                                  ) : (
                                    item.value
                                  )}
                                </div>
                              </Col>
                            ))}
                          </Row>
                        ))
                      ) : selectedDateDomainDataNonGrowing &&
                        selectedDateDomainDataNonGrowing.length > 0 ? (
                        chunkedDomainNonGrowingData.map(
                          (rowItems, rowIndex) => (
                            <Row
                              gutter={[8, 8]}
                              key={rowIndex}
                              style={{
                                width: "100%",
                                alignItems: "center",
                                marginTop: "20px",
                                // justifyContent: "center",
                              }}>
                              {rowItems.map((item, colIndex) => (
                                <Col key={colIndex} span={12}>
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <XFilled style={{ color: "blue" }} />
                                    <div style={{ color: "#a1a1af" }}>
                                      {item.key}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: "600",
                                      color: "#4d4d4d",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%",
                                    }}
                                    title={item.value}>
                                    {Array.isArray(item.value) &&
                                    item.value.length > 0 ? (
                                      <div
                                        style={{
                                          maxHeight: "80px",
                                          maxWidth: "120px",
                                          overflowY: "auto",
                                          // msOverflowStyle: "none",
                                          // scrollbarWidth: "none",
                                          padding: "2px 20px",
                                          border:
                                            "1px solid rgb(225, 223, 223)",
                                          cursor: "pointer",
                                          // "&::-webkit-scrollbar": {
                                          //   display: "none",
                                          // }
                                        }}
                                        title="Scroll for more">
                                        {item.value.map((val, index) => (
                                          <div key={index}>{val}</div>
                                        ))}
                                      </div>
                                    ) : (
                                      item.value
                                    )}
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          )
                        )
                      ) : (
                        <></>
                      )}
                    </Col>
                  </Col>
                </Row>
              ) : (
                <div style={{ textAlign: "center" }}>
                  Select a Row from the above table
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default KDEDashboard;
