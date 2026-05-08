import React, { useState } from "react";
import "./Index.css";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Breadcrumb,
  message,
  Radio,
} from "antd";
import Kafkasetup from "../../../assets/Images/KafkaSetup.svg";
import Kafka from "../../../assets/Images/Sources/kafka.svg";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { setSourceId } from "../../../Redux/Features/ConnectionSlice";
import { useDispatch, useSelector } from "react-redux";
import { backendApi } from "../../../api/backend";

const KafkaDashboard = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const sourceId = useSelector((state) => state.connection.sourceId);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const queryParams = new URLSearchParams(location.search);
  const queryType = queryParams.get("type");
  const handleFinish = async (values) => {
    const { image, text } = location.state || {};
    setLoading(true);
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
      <h5 className="mx-2 fw-bold">Create a Topic</h5>
      <Breadcrumb className="mx-2">
        {queryType === "source" ? (
          <Breadcrumb.Item>Source</Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item>Destination</Breadcrumb.Item>
        )}
        <Breadcrumb.Item>New Topic</Breadcrumb.Item>
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
              <h6 className="fw-bold">Create a Topic</h6>
              <Form.Item
                name="sourceName"
                label="Source Name"
                rules={[
                  { required: true, message: "Please Enter Source name" },
                ]}
                style={{ marginBottom: 0, marginTop: 10 }}>
                <Input placeholder="Source Name" />
              </Form.Item>
              <Form.Item name="topicUrl" label="Topic URL">
                <Input placeholder="URL" />
              </Form.Item>
              <img src={Kafka} alt="sql" className="right-image" />
            </Card>

            <Card className="sql-card">
              <Form.Item name="name" label="Name">
                <Input placeholder="Name" />
              </Form.Item>
              <Form.Item
                name="topicName"
                label="Topic Name"
                rules={[{ required: true, message: "Please Enter Topic name" }]}
                style={{ marginBottom: 0, marginTop: 15 }}>
                <Input placeholder="Topic Name" />
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

            <Form.Item>
              <Button
                className="w-100 sql-btn"
                htmlType="submit"
                loading={loading}>
                Setup Topic
              </Button>
            </Form.Item>
          </Col>
          <Col span={12}>
            <img src={Kafkasetup} alt="" />
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default KafkaDashboard;
