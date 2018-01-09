var TaylorToken = artifacts.require('./TaylorToken.sol');
var TaylorTokenTGE = artifacts.require('./TaylorTokenTGE.sol');
var Crowdsale = artifacts.require('./Crowdsale.sol');
var TokenVesting = artifacts.require('./TokenVesting.sol');
const latestTime = require('../test/helpers/latestTime.js');
const duration = require('../test/helpers/increaseTime.js').duration;


let getNow = new Promise((resolve, reject) => {
  web3.eth.getBlock('latest', (err, block) => {
    err ? reject(err) : resolve(block);
  })
})

module.exports = function (deployer, network, accounts) {

  console.log('Network', network);
  console.log('Accounts', accounts);

  let owner = accounts[0];
  let tokenInstance, saleInstance, vestingInstance, tgeInstance;
  const wallet = accounts[1];
  let now = 0;

    getNow.then((block) => {
      now = block.timestamp;
      return deployer
    })
    .then(function(){
      console.log("Deploying token");
      return TaylorToken.new({from: owner})
    })
    .then(function (tkn){
      tokenInstance = tkn;
      console.log("Deploying sale");
      return Crowdsale.new(now + 600, 2, 6535 * Math.pow(10,21), tokenInstance.address, wallet, {from:owner, gas:1500000});
    })
    .then(function(crdw) {
        saleInstance = crdw;
        console.log("Deploying TGE");
        return TaylorTokenTGE.new()
    })
    .then(function(tge) {
        tgeInstance = tge;
        console.log("Deploying vesting");
        return TokenVesting.new(accounts[2], tokenInstance.address, now,86400,172800);
      })
    .then(function(vestInst){
      vestingInstance = vestInst;
      console.log("Setting up TGE");
      return tgeInstance.setUp(tokenInstance.address,vestingInstance.address,"0x001","0x002","0x003","0x004",saleInstance.address, {from: owner});
    })
    .then(function(response){
      console.log("Distributing token");
      return tokenInstance.distribute(tgeInstance.address, {from: owner});
    })
    .then(function(response){
      console.log("Token Address: ", tokenInstance.address);
      console.log("Token ABI: ", tokenInstance.options);
      console.log("Sale address: ", saleInstance.address);
      console.log("Sale ABI: ", saleInstance.abi);
      console.log("TGE Address: ", tgeInstance.address);
      console.log("Vesting Address: ", vestingInstance.address);
      return tgeInstance.distribute({from: owner})
    })
    // .then(function(response){
    //   console.log("Token Address: ", tokenInstance.address);
    //   console.log("Token ABI: ", tokenInstance.abi);
    //   console.log("Sale address: ", saleInstance.address);
    //   console.log("Sale ABI: ", saleInstance.abi);
    //   console.log("TGE Address: ", tgeInstance.address);
    //   console.log("Vesting Address: ", vestingInstance.address);
    // })
};
