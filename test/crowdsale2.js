import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';
const { assertInvalidOpcode } = require('./helpers/assertThrow');

const TaylorToken = artifacts.require('../TaylorToken.sol');
const Crowdsale = artifacts.require('../Crowdsale.sol');
contract("Complex sale sate", (accounts) => {

  const owner = accounts[0];
  const wallet = accounts[9];
  const tokensForSale = 7 * Math.pow(10,24);
  const start = latestTime() + duration.days(1);
  let token, sale = {}

  before(async () => {

    //console.log(await latestTime());
    token = await TaylorToken.new({from:owner});
    sale = await Crowdsale.new(start, 30, tokensForSale ,token.address, wallet, {from:owner});
    await token.addWhitelisted(sale.address, { from: owner});
    await token.transfer(sale.address, tokensForSale, {from: owner});

    await sale.addWhitelisted(accounts, {from: owner});

    await increaseTimeTo(start + duration.minutes(5));

  })

  it("Distributes the correct amount of tokens", async () => {
    const values = [0, 9 * Math.pow(10, 16), 1 * Math.pow(10, 17), 8 * Math.pow(10,18), 2 * Math.pow(10, 19)]
    for(var i = 1; i < values.length; i ++){
      const rate = await sale.getCurrentRate();
      await sale.buyTokens({from: accounts[i], value: values[i]})
      const etherBalance = await web3.eth.getBalance(accounts[i]);
      const balance = await token.balanceOf(accounts[i]);
      const tokens = Math.pow(10,5) * values[i] / 7 ;
      const reason = tokens / balance;
      console.log("balance: ", balance.toNumber());
      console.log("tokens:", tokens);
      //There might me difference due to significant digits in solidity vs javascript.
      // More precise test can be found in simulation.js
      assert.equal((tokens / balance).toFixed(15), 1.000000000000000);
    }
  })

  it("Provides the correct rate", async () => {
    const realRates = [70000000000000, 79000000000000, 89000000000000, 93000000000000];
    for(var i = 0; i < realRates.length; i++) {
      const rate = await sale.getCurrentRate();
      assert.equal(rate.toNumber(), realRates[i]);
      await increaseTimeTo(start + duration.weeks(i + 1))
    }
  })

})
