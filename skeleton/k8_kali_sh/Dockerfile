FROM kalilinux/kali-linux-docker:latest
MAINTAINER Oscar Ortiz <oscar.ortiz@xertica.com>

RUN apt update -y && \
  apt dist-upgrade -y && \
  apt autoremove -y && \
  apt clean -y && \
  apt install -y kali-linux-top10;

COPY ./ /app/
WORKDIR /app/

CMD ["/app/start.sh" ]
#CMD ["date" ]
