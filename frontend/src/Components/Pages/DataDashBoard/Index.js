import React, { useState, useEffect } from "react";
import { Row, Col, Card } from "antd";
import { BarCharts } from "../../Components/Charts/BarChart/Index";
import { LineCharts } from "../../Components/Charts/LineChart/Index";
import { RadialbarCharts } from "../../Components/Charts/RadialChart/Index";
import DataTable from "../../Components/Table/Index";
import Calenders from "../../Components/Calender/Index";
import DataCards from "../../Components/Cards/DataCards/Index";
import serverErrorImage from "../../Assets/Images/ServerError.svg";
import "./Index.css";
import axios from "axios";
import { useSelector } from "react-redux";
import { GridLoader } from "react-spinners";

const DataDashboard = () => {
  const date = useSelector((state) => state.connection.date);
  const [cardsData, setCardsData] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [barData, setBarData] = useState({
    data: [],
    argumentField: "argumentField",
    valueField: "valueField",
    colorField: "colorField",
  });
  const [lineData, setLineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${
            process.env.REACT_APP_API_URL
          }/dashboard/data_monitoring/?date_or_year=${
            date.toISOString().split("T")[0]
          }`
        );

        const cardData = response.data?.card_data || {};
        const monthlyData = response.data?.monthly_data || {};
        if (
          response?.data?.table_data === "No data found on the selected date"
        ) {
          setTableData([]);
        } else {
          setTableData(response.data?.table_data || []);
        }

        const transformedBarData = {
          data: Object.keys(cardData)
            .slice(1)
            .map((key) => ({
              argumentField: key,
              valueField: cardData[key],
              colorField:
                key === "Tables Processed"
                  ? "#204496"
                  : key === "Tables Failed"
                  ? "#EA4648"
                  : "#449BD5",
            })),
          argumentField: "argumentField",
          valueField: "valueField",
          colorField: "colorField",
        };

        // Transform monthly_data for LineCharts
        const transformedLineData = Object.keys(monthlyData).map((month) => ({
          name: month,
          ...monthlyData[month],
        }));

        setCardsData(response.data?.card_data || []);
        setBarData(transformedBarData);
        setLineData(transformedLineData);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setServerError(true);
        console.error(err);
      }
    };

    fetchData();
  }, [date]);

  if (serverError) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <img src={serverErrorImage} alt="serverErrorImage" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mx-2">Data Monitoring </h2>
      {loading ? (
        <div style={{ position: "absolute", top: "50%", left: "50%" }}>
          <GridLoader height={3} color="#204496" />
        </div>
      ) : (
        <Row className="mt-4 mx-2 mb-5" gutter={[16, 16]}>
          <Col span={8}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card className="calendarCard">
                  <Calenders />
                </Card>
              </Col>

              <Col span={24}>
                <Card className="radialCard">
                  <RadialbarCharts data={cardsData} />
                </Card>
              </Col>
              <Col span={24}>
                <DataCards cards={cardsData} />
              </Col>
            </Row>
          </Col>
          <Col span={16}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card className="chartCard">
                  <BarCharts item={barData} />
                </Card>
              </Col>
              <Col span={16}>
                <Card className="chartCard">
                  <LineCharts item={lineData} />
                </Card>
              </Col>
              <Col span={24}>
                <Card className="tableCard">
                  <DataTable item={tableData} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DataDashboard;
