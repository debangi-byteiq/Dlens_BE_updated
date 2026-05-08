import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Form, Input, Button } from "antd";
import { backendApi } from "../../../api/backend";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const onFinish = async (values) => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const password = values.password;

    if (!token || !email) {
      setMessage("Invalid verification link.");
      return;
    }
    try {
      const response = await backendApi.resetPassword({
        token,
        email,
        password,
      });
      if (response.status === 200) {
        setMessage(response.data.message);
        setTimeout(() => navigate("/Login"), 3000);
      } else {
        setMessage("Invalid verification link.");
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || "Verification failed.");
      } else {
        setMessage("Network error. Please try again later.");
      }
    }
  };

  return (
    <div
      style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Reset Password</h2>
      {message && <p>{message}</p>}
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="New Password"
          name="password"
          rules={[
            { required: true, message: "Please enter your new password!" },
            { min: 6, message: "Password must be at least 6 characters!" },
          ]}>
          <Input.Password placeholder="Enter new password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Reset Password
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ResetPassword;
