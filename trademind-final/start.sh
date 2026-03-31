#!/bin/bash
cd /home/z/my-project/trademind-final
python3 -m http.server 8765 --bind 0.0.0.0 &
sleep 2
./cloudflared tunnel --url http://0.0.0.0:8765
