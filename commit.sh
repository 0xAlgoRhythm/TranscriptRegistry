#!/bin/bash

FILE="quick-test.sh"
MESSAGE="create script file commit"

TOTAL_LINES=$(wc -l < "$FILE")

for ((i=1; i<=TOTAL_LINES; i++)); do
    # Add a temporary comment
    echo "# commit-marker-$i" >> "$FILE"

    git add "$FILE"
    git commit -m "$MESSAGE"

    # Remove the comment again
    sed -i '$d' "$FILE"
    git add "$FILE"
    git commit -m "$MESSAGE"

    echo "Committed change for line $i / $TOTAL_LINES"
done
echo "All done! Total commits made: $((TOTAL_LINES * 2))"