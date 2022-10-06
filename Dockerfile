FROM oraclelinux:8-slim
RUN microdnf  -y module enable nodejs:16
RUN microdnf  -y install oracle-instantclient-release-el8
RUN microdnf  -y install oracle-instantclient-basic nodejs 
RUN microdnf -y install npm
RUN npm --location=global install pm2 yarn
RUN microdnf -y install java-1.8.0-openjdk

WORKDIR /server


COPY src/package*.json ./
RUN yarn install --production
COPY src/ /server
EXPOSE 3000

RUN export PATH=/usr/lib/oracle/21/client64/bin:$PATH
CMD ["pm2-runtime", "ecosystem.config.js"]
