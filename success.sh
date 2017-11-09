#!/usr/bin/env bash
echo 'Sending Discord Webhook';
export TIMESTAMP=$(date --utc +%FT%TZ);
export SHORT_COMMIT=${TRAVIS_COMMIT:0:7}
export COMMIT_FORMATTED="\\\`[$SHORT_COMMIT](https://github.com/$REPO_OWNER/$REPO_NAME/commit/$TRAVIS_COMMIT)\\\`";
curl -v -H User-Agent:bot -H Content-Type:application/json -d '{"avatar_url":"https://i.imgur.com/kOfUGNS.png","username":"Travis CI","embeds":[{"author":{"name":"Build #'"$TRAVIS_BUILD_NUMBER"' Passed - '"$AUTHOR_NAME"'","icon_url":"https://github.com/'"$AUTHOR_NAME"'.png","url":"https://github.com/'"$AUTHOR_NAME"'"},"url":"https://github.com/'"$REPO_OWNER"'/'"$REPO_NAME"'/commit/'"$TRAVIS_COMMIT"'","title":"['"$TRAVIS_REPO_SLUG"':'"$TRAVIS_BRANCH"'] ","color":65280,"fields":[{"name":"_ _", "value": "'"$COMMIT_FORMATTED"' - '"$TRAVIS_COMMIT_MESSAGE"'"}],"timestamp":"'"$TIMESTAMP"'","footer":{"text":"Node Version: '"$TRAVIS_NODE_VERSION"'"}}]}' $DISCORD_WEBHOOK_URL;
