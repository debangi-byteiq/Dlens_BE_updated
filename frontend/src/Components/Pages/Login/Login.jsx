import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";
import CryptoJS from "crypto-js";
import { backendApi } from "../../../api/backend";
import { APP_ROUTES } from "../../../config/routes";

const Login = () => {
  const navigate = useNavigate();
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const key = "AccessTheToken";
  const onSubmit = async (values) => {
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("password", values.password);
    try {
      const response = await backendApi.login(formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        var access_token = CryptoJS.AES.encrypt(
          response.data.access_token,
          key
        ).toString();
        var refresh_token = CryptoJS.AES.encrypt(
          response.data.refresh_token,
          key
        ).toString();
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        window.location.href = "/Connections";
      } else {
        message.error("User does not exist, please register");
      }
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Invalid username or password!");
    }
  };
  const toggleForm = () => {
    setIsForgotPassword(!isForgotPassword);
  };
  const forgotPassword = async (values) => {
    try {
      await backendApi.forgotPassword(
        {
          email: values.email,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      message.success("Password reset email sent if the account exists.");
    } catch (err) {
      console.error("Forgot password request failed:", err);
    }
  };
  const onFinishFailed = () => {
    message.error("Please fill in all required fields.");
  };

  const handleRegisterClick = () => {
    navigate(APP_ROUTES.register);
  };

  const handleButtonClick = () => {
    navigate(APP_ROUTES.home);
  };

  return (
    <div
      className="login-body"
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
        className="login-box"
        style={{
          display: "flex",
          width: "800px",
          height: "70vh",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow:
            "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
          // overflow: "hidden",
        }}>
        <div
          style={{
            backgroundColor: "rgb(8, 7, 56)",
            // backgroundColor: "#4E88AD",
            color: "white",
            padding: "40px",
            width: "50%",
            alignContent: "center",
          }}>
          <h1 style={{ fontSize: "2em", color: "white", textAlign: "center" }}>
            Welcome Back!
          </h1>
          <h1 style={{ fontSize: "1em", color: "white", textAlign: "center" }}>
            Transform Raw Data into Meaningful Intelligence.
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
        {!isForgotPassword ? (
          <div style={{ padding: "40px", width: "50%" }}>
            <h2
              style={{
                fontSize: "2em",
                marginBottom: "30px",
                textAlign: "center",
                color: "rgb(6, 4, 39)",
              }}>
              Login
            </h2>
            <Form
              Form
              layout="vertical"
              name="basic"
              initialValues={{ remember: true }}
              onFinish={onSubmit}
              onFinishFailed={onFinishFailed}
              autoComplete="off">
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: "Please input your username!" },
                ]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}>
                <Input.Password />
              </Form.Item>
              <p
                type="secondary"
                style={{ cursor: "pointer" }}
                onClick={toggleForm}>
                Forgot Password?
              </p>
              <Form.Item>
                <Button
                  // onClick={onSubmit}
                  type="primary"
                  htmlType="submit"
                  style={{
                    width: "100%",
                    backgroundColor: "rgb(8, 7, 56)",
                    color: "white",
                  }}>
                  Login
                </Button>
              </Form.Item>
            </Form>
            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
                color: "black",
              }}>
              Don&apos;t have an account?
              <button
                style={{
                  color: "rgb(13, 5, 36)",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
                onClick={handleRegisterClick}>
                Register
              </button>
            </p>
          </div>
        ) : (
          <div style={{ padding: "40px", width: "50%" }}>
            {" "}
            <Form layout="vertical" onFinish={forgotPassword}>
              <Form.Item
                label="Enter your email"
                name="email"
                rules={[
                  { required: true, message: "Please enter your email!" },
                  { type: "email", message: "Enter a valid email!" },
                ]}>
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Send Reset Link
                </Button>
              </Form.Item>
              <p
                type="secondary"
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  textAlign: "center",
                }}
                onClick={toggleForm}>
                Back to Login
              </p>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
