const loadData = async (pool, sql, params = []) => {
    let data = []
    const client = await pool.connect()
    try {
      const res = await client.query(sql, params)
      data = res.rows
    } finally {
      client.release()
    }
    return data
}
  
const loadDataWithDynamicQuery = async (pool, sql = '', params = {}, paramNames = []) => {
    const config = {
      text: sql,
      values: params
    }
    let data = {}
    try {
      const client = await pool.connect()
      try {
        const named = require('node-postgres-named')
        named.patch(client);
        
        const res = await client.query(config)
        const rows = res.rows || []
        data = rows[0] || {}
      } finally {
        client.release()
      }
    } catch (error) {
      const msg = await error.toString()
      data = msg.includes('Missing Parameters') ? { params: paramNames } : { error: msg }
    }
    return data
}

module.exports = { loadData, loadDataWithDynamicQuery }