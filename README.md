![Genesis Avatar](src/resources/cephalon-discord-dark.png)

# Project Genesis
A [Discord.js](http://hydrabolt.github.io/discord.js) bot for tracking Warframe alerts, invasions and more.

# Contribute

[![Stories in Ready](https://badge.waffle.io/aliasfalse/genesis.png?label=ready&title=Ready)](http://waffle.io/aliasfalse/genesis)

Feel free to submit a pull request. We are working on build checks and tests, and we use aribnb's codestyle and eslint configuration. Plugins for auto-linting on save are available for many popular editors.


## Get Help on Discord

[![Contact me on Discord](https://img.shields.io/badge/discord-Tobiah%238452-7289DA.svg)](https://discord.gg/0ycgfahdR8gTzWgM "Contact me on Discord: Tobiah#8452")

[![Try Genesis on Discord!](https://discordapp.com/api/guilds/146691885363232769/embed.png?style=shield)](https://discord.gg/0onjYYKuUBHiR3LK "Try Genesis on Discord!")



## Installation

1. Clone this repo

    ```
    git clone git@github.aliasfalse/genesis.git
    ```
2. Install mongodb server or obtain an available mongodb server

3. Run `npm install`

4. Run your bot and see below for available config / commands

## Configuration

Genesis requires a MongoDB server. It uses the **MONGODB_URL** environment variable for determining where to connect to

Environment Variable | Description | Example | Default
--- | --- | --- | ---
MONGODB_URL | connection url for mongodb | `mongodb://<host>:<port>/<database>` | N\A
LOCATION_MAX_CACHED_TIME | Maximum amount of time to cache location data | 600000 | 30000

## Commands

Command | Listener ID | Description
--- | --- | ---
`genesis start` |  | Adds user to DB and starts tracking
`genesis settings` |  | Returns settings
`genesis alerts` |  | Displays active alerts
`genesis baro` |  | Displays current Baro Ki'Teer status/inventory
`genesis darvo` |  | Displays current Darvo Daily Deal
`genesis end` |  | Hide custom keyboard (telegram only)
`genesis invasions` |  | Displays current Invasions
`genesis news` |   | Displays news
`genesis platform <platform>` |  | Changes the platform
`genesis platform` |  | Displays menu
`genesis settings` |  | Display settings menu
`genesis stop` |  | Turn off notifications
`genesis track <reward or event>` |  | Start tracking reward or event
`genesis track` |  | Tracking menu
`genesis untrack <reward or event>` |  | Stop tracking reward or event
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
user1>> /start

genesis>> Tracking started

user1>> /settings

genesis>> 
Your platform is PC
Alerts are OFF
Invasions are OFF
News are OFF

Tracked rewards:
Alternative helmets
ClanTech resources
Nightmare Mods
Auras
Resources
Nitain Extract
Void Keys
Weapon skins
Weapons
Other rewards

user1>> /end

genesis>> Done

```
