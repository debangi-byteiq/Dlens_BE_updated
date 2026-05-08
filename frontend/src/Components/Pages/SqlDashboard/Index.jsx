import React, { useState } from "react";
import "./Index.css";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Radio,
  Select,
  Button,
  Modal,
  Breadcrumb,
  Checkbox,
  message,
} from "antd";
import Sqlsetup from "../../../assets/Images/Sqlsetup.svg";
import sql from "../../../assets/Images/Sources/Sql.svg";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Table from "../../../assets/Images/Table.svg";
import { useLocation } from "react-router-dom";
import { backendApi } from "../../../api/backend";
import { setSourceId } from "../../../Redux/Features/ConnectionSlice";
import { useDispatch, useSelector } from "react-redux";
import { Info } from "lucide-react";

const { Option } = Select;
const availableSources = ["Courses", "Enrollment", "Faculty", "Students"];

const SqlDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkedSourcesList, setCheckedSourcesList] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const sourceId = useSelector((state) => state.connection.sourceId);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const queryParams = new URLSearchParams(location.search);
  const queryType = queryParams.get("type");

  console.log(location?.state, "data");
  const handleFinish = async (values) => {
    // debugger;
    setLoading(true);
    try {
      const { image, text } = location.state || {};
      console.log(location.state, "location.state");
      let response;
      if (queryType === "source") {
        const payload = {
          details: {
            hostname: values.host,
            port: values.port,
            username: values.username,
            password: values.password,
            dbname: values.databaseName,
            schema_name: values.schemaName,
            table_name: values.tableName,
            datecol: values.datecol || "",
            base_months: values?.baseMonth,
            inc_months: values?.incrementMonth,
            image: image,
            text: text,
          },
        };
        response = await backendApi.saveSource(payload);
        if (response.data.id) {
          message.success(response.data.message);
          dispatch(setSourceId(response.data.id));
          navigate("/Connections");
        } else {
          message.error(response.data.message);
        }
      }
      // } else if (queryType === "destination") {
      //   const { image, text } = location.state || {};
      //   const payload = {
      //     source_id: sourceId,
      //     details: {
      //       hostname: values.host,
      //       port: values.port,
      //       username: values.username,
      //       password: values.password,
      //       dbname: values.databaseName,
      //       schema_name: values.schemaName,
      //       table_name: values.tableName,
      //       datecol: values.datecol,
      //       base_months: values?.baseMonth,
      //       inc_months: values?.incrementMonth,
      //       image: image,
      //       text: text,
      //     },
      //   };
      //   response = await Services.POST(
      //     `${apiUrl}/save_destination`,
      //     payload
      //   );
      //   dispatch(setSourceId(null));
      // }
      // setModalVisible(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = () => {
    setModalVisible(false);
    setShowTable(false);
    navigate("/Connections");
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setShowTable(false);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleShowTable = () => {
    setShowTable(true);
  };

  const checkAll = availableSources.length === checkedSourcesList.length;
  const indeterminate =
    checkedSourcesList.length > 0 &&
    checkedSourcesList.length < availableSources.length;

  const onChange = (list) => {
    setCheckedSourcesList(list);
  };

  const onCheckAllChange = (e) => {
    setCheckedSourcesList(e.target.checked ? availableSources : []);
  };

  return (
    <div className="body">
      <h5>Create a new source</h5>
      <Breadcrumb className="mx-2">
        {queryType === "source" ? (
          <Breadcrumb.Item>Source</Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item>Destination</Breadcrumb.Item>
        )}
        <Breadcrumb.Item>
          <span>New Source</span>
        </Breadcrumb.Item>
      </Breadcrumb>
      <Form
        // className="w-100 my-3"
        layout="vertical"
        form={form}
        onFinish={handleFinish}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="back-btn" onClick={handleBackClick}>
              <LeftOutlined />
              <p className="mx-2 sql-text">Back</p>
            </div>
            <Card
              style={{
                border: "none",
              }}>
              <h5 className="fw-bold">Create a new source</h5>
              <Form.Item
                name="sourceName"
                label={<span>Source Name</span>}
                rules={[
                  { required: true, message: "Please Enter Source name" },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Source Name" />
              </Form.Item>
              <img src={sql} alt="sql" className="right-image" />
            </Card>
            <Card className="sql-card">
              <Form.Item
                name="host"
                label={<span>Host</span>}
                rules={[{ required: true, message: "Please Enter Host name" }]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Host" />
              </Form.Item>
              <Form.Item
                name="port"
                label={<span>Port</span>}
                rules={[{ required: true, message: "Please Enter port" }]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Port" />
              </Form.Item>
              <Form.Item
                name="databaseName"
                label={<span>Database Name</span>}
                rules={[
                  { required: true, message: "Please Enter Database name" },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Database Name" />
              </Form.Item>
              <Form.Item
                name="schemaName"
                label={<span>Schema Name</span>}
                rules={[
                  { required: true, message: "Please Enter Schema name" },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Schema Name" />
              </Form.Item>
              <Form.Item
                name="tableName"
                label={<span>Table Name</span>}
                rules={[{ required: true, message: "Please Enter Table name" }]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Table Name" />
              </Form.Item>
              <>
                <h2 style={{ fontSize: "17px", padding: "20px 0 5px 0" }}>
                  Additional set up for processing
                </h2>
                <Form.Item
                  name="datecol"
                  label={<span>Date Column</span>}
                  rules={[
                    { required: false, message: "Please Enter Date Column" },
                  ]}
                  style={{ marginBottom: 0, marginTop: 10 }}>
                  <Input placeholder="Date Column" />
                </Form.Item>
                {/* <p className="fw d-flex items-center gap-1 mt-2">
                <Info size={16} />
                Provide Date Column to perform Shifting
              </p> */}
                <Form.Item
                  name="baseMonth"
                  label={<span>Base Duration (in days)</span>}
                  rules={[
                    { required: false, message: "Please enter Base Months" },
                  ]}
                  style={{ marginBottom: 0, marginTop: 10 }}>
                  <Input placeholder="Enter Base Months" />
                </Form.Item>

                <Form.Item
                  name="incrementMonth"
                  label={<span>Incremental Duration (in days)</span>}
                  rules={[
                    {
                      required: false,
                      message: "Please enter Incremental Months",
                    },
                  ]}
                  style={{ marginBottom: 0, marginTop: 10 }}>
                  <Input placeholder="Enter Incremental Months" />
                </Form.Item>
              </>
            </Card>
            <Card className="sql-card">
              <Form.Item
                name="username"
                label={<span>Username</span>}
                rules={[
                  {
                    required: true,
                    message: "Please Enter Database User name",
                  },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item
                name="password"
                label={<span>Password</span>}
                rules={[
                  { required: true, message: "Please Enter Database Password" },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input.Password
                  placeholder="Password"
                  visibilityToggle={{
                    visible: passwordVisible,
                    onVisibleChange: setPasswordVisible,
                  }}
                />
              </Form.Item>
            </Card>
            <Card className="sql-card">
              <h6 className="fw-bold">Security</h6>
              <Form.Item name="sslModel" label={<span>SSL Models</span>}>
                <Select placeholder="Select SSL Model" className="w-100 h-100">
                  <Option value="tls">TLS</Option>
                  <Option value="ssl">SSL</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="sshTunnelMethod"
                label={<span>SSL Tunnel Method</span>}>
                <Select
                  placeholder="Select SSH Tunnel Method"
                  className="w-100 h-100">
                  <Option value="password">Password Authentication</Option>
                  <Option value="key">Key-Based Authentication</Option>
                </Select>
              </Form.Item>
            </Card>

            {queryType === "destination" && (
              <Card className="sql-card">
                <Form.Item
                  name="customMod"
                  label={<span>Transformation Type</span>}
                  rules={[
                    {
                      required: true,
                      message: "Please Select Transformation Type",
                    },
                  ]}>
                  <Radio.Group>
                    <Radio value="False">Default Transformation</Radio>
                    <Radio value="True">Custom Transformation</Radio>
                  </Radio.Group>
                </Form.Item>
              </Card>
            )}

            <Card className="sql-card">
              <h6 className="fw-bold">Advanced</h6>
              <Form.Item
                name="updateMethod"
                label={<span>Update Method</span>}
                className="fw-bold mt-3">
                <Radio.Group
                  name="updateMethod"
                  defaultValue={1}
                  className="radio-group mt-3">
                  <Radio value={1} className="radio-button w-100">
                    <span className="radio-heading">
                      Read Changes using Write-Ahead Log (CDC)
                    </span>
                    <br />
                    <span className="radio-text w-100">
                      Incrementally reads new inserts, updates, and deletes
                      using the Postgres write-ahead log (WAL). This needs to be
                      configured on the source database itself. Recommended for
                      tables of any size.
                    </span>
                  </Radio>
                  <Radio value={2} className="radio-button w-100">
                    <span className="radio-heading">
                      Detect Changes with Xmin System Column
                    </span>
                    <br />
                    <span className="radio-text">
                      Incrementally reads new inserts and updates via Postgres
                      Xmin system column. Suitable for databases that have low
                      transaction pressure.
                    </span>
                  </Radio>
                  <Radio value={3} className="radio-button">
                    <span className="radio-heading">
                      Scan Changes with User Defined Cursor
                    </span>
                    <br />
                    <span className="radio-text">
                      Incrementally detects new inserts and updates using the
                      cursor column chosen when configuring a connection (e.g.,
                      created_at, updated_at).
                    </span>
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Card>
            <Card className="ip-card">
              <div className="fw-bold my-3 fs-6">
                Please allow inbound traffic from the following Airbyte IPs in
                your firewall whether connecting directly or via SSH Tunnel:
              </div>
              <Form.Item name="ipAddresses">
                <Input
                  placeholder="Mindgraph IP addresses"
                  style={{
                    height: "50px",
                  }}
                />
              </Form.Item>
            </Card>
            <Form.Item>
              <Button
                className="w-100 sql-btn"
                htmlType="submit"
                loading={loading}>
                Setup Source
              </Button>
            </Form.Item>
          </Col>
          <Col span={12} style={{ marginTop: "42px" }}>
            <Card style={{ border: "none" }}>
              <img src={Sqlsetup} alt="" />
            </Card>
          </Col>
        </Row>
      </Form>
      {/* Modal for Form Submission */}
      <div className="ant-Modal">
        <Modal
          title={
            <div>
              <h6 className="fw-bold">Create a new source</h6>
              <Breadcrumb>
                <Breadcrumb.Item>Create a new source</Breadcrumb.Item>
                <Breadcrumb.Item>Source</Breadcrumb.Item>
                <Breadcrumb.Item>New Source</Breadcrumb.Item>
                <Breadcrumb.Item>Table</Breadcrumb.Item>
              </Breadcrumb>
            </div>
          }
          open={modalVisible}
          onCancel={handleModalCancel}
          footer={null}
          centered
          width={670}>
          <div
            className="d-flex flex-column justify-content-between"
            style={{ height: "270px" }}>
            <div className="d-flex justify-content-between">
              <div
                className="d-flex justify-content-between align-items-center p-3 bg-white border rounded-lg"
                style={{
                  cursor: "pointer",
                  width: "300px",
                  height: "50px",
                }}
                onClick={handleShowTable}>
                <div className="d-flex align-items-center gap-2 ">
                  <img src={Table} alt="" width={20} height={20} />
                  <p>Table</p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <p>4</p>
                  <RightOutlined />
                </div>
              </div>
              {showTable && (
                <div
                  className="d-flex flex-column justify-content-between h-100 gap-3 p-3 border rounded-lg bg-white"
                  style={{ width: "300px" }}>
                  <Checkbox
                    indeterminate={indeterminate}
                    onChange={onCheckAllChange}
                    checked={checkAll}>
                    Select All
                  </Checkbox>
                  <Checkbox.Group
                    value={checkedSourcesList}
                    options={availableSources}
                    onChange={onChange}
                    className="d-flex flex-column justify-content-between gap-3 h-100"
                  />
                </div>
              )}
            </div>
            {showTable && (
              <Button
                type="primary"
                className="w-100"
                onClick={handleModalOk}
                style={{ backgroundColor: "#576CC4" }}>
                Submit
              </Button>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SqlDashboard;
