FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=jobapp123 MYSQL_DATABASE=job_tracker

VOLUME ["/var/lib/mysql"]

COPY schema.sql /docker-entrypoint-initdb.d/schema.sql

EXPOSE 3306

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
	CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1 


