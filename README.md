# ton-q-server
TON GraphQL Server.

This component is a part of TON-Server and must not be accessed directly but through TON Labs Client Libraries.

# Prerequisites

Node.js

# Install

Clone this repository and run
```bash
npm install
```

# Setup

You can configure Q Server with command line parameters and/or ENV variables:

    Option                              ENV                          Default        Description
    ----------------------------------  ---------------------------  -------------  -----------------------------------
    -h, --host <host>                   Q_SERVER_HOST                getIp()        Listening address
    -p, --port <port>                   Q_SERVER_PORT                4000           Listening port

    -m, --requests-mode <mode>          Q_REQUESTS_MODE              kafka          Requests mode (kafka | rest)
    -r, --requests-server <url>         Q_REQUESTS_SERVER            kafka:9092     Requests server url
    -t, --requests-topic <name>         Q_REQUESTS_TOPIC             requests       Requests topic name

    -d, --db-server <address>           Q_DATABASE_SERVER            arangodb:8529  Database server:port
    -n, --db-name <name>                Q_DATABASE_NAME              blockchain     Database name
    -a, --db-auth <name>                Q_DATABASE_AUTH                             Database auth in form user:password
        --db-max-sockets <number>       Q_DATABASE_MAX_SOCKETS       100            Database auth in form user:password

        --slow-db-server <address>      Q_SLOW_DATABASE_SERVER       arangodb:8529  Slow database server:port
        --slow-db-name <name>           Q_SLOW_DATABASE_NAME         blockchain     Slow database name
        --slow-db-auth <name>           Q_SLOW_DATABASE_AUTH                        Slow database auth in form user:password
        --slow-db-max-sockets <number>  Q_SLOW_DATABASE_MAX_SOCKETS  3              Slow database auth in form user:password

    -j, --jaeger-endpoint <url>         Q_JAEGER_ENDPOINT                           Jaeger collector url
        --trace-service <name>          Q_TRACE_SERVICE              Q Server       Service name assigned to spans
        --trace-tags <tags>             Q_TRACE_TAGS                                Additional comma separated tags (name=value)

        --auth-endpoint <url>           Q_AUTH_ENDPOINT                             Auth server API url
        --mam-access-keys <keys>        Q_MAM_ACCESS_KEYS                           Access keys used to authorize mam endpoint access

    -s, --statsd-server <url>           Q_STATSD_SEREVER                            StatsD server url

# Run

```bash
node index.js
```

# Connectivity

Q-Server is accessible with GraphQL HTTP/WebSocket protocol on port "4000" and path "/graphql".

There is the only valid way to communicate with Q-Server – TON Labs Client Libraries.

# StatsD

Q-Server reports several StatsD metrics if it is configured with `statsd` option:

    Metric                Type     Tags             Description
    --------------------  -------  ---------------  -------------------------------------------------------------
    qserver.doc.count     counter  collection=name  Incremented each time when q-server has received notification 
                                                    from Arango db about document insert/update

    qserver.query.count   counter  collection=name  Incremented each time when q-server has started
                                                    query handler from SDK client

    qserver.query.time    timer    collection=name  Reported each time when q-server has finished 
                                                    query handler from SDK client
                                                       
    qserver.query.active  gauge    collection=name  Updated each time when q-server has started and finished 
                                                    query handler from SDK client

# For Developers

IMPORTANT!!!

**FIRST**. If you have modified source code you need to compile it with babel:
```bash
npm run babel
```
This will regenerate file in `dist` folder.

**SECOND**. If you want to modify scheme of database, you must do it only in one place `db.scheme.js`.
After that you need to generate source code for a graphql type definitions and for resolvers JavaScript code.
You must do it with:
```bash
npm run babel
npm run gen
npm run babel
```
Yes, you need too run babel twice :(.
