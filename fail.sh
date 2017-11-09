echo 'Sending Discord Webhook';
export TIMESTAMP=$(date --utc +%FT%TZ);
curl -v -H User-Agent:bot -H Content-Type:application/json -d '{"avatar_url": "https://i.imgur.com/kOfUGNS.png", "username": "Travis CI", "embeds": [{"author": {"name": "'"$AUTHOR_NAME"'", "url": "https://github.com/WFCD/Genesis/commit/'"$TRAVIS_COMMIT"'", "icon_url": "https://github.com/'"$AUTHOR_NAME"'.png"}, "title": "['"$TRAVIS_REPO_SLUG"':'"$TRAVIS_BRANCH"'] Build #'"$TRAVIS_BUILD_NUMBER"' Failed", "color": 16711680,"description": "'"$TRAVIS_COMMIT_MESSAGE"'", "timestamp": "'"$TIMESTAMP"'"}]}' $DISCORD_WEBHOOK_URL;
