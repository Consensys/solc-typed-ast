FROM node:16.14.0 as build

WORKDIR /solc-typed-ast

ENV SOL_AST_COMPILER_CACHE=/.compiler_cache

RUN apt-get update && \
    apt-get install jq -y

COPY /src /solc-typed-ast/src
COPY /package*.json /tsconfig.json /typedoc.json /docker/download.sh /LICENSE ./

RUN ./download.sh 'linux-amd64' $SOL_AST_COMPILER_CACHE && \
    ./download.sh 'wasm' $SOL_AST_COMPILER_CACHE

RUN npm install --unsafe-perm && \
    npm link --unsafe-perm && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/ src typedoc.json tsconfig.json
