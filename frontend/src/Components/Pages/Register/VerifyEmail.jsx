import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { backendApi } from "../../../api/backend";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setMessage("Invalid verification link.");
        setLoading(false);
        return;
      }
      try {
        const response = await backendApi.verifyUser({
          token,
          email,
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
      setLoading(false);
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="verify-container">
      <h2>Email Verification</h2>
      {loading ? (
        <p>Verifying...</p>
      ) : (
        <>
          {" "}
          <p>{message}</p>
          <p>Redirecting you to the login page</p>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
