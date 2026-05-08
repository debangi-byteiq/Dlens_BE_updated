import React from "react";
import { Layout as MainLayout } from "antd";
import { Outlet } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import "./Index.css";

const { Content } = MainLayout;

const Layout = () => {
  return (
    <div className="content-container">
      <MainLayout className="ant-layout">
        <Header />
        <MainLayout hasSider>
          <Sidebar />
          <Content className="content">
            <Outlet />
          </Content>
        </MainLayout>
      </MainLayout>
    </div>
  );
};

export default Layout;
