
// include Discord API
const { Client, Intents, Collection, MessageEmbed } = 
  require('discord.js');
const { SlashCommandBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle } = 
	require('@discordjs/builders');

// include REST and Discord API types
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// use crypto for random characters
var crypto = require('crypto');
// mysql
var mysql = require('mysql2/promise');
// sprintf
var sprintf = require('sprintf-js').sprintf;

// standard node libraries
const fs = require('fs');

// include our own configuration settings
const config = require("./config.json");

// ----------------------------------------------------------
// VARIABLES
// ----------------------------------------------------------

var timeLimit = 5*60;		// in seconds
var timeRefresh = 30;		// in seconds
//var timeLimit = 5*60;		// in seconds
//var timeRefresh = 60;		// in seconds
var db = [];

// ----------------------------------------------------------
// SLASH COMMANDS
// ----------------------------------------------------------

var slashCommands = [];
// bs-clearall
var bsclearall = new SlashCommandBuilder()
  .setName('bs-clearall')
  .setDescription('Clear all tables');
slashCommands.push(bsclearall);
// bs-game-add
var bsgameadd = new SlashCommandBuilder()
  .setName('bs-gameadd')
  .setDescription('Add a new game definition')
  .addIntegerOption(option =>
    option.setName('demonum')
      .setDescription('Demo Option Number')
      .setRequired(true)
  );
slashCommands.push(bsgameadd);
// bs-game-show
var bsgameshow = new SlashCommandBuilder()
  .setName('bs-gameshow')
  .setDescription('Show all games, or details on a specific one')
  .addIntegerOption(option =>
    option.setName('gamenum')
      .setDescription('Game Number')
  );
slashCommands.push(bsgameshow);

// ----------------------------------------------------------
// DATABASE FUNCTIONS
// ----------------------------------------------------------

// create a database connection
async function dbConnect() {
  // defaults
  var ret = { status: false, error: '' };
  var db = {};
  // mysql connect
  try {
    db = await mysql.createConnection({
      host:       config.dbhost,
      user:       config.dbuser,
      password:   config.dbpass,
      database:   config.dbname
    });
  } catch (error) {
    ret.error = 'could not connect to database';
    return [ret, db];
  }
  db.connect();
  // return result
  ret.status = true;
  return [ret, db];
}

// ----------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------

const zeroPad = (num, places) => String(num).padStart(places, '0');

async function codeRandom() {
  coderaw = crypto.randomBytes(8).toString('hex');
  codea = coderaw.match(/.{4}/g);
  code = "cbvc-" + codea.join('-');
  return code;
}

// ----------------------------------------------------------
// BROKER INFO
// ----------------------------------------------------------

async function apiBrokerGet(tokenId) {
  // defaults
  var ret = { status: false, broker: {}, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return ret;
  }

  // create sql command
  sql = "SELECT * FROM nfts WHERE nftid = ?";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [tokenId]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return ret;
  }
  // close database
  db.end();

  // return result
  ret.status = true;
  ret.broker = rows[0];
  return ret;
}

// ----------------------------------------------------------
// GAME SETUP
// ----------------------------------------------------------

async function apiGameCreate(game) {
  // defaults
  var ret = { status: false, gameNum: -1, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return ret;
  }

  // create sql command
  sql = "INSERT INTO setup_games (gname, gdesc, ginstr, grewards, regstart, regend, gstart, gend, regtype, loaners, lwallets, lexempt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [
      game.gname, game.gdesc, game.ginstr, game.grewards,
      game.regstart, game.regend,
      game.gstart, game.gend,
      game.regtype,
      game.loaners, game.lwallets, game.lexempt
      ]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return ret;
  }
  // close database
  db.end();
  // return result
  ret.status = true;
  ret.gameNum = rows.insertId;
  return ret;
}

