#!/bin/bash
if [ "$1" = "" ]; then
    echo "First parameter should be the base url to the service."
    echo "Example:"
    echo "\$ $0 'https://us-central1-keyservice-195412.cloudfunctions.net/keyservice'"
fi

URL="$1"

req() {
  METHOD="$1"
  ENDPOINT="$2"
  DATA="$3"
  curl \
    -X $METHOD \
    -H  "Content-Type: application/json" \
    -d "$DATA" \
    "$URL$ENDPOINT" \
    2>/dev/null
}

sessreq() {
  METHOD="$1"
  ENDPOINT="$2"
  ID="$3"
  SECRET="$4"
  DATA="$5"
  TIME="$(LC_ALL=C LANG=en date +"%a, %d %b %Y %T %z")"
  NONCE="$(openssl rand 63 -hex)"
  HEXVAL="$NONCE$(echo -n $METHOD$ENDPOINT$DATA$TIME | xxd -p | tr -d "\n")"
  HASH="$(echo -n "$HEXVAL" | xxd -r -p | openssl dgst -sha512 -mac HMAC -macopt "hexkey:$(echo -n "$SECRET" | xxd -p | tr -d "\n")" | cut -d" " -f2)"

  if [ "$DATA" = "" ]; then

    curl \
      -X $METHOD \
      -H "Authorization: ss1 keyid=$ID, hash=$HASH, nonce=$NONCE" \
      -H "Date: $TIME" \
      "$URL$ENDPOINT" \
      2>/dev/null

  else

    curl \
      -X $METHOD \
      -H "Authorization: ss1 keyid=$ID, hash=$HASH, nonce=$NONCE" \
      -H "Content-Type: application/json" \
      -H "Date: $TIME" \
      -d "$DATA" \
      "$URL$ENDPOINT" \
      2>/dev/null
  fi

}

#
# CREATE ACCOUNT
#

USERNAME0="johndoe$(date '+%s')"
USERNAME1="mrx$(date '+%s')"

SESS="$(req POST /account "{\"userIds\":[\"$USERNAME0\",\"$USERNAME1\"],\"password\":\"topsecret\"}")"
SESSID="$(echo "$SESS" | jq -r .session.id)"
SESSSECRET="$(echo "$SESS" | jq -r .session.secret)"

if [ "$SESSID" = "null" ]; then
    >&2 echo "Could not create user/session:"
    >&2 echo "$SESS"
    exit 1
fi

ERROR=""

#
# STORE SOME DATA
#

DATA="{ \"test\": 123 }"

RES="$(sessreq PUT /privdata/hello "$SESSID" "$SESSSECRET" "$DATA")"
if [ "$RES" != "{}" ]; then
  ERROR="true"
  >&2 echo "Could not store data:"
  >&2 echo "$RES"
fi

#
# NEW SESSION / LOGIN
#

SESS="$(req POST /account/login "{\"userId\":\"$USERNAME0\",\"password\":\"topsecret\"}")"
SESSID="$(echo "$SESS" | jq -r .session.id)"
SESSSECRET="$(echo "$SESS" | jq -r .session.secret)"

if [ "$SESSID" = "null" ]; then
  ERROR="true"
  >&2 echo "Could not create new session / login:"
  >&2 echo "$SESS"
fi

#
# FETCH THE STORED DATA
#

RES="$(sessreq GET /privdata/hello "$SESSID" "$SESSSECRET")"
if [ "$RES" != "$DATA" ]; then
  ERROR="true"
  >&2 echo "Data fetched is not the same data as was stored."
fi

#
# UPDATE USERIDS
#

USERNAME2="mynick$(date '+%s')"
RES="$(sessreq PUT /account "$SESSID" "$SESSSECRET" "{\"userIds\":[\"$USERNAME1\",\"$USERNAME2\"]}")"
if [ "$RES" != "{}" ]; then
  ERROR="true"
  >&2 echo "Could not change user id:"
  >&2 echo "$RES"
fi

#
# CHANGE PASSWORD:
#

RES="$(sessreq POST /account/password "$SESSID" "$SESSSECRET" "{\"previousPassword\":\"topsecret\",\"password\":\"qwerty\"}")"
if [ "$RES" != "{}" ]; then
  ERROR="true"
  >&2 echo "Could not change password:"
  >&2 echo "$RES"
fi

#
# NEW SESSION / LOGIN WITH NEW USERID AND PASSWORD:
#

SESS="$(req POST /account/login "{\"userId\":\"$USERNAME2\",\"password\":\"qwerty\"}")"
SESSID="$(echo "$SESS" | jq -r .session.id)"
SESSSECRET="$(echo "$SESS" | jq -r .session.secret)"

if [ "$SESSID" = "null" ]; then
  ERROR="true"
  >&2 echo "Could not create new session / login with new userid and password:"
  >&2 echo "$SESS"
fi

#
# DELETE ACCOUNT
#

RES="$(sessreq DELETE /account "$SESSID" "$SESSSECRET" '')"
if [ "$RES" != "{}" ]; then
  ERROR="true"
  >&2 echo "Could not delete account:"
  >&2 echo "$RES"
fi

#
# EXITCODE ON ERROR
#

if [ "$ERROR" != "" ]; then
  exit 1
fi
