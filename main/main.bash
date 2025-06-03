#!/bin/bash

# Directory to check

echo "Executing..."

directory="./downloads/"

# Check if directory exists
if [ -d "$directory" ]; then
    items=("$directory"/*)

    # more than 1 item?
    if [ ${#items[@]} -gt 1 ]; then

        # delete sitreprt2 if exists
        sitreprt2="$directory/sitreprt2.pdf"
        if [ -f "$sitreprt2" ]; then
            rm "$sitreprt2"
            echo "Deleted sitreprt2"
        fi
        
        # rename sitreprt to sitreprt2
        sitreprt="$directory/sitreprt.pdf"
        if [ -f "$sitreprt" ]; then
            mv "$sitreprt" "$sitreprt2"
            echo "Renamed sitreprt to sitreprt2"
        fi
        
    else
        echo "Only one item."
        sitreprt="$directory/sitreprt.pdf"
        sitreprt2="$directory/sitreprt2.pdf"
        if [ -f "$sitreprt" ]; then
            mv "$sitreprt" "$sitreprt2"
            echo "Renamed sitreprt to sitreprt2"
        fi
    fi
else
    echo "Directory does not exist."
fi

node webhook.js