async function apiGameStageCreate(stage) {
  // defaults
  var ret = { status: false, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return ret;
  }

  // create sql command
  sql = "INSERT INTO setup_stages (idgame, idstage, sname, sdesc, sinstr) VALUES (?, ?, ?, ?, ?)";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [
      stage.idgame, stage.idstage,
      stage.sname, stage.sdesc, stage.sinstr
      ]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return ret;
  }
  // close database
  db.end();
  // return result
  ret.status = true;
  return ret;
}

async function apiGameRoundGet(gameNum,roundNum) {
  // defaults
  var ret = { status: false, found: false, error: '' };
  var data = {};

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return [ret, data];
  }

  // create sql command
  sql = "SELECT * FROM setup_rounds WHERE idgame = ? AND idround = ?";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [
      gameNum, roundNum
      ]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return [ret, data];
  }
  if (rows.length < 1) {
    ret.error = 'Could not find Round ' + roundNum + ', Game ' + gameNum;
    return [ret, data];
  }

  // close database
  db.end();

  // return result
  data = rows[0];
  ret.status = true;
  ret.found = true;
  return [ret, data];
}

async function apiGameRoundCreate(round) {
  // defaults
  var ret = { status: false, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return ret;
  }

  // create sql command
  sql = "INSERT INTO setup_rounds (idgame, idstage, idround, rname, rdesc, rinstr, votetype, remtype, remnum, rlength) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [
      round.idgame, round.idstage, round.idround,
      round.rname, round.rdesc, round.rinstr,
      round.votetype, round.remtype, round.remnum,
      round.rlength
      ]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return ret;
  }
  // close database
  db.end();
  // return result
  ret.status = true;
  return ret;
}

async function apiGameClearAll() {

  // defaults
  var ret = { status: false, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return ret;
  }

  sql = "DELETE FROM setup_games";
  [rows, fields] = await db.query(sql);
  sql = "DELETE FROM setup_stages";
  [rows, fields] = await db.query(sql);
  sql = "DELETE FROM setup_rounds";
  [rows, fields] = await db.query(sql);
  sql = "DELETE FROM players";
  [rows, fields] = await db.query(sql);
  sql = "DELETE FROM votes";
  [rows, fields] = await db.query(sql);
  sql = "DELETE FROM rounds";
  [rows, fields] = await db.query(sql);

  // close database
  db.end();
  // return result
  ret.status = true;
  return ret;
}

async function apiGamesGet() {
  // defaults
  var ret = { status: false, error: '' };
  var data = [];

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return [ret, data];
  }

  // create sql command
  sql = "SELECT * from setup_games";
  // execute sql
  try {
    [rows, fields] = await db.query(sql);
  } catch (error) {
    ret.error = error.sqlMessage;
    return [ret, data];
  }
  // close database
  db.end();

  // return result
  if (rows.length > 0) {
    data = rows;
  }
  ret.status = true;
  return [ret, data];
}

async function apiGameGet(gameNum) {
  // defaults
  var ret = { status: false, error: '' };
  var data = {};

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return [ret, data];
  }

  // get game object
  sql = "SELECT * from setup_games where idgame = ?";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [gameNum]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return [ret, data];
  }
  if (rows.length > 0) {
    data = rows[0];
  } else {
    ret.error = 'Game Number ' + gameNum + ' not found';
    return [ret, data];
  }

  // get rounds 
  sql = "SELECT * from setup_rounds where idgame = ?";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [gameNum]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return [ret, data];
  }
  if (rows.length > 0) {
    data.rounds = rows;
  }
  // close database
  db.end();
  // return
  ret.status = true;
  return [ret, data];
}

// async function apiPlayersGet(gameNum,roundNum) {
async function apiPlayersRemainingGet(gameNum) {
  // defaults
  var ret = { status: false, error: '' };
  var data = {};

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return [ret, data];
  }

  // create sql command
  sql = "SELECT * FROM players WHERE idgame = ? AND ingame = 1";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [gameNum]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return [ret, data];
  }
  if (rows.length < 1) {
    ret.error = 'Could not find Round ' + roundNum + ', Game ' + gameNum +
      'players';
    return [ret, data];
  }

  // close database
  db.end();

  // return
  data = rows;
  ret.status = true;
  return [ret, data];
}

