import { Col, Row, Card } from "antd";
import React from "react";
import rightIcon from "../../../Assets/Images/right.svg";
import leftIcon from "../../../Assets/Images/left.svg";

const DataQualityCard = ({
  title,
  count,
  height,
  cusFontSize,
  icon,
  width,
}) => {
  return (
    <Card
      style={{
        width: width ? width : "100%",
        boxShadow: "0 2px 4px rgba(127, 194, 214, 0.1)",
        marginBottom: "12px",
        height: height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
      }}>
      <img
        src={icon}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          margin: "6px",
          backgroundColor: "#eff5ff",
          borderRadius: "50%",
          padding: "5px",
          display: "flex",
          alignItems: "end",
        }}
      />
      <div
        style={{
          textAlign: "left",
          paddingTop: "20px", 
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
        }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        <div
          style={{
            fontSize: cusFontSize,
            fontWeight: 600,
            color: icon === "left" ? "rgb(21, 101, 192)" : "rgb(20, 72, 116)",
          }}>
          {count}
        </div>
      </div>

      {/* {icon && (
          <img
            style={{ marginLeft: 16 }}
            src={icon === "left" ? leftIcon : rightIcon}
            alt="rightIcon"
          />
        )} */}

      {/* <img
        src={cardBg}
        alt="cardBg"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 200,
          height: height,
        }}
      /> */}
    </Card>
  );
};

const DataQualityCards = ({ cards, style, isMetaCard }) => {
  return (
    <Row gutter={8} style={style}>
      {cards.map((card, index) =>
        !isMetaCard ? (
          <Col key={index}>
            <DataQualityCard
              title={card.name}
              count={card.count}
              height={card.height}
              width={card.width}
              cusFontSize={card.cusFontSize}
              icon={card.icon}
            />
          </Col>
        ) : (
          <Col xs={24} sm={12} md={8} lg={4} xl={8} key={index}>
            <DataQualityCard
              title={card.name}
              count={card.count}
              height={card.height}
              width={card.width}
              cusFontSize={card.cusFontSize}
              icon={card.icon}
            />
          </Col>
        )
      )}
    </Row>
  );
};

export default DataQualityCards;
