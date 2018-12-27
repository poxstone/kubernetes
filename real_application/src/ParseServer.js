// ParseServer - open-source compatible API Server for Parse apps

var batch = require('./batch'),
  bodyParser = require('body-parser'),
  express = require('express'),
  middlewares = require('./middlewares'),
  Parse = require('parse/node').Parse,
  path = require('path');

import { ParseServerOptions, LiveQueryServerOptions } from './Options';
import defaults from './defaults';
import * as logging from './logger';
import Config from './Config';
import PromiseRouter from './PromiseRouter';
import requiredParameter from './requiredParameter';
import { AnalyticsRouter } from './Routers/AnalyticsRouter';
import { ClassesRouter } from './Routers/ClassesRouter';
import { FeaturesRouter } from './Routers/FeaturesRouter';
import { FilesRouter } from './Routers/FilesRouter';
import { FunctionsRouter } from './Routers/FunctionsRouter';
import { GlobalConfigRouter } from './Routers/GlobalConfigRouter';
import { HooksRouter } from './Routers/HooksRouter';
import { IAPValidationRouter } from './Routers/IAPValidationRouter';
import { InstallationsRouter } from './Routers/InstallationsRouter';
import { LogsRouter } from './Routers/LogsRouter';
import { ParseLiveQueryServer } from './LiveQuery/ParseLiveQueryServer';
import { PublicAPIRouter } from './Routers/PublicAPIRouter';
import { PushRouter } from './Routers/PushRouter';
import { CloudCodeRouter } from './Routers/CloudCodeRouter';
import { RolesRouter } from './Routers/RolesRouter';
import { SchemasRouter } from './Routers/SchemasRouter';
import { SessionsRouter } from './Routers/SessionsRouter';
import { UsersRouter } from './Routers/UsersRouter';
import { PurgeRouter } from './Routers/PurgeRouter';
import { AudiencesRouter } from './Routers/AudiencesRouter';
import { AggregateRouter } from './Routers/AggregateRouter';

import { ParseServerRESTController } from './ParseServerRESTController';
import * as controllers from './Controllers';
// Mutate the Parse object to add the Cloud Code handlers
addParseCloud();

// ParseServer works like a constructor of an express app.
// The args that we understand are:
// "analyticsAdapter": an adapter class for analytics
// "filesAdapter": a class like GridFSBucketAdapter providing create, get,
//                 and delete
// "loggerAdapter": a class like WinstonLoggerAdapter providing info, error,
//                 and query
// "jsonLogs": log as structured JSON objects
// "databaseURI": a uri like mongodb://localhost:27017/dbname to tell us
//          what database this Parse API connects to.
// "cloud": relative location to cloud code to require, or a function
//          that is given an instance of Parse as a parameter.  Use this instance of Parse
//          to register your cloud code hooks and functions.
// "appId": the application id to host
// "masterKey": the master key for requests to this app
// "collectionPrefix": optional prefix for database collection names
// "fileKey": optional key from Parse dashboard for supporting older files
//            hosted by Parse
// "clientKey": optional key from Parse dashboard
// "dotNetKey": optional key from Parse dashboard
// "restAPIKey": optional key from Parse dashboard
// "webhookKey": optional key from Parse dashboard
// "javascriptKey": optional key from Parse dashboard
// "push": optional key from configure push
// "sessionLength": optional length in seconds for how long Sessions should be valid for
// "maxLimit": optional upper bound for what can be specified for the 'limit' parameter on queries

class ParseServer {
  /**
   * @constructor
   * @param {ParseServerOptions} options the parse server initialization options
   */
  constructor(options: ParseServerOptions) {
    injectDefaults(options);
    const {
      appId = requiredParameter('You must provide an appId!'),
      masterKey = requiredParameter('You must provide a masterKey!'),
      cloud,
      javascriptKey,
      serverURL = requiredParameter('You must provide a serverURL!'),
      __indexBuildCompletionCallbackForTests = () => {},
    } = options;
    // Initialize the node client SDK automatically
    Parse.initialize(appId, javascriptKey || 'unused', masterKey);
    Parse.serverURL = serverURL;

    const allControllers = controllers.getControllers(options);

    const {
      loggerController,
      databaseController,
      hooksController,
    } = allControllers;
    this.config = Config.put(Object.assign({}, options, allControllers));

    logging.setLogger(loggerController);
    const dbInitPromise = databaseController.performInitialization();
    hooksController.load();

    // Note: Tests will start to fail if any validation happens after this is called.
    if (process.env.TESTING) {
      __indexBuildCompletionCallbackForTests(dbInitPromise);
    }

    if (cloud) {
      addParseCloud();
      if (typeof cloud === 'function') {
        cloud(Parse);
      } else if (typeof cloud === 'string') {
        require(path.resolve(process.cwd(), cloud));
      } else {
        throw "argument 'cloud' must either be a string or a function";
      }
    }
  }

