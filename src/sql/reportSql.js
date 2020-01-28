const getReportSqlByIdSQL = `
SELECT
    sql,
    params
FROM
    jsreport_lb_query
WHERE
    id_template = $1
`

const getReportSqlByShortIdSQL = `
SELECT
    q.sql,
    q.params
FROM
    "jsreport_TemplateType" AS t
    JOIN jsreport_lb_query as q ON q.id_template = t.id
WHERE
    t.shortid = $1
`

module.exports = { getReportSqlByIdSQL, getReportSqlByShortIdSQL }