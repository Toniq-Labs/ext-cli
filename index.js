#!/usr/bin/env node
require = require('esm-wallaby')(module);
var fetch = require('node-fetch');
global.fetch = fetch;
const origWarning = process.emitWarning;
process.emitWarning = function(...args) {
    if (args[2] !== 'DEP0005') {
        // pass any other warnings through normally
        return origWarning.apply(process, args);
    } else {
        // do nothing, eat the warning
    }
}
const extjs = require("../ext-js/dist/ext.node.js");
const defaultConfig = {
  host : "",
  alias : {
    identity : {},
    token : {},
  },
  active : {
    identity : false,
    token : false,
  }
},
cliColors = {
  red : '31m',
  yellow : '33m',
  cyan : '36m',
  white : '37m',
  green : '32m',
},
validCommands = [
  'config',
  'alias',
  'use',
  'man',
  'help',
  'metadata',
  'balance',
  'clear',
  'tokenid',
  'supply',
],
homeDir = require('os').homedir();
(async() => {
    // Validate Commands
    if (process.argv.length <= 2){
        return outputError("Please enter a command! (ext help)");
    }
    var command = process.argv[2], args = process.argv.slice(3);
    if (validCommands.indexOf(command) < 0 ) {
      return outputError("Invalid command");
    }

    // Load config
    var jsonfile = require('jsonfile');
    var confFile = homeDir+'/.ext.config.json';
    var config = {};
    jsonfile.readFile(confFile, async function(err, obj) {
      if (err){
        outputInfo('No config file found, making new one...');
        jsonfile.writeFile(confFile, defaultConfig);
        config = defaultConfig;
      } else {
        config = obj;
      }

      var token = (config.active.token ? (config.alias.token[config.active.token] ? config.alias.token[config.active.token] : false ): false), 
      identity = (config.active.identity ? (config.alias.identity[config.active.identity] ? config.alias.identity[config.active.identity] : false ): false);
      
      while(args.length && args[0].indexOf("--") === 0) {
        var k = args.shift();
        var v = args.shift();
        k = k.slice(2);
        if (k == "token") token = (config.alias.token[v] ? config.alias.token[v] : v );
        if (k == "identity") identity = (config.alias.identity[v] ? config.alias.identity[v] : v );
      }
      console.log(token);
      // Process Commands
      switch(command){
        case "tokenid":
          var canister = args[0];
          var index = args[1];
          return outputInfo(extjs.encodeTokenId(canister, index));
        break;
        case "config":
          return outputInfo(JSON.stringify(config));
        break;
        case "alias":
          //Create a local alias for a token, canister or identity
          var type = args[0];
          var data = args[1];
          var alias = args[2];
          config.alias[type][alias] = data;
          config.active[type] = alias;
          jsonfile.writeFile(confFile, config);
          return outputInfo('The new alias has been created - you are now using this token as well!');
        break;
        case "man":
        case "help":
          return outputInfo('Manual coming soon');
        break;
        case "supply":
          
        break;
        case "balance":
          var address = args[0];
          var md = await extjs.connect().token(token).getMetadata();
          var bal = await extjs.connect().token(token).getBalance(address)
          if (md.decimals > 2){
            bal /= BigInt(10**(md.decimals-2));
            bal = Number(bal) / 100;
          }
          return outputInfo(bal + " " + md.symbol);
        break;
        case "metadata":
          return outputInfo(await extjs.connect().token(token).getMetadata());
        break;
        case "clear":
          jsonfile.writeFile(confFile, defaultConfig);
          return output('Config file has been cleared!');
        break;
        
      }
    })
})();

//Helper Functions
function outputError(e){
  console.log('\x1b['+cliColors.red+'%s\x1b[0m', "Error: " + e);
}
function outputInfo(e){
  console.log('\x1b['+cliColors.yellow+'%s\x1b[0m', e);
}
function output(e){
  console.log('\x1b['+cliColors.green+'%s\x1b[0m', e);
}
function findKeyObj(list, t){
  for (var i = 0; i < list.length; i++){
    if (list[i].pkh == t || list[i].label == t) return list[i];
  }
  return false;
}