import { useState } from "react";
import {
  Upload,
  Input,
  Button,
  message,
  Form,
  Card,
  Tooltip,
} from "antd";
import { UploadOutlined, LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { backendApi } from "../../../api/backend";
import { setSourceId } from "../../../Redux/Features/ConnectionSlice";
import { useDispatch } from "react-redux";
import { InfoOutlined } from "@ant-design/icons";

const CsvDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [datecol, setDateCol] = useState("");
  const [baseMonths, setBaseMonths] = useState("");
  const [incMonths, setIncMonths] = useState("");
  const [error, setError] = useState("");
  const tooltipText = `
  1. Upload your CSV file by clicking the upload button.
  2. Provide the required inputs:
     - Date column name
     - Base duration in days
     - Incremental duration in days
  3. Click "Submit" to process the data. The system will analyze the data based on the provided parameters.
  Notes:
  - Ensure all input fields are filled accurately to avoid errors.
  - The date column should follow a consistent format (e.g., YYYY-MM-DD).
`;

  const validateCSV = (file) => {
    return file.type === "text/csv" || file.name?.toLowerCase().endsWith(".csv");
  };

  const handleFileChange = (info) => {
    const file = info.fileList[0]?.originFileObj || null;
    if (file && validateCSV(file)) {
      setCsvFile(file);
      setCsvFileName(file?.name);
      setError("");
    } else {
      setCsvFile(null);
      setError("Only CSV files are allowed.");
    }
  };

  const handleSubmit = async () => {
    if (!csvFile) {
      setError("All fields are mandatory, including the CSV file.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("datecol", datecol);
      formData.append("base_months", baseMonths);
      formData.append("inc_months", incMonths);

      const response = await backendApi.uploadCsv(formData);

      if (response.data && !response.data.error) {
        message.success(response.data.message);
        if (response.data.id) {
          dispatch(setSourceId(response.data.id));
        }
        navigate("/Connections");
      } else {
        message.error(response.data?.error || response.data?.message);
      }
    } catch (e) {
      console.log(e, "csv error");
      message.error("There was an error uploading the file.");
    }

    setError("");
  };
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="body">
      <div className="back-btn" onClick={handleBackClick}>
        <LeftOutlined />
        <p className="mx-2 sql-text">Back</p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
        <h3 style={{ margin: "10px" }}>Upload CSV File</h3>
        <Tooltip title={tooltipText}>
          <Button
            style={{
              borderRadius: "50%",
            }}
            icon={<InfoOutlined style={{ fontSize: "14px" }} />}
          />
        </Tooltip>
      </div>
      <Form layout="vertical" onFinish={handleSubmit}>
        <Card
          style={{
            width: "100%",
            marginBottom: "20px",
          }}>
          <p style={{ fontSize: "10px" }}>
            <li style={{ listStyle: "inside" }}>
              Upload a CSV file containing your data for processing.
            </li>
            <li style={{ listStyle: "inside" }}>
              Ensure the file is formatted correctly with headers for all
              columns.
            </li>
          </p>
          <Form.Item
            style={{ marginTop: "10px" }}
            label={<span>Select CSV File *</span>}
            required
            help={error && !csvFile ? error : ""}>
            <Upload
              accept=".csv"
              beforeUpload={() => false}
              onChange={handleFileChange}
              showUploadList={false}>
              <Button
                style={{
                  outline: "none",
                  border: "1px solid #71B5FF",
                  boxShadow: "0 0 1px #71B5FF",
                  color: "black", // Default text color
                  // transition: "color 0.3s ease", // Smooth transition effect
                }}
                onMouseEnter={(e) => (e.target.style.color = "#71B5FF")}
                onMouseLeave={(e) => (e.target.style.color = "black")}
                icon={<UploadOutlined />}>
                Click to Upload
              </Button>
            </Upload>
            <p>{csvFileName}</p>
          </Form.Item>
        </Card>
        <Card
          style={{
            width: "100%",
            marginBottom: "20px",
          }}>
          <h2 style={{ fontSize: "17px", padding: "20px 0 5px 0" }}>
            Additional set up for processing
          </h2>
          <p style={{ fontSize: "10px" }}>
            <li style={{ listStyle: "inside" }}>
              Specify the name of the column containing date values.
            </li>
            <li style={{ listStyle: "inside" }}>
              This column will be used as a reference for creating time-based
              windows for analysis.
            </li>
          </p>
          <Form.Item
            style={{ marginTop: "10px" }}
            label={<span>Date Column</span>}
            //   required
            help={error && !datecol ? "Please enter a Date Column" : ""}>
            <Input
              value={datecol}
              onChange={(e) => setDateCol(e.target.value)}
              placeholder="Enter Date Column"
              style={{
                outline: "none",
                border: "1px solid #71B5FF",
                boxShadow: "0 0 1px #71B5FF",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 5px #71B5FF")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </Form.Item>
          <p style={{ fontSize: "10px" }}>
            <li style={{ listStyle: "inside" }}>
              Define the number of days for the primary analysis window.
            </li>
            <li style={{ listStyle: "inside" }}>
              This duration sets the baseline for data comparisons.
            </li>
          </p>
          <Form.Item
            style={{ marginTop: "10px" }}
            label={<span>Base duration in (Days)</span>}
            //   required
            help={error && !baseMonths ? "Please enter Base Months" : ""}>
            <Input
              value={baseMonths}
              onChange={(e) => setBaseMonths(e.target.value)}
              placeholder="Enter Base Months"
              style={{
                outline: "none",
                border: "1px solid #71B5FF",
                boxShadow: "0 0 1px #71B5FF",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 5px #71B5FF")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </Form.Item>
          <p style={{ fontSize: "10px" }}>
            <li style={{ listStyle: "inside" }}>
              Specify the duration for incremental comparison windows.
            </li>
            <li style={{ listStyle: "inside" }}>
              This period helps identify changes relative to the base duration.
            </li>
          </p>
          <Form.Item
            style={{ marginTop: "10px" }}
            label={<span>Incremental duration in (days)</span>}
            //   required
            help={error && !incMonths ? "Please enter Incremental Months" : ""}>
            <Input
              value={incMonths}
              onChange={(e) => setIncMonths(e?.target?.value)}
              placeholder="Enter Incremental Months"
              style={{
                outline: "none",
                border: "1px solid #71B5FF",
                boxShadow: "0 0 1px #71B5FF",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 5px #71B5FF")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </Form.Item>
        </Card>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* <div style={{ marginTop: "40px" }}>
          <Title level={4}>How It Works:</Title>
          <ol style={{ listStyleType: "decimal" }}>
            <li>Upload your CSV file by clicking the upload button.</li>
            <li>
              Provide the required inputs:
              <ul>
                <li>Date column name</li>
                <li>Base duration in days</li>
                <li>Incremental duration in days</li>
              </ul>
            </li>
            <li>
              Click <strong>"Submit"</strong> to process the data. The system
              will analyze the data based on the provided parameters and prepare
              it for further insights.
            </li>
          </ol>

          <Title level={4}>Notes:</Title>
          <ul>
            <li>
              Ensure all input fields are filled accurately to avoid processing
              errors.
            </li>
            <li>
              The date column should follow a consistent date format (e.g.,
              <strong> YYYY-MM-DD</strong>).
            </li>
          </ul>
        </div> */}
        <Form.Item
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{ backgroundColor: "#576CC4" }}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CsvDashboard;
