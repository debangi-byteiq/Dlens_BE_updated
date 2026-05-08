import React from "react";
import { Card, Row, Col, Form, Input } from "antd";
import "../Info/Index.css";

const Info = () => {
  const [form] = Form.useForm();

  return (
    <Card>
      <div className="form-container">
        <Form
          className="w-100"
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
        >
          <Row gutter={32}>
            <Col span={12}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#204496",
                  marginBottom: "20px",
                }}
              >
                Diffen Glue Job
              </div>
              <Form.Item label="Source" name="Source1">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
              <Form.Item label="Error log" name="Error log1">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
              <Form.Item label="Table Name" name="Table Name1">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
              <Form.Item label="Error" name="Error1">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#204496",
                  marginBottom: "20px",
                }}
              >
                Extraction Info
              </div>
              <Form.Item label="Source" name="Source2">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
              <Form.Item label="Error log" name="Error log2">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
              <Form.Item label="Table Name" name="Table Name2">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
              <Form.Item label="Error" name="Error2">
                <Input placeholder="0" className="input" readOnly />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Card>
  );
};

export default Info;
