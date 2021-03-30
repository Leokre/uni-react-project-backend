const mysql = require("mysql2");

module.exports = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "toor",
    database: "uni-react-project-db"
})