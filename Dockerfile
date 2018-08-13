FROM registry.centos.org/centos/httpd-24-centos7
COPY /plugins /var/www/html/plugins
COPY index.sh /var/www/html/
RUN cd /var/www/html/ && ./index.sh > index.json && rm index.sh
