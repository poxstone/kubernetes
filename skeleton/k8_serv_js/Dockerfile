FROM node:10-alpine
MAINTAINER Oscar Ortiz <posxtone@gmail.com>

ENV APP_PORT=3000
ENV APP_PATH='/home/node/app'
ENV DB_HOST='my_db_host'
ENV DB_USER='my_db_user'
ENV DB_PASS='my_db_secret'
ENV DB_SCHE='items'
ENV USER='node'



RUN mkdir -p $APP_PATH/node_modules && chown -R node:node $APP_PATH
WORKDIR $APP_PATH
COPY ./* ./

USER $USER
RUN npm install
COPY --chown=node:node . .

EXPOSE $APP_PORT

CMD [ "node", "index.js" ]
