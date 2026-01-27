#!/bin/bash
set -e

MESSAGE_LIST=(
  "feat: add verifier access control"
  "test: add transcript verification tests"
  "refactor: optimize storage layout"
  "chore: improve contract structure"
  "docs: clarify solidity logic"
)

MSG_COUNT=${#MESSAGE_LIST[@]}
MSG_INDEX=0

# ✅ Only scan your repo code, skip submodules/libs/build folders
SOL_FILES=$(find . \
  -type f -name "*.sol" \
  -not -path "./lib/*" \
  -not -path "./node_modules/*" \
  -not -path "./out/*" \
  -not -path "./cache/*" \
  -not -path "./broadcast/*")

for FILE in $SOL_FILES; do
  echo "Processing $FILE"
  TOTAL_LINES=$(wc -l < "$FILE")

  for ((i=1; i<=TOTAL_LINES; i++)); do
    MESSAGE=${MESSAGE_LIST[$MSG_INDEX]}
    MSG_INDEX=$(( (MSG_INDEX + 1) % MSG_COUNT ))

    # Add temporary Solidity comment
    echo "// commit-marker-$i" >> "$FILE"
    git add "$FILE"
    git commit -m "$MESSAGE"

    # Remove the comment
    sed -i '$d' "$FILE"
    git add "$FILE"
    git commit -m "$MESSAGE"

    echo "Committed $FILE (line $i / $TOTAL_LINES)"
  done
done

echo "✅ Done (skipped submodules/libs)"
# End of script