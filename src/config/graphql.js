require('dotenv').config()

const { postgraphile } = require("postgraphile")
const { request } = require("graphql-request")

const connectionString = `postgres://${process.env.RDS_USERNAME}:${process.env.RDS_PASSWORD}@${process.env.RDS_HOSTNAME}:${process.env.RDS_PORT}/${process.env.RDS_DB_NAME}`

const startGraphQL = (app) => {
    app.use(
        postgraphile(
            connectionString,
            "public",
            {
                watchPg: true,
                graphiql: true,
                enhanceGraphiql: true,
                dynamicJson: true,
            }
        )
    )
}

module.exports = startGraphQL