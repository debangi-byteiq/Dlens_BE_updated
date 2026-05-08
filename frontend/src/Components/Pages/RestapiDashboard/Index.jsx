import React, { useState } from "react";
import "./Index.css";
import {
  Row,
  Col,
  Card,
  Checkbox,
  Form,
  Input,
  Radio,
  Button,
  Select,
  Breadcrumb,
  message,
} from "antd";
import Apisetup from "../../../assets/Images/RestAPISetup.svg";
import API from "../../../assets/Images/Api.svg";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { setSourceId } from "../../../Redux/Features/ConnectionSlice";
import { useDispatch, useSelector } from "react-redux";
import { backendApi } from "../../../api/backend";
const { Option } = Select;

const RestapiDashboard = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const sourceId = useSelector((state) => state.connection.sourceId);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const queryParams = new URLSearchParams(location.search);
  const queryType = queryParams.get("type");
  const handleFinish = async (values) => {
    setLoading(true);
    const { image, text } = location.state || {};
    try {
      let response;
      const payload = {
        details: {
          ...values,
          image: image,
          text: text,
        },
      };

      if (queryType === "source") {
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
      //   const destinationPayload = {
      //     source_id: sourceId,
      //     details: {
      //       ...values,
      //       image: image,
      //       text: text,
      //     },
      //   };
      //   response = await axios.post(
      //     `${process.env.REACT_APP_API_URL}/save_destination/`,
      //     destinationPayload
      //   );
      //   dispatch(setSourceId(null));
      // }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="body">
      <h5 className="mx-2 fw-bold">Create an API</h5>
      <Breadcrumb className="mx-2">
        {queryType === "source" ? (
          <Breadcrumb.Item>Source</Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item>Destination</Breadcrumb.Item>
        )}
        <Breadcrumb.Item>New API</Breadcrumb.Item>
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
            <Card>
              <h6 className="fw-bold">Create an API</h6>
              <Form.Item
                name="sourceName"
                label="Source Name"
                rules={[
                  { required: true, message: "Please Enter Source name" },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Source Name" />
              </Form.Item>
              <Form.Item
                name="apiUrl"
                label="API URL"
                rules={[{ required: true, message: "Please Enter URL" }]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="URL" />
              </Form.Item>
              <img src={API} alt="sql" className="right-image" />
            </Card>

            <Card className="sql-card">
              <Form.Item name="username" label="Username">
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item name="password" label="Password">
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
              <Form.Item name="authType" label="Authentication Type">
                <Select
                  placeholder="Select Authentication Type"
                  className="w-100 h-100">
                  <Option value="API Key Authentication">
                    API Key Authentication
                  </Option>
                  <Option value="OAuth 2.0">OAuth 2.0</Option>
                </Select>
              </Form.Item>
            </Card>

            {queryType === "destination" && (
              <Card className="sql-card">
                <Form.Item name="customMod" label="Transformation Type">
                  <Radio.Group defaultValue={"False"}>
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
                label="Update Method"
                className="fw-bold mt-3"
                rules={[
                  {
                    required: true,
                    message: "Please Select any one update method",
                  },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Radio.Group
                  name="updateMethod"
                  defaultValue={1}
                  className="radio-group mt-3">
                  <Radio value={1} className="radio-button w-100">
                    <span className="radio-heading">GET</span>
                    <br />
                    <span className="radio-text">
                      Retrieves data from the server. It is a read-only
                      operation that does not change the state of the resource.
                    </span>
                  </Radio>
                  <Radio value={2} className="radio-button w-100">
                    <span className="radio-heading">PUT</span>
                    <br />
                    <span className="radio-text ">
                      Updates an existing resource on the server. It usually
                      requires the entire resource representation.
                    </span>
                  </Radio>
                  <Radio value={3} className="radio-button w-100">
                    <span className="radio-heading">POST</span>
                    <br />
                    <span className="radio-text">
                      Sends data to the server to create a new resource. It
                      typically changes the state of the resource on the server.
                    </span>
                  </Radio>
                  <Radio value={4} className="radio-button w-100">
                    <span className="radio-heading">DELETE</span>
                    <br />
                    <span className="radio-text">
                      Removes a resource from the server.
                    </span>
                  </Radio>
                  <Radio value={5} className="radio-button w-100">
                    <span className="radio-heading">OPTION</span>
                    <br />
                    <span className="radio-text">
                      Describes the communication options for the target
                      resource. It is used for CORS (Cross-Origin Resource
                      Sharing) and can tell which methods are allowed for a
                      specific resource.
                    </span>
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Card>
            <Form.Item>
              <Button
                className="w-100 sql-btn"
                htmlType="submit"
                loading={loading}>
                Setup API
              </Button>
            </Form.Item>
          </Col>
          <Col span={12}>
            <img src={Apisetup} alt="" />
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default RestapiDashboard;
