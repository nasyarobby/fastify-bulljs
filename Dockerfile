FROM node:14.19.3-stretch
RUN apt-get update && apt-get install -y openjdk-8-jdk

RUN yarn global add pm2


RUN apt-get install -y libaio1 alien
RUN wget http://yum.oracle.com/repo/OracleLinux/OL7/oracle/instantclient/x86_64/getPackage/oracle-instantclient19.6-basic-19.6.0.0.0-1.x86_64.rpm
RUN alien -i --scripts oracle-instantclient*.rpm
RUN rm -f oracle-instantclient*.rpm  

WORKDIR /server

COPY src/package*.json ./
RUN yarn install --production
COPY src/ /server
EXPOSE 3000

RUN export PATH=/usr/lib/oracle/21/client64/bin:$PATH
CMD ["pm2-runtime", "ecosystem.config.js"]
