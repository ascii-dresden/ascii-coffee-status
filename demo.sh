#!/bin/bash

while true; do
    echo '{"StatusSNS":{"Time":"2022-08-19T16:00:25","ENERGY":{"TotalStartTime":"2022-08-19T11:52:13","Total":6.04,"Yesterday":0,"Today":6.04,"Power":20,"ApparentPower":26,"ReactivePower":18,"Factor":0.74,"Voltage":234,"Current":0.111}}}' | curl -d @- -X POST -H "Content-Type: application/json" http://localhost:3000/status;
    sleep 1;
done;
