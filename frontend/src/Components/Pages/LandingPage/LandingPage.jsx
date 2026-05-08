import React from "react";
import { Card, Menu } from "antd";
import { Link } from "react-router-dom";
import dashboard from "../../../assets/Images/dashboardImg.png";
import eye from "../../../assets/Images/eye.png";
import target from "../../../assets/Images/target.png";
import dataAnalysis from "../../../assets/Images/data-analysis.png";
import analysis from "../../../assets/Images/approval.gif";
import power from "../../../assets/Images/evolution.gif";
import data from "../../../assets/Images/analytics.gif";
import logo from "../../../assets/Images/MindGraph.svg";
import "./LandingPage.css";
import Carousel from "./Carousel.jsx";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();
  const handleLoginClick = () => {
    navigate("/Connections");
  };
  const handleRegisterClick = () => {
    navigate("/Register");
  };
  return (
    <div className="landing-page">
      <div className="navbar">
        <Menu mode="horizontal" className="menu">
          <img className="MGlogo" src={logo} alt="Logo" />
          <div className="auth-links">
            <div>
              <Menu.Item key="/Connections">
                <a
                  // href="/Login"
                  className="nav-link"
                  style={{
                    // transition: "color 0.3s ease",
                    fontSize: "18px",
                    textDecoration: "underline",
                  }} // Added transition
                  // onMouseEnter={(e) => (e.target.style.color = "orange")}
                  // onMouseLeave={(e) => (e.target.style.color = "white")}
                  onClick={handleLoginClick}>
                  Connections
                </a>
              </Menu.Item>
            </div>
            {/* <div className="divider"></div> */}
            <div>
              {/* <Menu.Item key="/Register">
                <a
                  // href="/Register"
                  className="nav-link"
                  style={{
                    transition: "color 0.3s ease",
                    fontSize: "18px",
                    textDecoration: "underline",
                  }} // Added transition
                  onMouseEnter={(e) => (e.target.style.color = "orange")}
                  onMouseLeave={(e) => (e.target.style.color = "white")}
                  onClick={handleRegisterClick}>
                  Register
                </a>
              </Menu.Item> */}
            </div>
          </div>
        </Menu>
      </div>
      {/* Header Section */}
      <div
        className="header-section"
        data-aos="fade-up"
        data-aos-anchor-placement="fade-up">
        <div className="header-text">
          <h1>DLens: Illuminate Your Data Landscape</h1>
          <p>
            Ensure Data Quality, Drive Insights, and Empower Your Business
            Initiatives. Effortlessly analyze and adapt to trends, empowering
            your business with data-driven decisions. With our intuitive
            dashboards, making informed choices has never been simpler or more
            effective.
          </p>
        </div>
        <Card className="header-card">
          {/* <img src={dashboard} alt="Dashboard Preview" /> */}
          <motion.img
            src={dashboard}
            alt="Dashboard Preview"
            style={{ height: "300px" }}
            initial={{ opacity: 0, y: 200 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </Card>
      </div>
      {/* Key Highlights */}
      <div className="key-highlights">
        <div className="highlight-item">
          <img src={analysis} alt="Trust" />
          <p>Get Data You Can Trust</p>
        </div>
        <div className="highlight-item">
          <img src={power} alt="Power" />
          <p>Unlock the power of your Data</p>
        </div>
        <div className="highlight-item">
          <img src={data} alt="Data Management" />
          <p>Streamline Data Management</p>
        </div>
      </div>
      {/*About DLens*/}
      {/* <div
        className="about"
        data-aos="fade-up"
        data-aos-anchor-placement="fade-up"
      >
        <h2 style={{ textAlign: "center", color: "white" }}>About</h2>
        <div className="about-content">
          <Carousel />
          <p>
            DLens is a proprietary product which leverages the power of
            mathematical models, story-telling, research and innovation to
            evaluate datasets from a variety of sources Cloud as well as On-Prem
            with an objective to let all key stakeholders know and feel their
            data; it's a product which would revolutionize the data stewardship,
            management and analytics value generation from the data assets of
            the organization. It is packed with 7 different features catering to
            specific audiences of data who have a big stake in the monetization
            aspect of it.
          </p>
        </div>
      </div> */}
      <div
        class="about-section"
        data-aos="fade-up"
        data-aos-anchor-placement="fade-up">
        <div class="container">
          <div class="row">
            <div class="content-column col-lg-6 col-md-12 col-sm-12 order-2">
              <div class="inner-column">
                <div class="sec-title">
                  <span class="title">About DLens</span>
                </div>
                <div class="text">
                  DLens is a proprietary product which leverages the power of
                  mathematical models, story-telling, research and innovation to
                  evaluate datasets from a variety of sources Cloud as well as
                  On-Prem with an objective to let all key stakeholders know and
                  feel their data; it's a product which would revolutionize the
                  data stewardship, management and analytics value generation
                  from the data assets of the organization. It is packed with 7
                  different features catering to specific audiences of data who
                  have a big stake in the monetization aspect of it.
                </div>
              </div>
            </div>

            <div class="image-column col-lg-6 col-md-12 col-sm-12">
              <div class="inner-column wow fadeInLeft">
                {/* <div class="author-desc">
                  <h2>ABOUT US</h2>
                </div> */}
                <figure class="image-1">
                  <a class="lightbox-image" data-fancybox="images">
                    <img
                      src={dashboard}
                      // title="Rahul Kumar Yadav"
                      // src="https://i.ibb.co/QP6Nmpf/image-1-about.jpg"
                      // alt=""
                    />
                  </a>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Key Features */}
      <div
        className="key-features"
        data-aos="fade-up"
        data-aos-anchor-placement="fade-up">
        <h2>Key Features</h2>
        <div className="profiling-content">
          <Card className="profiling-card">
            <img src={eye} />
            <h4>Data Profiling</h4>
            <p>
              Gain a comprehensive view of your datasets with detailed
              profiling. Our solution helps you analyze data elements, detect
              duplicates, and extract key statistics like mean, median, and
              standard deviation. Understand the structure of categorical,
              numerical, and date-based columns for smarter decision-making.
            </p>
          </Card>
          <Card className="profiling-card">
            <img src={dataAnalysis} />
            <h4>Data Shift Analysis</h4>
            <p>
              Stay ahead of the competition by identifying shifts in data
              patterns over time. Our proprietary Data Shift Indexation
              quantifies how new data differs from historical trends, giving you
              insights into Macro and Micro Shifts across numerical and
              categorical fields. Detect market shifts early and adjust your
              strategy accordingly.
            </p>
          </Card>
          <Card className="profiling-card">
            <img src={target} />
            <h4>KDE - Key Data Elements</h4>
            <p>
              Evaluate key data elements across completeness, format
              consistency, and domain accuracy. Our robust scoring methodology
              helps you assess data reliability at both field and tuple levels,
              ensuring precision in every dataset you analyze.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
