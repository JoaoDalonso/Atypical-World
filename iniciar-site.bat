@echo off
chcp 65001 > nul
title Atypical World - Servidor Local

echo.
echo Iniciando o servidor local do Atypical World...
echo.

node api\dev-server.js

pause