  get app() {
    if (!this._app) {
      this._app = ParseServer.app(this.config);
    }
    return this._app;
  }

  handleShutdown() {
    const { adapter } = this.config.databaseController;
    if (adapter && typeof adapter.handleShutdown === 'function') {
      adapter.handleShutdown();
    }
  }

  /**
   * @static
   * Create an express app for the parse server
   * @param {Object} options let you specify the maxUploadSize when creating the express app  */
  static app({ maxUploadSize = '20mb', appId }) {
    // This app serves the Parse API directly.
    // It's the equivalent of https://api.parse.com/1 in the hosted Parse API.
    var api = express();
    //api.use("/apps", express.static(__dirname + "/public"));
    // File handling needs to be before default middlewares are applied
    api.use(
      '/',
      middlewares.allowCrossDomain,
      new FilesRouter().expressRouter({
        maxUploadSize: maxUploadSize,
      })
    );

    api.use('/health', function(req, res) {
      res.json({
        status: 'ok',
      });
    });

    api.use(
      '/',
      bodyParser.urlencoded({ extended: false }),
      new PublicAPIRouter().expressRouter()
    );

    api.use(bodyParser.json({ type: '*/*', limit: maxUploadSize }));
    api.use(middlewares.allowCrossDomain);
    api.use(middlewares.allowMethodOverride);
    api.use(middlewares.handleParseHeaders);

    const appRouter = ParseServer.promiseRouter({ appId });
    api.use(appRouter.expressRouter());

    api.use(middlewares.handleParseErrors);

    // run the following when not testing
    if (!process.env.TESTING) {
      //This causes tests to spew some useless warnings, so disable in test
      /* istanbul ignore next */
      process.on('uncaughtException', err => {
        if (err.code === 'EADDRINUSE') {
          // user-friendly message for this common error
          process.stderr.write(
            `Unable to listen on port ${err.port}. The port is already in use.`
          );
          process.exit(0);
        } else {
          throw err;
        }
      });
      // verify the server url after a 'mount' event is received
      /* istanbul ignore next */
      api.on('mount', function() {
        ParseServer.verifyServerUrl();
      });
    }
    if (process.env.PARSE_SERVER_ENABLE_EXPERIMENTAL_DIRECT_ACCESS === '1') {
      Parse.CoreManager.setRESTController(
        ParseServerRESTController(appId, appRouter)
      );
    }
    return api;
  }

  static promiseRouter({ appId }) {
    const routers = [
      new ClassesRouter(),
      new UsersRouter(),
      new SessionsRouter(),
      new RolesRouter(),
      new AnalyticsRouter(),
      new InstallationsRouter(),
      new FunctionsRouter(),
      new SchemasRouter(),
      new PushRouter(),
      new LogsRouter(),
      new IAPValidationRouter(),
      new FeaturesRouter(),
      new GlobalConfigRouter(),
      new PurgeRouter(),
      new HooksRouter(),
      new CloudCodeRouter(),
      new AudiencesRouter(),
      new AggregateRouter(),
    ];

    const routes = routers.reduce((memo, router) => {
      return memo.concat(router.routes);
    }, []);

    const appRouter = new PromiseRouter(routes, appId);

    batch.mountOnto(appRouter);
    return appRouter;
  }

