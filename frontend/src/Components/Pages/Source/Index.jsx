import { useState } from "react";
import "./Index.css";
import { Row, Col, Card, Tooltip, message } from "antd";
import { DownOutlined, UpOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addSourceImage,
  clearImages,
} from "../../../Redux/Features/ConnectionSlice";
import {
  AVAILABLE_CONNECTOR_COUNT,
  CONNECTOR_GROUPS,
} from "../../../config/connectors";

const Source = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedCards, setExpandedCards] = useState([]);
  const sourceImages = useSelector((state) => state.connection.sourceImages);

  const handleToggle = (id) => {
    setExpandedCards((prevExpandedCards) =>
      prevExpandedCards.includes(id)
        ? prevExpandedCards.filter((cardId) => cardId !== id)
        : [...prevExpandedCards, id]
    );
  };

  const handleCardClick = (item) => {
    if (!item.supported) {
      message.info(`${item.text} is not wired to the backend yet.`);
      return;
    }

    if (sourceImages.length > 0) {
      dispatch(clearImages());
    }

    dispatch(addSourceImage({ image: item.image, text: item.text }));
    navigate(item.route, {
      state: { image: item.image, text: item.text },
    });
  };

  return (
    <div className="body">
      <h2>Set up a new source</h2>
      <h5 className="my-4 thick-underline">
        Connectors ({AVAILABLE_CONNECTOR_COUNT} available)
      </h5>
      <Row className="px-3 source-card" gutter={[16, 16]}>
        {CONNECTOR_GROUPS.map((card) => (
          <Col key={card.id} span={24}>
            <Card
              className={` ${
                expandedCards.includes(card.id) ? "expanded-card" : ""
              }`}
              style={{
                cursor: "pointer",
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
              }}
              onClick={() => handleToggle(card.id)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p className="source-text">{card.title}</p>
                {expandedCards.includes(card.id) ? (
                  <UpOutlined
                    className="source-image"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggle(card.id);
                    }}
                  />
                ) : (
                  <DownOutlined
                    className="source-image"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggle(card.id);
                    }}
                  />
                )}
              </div>
              {expandedCards.includes(card.id) && (
                <div className="expanded-content">
                  <Row gutter={[16, 16]}>
                    {card.items.map((item) => (
                      <Col key={item.text} span={6}>
                        <Tooltip
                          title={
                            item.supported
                              ? item.text
                              : `${item.text} is not wired to the backend yet`
                          }
                          placement="bottom">
                          <Card
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              maxWidth: "180px",
                              cursor: item.supported ? "pointer" : "not-allowed",
                              opacity: item.supported ? 1 : 0.45,
                            }}
                            onClick={() => handleCardClick(item)}>
                            <img src={item.image} alt={item.text} />
                          </Card>
                        </Tooltip>
                      </Col>
                    ))}
                    <Col span={6}>
                      <Card className="w-50 h-20 dashed-card">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}>
                          <p className="source-text">
                            <PlusOutlined className="source-image" /> New Source
                          </p>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Source;
