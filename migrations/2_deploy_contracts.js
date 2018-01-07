var TaylorToken = artifacts.require('./TaylorToken.sol');
var TaylorTokenTGE = artifacts.require('./TaylorTokenTGE.sol');
var Crowdsale = artifacts.require('./Crowdsale.sol');
var TokenVesting = artifacts.require('./TokenVesting.sol');
const latestTime = require('../test/helpers/latestTime.js');
const duration = require('../test/helpers/increaseTime.js').duration;

module.exports = function (deployer, network, accounts) {

  // console.log('Network', network);
  // console.log('Accounts', accounts);
  //
  // let owner = accounts[0];
  // let tokenInstance, saleInstance;
  // const wallet = accounts[1];
  //
  //
  //
  // deployer.then(function(){
  //   return TaylorToken.new({from: owner})
  // }).then(function (tkn){
  //   tokenInstance = tkn;
  //   console.log("Before instantiating sale");
  //     return Crowdsale.new(1515197936, 2, 6535 * Math.pow(10,21), tokenInstance.address, wallet, {from:owner, gas:1500000});
  //   })
  //   .then(function(crwd){
  //   icoAddress = crwd.address;
  //   console.log("Token address: ", tokenInstance.address);
  //   console.log("Sale address: ", icoAddress);
  //   return tokenInstance.transfer(icoAddress, 6535 * Math.pow(10,21), { from: owner})
  // })
};
