FROM node:16.14.0 as build

WORKDIR /solc-typed-ast

ENV SOL_AST_COMPILER_CACHE=/.compiler_cache

COPY /src /solc-typed-ast/src
COPY /package*.json /tsconfig.json /typedoc.json /LICENSE ./

RUN npm install --unsafe-perm && \
    npm link --unsafe-perm && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/ src typedoc.json tsconfig.json