async function gamePlayerProgress(tokenId,gameNum,stageNum,roundNum) {
  // defaults
  var ret = { status: false, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return ret;
  }

  // create sql command
  sql = "UPDATE players SET idstage = ?, idround = ? WHERE idgame = ? and tokenid = ?";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [
      stageNum, roundNum,
      gameNum, tokenId
      ]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return ret;
  }

  // close database
  db.end();

  // return
  ret.status = true;
  return ret;
}

async function gamePlayerOut(tokenId,gameNum) {
  // defaults
  var ret = { status: false, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return ret;
  }

  // create sql command
  sql = "UPDATE players SET ingame = 0 WHERE idgame = ? and tokenid = ?";
  // execute sql
  try {
    [rows, fields] = await db.query(sql, [ gameNum, tokenId ]);
  } catch (error) {
    ret.error = error.sqlMessage;
    return ret;
  }

  // close database
  db.end();

  // return
  ret.status = true;
  return ret;
}

async function apiPlayersAdd(gameNum,method) {
  // defaults
  var ret = { status: false, 
    error: 'Player Add Method ' + method + ' not found' };

  // add based on method
  switch (method) {
    case 'demo200':
      resp =  await _registrationDemo200(gameNum);
      ret = resp;
      break;
    default:
      break;
  }

  return ret;
}

async function _registrationDemo200(gameNum) {
  // defaults
  var ret = { status: false, error: '' };

  // get db connection
  [resp, db] = await dbConnect();
  if (! resp.status) {
    ret.error = resp.error;
    return [ret, data];
  }

  tstamp = new Date().getTime() / 1000;

  // pick 200 random brokers
  players = [];
  for (let x=0; x<200; x++) {
    // pick random broker
    while (true) {
      tokenId = crypto.randomInt(1,10000);
      if (! players.includes(tokenId)) {
	players.push(tokenId);
	break;
      }
    }
    // pick random wallet address
    waddr = '0x' + crypto.randomBytes(20).toString('hex');
    // create sql
    sql = "INSERT INTO players (idgame, waddr, tokenid, owned, tstamp, idstage, idround, ingame) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    // execute sql
    try {
      [rows, fields] = await db.query(sql, [
	gameNum, waddr, tokenId,
	1, tstamp,
	1, 1, 1
      ]);
    } catch (error) {
      ret.error = error.sqlMessage;
    }
  }

  ret.status = true;
  return ret;
}


// ----------------------------------------------------------
// DEMO CREATIONS
// ----------------------------------------------------------

const timeMinute = 60;
const timeHour = timeMinute * 60;
const timeDay = timeHour * 24;

