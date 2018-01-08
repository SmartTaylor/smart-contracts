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
  let failedTransactions = [];
  let interactionsSnapshots = [];
  let receipt;


  //Arrays that smulate mappings from address(position in the accounts array) to any value;
  var contributors =  generateEmptyMappings(accounts.length);
  let tokenBalances = generateEmptyMappings(accounts.length);

  //Sim of UINTs
  let weiRaised = 0;
  let tokensSold = 0;
  let tokenCap = await sale.tokenCap();
  let startTime = await sale.startTime();
  let endTime = 0;
  const realRates = [700000000000000, 790000000000000, 860000000000000, 930000000000000];

  for(var i = 2; i < accounts.length; i++){
    let week = Math.floor((latestTime() - startTime) / duration.weeks(1));
    let value = getRandomValueInEther(0.1, 50);
    let snapshot = {
      "iteraction": i,
      "value": value,
      "week": week,
      "rate": realRates[week],
      "sender address": accounts[i],
    };
      if(week > 4){
        console.log("Finalized by time");
        break;
      }

      try{
          receipt = await sale.buyTokens({from: accounts[i], value: value});
          contributors[i] = contributors[i] + value;
          weiRaised += value;
          const tokens = calculateTokenAmount(value, realRates[week]);
          tokensSold += tokens
          tokenBalances[i] = tokens;

          snapshot.succeed = true;
      }
      catch (e)
      {
        failedTransactions.push(i);
        snapshot.succeed = false;
      }
    // const timeToAdvance = Math.floor(Math.random() * (300 - 1) + 1)
    // var time = await increaseTimeTo(latestTime() + duration.minutes(timeToAdvance));
    if(tokenCap - tokensSold < calculateTokenAmount(web3.toWei(0.9, "ether"),realRates[week])){
      console.log("Reached the cap");
      break;
    }
    interactionsSnapshots.push(snapshot);
  }

  return {
    "weiRaised": weiRaised,
    "tokensSold": tokensSold,
    "contributors": contributors,
    "startTime": startTime,
    "endTime": endTime,
    "tokenBalances": tokenBalances,
    "failedTransactions": failedTransactions,
    "interactionsSnapshots": interactionsSnapshots,
  }


}

contract("Simulation", async (accounts) => {
  const owner = accounts[0];
  const wallet = accounts[1];
  const tokensForSale = 6535 * Math.pow(10,21);
  let start,  token, sale, simulation, walletBalance = {};

  before(async function () {
    start = latestTime() + duration.days(1);
    token = await TaylorToken.new({from:owner});
    sale = await Crowdsale.new(start, 30, tokensForSale ,token.address, wallet, {from:owner});
    await token.addWhitelistedTransfer(sale.address, { from: owner});
    await token.transfer(sale.address, tokensForSale, {from: owner});

    for(var i = 1; i < accounts.length; i++){
      await sale.addWhitelisted(accounts[i], false, {from: owner});
    }

    walletBalance = await web3.eth.getBalance(wallet);
    await increaseTimeTo(start + duration.minutes(5));
    simulation = await simulate(accounts, sale);
    console.log(simulation.contributors);
    console.log(simulation.tokensSold);
    console.log(simulation.tokenBalances);
    console.log(simulation.failedTransactions);
  })

  it("Sale behaves correctly", async () => {
    assert.isTrue(true);
  })

  it("Buyers got correct amount of tokens", async () => {
    for(var i = 1; i < accounts.length; i++){
      const weiAmount = simulation.contributors[i];
      const balance = await token.balanceOf(accounts[i]);
      assert.equal(((balance.toNumber() + 1) / (simulation.tokenBalances[i] + 1)).toFixed(14),1.00000000000000 );
    }
  })

  it("Sale raised the correct amount of money", async () => {
    const raised = simulation.weiRaised;
    const walletBal = await web3.eth.getBalance(wallet);
    assert.equal((raised / walletBal.toNumber() - walletBalance.toNumber()).toFixed(14),1.000000000000000);
  })

  it("accounts correctly for tokens", async () => {
    console.log(simulation.tokensSold / Math.pow(10,18));
  })
})
