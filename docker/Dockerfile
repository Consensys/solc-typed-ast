FROM node:12.22.9 as build

RUN apt-get update && \
    apt-get install jq -y

COPY download.sh /download.sh

RUN ./download.sh 'linux-amd64'
RUN ./download.sh 'wasm'

FROM node:12.22.9
COPY --from=build /.compiler_cache /.compiler_cache
ENV SOL_AST_COMPILER_CACHE=/.compiler_cache
