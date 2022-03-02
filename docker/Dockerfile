FROM node:16.14.0 as build

RUN apt-get update && \
    apt-get install jq -y

COPY download.sh /download.sh

RUN ./download.sh 'linux-amd64' /.compiler_cache
RUN ./download.sh 'bin' /.compiler_cache

FROM node:16.14.0
COPY --from=build /.compiler_cache /.compiler_cache
ENV SOL_AST_COMPILER_CACHE=/.compiler_cache
