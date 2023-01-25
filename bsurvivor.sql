
CREATE TABLE IF NOT EXISTS `setup_games` (
  `idgame` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `gname` varchar(256) NOT NULL default '',
  `gdesc` TEXT,
  `ginstr` TEXT,
  `grewards` TEXT,
  `regstart` int(11) UNSIGNED NOT NULL default '0',
  `regend` int(11) UNSIGNED NOT NULL default '0',
  `gstart` int(11) UNSIGNED NOT NULL default '0',
  `gend` int(11) UNSIGNED NOT NULL default '0',
  `regtype` varchar(64) NOT NULL default '1perwallet',
  `loaners` tinyint UNSIGNED NOT NULL default '0',
  `lwallets` TEXT,
  `lexempt` TEXT,
  PRIMARY KEY (`idgame`)
);

CREATE TABLE IF NOT EXISTS `setup_stages` (
  `idgame` int(11) UNSIGNED NOT NULL default '0',
  `idstage` int(11) UNSIGNED NOT NULL default '0',
  `sname` varchar(256) NOT NULL default '',
  `sdesc` TEXT,
  `sinstr` TEXT,
  PRIMARY KEY (`idgame`, `idstage`),
  KEY (`idgame`),
  KEY (`idstage`)
);


CREATE TABLE IF NOT EXISTS `setup_rounds` (
  `idgame` int(11) UNSIGNED NOT NULL default '0',
  `idstage` int(11) UNSIGNED NOT NULL default '0',
  `idround` int(11) UNSIGNED NOT NULL default '0',
  `rname` varchar(256) NOT NULL default '',
  `rdesc` TEXT,
  `rinstr` TEXT,
  `votetype` varchar(64) NOT NULL default 'stagep',
  `remtype` varchar(64) NOT NULL default 'number',
  `remnum` SMALLINT UNSIGNED NOT NULL default '0',
  `rlength` SMALLINT UNSIGNED NOT NULL default '0',
  PRIMARY KEY (`idgame`, `idstage`, `idround`),
  KEY (`idgame`),
  KEY (`idstage`),
  KEY (`idround`)
);

CREATE TABLE IF NOT EXISTS `players` (
  `idgame` int(11) UNSIGNED NOT NULL default '0',
  `waddr` varchar(64) NOT NULL default '',
  `twitter` varchar(64) NOT NULL default '',
  `discord` varchar(64) NOT NULL default '',
  `tokenid` SMALLINT UNSIGNED NOT NULL default '0',
  `owned` TINYINT UNSIGNED NOT NULL default '1',
  `tstamp` int(11) UNSIGNED NOT NULL default '0',
  `idstage` int(11) UNSIGNED NOT NULL default '0',
  `idround` int(11) UNSIGNED NOT NULL default '0',
  `ingame` TINYINT UNSIGNED NOT NULL default '1',
  PRIMARY KEY (`idgame`, `tokenid`),
  KEY (`idgame`),
  KEY (`waddr`),
  KEY (`tokenid`),
  KEY (`idstage`),
  KEY (`idround`),
  KEY (`ingame`)
);

CREATE TABLE IF NOT EXISTS `votes` (
  `idgame` int(11) UNSIGNED NOT NULL default '0',
  `idstage` int(11) UNSIGNED NOT NULL default '0',
  `idround` int(11) UNSIGNED NOT NULL default '0',
  `vote` SMALLINT UNSIGNED NOT NULL default '0',
  `voter` SMALLINT UNSIGNED NOT NULL default '0',
  `tstamp` int(11) UNSIGNED NOT NULL default '0',
  PRIMARY KEY (`idgame`, `idstage`, `idround`, `voter`),
  KEY (`idgame`),
  KEY (`idstage`),
  KEY (`idround`),
  KEY (`vote`),
  KEY (`voter`)
);

CREATE TABLE IF NOT EXISTS `rounds` (
  `idgame` int(11) UNSIGNED NOT NULL default '0',
  `idstage` int(11) UNSIGNED NOT NULL default '0',
  `idround` int(11) UNSIGNED NOT NULL default '0',
  `rname` varchar(256) NOT NULL default '',
  `vdesc` TEXT,
  `vsummary` TEXT,
  `vout` TEXT,
  `votetype` varchar(64) NOT NULL default 'stagep',
  `remtype` varchar(64) NOT NULL default 'number',
  `remnum` SMALLINT UNSIGNED NOT NULL default '0',
  PRIMARY KEY (`idgame`, `idstage`, `idround`),
  KEY (`idgame`),
  KEY (`idstage`),
  KEY (`idround`)
);

CREATE TABLE IF NOT EXISTS `vote_types` (
  `votename` varchar(64) NOT NULL default '',
  `votedesc` TEXT,
  PRIMARY KEY (`votename`)
);

CREATE TABLE IF NOT EXISTS `rem_types` (
  `remname` varchar(64) NOT NULL default '',
  `remdesc` TEXT,
  `random` tinyint NOT NULL default 0,
  PRIMARY KEY (`remname`),
  KEY (`random`)
);

CREATE TABLE IF NOT EXISTS `reg_types` (
  `regname` varchar(64) NOT NULL default '',
  `regdesc` TEXT,
  PRIMARY KEY (`regname`)
);


