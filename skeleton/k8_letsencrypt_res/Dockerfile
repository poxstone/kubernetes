FROM alpine:latest
MAINTAINER Oscar Ortiz <oscar.ortiz@xertica.com>

ENV APP_PORT=8000
ENV RESPONSE='test_response'
ENV APP_PATH='/app'

RUN apk add --no-cache python3 \
    && python3 -m ensurepip \
    && pip3 install --upgrade pip gunicorn

COPY ./ $APP_PATH

EXPOSE 8000

WORKDIR $APP_PATH
CMD [ "python3", "./main.py" ]
