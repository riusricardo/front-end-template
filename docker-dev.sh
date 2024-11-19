#!/usr/bin/env bash
# Copyright 2017-2022 @polkadot authors & contributors
# This software may be modified and distributed under the terms
# of the Apache-2.0 license. See the LICENSE file for details.

trap "echo; exit" INT
trap "echo; exit" HUP

# try to fetch public IP address if value not set in .env
PUBLIC_IP_ADDRESS_FALLBACK=$(wget http://ipecho.net/plain -O - -q ; echo)

# assign fallback values for environment variables from .env.example incase
# not declared in .env file. alternative approach is `echo ${X:=$X_FALLBACK}`
source $(dirname "$0")/.env.example
source $(dirname "$0")/.env
${PUBLIC_IP_ADDRESS:=$PUBLIC_IP_ADDRESS_FALLBACK}
export APP_NAME=$(jq '.name' package.json | sed 's/\"//g')
export PORT
if [ "$NODE_ENV" != "development" ]; then
    printf "\nError: NODE_ENV should be set to development in .env\n";
    kill "$PPID"; exit 1;
fi

printf "\n*** Building Docker container. Please wait... \n***"
DOCKER_BUILDKIT=0 docker compose -f docker-compose-dev.yml up --build -d
if [ $? -ne 0 ]; then
    kill "$PPID"; exit 1;
fi

printf "\n*** Finished building. Please open:\n***"
printf "\n*** - http://localhost:${PORT} (local server)"
if [ "$PUBLIC_IP_ADDRESS" != "" ]; then
    printf "\n*** - http://${PUBLIC_IP_ADDRESS}:${PORT} (remote server)\n***\n";
fi
