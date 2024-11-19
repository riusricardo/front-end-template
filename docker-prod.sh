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
export PUBLIC_IP_ADDRESS NODE_ENV PORT_NGINX PORT_PROD
export APP_NAME=$(jq '.name' package.json | sed 's/\"//g')
if [ "$NODE_ENV" != "production" ]; then
    printf "\nError: NODE_ENV should be set to production in .env\n";
    kill "$PPID"; exit 1;
fi
echo ${PUBLIC_IP_ADDRESS:=$PUBLIC_IP_ADDRESS_FALLBACK}
if [ "$PUBLIC_IP_ADDRESS" = "" ]; then
    printf "\nError: PUBLIC_IP_ADDRESS should be set in .env\n";
    kill "$PPID"; exit 1;
fi
export PUBLIC_URL="http://${PUBLIC_IP_ADDRESS}:${PORT_PROD}"

printf "\n*** Building $NODE_ENV $APP_NAME. Please wait...\n***"
DOCKER_BUILDKIT=0 docker compose -f docker-compose-prod.yml up --build -d
if [ $? -ne 0 ]; then
    kill "$PPID"; exit 1;
fi

printf "\n*** Finished building ${NODE_ENV}.\n***"
printf "\n*** Please open: ${PUBLIC_URL}.\n***\n"
