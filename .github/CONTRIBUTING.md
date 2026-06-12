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

1. Get a bot token from the [Discord application dashboard](https://discord.com/developers/applications) and add it to `.env.local` (copy from [`.env.example`](.env.example)).

2. Install [Docker](https://docs.docker.com/get-docker/) and run `npm ci` at the repo root.

3. Start the stack: `npm run docker:up`

4. View logs: `docker compose logs -f bot` (or `worker`).

5. Invite the bot to your server using the format:

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
 * ~~Other dude who's helping, writing features, debugging, and sometimes sleeping~~ Other dude who took over after a while, actively maintaining and trying to make genesis the best & most utilitous Warframe bot he can 
