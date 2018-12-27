import ClassesRouter from './ClassesRouter';
import rest from '../rest';
import * as middleware from '../middlewares';
import Parse from 'parse/node';
import UsersRouter from './UsersRouter';

const BASE_KEYS = ['where', 'distinct', 'pipeline'];

const PIPELINE_KEYS = [
  'addFields',
  'bucket',
  'bucketAuto',
  'collStats',
  'count',
  'currentOp',
  'facet',
  'geoNear',
  'graphLookup',
  'group',
  'indexStats',
  'limit',
  'listLocalSessions',
  'listSessions',
  'lookup',
  'match',
  'out',
  'project',
  'redact',
  'replaceRoot',
  'sample',
  'skip',
  'sort',
  'sortByCount',
  'unwind',
];

const ALLOWED_KEYS = [...BASE_KEYS, ...PIPELINE_KEYS];

export class AggregateRouter extends ClassesRouter {
  handleFind(req) {
    const body = Object.assign(
      req.body,
      ClassesRouter.JSONFromQuery(req.query)
    );
    const options = {};
    if (body.distinct) {
      options.distinct = String(body.distinct);
    }
    options.pipeline = AggregateRouter.getPipeline(body);
    if (typeof body.where === 'string') {
      body.where = JSON.parse(body.where);
    }
    return rest
      .find(
        req.config,
        req.auth,
        this.className(req),
        body.where,
        options,
        req.info.clientSDK
      )
      .then(response => {
        for (const result of response.results) {
          if (typeof result === 'object') {
            UsersRouter.removeHiddenProperties(result);
          }
        }
        return { response };
      });
  }

  /* Builds a pipeline from the body. Originally the body could be passed as a single object,
   * and now we support many options
   *
   * Array
   *
   * body: [{
   *   group: { objectId: '$name' },
   * }]
   *
   * Object
   *
   * body: {
   *   group: { objectId: '$name' },
   * }
   *
   *
   * Pipeline Operator with an Array or an Object
   *
   * body: {
   *   pipeline: {
   *     group: { objectId: '$name' },
   *   }
   * }
   *
   */
  static getPipeline(body) {
    let pipeline = body.pipeline || body;

    if (!Array.isArray(pipeline)) {
      pipeline = Object.keys(pipeline).map(key => {
        return { [key]: pipeline[key] };
      });
    }

    return pipeline.map(stage => {
      const keys = Object.keys(stage);
      if (keys.length != 1) {
        throw new Error(
          `Pipeline stages should only have one key found ${keys.join(', ')}`
        );
      }
      return AggregateRouter.transformStage(keys[0], stage);
    });
  }

  static transformStage(stageName, stage) {
    if (ALLOWED_KEYS.indexOf(stageName) === -1) {
      throw new Parse.Error(
        Parse.Error.INVALID_QUERY,
        `Invalid parameter for query: ${stageName}`
      );
    }
    if (stageName === 'group') {
      if (stage[stageName].hasOwnProperty('_id')) {
        throw new Parse.Error(
          Parse.Error.INVALID_QUERY,
          `Invalid parameter for query: group. Please use objectId instead of _id`
        );
      }
      if (!stage[stageName].hasOwnProperty('objectId')) {
        throw new Parse.Error(
          Parse.Error.INVALID_QUERY,
          `Invalid parameter for query: group. objectId is required`
        );
      }
      stage[stageName]._id = stage[stageName].objectId;
      delete stage[stageName].objectId;
    }
    return { [`$${stageName}`]: stage[stageName] };
  }

  mountRoutes() {
    this.route(
      'GET',
      '/aggregate/:className',
      middleware.promiseEnforceMasterKeyAccess,
      req => {
        return this.handleFind(req);
      }
    );
  }
}

export default AggregateRouter;
