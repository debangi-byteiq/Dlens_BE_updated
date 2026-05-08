import React, { useRef, useEffect, useState } from "react";
import { Button, message, Card, Col, Row, Tooltip } from "antd";
import { Link, useNavigate } from "react-router-dom";
import "./Index.css";
import AddConnection from "../../CommonComponents/AddConnectionBtn";
import {
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Progress } from "antd";
import {
  removeProcessResponseAtIndex,
  clearImages,
} from "../../../Redux/Features/ConnectionSlice";
import {
  manageProgress,
  togglePolling,
} from "../../../Redux/Features/progessSilce";
import { backendApi } from "../../../api/backend";
import { makeWebSocketUrl } from "../../../Services/apiConfig";
import { Button6, Button7, KDEIcon } from "../../../assets/sidebarIcons";

const Connection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sourceImages = useSelector((state) => state.connection.sourceImages);
  const containerRef = useRef(null);
  const [sourceRefs, setSourceRefs] = useState([]);
  const [processLoading, setProcessLoading] = useState(false);

  useEffect(() => {
    setSourceRefs(sourceImages.map(() => React.createRef()));
  }, [sourceImages]);

  const handleDelete = (index) => {
    dispatch(clearImages());
    dispatch(removeProcessResponseAtIndex(index));
  };

  const [taskId, setTaskId] = useState(null);
  const progress = useSelector((state) => state.progress.progress);
  const [status, setStatus] = useState("idle");
  const [profilingStatus, setProfilingStatus] = useState(false);
  const [KDEStatus, setKDEStatus] = useState(false);
  const [shiftingStatus, setShiftingStatus] = useState(false);
  const pollingActive = useSelector((state) => state.progress.pollingActive);
  const handleStartProcess = async () => {
    if (sourceImages?.length > 0) {
      setProcessLoading(true);
      try {
        const response = await backendApi.runPipeline();
        setTaskId(response.data.task_id);
        localStorage.setItem("taskId", response.data.task_id);
        if (response.status === 200) {
          message.success("Process started successfully");
          dispatch(togglePolling(true));
        } else {
          message.error("Failed to start the process");
        }
      } catch (error) {
        console.error("Error starting the process:", error);
        message.error("An error occurred while starting the process");
      }
    } else {
      navigate("/Source");
    }
  };

  useEffect(() => {
    if (!taskId) return;

    const socket = new WebSocket(makeWebSocketUrl(`/ws/${taskId}`));

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(manageProgress(data?.progress));
      setStatus(data.message);
      if (data.message === "PROFILING COMPLETED AND SHIFTING STARTED") {
        setProfilingStatus(true);
      }
      if (data.message === "SHIFTING COMPLETED AND KDE STARTED") {
        setShiftingStatus(true);
      }
      if (data.message === "KDE COMPLETED") {
        setKDEStatus(true);
      }
      if (
        data.status === "completed" ||
        data.status === "failed" ||
        data.message === "Task completed successfully"
      ) {
        setProcessLoading(false);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [taskId, dispatch]);

  const handleNavigation = () => {
    navigate("/DataProfiling");
  };
  return (
    <div className="connections-container">
      {pollingActive ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}>
          <Row>
            <Col
              span={24}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}>
              <Progress type="circle" percent={Math.round((progress || 0) * 100)} />
              <p
                style={{
                  textAlign: "center",
                  fontSize: "20px",
                  color: "blue",
                  fontweight: 600,
                }}>
                {status === "Task completed successfully"
                  ? "Task Uploaded successfully!"
                  : "Uploading your data, please wait!"}
              </p>
            </Col>
          </Row>
          <Row
            gutter={8}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Col span={12}>
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <Button6 />
                <p>Data Profiling</p>
              </div>
            </Col>
            <Col span={4}>
              {!profilingStatus ? (
                <ClockCircleOutlined
                  style={{ fontSize: "30px", color: "blue" }}
                />
              ) : (
                <CheckCircleFilled
                  style={{ fontSize: "30px", color: "green" }}
                />
              )}
            </Col>
            <Col
              span={8}
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Tooltip
                title={!profilingStatus ? "Profiling is not yet complete" : ""}>
                <Button
                  type="primary"
                  disabled={!profilingStatus}
                  onClick={handleNavigation}>
                  View Profiling
                </Button>
              </Tooltip>
            </Col>
          </Row>
          <Row
            gutter={8}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Col span={12}>
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <Button7 />
                <p>Data Shifting</p>
              </div>
            </Col>
            <Col span={4}>
              {!shiftingStatus ? (
                <ClockCircleOutlined
                  style={{ fontSize: "30px", color: "blue" }}
                />
              ) : (
                <CheckCircleFilled
                  style={{ fontSize: "30px", color: "green" }}
                />
              )}
            </Col>
            <Col
              span={8}
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Tooltip
                title={!shiftingStatus ? "Shifting   is not yet complete" : ""}>
                <Button
                  type="primary"
                  disabled={!shiftingStatus}
                  onClick={() => navigate("/DataShifting")}>
                  View Shifting
                </Button>
              </Tooltip>
            </Col>
          </Row>
          <Row
            gutter={8}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Col span={12}>
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <KDEIcon />
                <p>KDE Dashboard</p>
              </div>
            </Col>
            <Col span={4}>
              {!KDEStatus ? (
                <ClockCircleOutlined
                  style={{ fontSize: "30px", color: "blue" }}
                />
              ) : (
                <CheckCircleFilled
                  style={{ fontSize: "30px", color: "green" }}
                />
              )}
            </Col>
            <Col
              span={8}
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Tooltip title={!KDEStatus ? "KDE is not yet complete" : ""}>
                <Button
                  type="primary"
                  disabled={!KDEStatus}
                  onClick={() => navigate("/KDEDashboard")}>
                  View KDE
                </Button>
              </Tooltip>
            </Col>
          </Row>

          {status ===
          "Date columnn does not exist, skipping shifting and kde" ? (
            <Card style={{ textAlign: "center", padding: "10px" }}>
              <p style={{ fontSize: "22px" }}>
                Data Column does not Exist in the data.
              </p>
              <p style={{ fontweight: 500, color: "red" }}>
                Cannot upload data for Shifting and KDE dashboards.
              </p>
            </Card>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <div className="w-100">
          <div className="empty-col"></div>
          <div className="connections-content">
            <div className="w-100 d-flex flex-column align-items-center">
              <p className="connection-title">Connections link</p>
              <p className="connection-subtitle">Add Source</p>
            </div>
            <div className="w-100 connection-wrapper" ref={containerRef}>
              <Card
                style={{ borderRadius: "50%", border: "2.5px solid #285180" }}>
                {sourceImages.map((image, index) => (
                  <AddConnection
                    key={index}
                    ref={sourceRefs[index]}
                    type="Source"
                    onDelete={() => handleDelete(index)}
                    className="source-box">
                    {image && <img src={image} className="w-full" />}
                  </AddConnection>
                ))}
                {sourceImages.length < 1 && (
                  <AddConnection className="add-source">
                    <PlusOutlined
                      style={{ fontSize: "60px", color: "#285180" }}
                    />
                  </AddConnection>
                )}
              </Card>
            </div>
          </div>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <button
              className="btn-primary"
              disabled={processLoading}
              onClick={handleStartProcess}>
              {processLoading
                ? "Starting Process"
                : sourceImages.length > 0
                ? "Start Process"
                : "Create Your Connections"}
            </button>
            <Link to="/DataShifting" className="text-decoration-none btn-link">
              or play around in our demo instance
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connection;
