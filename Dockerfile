FROM mikefarah/yq
RUN apk add --no-cache bash
COPY /plugins /test/plugins
COPY check_plugins_location.sh /test/check_plugins_location.sh
RUN cd /test/ && ./check_plugins_location.sh

FROM registry.centos.org/centos/httpd-24-centos7
COPY /plugins /var/www/html/plugins
COPY index.sh /var/www/html/
RUN cd /var/www/html/ && ./index.sh > index.json && rm index.sh
