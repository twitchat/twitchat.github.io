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
var token = program.token;

if (app) secret = secret ? secret : config[app].secret;

var uid = program.uid ? program.uid : process.env.FIREBASE_UID;
if (config[app]) uid = uid ? uid : config[app].uid;
uid = uid ? uid : 'root';

if (config[app]) {
    token = token ? token : config[app].users[uid].token;
}

var url;
if (config[app]) {
    url = config[app].url ? config[app].url : "https://" + config[app] + ".firebaseio.com/";
}

if (!url) console.error('missing firebase url');
if (!token) console.error('missing firebase token');

var ref = new Firebase(url);
console.log(token);
ref.authWithCustomToken(token, function(error, authData) {
  if (error) {
    console.log("Login Failed!", error);
  } else {
    console.log("Login Succeeded!", authData);
  }
});

function hasFile(f) {
  var fs = require('fs');
  var b = false;
  try {
    b = fs.statSync(f).isFile();
  } catch (e) {
  }
  return b;
}

