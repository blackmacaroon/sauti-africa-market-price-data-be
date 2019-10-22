const knex = require("knex")
const secrets = require("../config/secrets.js")

const config = require("../knexfile.js")

const environment = secrets.environment
// we must select the development object from our knexfile
const db = knex(config.environment) //TODO: change this to be dynamic later

// export for use in codebase
module.exports = db
