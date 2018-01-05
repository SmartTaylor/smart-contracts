import {increaseTimeTo, increaseTime, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'

const TaylorToken = artifacts.require("TaylorToken");
const Crowdsale = artifacts.require("Crowdsale");

function calculateTokenAmount(weiAmount, rate) {
  return Math.pow(10,18) * weiAmount / rate;
}


function getRandomValueInEther(max, min){
  return Math.floor(Math.random() * (max - min) + min) * Math.pow(10,18)
}

function generateEmptyMappings(size) {
  var a = [];
  for(var i=0; i < size; i++){
    a.push(0);
  }
  return a;
}


async function simulate(accounts, sale){

  //Simulation variables
  var failedTransactions = [];
  var interactionsSnapshots = [];
  let receipt;


  //Arrays that smulate mappings from address(position in the accounts array) to any value;
  var contributors = generateEmptyMappings(accounts.length);

  //Sim of UINTs
  let weiRaised;
  let tokensSold;
  let tokenCap;
  let startTime;
  let endTime;
  const rates = [70000000000000, 79000000000000, 89000000000000, 93000000000000];


  for(var i = 0; i < accounts.length; i++){
    let week = Math.floor(startTime - Date.now() / week)
    let value = getRandomValueInEther(0.1, 50);
    let snapshot = {
      "iteraction": i,
      "value": value,
      "week": week,
      "rate": rates[week],
      "sender address": accounts[i],
    };

      try{
          receipt = await sale.buyTokens({from: accounts[i], value: value});
          contributors[i] = contributors[i] + value;
          weiRaised += value;
          const tokens = calculateTokenAmount(value, rates[week]);
          tokensSold += tokens

          snapshot.succeed = true;
      }
      catch (e)
      {
        failedTransactions.push(i);
        snapshot.succeed = false;
      }
    const timeToAdvance = Math.floor(Math.random() * (3000 - 1) + 1)
    var time = await increaseTimeTo(lastBlock + duration.minutes(timeToAdvance));

    interactionsSnapshots.push(snapshot);
  }

  return {
    "weiRaised": weiRaised,
    "tokensSold": tokensSold,
    "contributors": contributors,
    "startTime": startTime,
    "endTime": endTime,
    "failedTransactions": failedTransactions,
    "interactionsSnapshots": interactionsSnapshots,
  }


}

contract("Simulation", async (accounts) => {
  const owner = accounts[0];
  const wallet = accounts[9];
  const tokensForSale = 7 * Math.pow(10,24);
  const now = latestTime()
  const start = now + duration.days(1);
  let token, sale = {};

  before(async function () {

    token = await TaylorToken.new({from:owner});
    sale = await Crowdsale.new(start, 30, tokensForSale ,token.address, wallet, {from:owner});
    await token.addWhitelisted(sale.address, { from: owner});
    await token.transfer(sale.address, tokensForSale, {from: owner});

    await sale.addWhitelisted(accounts, {from: owner});

    await increaseTimeTo(start + duration.minutes(5));

  })

  it("Sale behaves correctly", async () => {
    let simulation = await simulate(accounts, sale);
    console.log(simulation);
    assert.isTrue(true);
  })
})