async function gameDemo1(interaction) {

  // defaults 
  retmsg = 'Something went wrong, terribly wrong..';

  // create game
  game = {
    gname: 'Demo 1: 2sr 200 brokers',
    gdesc: 'A demo game to run quickly, 2 stages, 2 rounds per stage, 200 brokers registered, 60 second rounds, random remove actions, starts in 1 minute',
    ginstr: 'instructions here',
    grewards: 'rewards details here',
    regstart: (new Date().getTime() / 1000) - (timeHour * 3),
    regend: (new Date().getTime() / 1000) - (timeHour * 2),
    gstart: (new Date().getTime() / 1000) + timeMinute,
    gend: (new Date().getTime() / 1000) + (timeMinute * 10),
    regtype: 'demo200',
    loaners: false,
    lwallets: '',
    lexempt: '',
  };
  resp = await apiGameCreate(game);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_games table';
    return retmsg;
  }
  gameNum = resp.gameNum;

  // add stages
  stage1 = {
    idgame: gameNum,
    idstage: 1,
    sname: 'Demo: 1st stage',
    sdesc: 'Demo stage with 2 rounds',
    sinstr: 'instructions here'
  };
  resp = await apiGameStageCreate(stage1);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_stages table';
    return retmsg;
  }
  stage2 = JSON.parse(JSON.stringify(stage1));
  stage2.idstage = 2;
  stage2.sname = 'Demo: 2nd stage';
  resp = await apiGameStageCreate(stage2);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_stages table';
    return retmsg;
  }
  stage3 = JSON.parse(JSON.stringify(stage1));
  stage3.idstage = 3;
  stage3.sname = 'Demo: Final';
  resp = await apiGameStageCreate(stage3);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_stages table';
    return retmsg;
  }

  // add rounds
  round1 = {
    idgame: gameNum,
    idstage: 1,
    idround: 1,
    rname: 'Demo: Stage 1 - Round 1',
    rdesc: 'Demo Round',
    rinstr: 'instructions here',
    votetype: 'stagep',
    remtype: 'random',
    remnum: 75,
    rlength: 1
  };
  resp = await apiGameRoundCreate(round1);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_rounds table';
    return retmsg;
  }
  round2 = JSON.parse(JSON.stringify(round1));
  round2.idround = 2;
  round2.rname = 'Demo: Stage 1 - Round 2';
  resp = await apiGameRoundCreate(round2);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_rounds table';
    return retmsg;
  }
  round3 = JSON.parse(JSON.stringify(round1));
  round3.idround = 3;
  round3.idstage = 2;
  round3.rname = 'Demo: Stage 2 - Round 3';
  round3.remnum = 25;
  resp = await apiGameRoundCreate(round3);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_rounds table';
    return retmsg;
  }
  round4 = JSON.parse(JSON.stringify(round3));
  round4.idround = 4;
  round4.rname = 'Demo: Stage 2 - Round 4';
  round4.remnum = 24;
  resp = await apiGameRoundCreate(round4);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_rounds table';
    return retmsg;
  }
  round5 = JSON.parse(JSON.stringify(round4));
  round5.idround = 5;
  round5.rname = 'Demo: Stage 2 - Round 5';
  round5.remnum = 0;
  resp = await apiGameRoundCreate(round5);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add entry to setup_rounds table';
    return retmsg;
  }

  // add players
  regMethod = 'demo200';
  resp = await apiPlayersAdd(gameNum,regMethod);
  if (!resp || !resp.status) {
    retmsg = 'Unable to add players for method ' + regMethod;
    return retmsg;
  }

  // start game
  setTimeout(
    gameStart,
    1000 * 15,
//    1000 * timeMinute,
    interaction,
    gameNum
  );

  // return
  retmsg = 'Game Number ' + gameNum + ' has been started';
  return retmsg;
}

async function gameStart(interaction, gameNum) {

  // get required discord objects
  guild = await client.guilds.cache.get(interaction.guildId);
  channel = await guild.channels.cache.get(interaction.channelId);

  // display game
  retmsg = await gameDisplay(gameNum);
  channel.send(retmsg);

  // start Round 1
  setTimeout(
    gameRound,
    1000 * 15,
//    1000 * timeMinute,
    interaction,
    gameNum,
    1
  );
}

