#!/bin/bash

ARCH="${1}"
TARGET_DIR=".compiler_cache/$ARCH"
mkdir -p $TARGET_DIR

curl -s https://binaries.soliditylang.org/$ARCH/list.json --output $TARGET_DIR/list.json

FILES=( $(cat $TARGET_DIR/list.json | jq -r '.releases[]') )

for i in "${FILES[@]}"
do
    echo Downloading "https://binaries.soliditylang.org/$ARCH/$i"
    curl -s https://binaries.soliditylang.org/$ARCH/$i --output $TARGET_DIR/$i && chmod a+x $TARGET_DIR/$i
done
