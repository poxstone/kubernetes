var express = require('express');
var mysql = require('mysql');
var redis = require("redis");

const ENV      = process.env;
const PORT     = ENV.APP_PORT || 3000
const REDIS    = {host: ENV.REDIS_HOST || 'localhost',
                  port: ENV.REDIS_PORT || 6379};
const dbConfig = {host     : ENV.DB_HOST || '0.0.0.0',
                  user     : ENV.DB_USER || 'my_db_user',
                  password : ENV.DB_PASS || 'my_db_secret',
                  db : ENV.DB_SCHE || 'items'}
console.log(ENV);

var app = express();

/* sql connections */
const sqlCli = mysql.createConnection(dbConfig);
sqlCli.connect();

/* redis connection */
redisCli = redis.createClient(REDIS.port, REDIS.host);
redisCli.on('error', err => console.error('ERR:REDIS:', err));


/* Routes */
app.get('/', (req, res) => res.send('node js - ok'));

/* sql */
app.get('/sql', (req, res) => {
  console.info('GET /sql');
  var limit = req.query.limit ? req.query.limit : 3;
  var query = `SELECT * FROM ${dbConfig.db}.books LIMIT ${limit};`;
  var dummy = '{"id":1, "name":"dummy 1", "cant": 2}'
  
  try{
    sqlCli.query(query, (err, rows, fields) => {
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

/* redis */
app.get('/redis', (req, res) => {
  redisCli.incr('visits', (err, reply) => {
    if (err) {
      console.log(err);
      res.status(500).send(err. message);
      return;
    }
    res.send(JSON.stringify({visitor: reply}));
  });
});

/* run app */
app.listen(PORT, () => console.log(`run ${PORT}!`));
