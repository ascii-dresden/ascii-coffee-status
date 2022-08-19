#!/bin/bash

while true; do
    curl -s "http://10.3.141.218/cm?cmnd=Status%2010" | curl -d @- -X POST -H "Content-Type: application/json" https://ascii.lars-westermann.de/status;
    sleep 1;
done;
