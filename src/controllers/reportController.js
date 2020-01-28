const express = require("express");

const { getRequestJson, getReportDataByIdSservice } = require('../services/reportService')

const startJSReport = (app, server, route) => {
    const reportingApp = express();
    app.use('/reporting', reportingApp);
    app.get("/reports/:id/data", getReportDataById)
 
    const jsreportConfigs = {
        store: {
            provider: 'postgres'
        },
        extensions: {
            express: { app: reportingApp, server: server },
            'postgres-store': {
                host: process.env.RDS_HOSTNAME,
                port: process.env.RDS_PORT,
                database: process.env.RDS_DB_NAME,
                user: process.env.RDS_USERNAME,
                password: process.env.RDS_PASSWORD
            },
            'phantom-pdf': {
                numberOfWorkers: 1,
                timeout: 180000,
                allowLocalFilesAccess: false,
                defaultPhantomjsVersion: "1.9.8"
            },
            scripts: {
                allowedModules: ['request'],
            }
        },
        appPath: route + "/reporting",
    }

    const jsreport = require('jsreport')(jsreportConfigs)

    jsreport.init().then(() => {
        console.log('jsreport server started')
        jsreport.beforeRenderListeners.add('beforeRender', beforeRender)
    }).catch((e) => {
        console.error(e);
    })
}

const getReportDataById = async (req, res) => {
    res.status(200).json(await getReportDataByIdSservice(req.params.id, req.query.params))
}

const beforeRender = async (req, res) => {
  const url = req.context.http.baseUrl.replace('/reporting','/reports/' + req.template.shortid + '/data')
  req.data = await getRequestJson(url, req.context.http.query)
}

module.exports = startJSReport