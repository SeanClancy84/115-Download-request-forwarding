#!/bin/bash
# 查找包含 /opt/listenMagnet/server.js 的进程，并杀死第一个
pid=$(ps -ef | grep 'node /opt/listenMagnet/server.js' | grep -v grep | awk 'NR==1{print $2}')

if [ -z "$pid" ]; then
  echo "No process found."
else
  echo "Killing process $pid"
  kill $pid
fi