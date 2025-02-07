#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

while IFS= read -r -d '' file
do
  echo "clearing $file";
  jq 'reduce path(.cells[]|select(.cell_type == "code")) as $cell (.; setpath($cell + ["outputs"]; []) | setpath($cell + ["execution_count"]; null))' "$file" > "$file.tmp";
  mv "$file.tmp" "$file";
done <   <(find . -name '*.ipynb' -print0)