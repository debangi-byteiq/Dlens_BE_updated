import React, { useState } from "react";
import dashboard from "../../../assets/Images/dashboardImg.png";
import kde from "../../../assets/Images/kdeScore.png";
import profiling from "../../../assets/Images/profiling.png";

const images = [dashboard, kde, profiling];

function Carousel() {
  const [current, setCurrent] = useState(0);

  function nextSlide() {
    setCurrent(current === images.length - 1 ? 0 : current + 1);
  }

  function prevSlide() {
    setCurrent(current === 0 ? images.length - 1 : current - 1);
  }
  return (
    <div
      className="slider-container"
      style={{
        display: "flex",
        justifyContent: "center",
        // padding: "20px",
        alignItems: "center",
        height: "100vh",
      }}>
      <div
        className="left-arrow-button"
        onClick={prevSlide}
        style={{
          cursor: "pointer",
        }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="#fff"
          className="arrow-icon"
          style={{ width: "1.5rem", height: "1.5rem" }}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </div>
      {images.map(
        (image, index) =>
          current === index && (
            <div
              key={image}
              className="slide-content"
              style={{
                display: "flex",
                justifyContent: "center",
                borderRadius: "0.6rem",
                // background:
                //   "linear-gradient(to right, rgb(174, 106, 4), rgb(178, 69, 7))",
              }}>
              <img
                className="slide-image"
                src={image}
                alt="images"
                style={{
                  width: "80%",
                  padding: "16px 0",
                }}
              />
            </div>
          )
      )}
      <div
        className="right-arrow-button"
        onClick={nextSlide}
        style={{
          cursor: "pointer",
        }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="#fff"
          className="arrow-icon"
          style={{ width: "1.5rem", height: "1.5rem" }}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </div>
    </div>
  );
}

export default Carousel;
