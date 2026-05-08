import "./Index.css";
import { Layout as MainLayout, Tooltip } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  Button1,
  Button6,
  Button7,
  KDEIcon,
} from "../../../assets/sidebarIcons";

const { Sider } = MainLayout;

const navItems = [
  {
    link: "/Connections",
    icons: <Button1 />,
    tooltip: "Connections",
  },
  {
    link: "/DataProfiling",
    icons: <Button6 />,
    tooltip: "Data Profiling",
  },
  {
    link: "/DataShifting",
    icons: <Button7 />,
    tooltip: "Data Shifting",
  },
  {
    link: "/KDEDashboard",
    icons: <KDEIcon />,
    tooltip: "KDE Dashboard",
  },
];

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sider width={70} trigger={null} className="sidebar-antd">
      <div className="d-flex flex-column pt-5 align-item-center">
        <ul className="nav-ul">
          {navItems.map((item) => (
            <Tooltip key={item.link} title={item.tooltip} placement="right">
              <Link to={item.link}>
                <li
                  className={
                    currentPath === item.link
                      ? "nav-ul-item active"
                      : "nav-ul-item"
                  }>
                  <div className="sidebar-items">
                    <span className="icon">{item.icons}</span>
                  </div>
                </li>
              </Link>
            </Tooltip>
          ))}
        </ul>
      </div>
    </Sider>
  );
};

export default Sidebar;
