import Sql from "../assets/Images/Sources/Sql.svg";
import Redis from "../assets/Images/Sources/Redis.svg";
import Rabit from "../assets/Images/Sources/Rabit.svg";
import Excel from "../assets/Images/Sources/Excel.svg";
import Amazon from "../assets/Images/Sources/Amazon.svg";
import Azure from "../assets/Images/Sources/Azure.svg";
import Datalake from "../assets/Images/Sources/Datalake.svg";
import Csv from "../assets/Images/Sources/Csv.svg";
import Oracle from "../assets/Images/Sources/Oracle.svg";
import Googledrive from "../assets/Images/Sources/googledrive.svg";
import Restapi from "../assets/Images/Sources/restapi.svg";
import Snowflake from "../assets/Images/Sources/snowflake.svg";
import Zapier from "../assets/Images/Sources/Zapier.svg";
import ActiveMQ from "../assets/Images/Sources/ActiveMQ.svg";
import Graphql from "../assets/Images/Sources/graphql.svg";
import Prostgres from "../assets/Images/Sources/Prostgres.svg";
import Mongo from "../assets/Images/Sources/Mongo.svg";
import Kafka from "../assets/Images/Sources/kafka.svg";
import { APP_ROUTES } from "./routes";

const sourceRoute = (route) => `${route}?type=source`;

// The backend currently implements CSV upload and relational sources only.
// Keep this flag explicit so future connectors are visible but cannot launch.
export const CONNECTOR_GROUPS = [
  {
    id: 1,
    title: "Suggested Sources",
    items: [
      {
        image: Sql,
        text: "MySQL",
        route: sourceRoute(APP_ROUTES.sqlDashboard),
        supported: true,
      },
      {
        image: Prostgres,
        text: "Postgres",
        route: sourceRoute(APP_ROUTES.postgresDashboard),
        supported: true,
      },
      {
        image: Excel,
        text: "CSV",
        route: sourceRoute(APP_ROUTES.csvDashboard),
        supported: true,
      },
    ],
  },
  {
    id: 2,
    title: "Database",
    items: [
      { image: Oracle, text: "Oracle", route: "/oracle" },
      {
        image: Sql,
        text: "MySQL",
        route: sourceRoute(APP_ROUTES.sqlDashboard),
        supported: true,
      },
      { image: Mongo, text: "Mongo DB", route: "/mongo-db" },
      {
        image: Prostgres,
        text: "Postgres",
        route: sourceRoute(APP_ROUTES.postgresDashboard),
        supported: true,
      },
      { image: Zapier, text: "Zapier", route: "/zapier" },
      { image: Datalake, text: "DataWarehouse", route: "/datawarehouse" },
      { image: Snowflake, text: "SnowFlake", route: "/snowflake" },
    ],
  },
  {
    id: 3,
    title: "APIs",
    items: [
      { image: Googledrive, text: "Google Drive", route: "/google-drive" },
      {
        image: Restapi,
        text: "Rest API",
        route: sourceRoute(APP_ROUTES.restApiDashboard),
      },
      { image: Graphql, text: "GraphQL", route: "/graphql" },
      { image: Azure, text: "Azure", route: "/azure" },
    ],
  },
  {
    id: 4,
    title: "Files (CSV, Excel)",
    items: [
      { image: Excel, text: "Excel", route: APP_ROUTES.excelUpload },
      {
        image: Csv,
        text: "CSV",
        route: APP_ROUTES.csvUpload,
        supported: true,
      },
    ],
  },
  {
    id: 5,
    title: "Message Queue",
    items: [
      { image: Rabit, text: "Rabbit MQ", route: "/rabbit-mq" },
      { image: Amazon, text: "Amazon", route: "/amazon" },
      { image: ActiveMQ, text: "Active MQ", route: "/active-mq" },
      { image: Redis, text: "Redis Streams", route: "/redis-streams" },
      {
        image: Kafka,
        text: "Kafka",
        route: sourceRoute(APP_ROUTES.kafkaDashboard),
      },
    ],
  },
];

export const AVAILABLE_CONNECTOR_COUNT = CONNECTOR_GROUPS.reduce(
  (count, group) => count + group.items.filter((item) => item.supported).length,
  0
);