  /**
   * starts the parse server's express app
   * @param {ParseServerOptions} options to use to start the server
   * @param {Function} callback called when the server has started
   * @returns {ParseServer} the parse server instance
   */
  start(options: ParseServerOptions, callback: ?() => void) {
    const app = express();
    if (options.middleware) {
      let middleware;
      if (typeof options.middleware == 'string') {
        middleware = require(path.resolve(process.cwd(), options.middleware));
      } else {
        middleware = options.middleware; // use as-is let express fail
      }
      app.use(middleware);
    }

    app.use(options.mountPath, this.app);
    const server = app.listen(options.port, options.host, callback);
    this.server = server;

    if (options.startLiveQueryServer || options.liveQueryServerOptions) {
      this.liveQueryServer = ParseServer.createLiveQueryServer(
        server,
        options.liveQueryServerOptions
      );
    }
    /* istanbul ignore next */
    if (!process.env.TESTING) {
      configureListeners(this);
    }
    this.expressApp = app;
    return this;
  }

  /**
   * Creates a new ParseServer and starts it.
   * @param {ParseServerOptions} options used to start the server
   * @param {Function} callback called when the server has started
   * @returns {ParseServer} the parse server instance
   */
  static start(options: ParseServerOptions, callback: ?() => void) {
    const parseServer = new ParseServer(options);
    return parseServer.start(options, callback);
  }

  /**
   * Helper method to create a liveQuery server
   * @static
   * @param {Server} httpServer an optional http server to pass
   * @param {LiveQueryServerOptions} config options fot he liveQueryServer
   * @returns {ParseLiveQueryServer} the live query server instance
   */
  static createLiveQueryServer(httpServer, config: LiveQueryServerOptions) {
    if (!httpServer || (config && config.port)) {
      var app = express();
      httpServer = require('http').createServer(app);
      httpServer.listen(config.port);
    }
    return new ParseLiveQueryServer(httpServer, config);
  }

  static verifyServerUrl(callback) {
    // perform a health check on the serverURL value
    if (Parse.serverURL) {
      const request = require('./request');
      request({ url: Parse.serverURL.replace(/\/$/, '') + '/health' })
        .catch(response => response)
        .then(response => {
          const json = response.data || null;
          if (
            response.status !== 200 ||
            !json ||
            (json && json.status !== 'ok')
          ) {
            /* eslint-disable no-console */
            console.warn(
              `\nWARNING, Unable to connect to '${Parse.serverURL}'.` +
                ` Cloud code and push notifications may be unavailable!\n`
            );
            /* eslint-enable no-console */
            if (callback) {
              callback(false);
            }
          } else {
            if (callback) {
              callback(true);
            }
          }
        });
    }
  }
}

function addParseCloud() {
  const ParseCloud = require('./cloud-code/Parse.Cloud');
  Object.assign(Parse.Cloud, ParseCloud);
  global.Parse = Parse;
}

function injectDefaults(options: ParseServerOptions) {
  Object.keys(defaults).forEach(key => {
    if (!options.hasOwnProperty(key)) {
      options[key] = defaults[key];
    }
  });

  if (!options.hasOwnProperty('serverURL')) {
    options.serverURL = `http://localhost:${options.port}${options.mountPath}`;
  }

  options.userSensitiveFields = Array.from(
    new Set(
      options.userSensitiveFields.concat(
        defaults.userSensitiveFields,
        options.userSensitiveFields
      )
    )
  );

  options.masterKeyIps = Array.from(
    new Set(
      options.masterKeyIps.concat(defaults.masterKeyIps, options.masterKeyIps)
    )
  );
}

// Those can't be tested as it requires a subprocess
/* istanbul ignore next */
function configureListeners(parseServer) {
  const server = parseServer.server;
  const sockets = {};
  /* Currently, express doesn't shut down immediately after receiving SIGINT/SIGTERM if it has client connections that haven't timed out. (This is a known issue with node - https://github.com/nodejs/node/issues/2642)
    This function, along with `destroyAliveConnections()`, intend to fix this behavior such that parse server will close all open connections and initiate the shutdown process as soon as it receives a SIGINT/SIGTERM signal. */
  server.on('connection', socket => {
    const socketId = socket.remoteAddress + ':' + socket.remotePort;
    sockets[socketId] = socket;
    socket.on('close', () => {
      delete sockets[socketId];
    });
  });

  const destroyAliveConnections = function() {
    for (const socketId in sockets) {
      try {
        sockets[socketId].destroy();
      } catch (e) {
        /* */
      }
    }
  };

  const handleShutdown = function() {
    process.stdout.write('Termination signal received. Shutting down.');
    destroyAliveConnections();
    server.close();
    parseServer.handleShutdown();
  };
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

export default ParseServer;
