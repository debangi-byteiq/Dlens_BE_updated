import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Tree,
  Typography,
  Empty,
  Spin,
} from "antd";
import { FileOutlined } from "@ant-design/icons";
import { RefreshCw, Table2, CircleDot } from "lucide-react";
import AceEditor from "react-ace";
import axios from "axios";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";
import "./Index.css";
const { Text } = Typography;

const QueryExecutor = () => {
  const [fetchTablesLoading, setFetchTablesLoading] = useState(false);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [loadLoading, setLoadLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [code, setCode] = useState("");
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]); 
  const [responseMessage, setResponseMessage] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);

  useEffect(() => {
    console.log(code, "code");
  }, [code]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setFetchTablesLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/diffen/fetch_all_table`
      );
      const tables = response.data.tables;
      const newTreeData = await Promise.all(
        tables.map(async (table) => {
          const columns = await fetchTableInfo(table);
          return {
            title: (
              <span>
                <Text style={{ marginLeft: "10px", fontSize: "16px" }}>
                  {table}
                </Text>
              </span>
            ),
            key: table,
            icon: <Table2 size={24} />,
            children: columns,
          };
        })
      );
      setTreeData(newTreeData);
      if (tables.length > 0) {
        setCode(`SELECT * FROM ${tables[0]};`);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setFetchTablesLoading(false);
    }
  };

  const fetchTableInfo = async (tableName) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/diffen/table_info/${tableName}`
      );
      const tableInfo = response.data.table_info;
      return tableInfo.map((column, index) => ({
        title: (
          <span style={{}}>
            <Text
              strong
              style={{
                marginLeft: "6px",
              }}
            >
              {column.column_name}
            </Text>
            : {column.data_type}
          </span>
        ),
        key: `column-${tableName}-${index + 1}`,
        icon: <CircleDot size={18} />,
        isLeaf: true,
      }));
    } catch (error) {
      console.error("Error fetching table info:", error);
      return [];
    }
  };

  const onLoadData = async ({ key, children }) => {
    if (children) {
      return;
    }

    const tableName = key;
    const columns = await fetchTableInfo(tableName);

    setTreeData((prevTreeData) =>
      prevTreeData.map((node) =>
        node.key === key ? { ...node, children: columns } : node
      )
    );
  };

  const onSelect = (selectedKeys, info) => {
    if (info.node.isLeaf) {
      // Column is selected (leaf node), update the query to select the specific column
      const columnName = info.node.title.props.children[0].props.children;
      const tableName = info.node.key.split("-")[1]; // Extract table name from the key
      setCode(`SELECT ${columnName} FROM ${tableName};`);
    } else {
      // Table is selected, update the query to select all from the table
      setCode(`SELECT * FROM ${info.node.title};`);
    }
  };

  const columns = [
    { title: "Column Name", dataIndex: "column_name", key: "column_name" },
    { title: "Data Type", dataIndex: "data_type", key: "data_type" },
  ];

  const executeQuery = async (flag) => {
    try {
      if (flag === "execute") {
        setExecuteLoading(true);
      } else if (flag === "load") {
        setLoadLoading(true);
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/diffen/query_tool`,
        {
          query: code,
          flag: flag,
        }
      );

      if (flag === "load") {
        setResponseMessage(response.data.message);
        setResponseStatus(response.data.status);
        setTableData([]);
        setTableColumns([]);
      } else if (flag === "execute") {
        if (response.data.table === "true") {
          const tableRows = response.data.data;

          if (tableRows.length > 0) {
            const dynamicColumns = Object.keys(tableRows[0]).map((key) => ({
              title: key.charAt(0).toUpperCase() + key.slice(1),
              dataIndex: key,
              key: key,
            }));

            setTableColumns(dynamicColumns);
            setTableData(tableRows);
          } else {
            setTableData([]);
          }
          setResponseMessage("Query executed successfully");
          setResponseStatus("success");
        } else {
          setResponseMessage(response.data.message);
          setResponseStatus("error");
          setTableData([]);
          setTableColumns([]);
        }
      }
    } catch (error) {
      console.error("Error executing query:", error);
      setResponseMessage("An error occurred while executing the query");
      setResponseStatus("error");
      setTableData([]);
      setTableColumns([]);
    } finally {
      if (flag === "execute") {
        setExecuteLoading(false);
      } else if (flag === "load") {
        setLoadLoading(false);
      }
    }
  };

  const renderResponseMessage = () => {
    if (responseMessage) {
      const cardStyle = {
        marginBottom: "16px",
        backgroundColor: responseStatus === "success" ? "#f6ffed" : "#fff1f0",
        border: `1px solid ${
          responseStatus === "success" ? "#b7eb8f" : "#ffa39e"
        }`,
      };

      return (
        <Spin spinning={loadLoading}>
          <Card style={cardStyle}>
            <Text
              strong
              style={{
                color: responseStatus === "success" ? "#52c41a" : "#f5222d",
              }}
            >
              {responseMessage}
            </Text>
          </Card>
        </Spin>
      );
    }
    return null;
  };

  return (
    <div style={{ height: "calc(100vh - 150px)", overflow: "hidden" }}>
      <h2 className="mx-2">QueryExecutor</h2>
      <Row
        gutter={[16, 16]}
        className="mt-4 mx-2 mb-5 py-2"
        style={{ height: "100%", overflow: "hidden" }}
      >
        <Col span={5}>
          <Card
            style={{
              borderRadius: 0,
              height: "calc(91.7vh - 150px)",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h6 className="fw-bold">Tables</h6>
              <RefreshCw
                size={16}
                style={{ cursor: "pointer" }}
                onClick={fetchTables}
                className={fetchTablesLoading ? "loading-spin" : ""} // Add a CSS class for spinning effect
              />
            </div>
            {treeData.length <= 0 ? (
              <Empty
                description="No Tables Found"
                style={{ marginTop: "50%" }}
              />
            ) : (
              <Tree
                showIcon
                onSelect={onSelect}
                treeData={treeData}
                loadData={onLoadData}
              />
            )}
          </Card>
        </Col>
        <Col span={19} style={{ height: "91.7%" }}>
          <Row
            gutter={16}
            style={{ display: "flex", gap: "10px", height: "100%" }}
          >
            <Col span={24} style={{ height: "30%" }}>
              <div style={{ position: "relative", height: "100%" }}>
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 5,
                    zIndex: 1,
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <Button
                    type="default"
                    onClick={() => executeQuery("load")}
                    loading={loadLoading}
                  >
                    Load
                  </Button>
                  <Button
                    style={{ backgroundColor: "#204496", color: "white" }}
                    onClick={() => executeQuery("execute")}
                    loading={executeLoading}
                  >
                    Execute
                  </Button>
                </div>

                <AceEditor
                  height="100%"
                  width="100%"
                  value={code}
                  onChange={(value) => setCode(value)}
                  mode="mysql"
                  theme="tomorrow"
                  fontSize="16px"
                  highlightActiveLine={true}
                  setOptions={{
                    enableLiveAutocompletion: true,
                    showLineNumbers: true,
                    tabSize: 2,
                    enableBasicAutocompletion: true,
                  }}
                />
              </div>
            </Col>
            <Col span={24} style={{ height: "70%" }}>
              <Card
                style={{ borderRadius: 0, height: "100%", overflow: "auto" }}
              >
                {renderResponseMessage()}
                <Spin spinning={executeLoading}>
                  {tableData.length > 0 ? (
                    <Table
                      style={{ height: "50%", overflow: "auto" }}
                      size="small"
                      columns={tableColumns}
                      dataSource={tableData}
                      pagination={false}
                      scroll={{ x: 500 }}
                    />
                  ) : (
                    <Empty
                      style={{ marginTop: "10%" }}
                      description="No Data Found"
                    />
                  )}
                </Spin>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default QueryExecutor;
