const ms30d = 2592000000;

function timeToSeconds(time: string | undefined) {
  if (time === undefined) {
    return 0;
  }
  const a = time.split(':');
  return +a[0] * 60 * 60 + (+a[1] * 60 + +a[2]);
}

function safeNumber(value: number) {
  return Number.isNaN(value) ? 0 : value;
}

function formatTime(n: number) {
  const hours = safeNumber(Math.floor(n / 60 / 60));
  const minutes = safeNumber(Math.floor((n - hours * 60 * 60) / 60));
  const seconds = safeNumber(Math.round(n - hours * 60 * 60 - minutes * 60));
  const h = hours > 0 ? `${hours < 10 ? `0${hours}` : hours}:` : '';
  return `${h + (minutes < 10 ? `0${minutes}` : minutes)}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

function sortNumber(a: number, b: number) {
  return a - b;
}

function getBestTime(times: number[]) {
  return formatTime(times.sort(sortNumber)[0]);
}

function getAverageTime(times: number[]) {
  let sum = 0;
  for (let i = 0; i < times.length; i += 1) {
    sum += parseInt(String(times[i]), 10);
  }
  return formatTime(sum / times.length);
}

type RaidEntry = {
  type: string;
  objective: string;
  time: string;
  leaderboardGenerated: string;
  host: string;
  players: string[];
};

/** Aggregated raid leaderboard stats for a player. */
export default class RaidStat {
  successes = 0;

  completed = 0;

  best = '';

  average = '';

  successTimes: number[] = [];

  uniqueMems: string[] = [];

  thirty_successes = 0;

  thirty_completed = 0;

  thirty_times: number[] = [];

  thirty_average = '';

  constructor(userJson?: RaidEntry[], type?: string) {
    if (userJson) {
      this.calculateStats(userJson, type);
    }

    this.best = getBestTime(this.successTimes);
    this.average = getAverageTime(this.successTimes);
    this.thirty_average = getAverageTime(this.thirty_times);
  }

  calculateStats(json: RaidEntry[], type?: string) {
    const now = Date.now();
    json.forEach((raid) => {
      const raidDate = new Date(raid.leaderboardGenerated).getTime();
      const newerThan30Days = now - ms30d < raidDate;
      if (raid.type === type) {
        if (raid.objective === 'VICTORY') {
          this.successes += 1;
          this.successTimes.push(timeToSeconds(raid.time));
          if (newerThan30Days) {
            this.thirty_successes += 1;
            this.thirty_times.push(timeToSeconds(raid.time));
          }
        }
        this.completed += 1;
        if (newerThan30Days) {
          this.thirty_completed += 1;
        }
        raid.players.push(raid.host);
        raid.players.forEach((player) => {
          if (this.uniqueMems.indexOf(player) === -1) {
            this.uniqueMems.push(player);
          }
        });
      }
    });
  }

  toString() {
    return (
      `**Cleared:** ${this.successes}/${this.completed}\n` +
      `**Best Time:** ${this.best}\n` +
      `**Average Time:** ${this.average}\n` +
      `**Unique Party Members:** ${this.uniqueMems.length}\n` +
      `**Cleared (30d):** ${this.thirty_successes}/${this.thirty_completed}\n` +
      `**Average Time (30d):** ${this.thirty_average}`
    );
  }

  makeTotals(lor: RaidStat, lornm: RaidStat, jv: RaidStat) {
    this.successes = lor.successes + lornm.successes + jv.successes;
    this.completed = lor.completed + lornm.completed + jv.completed;
    this.best = getBestTime([timeToSeconds(lor.best), timeToSeconds(lornm.best), timeToSeconds(jv.best)]);
    this.average = getAverageTime([
      timeToSeconds(lor.average),
      timeToSeconds(lornm.average),
      timeToSeconds(jv.average),
    ]);
    this.successTimes = [].concat(lor.successTimes).concat(lornm.successTimes).concat(jv.successTimes);
    this.uniqueMems = [];
    lor.uniqueMems.forEach((mem) => {
      if (this.uniqueMems.indexOf(mem) === -1) {
        this.uniqueMems.push(mem);
      }
    });
    lornm.uniqueMems.forEach((mem) => {
      if (this.uniqueMems.indexOf(mem) === -1) {
        this.uniqueMems.push(mem);
      }
    });
    jv.uniqueMems.forEach((mem) => {
      if (this.uniqueMems.indexOf(mem) === -1) {
        this.uniqueMems.push(mem);
      }
    });

    this.thirty_successes = lor.thirty_successes + lornm.thirty_successes + jv.thirty_successes;
    this.thirty_completed = lor.thirty_completed + lornm.thirty_completed + jv.thirty_completed;
    this.thirty_times = [].concat(lor.thirty_times).concat(lornm.thirty_times).concat(jv.thirty_times);

    this.best = getBestTime(this.successTimes);
    this.average = getAverageTime(this.successTimes);
    this.thirty_average = getAverageTime(this.thirty_times);
  }
}
