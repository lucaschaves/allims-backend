require("dotenv").config();

const express = require("express");
const cors = require("cors");
const reportingApp = express();

const defineAuthRoutes = require("./src/controllers/authController");
const authMiddleware = require("./src/middlewares/authMiddleware");
const startGraphQL = require("./src/config/graphql");
const startJSReport = require("./src/controllers/reportController");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

const openRoutes = express.Router();
app.use("/oapi/v1", openRoutes);

defineAuthRoutes(openRoutes);

const protectedRoutes = express.Router();
app.use("/api/v1", protectedRoutes);

// protectedRoutes.use(authMiddleware);

const serverPort = process.env.PORT || 4000;
const server = app.listen(serverPort, () => {
  console.log(`Server is running on: http://localhost:${serverPort}`);
});

const tryParseJson = async (value, defaultValue) => {
  try {
    if (!defaultValue) defaultValue = value;
    if (!value) return defaultValue;
    return JSON.parse(value);
  } catch (err) {
    return defaultValue;
  }
};

const isNumber = async (text = "") => {
  try {
    for (let i = 0; i < text.length; i++) {
      if (isNaN(Number.parseInt(text[i]))) return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

const loadData = async (pool, sql, params = []) => {
  let data = [];
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    data = res.rows;
  } finally {
    client.release();
  }
  return data;
};

const loadDataWithDynamicQuery = async (
  pool,
  sql = "",
  params = {},
  paramNames = []
) => {
  const config = {
    text: sql,
    values: params
  };
  let data = {};
  try {
    const client = await pool.connect();
    try {
      const named = require("node-postgres-named");
      named.patch(client);

      const res = await client.query(config);
      const rows = res.rows || [];
      data = rows[0] || {};
    } finally {
      client.release();
    }
  } catch (error) {
    const msg = await error.toString();
    data = msg.includes("Missing Parameters")
      ? { params: paramNames }
      : { error: msg };
  }
  return data;
};

const getReportSqlByIdSQL = `
SELECT
    sql,
    params
FROM
    jsreport_lb_query
WHERE
    id_template = $1
`;

const getReportSqlById = async id => {
  let data = {};
  await loadData(pool, getReportSqlByIdSQL, [id]).then((res = []) => {
    data = res[0] || {};
  });
  return data;
};

const getReportSqlByShortIdSQL = `
SELECT
    q.sql,
    q.params
FROM
    "jsreport_TemplateType" AS t
    JOIN jsreport_lb_query as q ON q.id_template = t.id
WHERE
    t.shortid = $1
`;

const getReportSqlByShortId = async shortId => {
  let data = {};
  await loadData(pool, getReportSqlByShortIdSQL, [shortId]).then((res = []) => {
    data = res[0] || {};
  });
  return data;
};

const getReportDataByIdSservice = async (id, params = {}) => {
  params = await tryParseJson(params);
  const query = (await isNumber(id))
    ? await getReportSqlById(id)
    : await getReportSqlByShortId(id);
  if (!query.sql) return null;
  let data = {};
  await loadDataWithDynamicQuery(pool, query.sql, params, query.params).then(
    (res = {}) => {
      data = res;
    }
  );
  return data;
};

const getReportDataById = async (req, res) => {
  console.log(req.params.id, req.query.params);
  res
    .status(200)
    .json(await getReportDataByIdSservice(req.params.id, req.query.params));
};

app.get("/reports/:id/data", getReportDataById);

const getRequestQueryParams = async (query = {}) => {
  const keys = Object.keys(query);
  const values = Object.values(query);
  if (keys.length === 0) return "";
  let params = "";
  for (let i = 0; i < keys.length; i++) {
    params += i === 0 ? "?" : "&";
    params += keys[i] + "=" + values[i];
  }
  return params;
};

const getRequestJson = async (url, query) => {
  url = url + (await getRequestQueryParams(query));
  const promise = new Promise((resolve, reject) => {
    require("request")(
      {
        url: url,
        json: true
      },
      function(err, response, body) {
        if (err) {
          reject(err);
        } else {
          resolve(body);
        }
      }
    );
  });
  let data;
  await promise.then(result => {
    data = result;
  });
  return data;
};

const beforeRender = async (req, res) => {
  const url = req.context.http.baseUrl.replace(
    "/reporting",
    "/reports/" + req.template.shortid + "/data"
  );
  req.data = await getRequestJson(url, req.context.http.query);
};

const jsreportConfigs = {
  store: {
    provider: "postgres"
  },
  extensions: {
    express: { app: reportingApp, server: server },
    "postgres-store": {
      host: process.env.RDS_HOSTNAME,
      port: process.env.RDS_PORT,
      database: process.env.RDS_DB_NAME,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD
    },
    "phantom-pdf": {
      numberOfWorkers: 1,
      timeout: 180000,
      allowLocalFilesAccess: false,
      defaultPhantomjsVersion: "1.9.8"
    },
    scripts: {
      allowedModules: ["request"]
    }
  },
  appPath: "/reporting"
};

const jsreport = require("jsreport")(jsreportConfigs);

/*const jsreport = require('jsreport')({
  extensions: {
    express: { app: reportingApp, server: server },
  },
  appPath: "/reporting"
});*/

jsreport
  .init()
  .then(() => {
    console.log("jsreport server started");
    jsreport.beforeRenderListeners.add("beforeRender", beforeRender);
  })
  .catch(e => {
    console.error(e);
  });

/*jsreport.init().then(() => {
  return jsreport.render({
    template: {
      content: '<h1>Hello {{foo}}</h1>',
      helpers: { foo: () => { return 'world' } },
      engine: 'handlebars',
      recipe: 'chrome-pdf'
    }
  })
}).catch((e) => {
  console.error(e);
});*/

if (process.env.NODE_ENV !== "production") {
  startGraphQL(openRoutes);
  startJSReport(openRoutes, server, "/oapi/v1");
} else {
  startGraphQL(protectedRoutes);
  startJSReport(protectedRoutes, server, "/api/v1");
}
