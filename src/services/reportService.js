const { tryParseJson, isNumber } = require('../utils/lib')
const { loadData, loadDataWithDynamicQuery } = require('../utils/query')
const { getReportSqlByIdSQL, getReportSqlByShortIdSQL } = require('../sql/reportSql')
const pool = require('../config/db')

const getReportSqlById = async (id) => {
    let data = {}
    await loadData(pool, getReportSqlByIdSQL, [id]).then((res = []) => {
        data = res[0] || {}
    })
    return data
}

const getReportSqlByShortId = async (shortId) => {
    let data = {}
    await loadData(pool, getReportSqlByShortIdSQL, [shortId]).then((res = []) => {
        data = res[0] || {}
    })
    return data
}
  
const getReportDataByIdSservice = async (id, params = {}) => {
    params = await tryParseJson(params)
    const query = await isNumber(id) ? await getReportSqlById(id) : await getReportSqlByShortId(id)
    if (!query.sql) return null
    let data = {}
    await loadDataWithDynamicQuery(pool, query.sql, params, query.params).then((res = {}) => {
        data = res
    })
    return data
}

const getRequestQueryParams = async (query = {}) => {
    const keys = Object.keys(query)
    const values = Object.values(query)
    if (keys.length === 0) return ''
    let params = ''
    for (let i = 0; i < keys.length; i++) {
        params += (i === 0) ? '?' : '&'
        params += keys[i] + '=' + values[i]
    }
    return params
}
  
const getRequestJson = async (url, query) => {
    url = url + await getRequestQueryParams(query)
    const promise = new Promise((resolve, reject) => {
        require('request')({
            url: url,
            json: true
        }, function (err, response, body) {
            if (err) {
                reject(err)
            } else {
                resolve(body)
            }
        })
    })
    let data
    await promise.then((result) => {
        data = result
    })
    return data
}

module.exports = { getReportSqlById, getReportSqlByShortId, getReportDataByIdSservice, getRequestQueryParams, getRequestJson }