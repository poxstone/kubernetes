#!/bin/sh

cd $APP_PATH;
gunicorn --workers=$WORKERS --timeout=$TIMEOUT --bind 0.0.0.0:$APP_PORT $GUNICORN_MODULE:$GUNICORN_CALLABLE;
