#!/usr/bin/env node

var Firebase = require("firebase");
var FirebaseTokenGenerator = require("firebase-token-generator");

var configPath = process.env.HOME + '/.firebase/' + 'config.json';
var config = hasFile(configPath) ? require(configPath) : null;
var program = require('commander'); // for cli args

program
  .version('1.0.0')
  .option('-a, --app <app>', 'firebase app name')
  .option('-s, --secret <secret>', 'firebase secret')
  .option('-u, --uid', 'firebase uid')
  .option('-t, --token', 'firebase user token')
  .parse(process.argv);

var secret = program.secret ? program.secret : process.env.FIREBASE_SECRET;
var app = program.app ? program.app : process.env.FIREBASE_APP;
var uid = program.uid ? program.uid : process.env.FIREBASE_UID;

if (!app) console.error('missing firebase app');

if (config[app]) uid = uid ? uid : config[app].uid;
uid = uid ? uid : 'root';

if (config[app]) secret = secret ? secret : config[app].secret;

if (!secret) console.error('missing firebase secret');

var tokenGenerator = new FirebaseTokenGenerator(secret);
var token = tokenGenerator.createToken({ uid: uid });
console.log(token);

function hasFile(f) {
  var fs = require('fs');
  var b = false;
  try {
    b = fs.statSync(f).isFile();
  } catch (e) {
  }
  return b;
}

