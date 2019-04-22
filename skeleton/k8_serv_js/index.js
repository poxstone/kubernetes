var express = require('express');
var mysql = require('mysql');

const ENV = process.env;
const PORT = ENV.APP_PORT || 3000
const dbConfig = {host     : ENV.DB_HOST || '0.0.0.0',
                  user     : ENV.DB_USER || 'my_db_user',
                  password : ENV.DB_PASS || 'my_db_secret',
                  db : ENV.DB_SCHE || 'items'}
console.log(ENV);

var app = express();

/* sql connections */

const connection = mysql.createConnection(dbConfig);
connection.connect();


/* Routes */
app.get('/', (req, res) => res.send('node js - ok'));

app.get('/books', (req, res) => {
  console.info('GET /books');
  var limit = req.query.limit ? req.query.limit : 3;
  var query = `SELECT * FROM ${dbConfig.db}.books LIMIT ${limit};`;
  var dummy = '{"id":1, "name":"dummy 1", "cant": 2}'
  
  try{
    connection.query(query, (err, rows, fields) => {
      if (err) {
        console.error(err);
        res.send(dummy);
      }
      res.send(JSON.stringify(rows));
    });
  } catch (err){
    console.error(err);
    res.send(dummy);
  }
});

/* run app */
app.listen(PORT, () => console.log(`run ${PORT}!`));
