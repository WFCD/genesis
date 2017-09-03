# Project Genesis <img src="src/resources/genesis-vector-cyan.png" height="25" width="25" alt="Genesis Avatar"/>

[![Supported by Warframe Community Developers](https://raw.githubusercontent.com/WFCD/banner/master/banner.png)](https://github.com/WFCD "Supported by Warframe Community Developers")
### A [Discord.js](http://discord.js.org) bot for tracking Warframe alerts, invasions and more. 

# Contribute

[![Stories in Ready](https://badge.waffle.io/aliasfalse/genesis.png?label=ready&title=Ready)](http://waffle.io/aliasfalse/genesis)

Feel free to submit a pull request. We are working on build checks and tests, and we use aribnb's codestyle and eslint configuration. Plugins for auto-linting on save are available for many popular editors.


## Thanks Discord, Legalese things

Due to the New Discord T.O.S , if you continue to use, participate, be in, or not leave Cephalon Sanctuary, you agree to allowing me, any person, user, or member, any bot, service, app, and anything to collect, use, transmit, or any data related to your user account, any data made available by Discord in the API or SDK, any metadata from your user account, any messages and or content you send, and anything else you do or give by staying in Cephalon Sanctuary, or by using my bot.

If you do not agree to letting Genesis, Oratoris, or any other bot there do so, please kick Genesis from your clan or depart from Cephalon Sanctuary.

## Get Help on Discord

[![Try Genesis on Discord!](https://discordapp.com/api/guilds/146691885363232769/embed.png?style=banner2)](https://discord.gg/DuFunUv "Try Genesis on Discord!")

[![Get Genesis on Discord](src/resources/ceph-gen-banner.png)](https://bot.discord.io/genesis "Add Cephalon Genesis to your Server!")


## Installation

1. Clone this repo

    ```
    git clone git@github.warframe-community-developers/genesis.git
    ```
1. Install mysql server and configure a database to store settings and data

1. Run `npm i`

1. Start bot with [pm2](http://pm2.keymetrics.io/) using a copy of the provided `pm2.json` file.

1. See below for available config / commands

## Configuration

Genesis requires a MySQL server. It uses the **MYSQL_*** environment variables for determining where to connect to

Environment Variable | Description | Example | Default
--- | --- | --- | ---
TOKEN | Discord connection token | `mfa.234089sdfasdf20dfada,f.asd` | N\A
LOCATION_MAX_CACHED_TIME | Maximum amount of time to cache location data | 600000 | 60000
NEXUSSTATS_MAX_CACHED_TIME | Maximum amount of time to cache nexus stats data | 600000 | 60000
LOG_LEVEL | Logging level of the bot, including info, debug, error, fatal | `DEBUG` | `ERROR`
MYSQL_DB | MySQL database name, used for connecting to data provider and storage | `genesis` | `genesis`
MYSQL_PASSWORD | MySQL database connection password | `password` | N\A
MYSQL_USER | MySQL database connection user | `genesis` | `genesis`
MYSQL_PORT | MySQL database connection port | 3306 | 3306
MYSQL_HOST | Hostname for conneting to MySQL | `localhost` | `localhost`
SHARD_OFFSET | Offset of the first shard id for the local shards, default 0 | 2 | 0
LOCAL_SHARDS | Number of shards locally | 2 | 1
SHARDS | Total number of shards | 1 | 1
OWNER | ID of the person owning/running the bot, used for checking permissions
DISCORD_BOTS_WEB_TOKEN | Token used to update bots.discord.pw bot statistics | `as;dofiahsdf` | N\A
DISCORD_BOTS_WEB_USER | Bot user id on bots.discord.pw to update with server count | 6456514654966321321 | N\A
DISCORD_CARBON_TOKEN | Carbonitex bot token for posting server data to Carbonitex | `as;dofiahsdf` | N\A
PREFIX | Default prefix to use for the instance | `\` | `\`
RAVEN_URL | DSN url for logging data  to Sentry | `'https://***:***@sentry.io/***' | N\A

## Commands

Command | Listener ID | Description
--- | --- | ---
`genesis settings` |  | Returns settings in a direct message
`genesis alerts` |  | Displays active alerts
`genesis baro` |  | Displays current Baro Ki'Teer status/inventory
`genesis darvo` |  | Displays current Darvo Daily Deal
`genesis invasions` |  | Displays current Invasions
`genesis news` |   | Displays news
`genesis platform <platform>` |  | Changes the platform
`genesis platform` |  | Displays usage
`genesis simaris` |  | Get Synthesis target tracking
`genesis update` |  | Display current update
`genesis primeaccess` |  | Display current Prime Access news
`genesis damage` |  | Display link to Damage 2.0 infographic
`genesis armor`  |  | Display instructions for calculating armor
`genesis armor <current armor>` |  | Display current damage resistance and amount of corrosive procs required to strip it
`genesis armor <base armor> <base level> <current level>` | |  Display the current armor, damage resistance, and necessary corrosive procs to strip armor.
`genesis shield`  |  | Display instructions for calculating armor
`genesis shield <base shield> <base level> <current level>` | |  Display the current shields.
`genesis conclave` |  | Display usage for conclave command
`genesis conclave all` |  | Display all conclave challenges
`genesis conclave daily` |  | Display active daily conclave challenges
`genesis conclave weekly` |  | Display active weekly conclave challenges
`genesis enemies` |  | Display list of active persistent enemies where they were last found

## Sample Interaction

```
... to come later, want to finish more of the functionality
```


## Throughput

[![Throughput Graph](https://graphs.waffle.io/aliasfalse/genesis/throughput.svg)](https://waffle.io/aliasfalse/genesis/metrics/throughput)


## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
