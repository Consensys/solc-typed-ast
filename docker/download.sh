#!/bin/bash

ARCH="${1:-linux-amd64}"
TARGET_DIR="/.compiler_cache/$ARCH/"
mkdir -p $TARGET_DIR

FILES=( $(curl -s https://binaries.soliditylang.org/$ARCH/list.json | jq -r '.releases[]') )

for i in "${FILES[@]}"
do
    echo downloading "https://binaries.soliditylang.org/$ARCH/$i"
    curl -s https://binaries.soliditylang.org/$ARCH/$i --output $TARGET_DIR/$i && chmod a+x $TARGET_DIR/$i
done
