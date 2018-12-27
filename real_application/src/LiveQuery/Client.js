import logger from '../logger';

import type { FlattenedObjectData } from './Subscription';
export type Message = { [attr: string]: any };

const dafaultFields = [
  'className',
  'objectId',
  'updatedAt',
  'createdAt',
  'ACL',
];

class Client {
  id: number;
  parseWebSocket: any;
  hasMasterKey: boolean;
  userId: string;
  roles: Array<string>;
  subscriptionInfos: Object;
  pushConnect: Function;
  pushSubscribe: Function;
  pushUnsubscribe: Function;
  pushCreate: Function;
  pushEnter: Function;
  pushUpdate: Function;
  pushDelete: Function;
  pushLeave: Function;

  constructor(id: number, parseWebSocket: any, hasMasterKey: boolean) {
    this.id = id;
    this.parseWebSocket = parseWebSocket;
    this.hasMasterKey = hasMasterKey;
    this.roles = [];
    this.subscriptionInfos = new Map();
    this.pushConnect = this._pushEvent('connected');
    this.pushSubscribe = this._pushEvent('subscribed');
    this.pushUnsubscribe = this._pushEvent('unsubscribed');
    this.pushCreate = this._pushEvent('create');
    this.pushEnter = this._pushEvent('enter');
    this.pushUpdate = this._pushEvent('update');
    this.pushDelete = this._pushEvent('delete');
    this.pushLeave = this._pushEvent('leave');
  }

  static pushResponse(parseWebSocket: any, message: Message): void {
    logger.verbose('Push Response : %j', message);
    parseWebSocket.send(message);
  }

  static pushError(
    parseWebSocket: any,
    code: number,
    error: string,
    reconnect: boolean = true
  ): void {
    Client.pushResponse(
      parseWebSocket,
      JSON.stringify({
        op: 'error',
        error: error,
        code: code,
        reconnect: reconnect,
      })
    );
  }

  addSubscriptionInfo(requestId: number, subscriptionInfo: any): void {
    this.subscriptionInfos.set(requestId, subscriptionInfo);
  }

  getSubscriptionInfo(requestId: number): any {
    return this.subscriptionInfos.get(requestId);
  }

  deleteSubscriptionInfo(requestId: number): void {
    return this.subscriptionInfos.delete(requestId);
  }

  _pushEvent(type: string): Function {
    return function(subscriptionId: number, parseObjectJSON: any): void {
      const response: Message = {
        op: type,
        clientId: this.id,
      };
      if (typeof subscriptionId !== 'undefined') {
        response['requestId'] = subscriptionId;
      }
      if (typeof parseObjectJSON !== 'undefined') {
        let fields;
        if (this.subscriptionInfos.has(subscriptionId)) {
          fields = this.subscriptionInfos.get(subscriptionId).fields;
        }
        response['object'] = this._toJSONWithFields(parseObjectJSON, fields);
      }
      Client.pushResponse(this.parseWebSocket, JSON.stringify(response));
    };
  }

  _toJSONWithFields(parseObjectJSON: any, fields: any): FlattenedObjectData {
    if (!fields) {
      return parseObjectJSON;
    }
    const limitedParseObject = {};
    for (const field of dafaultFields) {
      limitedParseObject[field] = parseObjectJSON[field];
    }
    for (const field of fields) {
      if (field in parseObjectJSON) {
        limitedParseObject[field] = parseObjectJSON[field];
      }
    }
    return limitedParseObject;
  }
}

export { Client };