const embedResults = {
  color: 0x0099ff,
  title: 'Broker Survivor - Game X',
  url: 'https://cyberbrokers.io/',
  author: {
    name: 'CyberBrokers',
    iconURL: 'https://www.cartarl.com/images/cb/cb-logo.png'
  },
  description: '',
  thumbnail: {
    url: 'https://www.thefizzy.io/images/display-orange-results.png'
  },
  fields: [],
  image: {
    url: '',
  },
  footer: {
    text: 'I\'m Jetta Stumped, your host for Broker Survivor.',
    iconURL: 'https://www.thefizzy.io/images/icons/talent/puzzlemaster-dark.png'
  }
};
const embedWinner = {
  color: 0x0099ff,
  title: 'Broker Survivor - Game X',
  url: 'https://cyberbrokers.io/',
  author: {
    name: 'CyberBrokers',
    iconURL: 'https://www.cartarl.com/images/cb/cb-logo.png'
  },
  description: '',
  thumbnail: {
    url: 'https://www.thefizzy.io/images/display-orange-winner.png'
  },
  fields: [],
  image: {
    url: '',
  },
  footer: {
    text: 'I\'m Jetta Stumped, your host for Broker Survivor.',
    iconURL: 'https://www.thefizzy.io/images/icons/talent/puzzlemaster-dark.png'
  }
};
async function gameRound(interaction, gameNum, roundNum) {

  // default
  end = false;

  // get required discord objects
  guild = await client.guilds.cache.get(interaction.guildId);
  channel = await guild.channels.cache.get(interaction.channelId);

  // get round info
  [resp, round] = await apiGameRoundGet(gameNum, roundNum);
  if (round.remnum == 0) {
    end = true;
  }

  // get next round info
  [resp, nround] = await apiGameRoundGet(gameNum, roundNum + 1);

  // get players
  [resp, players] = await apiPlayersRemainingGet(gameNum);

  // are we done ?
  if (end) {
    // get winner & broker data
    winner = players[0];
    broker = {};
    resp = await apiBrokerGet(winner.tokenid);
    console.log(resp);
    if (resp && resp.status) {
      broker = resp.broker;
    }

    // create winning embed
    embed = JSON.parse(JSON.stringify(embedWinner));      // deep copy
    embed.title = sprintf('Broker Survivor - Game %1s',gameNum);
    winTitle = 'Winner !';
    winMsg = '';
    winMsg += sprintf('`CB-%1s` \u200b %2s\n', winner.tokenid, broker.name);
    winMsg += sprintf('%1s | %2s\n', broker.talent, broker.class);
//    winMsg += sprintf('%1s\n', winner.discord);
    winMsg += sprintf('%1s\n', winner.waddr);
    embed.fields.push( {
      name: winTitle, value: winMsg, inline: false});
    embed.image.url = sprintf('https://www.thefizzy.io/images/brokers/medium/broker-%1s.png',winner.tokenid);

    channel.send({ embeds: [embed]});
    return;
  }

  // randomly vote out
  outIndex = [];
  for (let x=0; x<round.remnum; x++) {
    // pick random broker
    while (true) {
      out = crypto.randomInt(0,players.length);
      if (! outIndex.includes(out)) {
	outIndex.push(out);
	break;
      }
    }
  }

  // update players
  outTokenIds = [];
  for (let index=0; index<players.length; index++) {
    // get player
    player = players[index];
    // in/out of game
    ingame = outIndex.includes(index) ? 0 : 1;
    // update player
    if (ingame) {
      await gamePlayerProgress(player.tokenid,gameNum,nround.idstage,nround.idround);
    } else {
      outTokenIds.push(player.tokenid);
      await gamePlayerOut(player.tokenid,gameNum);
    }
  }

  // update round

  // message
  roundRemove = round.remnum;
  votesTotal = 0;
  votesBrokers = 0;
  votesOut = 0;
  autoMethod = 'Random';
  autoOut = roundRemove - votesOut;
  brokersOut = outTokenIds;

  embed = JSON.parse(JSON.stringify(embedResults));      // deep copy
  embed.title = sprintf('Broker Survivor - Game %1s',gameNum);
  summaryTitle = sprintf('Round %1s Summary',roundNum);
  summaryMsg = '';
  summaryMsg += sprintf('`Voted Out` \u200b  %1s\n',roundRemove);
  summaryMsg += sprintf('`Voting   ` \u200b  Out: %1s, \u200bTotal %1s, \u200bBrokers: %2s\n',
    votesOut, votesTotal, votesBrokers);
  summaryMsg += sprintf('`Auto     ` \u200b  Out: %1s, \u200bMethod: %2s\n',
    autoOut, autoMethod);
  embed.fields.push( {
      name: summaryTitle, value: summaryMsg, inline: false});

  outMsg = '';
  outCount = 1;
  outFirst = true;
  breakNum = Math.floor(roundRemove / 3);
  for (tokenId of brokersOut) {
    outMsg += sprintf('`CB-%1s`\n', tokenId.toString().padStart(5,'0'));
    outCount++;
    if (outCount > breakNum) {
      outTitle = '** **';
      if (outFirst) {
	outTitle = 'Voted Out'; 
	outFirst = false;
      }
      outCount = 1;
      embed.fields.push({ name: outTitle, value: outMsg, inline: true });
      outMsg = '';
    }
  }

  nextTitle = 'Next Round Ends';
  nextMsg = '';
  nextMsg += '<t:1663201629:f>';
  embed.fields.push({ name: nextTitle, value: nextMsg, inline: false });

  channel.send({ embeds: [embed]});

  // setup next round
  setTimeout(
    gameRound,
    1000 * 15,
//    1000 * timeMinute,
    interaction,
    gameNum,
    roundNum + 1
  );
}

