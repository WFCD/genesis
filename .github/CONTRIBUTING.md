# Contribution

## Getting started

1. Fork this repo

2. Log or pick an issue

3. ... (Make your code changes)

4. Profit! (Submit a Pull Request)

5. We all profit. (Your pr is integrated)

## Guidelines

### Linting

Use the provided `.eslintrc.json` to lint your files, include any ignores in your pull request documentation with a reason why.


### Running

1. Get a bot token from the [discord application dashboard here](https://discordapp.com/developers/applications/me) and use it in a copy of `pm2.json`, we ignore `genesis.json` by default in our `.gitignore`.

2. Install [pm2](http://pm2.keymetrics.io/docs/usage/quick-start/).

3. Add any other applicable tokens to `genesis.json` (or whatever you called it).

4. Run `pm2 start genesis.json` to start the bot.

5. View logs in `pm2 logs genesis-test` if you wish to see logs for the process.

6. Invite the bot to your server using the format:

`https://discordapp.com/oauth2/authorize?scope=bot&client_id=<bot_client_id>&permissions=<permissions###>`.

### Resources

* [Permissions calculator](https://discordapi.com/permissions.html)

* warframe-worldstate-parser [Docs](https://warframe-community-developers.github.io/warframe-worldstate-parser)

* warframe-nexus-query [Docs](https://warframe-community-developers.github.io/warframe-nexus-query)

* Contact Tobiah on Discord [Cephalon Genesis guild](https://discord.gg/0onjYYKuUBHiR3LK)

## Contributors

Nspace
 * Awesome dude who's working on porting and updating the accumulated tech debt caused by hubot

Tobiah
 * Other dude who's helping, writing features, debugging, and sometimes sleeping
