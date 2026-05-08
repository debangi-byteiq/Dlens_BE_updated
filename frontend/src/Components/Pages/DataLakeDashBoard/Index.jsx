import React, { useState, useEffect } from "react";
import { Row, Col, Card, Select, DatePicker } from "antd";
import AreaChart1 from "../../Components/Charts/AreaChart/AreaChart1";
import AreaChart2 from "../../Components/Charts/AreaChart/AreaChart2";
import AreaChart3 from "../../Components/Charts/AreaChart/AreaChart3";
import AreaChart4 from "../../Components/Charts/AreaChart/AreaChart4";
import DataLakeCards from "../../Components/Cards/DataLakeCards/Index";
import Info from "../../Components/Info/Index";
import { GridLoader } from "react-spinners";
import serverErrorImage from "../../Assets/Images/ServerError.svg";
import "./Index.css";
import axios from "axios";
import dayjs from "dayjs";
const { Option } = Select;

const DataLakeDashBoard = () => {
  const [loading, setLoading] = useState(false);
  const moment = require("moment");
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const calendarDate = moment(date);
  const [source, setSource] = useState("");
  const [tableName, setTableName] = useState("");
  const [runType, setRunType] = useState("");
  const [cardData, setCardData] = useState([]);
  const [incomingData, setIncomingData] = useState({});
  const [allStorageData, setAllStorageData] = useState({});
  const [openGraphData, setOpenGraphData] = useState({});
  const [noOpenGraphData, setNoOpenGraphData] = useState({});
  const [serverError, setServerError] = useState(false);

  const onChangeDate = (dateString) => {
    setDate(dayjs(dateString).format("YYYY-MM-DD"));
  };

  const onChangeSource = (value) => {
    setSource(value);
  };

  const onChangeTableName = (value) => {
    setTableName(value);
  };

  const onChangeRunType = (value) => {
    setRunType(value);
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/dashboard/data_lake_monitoring/?date=${date}`;
      if (source) {
        url += `&source=${source}`;
      }
      if (tableName) {
        url += `&table_name=${tableName}`;
      }
      if (runType) {
        url += `&run_type=${runType}`;
      }
      try {
        const response = await axios.get(url);
        setCardData(response.data.card_data);
        setIncomingData(response.data.incomming);
        setAllStorageData(response.data.allstorage_graph);
        setOpenGraphData(response.data.open_graph);
        setNoOpenGraphData(response.data.nonopen_graph);
      } catch (error) {
        console.error("Error fetching data:", error);
        setServerError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, source, tableName, runType]);

  const day = calendarDate?.format("D");
  const dayOfWeek = calendarDate?.format("dddd").toUpperCase();
  const month = calendarDate?.format("MMMM").toUpperCase();

  if (serverError) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <img src={serverErrorImage} alt="serverErrorImage" />
      </div>
    );
  }
  return (
    <div className="mx-2 mb-5">
      <h2 className="mx-2">DataLake Monitoring</h2>
      {loading ? (
        <div style={{ position: "absolute", top: "50%", left: "50%" }}>
          <GridLoader height={3} color="#204496" />
        </div>
      ) : (
        <>
          <Row gutter={16}>
            <Col span={8}></Col>
            <Col span={4}>
              <DatePicker
                defaultValue={dayjs(moment(date, "YYYY-MM-DD"))} // Use value instead of defaultValue
                onChange={onChangeDate}
                format="YYYY-MM-DD"
                className="w-100 h-100"
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Source"
                className="w-100 h-100"
                onChange={onChangeSource}
                value={source || undefined}
              >
                <Option value="aims">Aims</Option>
                <Option value="skcargo">Skcargo</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Table Name"
                className="w-100 h-100"
                onChange={onChangeTableName}
                value={tableName || undefined}
              >
                <Option value="aims_all_legpax">Aims all legpax</Option>
                <Option value="aims_all_legmain">Aims all legmain</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Run Type"
                className="w-100 h-100"
                onChange={onChangeRunType}
                value={runType || undefined}
              >
                <Option value="incremental">Incremental</Option>
              </Select>
            </Col>
          </Row>
          <Row className="mt-4" gutter={[16, 16]}>
            <Col span={8}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card className="calendar-card">
                    <Row
                      justify="center"
                      align="middle"
                      style={{ color: "#204496", fontWeight: "700" }}
                    >
                      <Col>
                        <div style={{ fontSize: "72px", color: "#EA4648" }}>
                          {day}
                        </div>
                      </Col>
                      <Col>
                        <Row className="d-flex flex-column justify-content-center align-items-start">
                          <Col>
                            <div
                              style={{ fontSize: "42px", lineHeight: "42px" }}
                            >
                              {month}
                            </div>
                          </Col>
                          <Col>
                            <div
                              style={{ fontSize: "18px", lineHeight: "18px" }}
                            >
                              {dayOfWeek}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={24}>
                  <Info />
                </Col>
                <Col span={24}>
                  <DataLakeCards
                    cards={Object.keys(cardData).map((key) => ({
                      name: key,
                      count: cardData[key].toLocaleString(),
                      trend:
                        key === "Insert Open" ||
                        key === "Update Open" ||
                        key === "Storage Duplicates" ||
                        key === "Diffen Duplicates"
                          ? "down"
                          : "up",
                    }))}
                  />
                </Col>
              </Row>
            </Col>
            <Col span={16}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card>
                    <AreaChart1 item={incomingData} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <AreaChart2 item={allStorageData} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <AreaChart3 item={openGraphData} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <AreaChart4 item={noOpenGraphData} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default DataLakeDashBoard;
