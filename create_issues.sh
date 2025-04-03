#!/bin/bash

# This script creates GitHub issues from selected items in board.txt or a selected todo file
# Usage: ./create_issues.sh [path_to_board_txt] [selected_items_file]
# If selected_items_file is not provided, all items will be processed

BOARD_FILE="${1:-board.txt}"
SELECTED_FILE="${2:-selected_todo.txt}"

if [ ! -f "$BOARD_FILE" ]; then
  echo "Error: Board file '$BOARD_FILE' not found."
  exit 1
fi

# Function to clean up the line (remove leading dash and whitespace)
clean_line() {
  echo "$1" | sed 's/^- *//'
}

# Process the board file
echo "Processing board file: $BOARD_FILE"
echo "-----------------------------"

current_section=""
found_task=false
title=""
description=""

while IFS= read -r line; do
  # Skip empty lines
  if [ -z "$line" ]; then
    continue
  fi

  # Check if it's a section header (starts with ##)
  if [[ $line == \#\#* ]]; then
    current_section=$(echo "$line" | sed 's/^## *//')
    echo "Found section: $current_section"
    continue
  fi

  # Check if it's a task item (starts with -)
  if [[ $line =~ ^-\ .+ ]]; then
    # If we found a task before, process it before moving to the next one
    if [ "$found_task" = true ] && [ -n "$title" ]; then
      # If a selected file is provided, check if this task is in it
      if [ -f "$SELECTED_FILE" ]; then
        if grep -q "$title" "$SELECTED_FILE"; then
          echo "Creating issue for task: $title"
          
          # Create the issue and get its number
          issue_url=$(gh issue create \
            --title "$title" \
            --body "Category: $current_section

$description" \
            --label "enhancement")
          
          issue_number=$(echo $issue_url | grep -o '[0-9]*$')
          
          echo "Created issue #$issue_number: $issue_url"
          
          # Wait for issue creation to complete
          sleep 2
          
          # Add the in-progress label to move it to In Progress column (optional)
          # gh issue edit $issue_number --add-label "in-progress"
          
          echo "Done."
          
          # Add a delay to avoid hitting GitHub API rate limits
          sleep 1
        fi
      fi
    fi
    
    # Reset for next task
    title=$(clean_line "$line")
    description=""
    found_task=true
    continue
  fi

  # If we found a task and this line is not a new task, it's part of the description
  if [ "$found_task" = true ] && [ -n "$title" ]; then
    # Append to description
    if [ -z "$description" ]; then
      description="$line"
    else
      description="$description
$line"
    fi
  fi
done < "$BOARD_FILE"

# Handle the last task in the file
if [ "$found_task" = true ] && [ -n "$title" ]; then
  if [ -f "$SELECTED_FILE" ]; then
    if grep -q "$title" "$SELECTED_FILE"; then
      echo "Creating issue for task: $title"
      
      # Create the issue and get its number
      issue_url=$(gh issue create \
        --title "$title" \
        --body "Category: $current_section

$description" \
        --label "enhancement")
      
      issue_number=$(echo $issue_url | grep -o '[0-9]*$')
      
      echo "Created issue #$issue_number: $issue_url"
      
      # Wait for issue creation to complete
      sleep 2
      
      # Add the in-progress label to move it to In Progress column (optional)
      # gh issue edit $issue_number --add-label "in-progress"
      
      echo "Done."
    fi
  fi
fi

echo "-----------------------------"
echo "Done creating issues."