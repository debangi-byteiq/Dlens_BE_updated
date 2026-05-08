import { lazy, Suspense, useEffect } from "react";
import "./App.css";
import {
  Routes,
  Route,
  BrowserRouter as Router,
} from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { APP_ROUTES, DASHBOARD_ROUTES } from "./config/routes";

const Layout = lazy(() => import("./Components/CommonComponents/Layout/Layout"));
const LandingPage = lazy(() => import("./Components/Pages/LandingPage/LandingPage"));
const Login = lazy(() => import("./Components/Pages/Login/Login"));
const Register = lazy(() => import("./Components/Pages/Register/Register"));
const VerifyEmail = lazy(() => import("./Components/Pages/Register/VerifyEmail"));
const ResetPassword = lazy(() => import("./Components/Pages/Login/ResetPassword"));
const NotFound = lazy(() => import("./Components/Pages/NotFound"));

const pageComponents = {
  Connection: lazy(() => import("./Components/Pages/Connection/Index")),
  Source: lazy(() => import("./Components/Pages/Source/Index")),
  DataShifting: lazy(() => import("./Components/Pages/DataShifting/DatShifting")),
  KDEDashboard: lazy(() => import("./Components/Pages/KDEdashboard/KDEdashboard")),
  DataProfiling: lazy(() => import("./Components/Pages/DataProfiling/DataProfiling")),
  SqlDashboard: lazy(() => import("./Components/Pages/SqlDashboard/Index")),
  PostgresDashboard: lazy(() => import("./Components/Pages/PostgresDashboard/Index")),
  CsvDashboard: lazy(() => import("./Components/Pages/CSVdashboard/CSVDashboard")),
  KafkaDashboard: lazy(() => import("./Components/Pages/KafkaDashboard/Index")),
  RestapiDashboard: lazy(() => import("./Components/Pages/RestapiDashboard/Index")),
};

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
    });
  }, []);

  return (
    <Suspense fallback={null}>
      <Router>
        <Routes>
          <Route path={APP_ROUTES.accountVerify} element={<VerifyEmail />} />
          <Route path={APP_ROUTES.resetPassword} element={<ResetPassword />} />
          <Route path={APP_ROUTES.login} element={<Login />} />
          <Route path={APP_ROUTES.register} element={<Register />} />
          <Route path={APP_ROUTES.home} element={<LandingPage />} />
          <Route element={<Layout />}>
            {DASHBOARD_ROUTES.map(({ path, page }) => {
              const Page = pageComponents[page];
              return <Route key={path} path={path} element={<Page />} />;
            })}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </Suspense>
  );
}

export default App;
