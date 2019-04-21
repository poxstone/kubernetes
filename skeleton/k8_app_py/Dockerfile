FROM alpine:latest
MAINTAINER Oscar Ortiz <posxtone@gmail.com>

ENV APP_PORT=8081
ENV GUNICORN_MODULE='main'
ENV GUNICORN_CALLABLE='app'
ENV GUNICORN_USER='user_gun'
ENV APP_PATH='/app'
ENV WORKERS=3 
ENV TIMEOUT=120
ENV VERSION_DEP='v0.0.1f'

RUN apk add --no-cache python3 \
    && python3 -m ensurepip \
    && pip3 install --upgrade pip gunicorn \
    && adduser -D -h $APP_PATH $GUNICORN_USER

COPY ./ $APP_PATH

RUN pip3 install -r $APP_PATH/requirements.txt --upgrade

EXPOSE $APP_PORT

USER $GUNICORN_USER
WORKDIR $APP_PATH
ENTRYPOINT $APP_PATH/entrypoint.sh
