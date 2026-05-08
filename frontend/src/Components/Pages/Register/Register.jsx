import { Form, Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { backendApi } from "../../../api/backend";
import "./Register.css";

const Register = () => {
  const onFinish = async (values) => {
    const payload = {
      name: values.fullName,
      email: values.email,
      password: values.password,
    };
    try {
      await backendApi.registerUser(payload);
      alert("Activation Link sent to mail");
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };
  const onFinishFailed = (errorInfo) => {
    console.error("Registration form validation failed:", errorInfo);
  };
  const navigate = useNavigate();
  const handleLoginClick = () => {
    navigate("/Login");
  };
  const handleButtonClick = () => {
    navigate("/Home");
  };

  return (
    <div
      className="register-body"
      style={{
        fontFamily: "sans-serif",
        margin: 0,

        // background:
        //   "linear-gradient(to right,rgb(174, 106, 4),rgb(178, 69, 7))",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}>
      <div
        className="register-box"
        style={{
          display: "flex",
          width: "800px",
          height: "80vh",
          backgroundColor: "white",
          borderRadius: "8px",
          // boxShadow: "0 4px 8px rgba(225, 213, 213, 0.1)",
          boxShadow:
            "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
          overflow: "hidden",
        }}>
        <div
          style={{
            backgroundColor: "rgb(8, 7, 56)",
            color: "white",
            padding: "40px",
            width: "50%",
            alignContent: "center",
          }}>
          <h1 style={{ fontSize: "2em", textAlign: "center", color: "#fff" }}>
            Unlock the True Potential of Your Data with Advanced Insights
          </h1>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "35px",
            }}>
            <Button
              type="primary"
              style={{
                backgroundColor: "rgb(222, 222, 225)",
                border: "none",
                color: "black",
              }}
              onClick={handleButtonClick}>
              Home
            </Button>
          </div>
        </div>
        <div style={{ padding: "40px", width: "50%" }}>
          <h2
            style={{
              fontSize: "2em",
              marginBottom: "30px",
              textAlign: "center",
              color: "rgb(6, 4, 39)",
            }}>
            Sign In
          </h2>
          <Form
            name="basic"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off">
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[
                { required: true, message: "Please input your full name!" },
              ]}>
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}>
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Verify Password"
              name="verifyPassword"
              rules={[
                { required: true, message: "Please confirm your password!" },
              ]}>
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  width: "100%",
                  backgroundColor: "rgb(8, 7, 56)",
                  color: "white",
                }}>
                REGISTER
              </Button>
            </Form.Item>
          </Form>
          <p style={{ textAlign: "center", marginTop: "20px", color: "black" }}>
            Already have an account?
            <button
              style={{
                color: "rgb(8, 7, 56)",
                border: "none",
                background: "transparent",
                padding: 0,
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={handleLoginClick}>
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