async function gameDisplay(gameNum) {

  retmsg = '**Game: ' + gameNum + '**:\n';

  [resp, game] = await apiGameGet(gameNum);

  retmsg += game.idgame + ' - ' + game.gname + '\n';
  retmsg += ' Registration Start: ' + Date(game.regstart) + '\n';
  retmsg += ' Registration Type: ' + game.regtype + '\n';
  retmsg += ' Game Start: ' + Date(game.regstart) + '\n';
  retmsg += 'Rounds\n';
  for (round of game.rounds) {
    retmsg += ' Round: ' + round.idround + ' Stage: ' + round.idstage +
	' ' + round.votetype + ' ' + round.remtype + ' ' + 
	round.remnum + ' ' + round.rlength + '\n';
  }
  retmsg += '** **\n';
 
  return retmsg;
}

// ----------------------------------------------------------
// SLASH COMMANDS
// ----------------------------------------------------------

async function cmdGameAdd(interaction) {

  // defaults
  retmsg = 'The game option you selected is not currently available';

  // get game option from command
  demoNum = interaction.options.getInteger('demonum');

  // process based on command option
  switch (demoNum) {
    case 1:
      retmsg = await gameDemo1(interaction); 
      break;
    default:
      break;
  }

  interaction.reply({ content: retmsg, ephemeral: true });
}

async function cmdGameShow(interaction) {

  // defaults
  retmsg = 'No games have been defined';

  // get game number option
  gameNum = interaction.options.getInteger('gamenum');

  // display all
  if (gameNum === null) {
    [resp, games] = await apiGamesGet();
    retmsg = '**Games**:\n';
    for (game of games) {
      retmsg += game.idgame + ' - ' + game.gname + '\n';
      retmsg += ' Registration Start: ' + Date(game.regstart) + '\n';
      retmsg += ' Registration Type: ' + game.regtype + '\n';
      retmsg += ' Game Start: ' + Date(game.regstart) + '\n';
    }
  // display single
  } else {
    retmsg = await gameDisplay(gameNum);
  }

  interaction.reply({ content: retmsg, ephemeral: true });
}


// ----------------------------------------------------------
// DISCORD CALLBACKS
// ----------------------------------------------------------


// create Discord client
const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
  partials: ["CHANNEL"]
});

// client startup
client.on('ready', () => {
  // show who we are
  console.log(`Bot logged in as ${client.user.tag}!`);

  const dREST = new REST({ version: '9' }).setToken(config.dauth_token);

  try {
    (async () => {
      await dREST.put(
        Routes.applicationCommands(client.user.id), { body: slashCommands })
         .then(() => {
	   console.log(
	     'Successfully registered application commands globally');
	 });
    })();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

});

// proccess slash commands
client.on('interactionCreate', async (interaction) => {
  // if this isn't a registered command, stop now
  if (!interaction.isCommand()) return;

  // process corresponding command
  switch(interaction.commandName) {

    case 'bs-clearall':
      resp = await apiGameClearAll();
      interaction.reply({ content: 'All game tables cleared', ephemeral: true });
      break;
    case 'bs-gameadd':
      resp = await cmdGameAdd(interaction);
      break;
    case 'bs-gameshow':
      resp = await cmdGameShow(interaction);
      break;
  }

});

// ----------------------------------------------------------
// MAIN
// ----------------------------------------------------------

async function main() {

  // discord login and listen
  client.login(config.dauth_token);
}

main();

