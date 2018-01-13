var HDWalletProvider = require("truffle-hdwallet-provider");
require('babel-register');
require('babel-polyfill');

var mnemonic = "yard innocent emerge olympic cactus inject aspect improve purse film hospital brown"

module.exports = {

  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ganache: {
      host: '10.212.2.185',
      port: 7545,
      network_id: "*"
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: "4",
      from: "0x23558831583604d63a12022e7a26fc1ed225a8f7",
    },
  }
};
