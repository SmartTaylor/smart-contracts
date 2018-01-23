import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';
const { assertRevert, assertInvalidOpcode } = require('./helpers/assertThrow');

const TaylorToken = artifacts.require('../TaylorToken.sol');
const Crowdsale = artifacts.require('../Crowdsale.sol');

contract('Crowdsale contract', (accounts) => {

  const owner = accounts[0];
  const wallet = accounts[9];
  const tokensForSale = 6535 * Math.pow(10,21);
  let start,token, sale = {}

  context("Sale initialization", async () => {

    before(async () => {

      token = await TaylorToken.new({from:owner});
      start = latestTime() + duration.minutes(1);
      sale = await  Crowdsale.new(start, 30, tokensForSale,token.address, wallet);
      await token.transfer(sale.address, tokensForSale, {from: owner});

    })

    it("Has correct start date", async () => {
      const date = await sale.startTime();
      assert.equal(date, start)
    })

    it("Has correct end date", async () => {
      const date = await sale.endTime();
      assert.equal(date, start + duration.days(30))
    })

    it("Has the correct wallet address", async () => {
      const wal = await sale.wallet();
      assert.equal(wal, wallet)
    })

    it("Has the correct token address", async () => {
      const tok = await sale.taylorToken();
      assert.equal(tok, token.address)
    })

    it("Has the correct cap", async () => {
      const cap = await sale.tokenCap();
      assert.equal(cap, tokensForSale);
    })

    it("Starts with correct amount raiser", async () => {
      const raised = await sale.weiRaised();
      assert.equal(raised, 0);
    })

    it("Starts with correct amount of tokens Sold", async () => {
      const sold = await sale.tokensSold();
      assert.equal(sold, 0);
    })

    it("Has the correct rates", async () => {
      const realRates = [700000000000000, 790000000000000, 860000000000000, 930000000000000];
      for( var i = 0; i < realRates.length; i++){
        const rate = await sale.rates(i);
        assert.equal(rate, realRates[i]);
      }
    })
  })

  context("Basic bidding functionality", async () => {

    const whited = [accounts[1],accounts[2],accounts[3],accounts[4],accounts[5]]

    before(async () => {

      token = await TaylorToken.new({from:owner});
      start = latestTime() + duration.minutes(1);
      sale = await  Crowdsale.new(start, 30, tokensForSale,token.address, wallet);
      await token.addWhitelistedTransfer(sale.address, { from: owner});
      await token.addWhitelistedBurn(sale.address, { from: owner});
      await token.transfer(sale.address, tokensForSale, {from: owner});

    })

    it("Addresses can be whitelisted", async () => {
      for(var i = 0; i < whited.length ; i++){
        await sale.addWhitelisted(whited[i], false, {from: owner});
        const whitelisted = await sale.whitelisted(whited[i]);
        assert.isTrue(whitelisted);
      }
    })

    it("Fails if sale hasn't started", async () => {
      return assertRevert(async () => {
        await sale.buyTokens({from: accounts[1]})
      })
    })

    it("Allows for whitelisted address to bid", async () => {
      const value = 70000000000000000;
      await increaseTimeTo(start + duration.minutes(5));
      await sale.buyTokens({from: accounts[1], value: value})
      const raised = await sale.weiRaised();
      const balance = await token.balanceOf(accounts[1]);
      assert.equal(raised.toNumber(), value);
      assert.equal(balance.toNumber(), Math.pow(10,18)*value/700000000000000);
    })

    it("Fails if address isn't whitelisted", async () => {
      return assertRevert(async () => {
        const value = 70000000000000000;
        await sale.buyTokens({from: accounts[8], value: value})
      })
    })

    it("Fails if amount is less than mininum", async () => {
      return assertRevert(async () => {
        const value = 7000000000000;
        await sale.buyTokens({from: accounts[1], value: value})
      })
    })


    it("Fails if amount is greater than maximum", async () => {
      const value = 6 * Math.pow(10,19);
      return assertRevert(async () => {
        await sale.buyTokens({from: accounts[2], value: value})
      })
    })

    it("Don't let bidder buy more than maximum in multiples transactions", async () => {
        await sale.addWhitelisted([accounts[7]], false, {from: owner});
        const value = 2 * Math.pow(10,19);
        return assertRevert(async () => {
          for(var i = 0; i < 4; i++ ){
            await sale.buyTokens({from:accounts[7], value: value})
          }
        })
    })

    it("Fails if sale is paused", async () => {
      const value = 70000000000000000;
      await sale.pause({from: owner});
      return assertRevert(async () => {
        await sale.buyTokens({from:accounts[5], value: value})
      })
    })

    it("Allows if sale is unpaused", async () => {
      const value = 70000000000000000;
      await sale.unpause({from: owner});
      const raised = await sale.weiRaised();
      await sale.buyTokens({from: accounts[5], value: value})
      const raised2 = await sale.weiRaised();
      assert.equal(raised2.toNumber() - value, raised.toNumber());
    })

    it("Pools can buy up to 250ETH in tokens in the first week", async () =>{
      await sale.addWhitelisted(accounts[8], true, { from: owner});
      const value = 2.4 * Math.pow(10,20);
      const raised = await sale.weiRaised();
      await sale.buyTokens({from: accounts[8], value: value})
      const raised2 = await sale.weiRaised();
      const balance = await token.balanceOf(accounts[8]);
      assert.equal(raised.toNumber() + value , raised2.toNumber());
    })

    it("Pools can't but more than 50 ETH in the following weeks", async () => {
      await sale.addWhitelisted(accounts[9], true, { from: owner});
      const value = 2.4 * Math.pow(10,20);
      await increaseTimeTo(start + duration.weeks(2));
      return assertRevert(async () => {
        await sale.buyTokens({from: accounts[9], value: value})
      })
    })

    it("Fails if sale has reached ende time", async() => {
      await increaseTimeTo(start + duration.weeks(5));
      const value = 2 * Math.pow(10,19);
      return assertRevert(async () => {
        await sale.buyTokens({from: accounts[4], value: value})
      })
    })
  })

  context("Finalizing sale", async() => {
    beforeEach(async () => {
      start = latestTime() + duration.days(1);
      token = await TaylorToken.new({from:owner});
      sale = await  Crowdsale.new(start, 30, tokensForSale / 10 ,token.address, wallet);
      await token.addWhitelistedTransfer(sale.address, { from: owner});
      await token.addWhitelistedBurn(sale.address, { from: owner});
      await token.transfer(sale.address, tokensForSale / 10, {from: owner});

      for(var i = 1; i < accounts.length; i++){
        await sale.addWhitelisted(accounts[i], true, {from: owner});
      }
      await increaseTimeTo(start + duration.minutes(5));
    })

    it("Finalizes when tokens are sold out", async() => {
      let tokensBuyed = 0;
      for(var i = 1; i < 5; i++){
        await sale.buyTokens({from:accounts[i], value: web3.toWei(95, "ether")})
        tokensBuyed +=  Math.pow(10,18)*web3.toWei(95, "ether")/700000000000000
      }
      let singleBuy = Math.pow(10,18)*web3.toWei(95, "ether")/700000000000000;
      let sold = await sale.tokensSold();
      let cap = await sale.tokenCap();
      const bal9 = await web3.eth.getBalance(accounts[i]);
      await sale.buyTokens({from:accounts[9], value: web3.toWei(80, "ether")});
      sold = await sale.tokensSold();
      cap = await sale.tokenCap();
      const bal = await token.balanceOf(sale.address);
      assert.equal(bal.toNumber(), 0)
    })
  })

  context("Complex sale sate", () => {

    beforeEach(async () => {

      start = latestTime() + duration.days(2);
      token = await TaylorToken.new({from:owner});
      sale = await Crowdsale.new(start, 30, tokensForSale ,token.address, wallet, {from:owner});
      await token.addWhitelistedTransfer(sale.address, { from: owner});
      await token.addWhitelistedBurn(sale.address, { from: owner});
      await token.transfer(sale.address, tokensForSale, {from: owner});
      for(var i = 1; i < accounts.length; i++ ){
        await sale.addWhitelisted(accounts[i], false,{from: owner});
      }
      await increaseTimeTo(start + duration.minutes(5));
    })

    it("Distributes the correct amount of tokens", async () => {
      const values = [0, 9 * Math.pow(10, 16), 1 * Math.pow(10, 17), 3 * Math.pow(10,18), 2 * Math.pow(10, 19)]
      for(var i = 1; i < values.length; i ++){
        const rate = await sale.getCurrentRate();
        await sale.buyTokens({from: accounts[i], value: values[i]})
        const etherBalance = await web3.eth.getBalance(accounts[i]);
        const balance = await token.balanceOf(accounts[i]);
        const tokens = Math.pow(10,4) * values[i] / 7 ;
        const reason = tokens / balance;

        //There might me difference due to significant digits in solidity vs javascript.
        // More precise test can be found in simulation.js
        assert.equal((tokens / balance).toFixed(15), 1.000000000000000);
      }
    })

    it("Distribute correct amount of tokens for pools", async () => {
      const values = 2 * Math.pow(10, 20);
      await sale.addWhitelisted(accounts[8], true ,{from: owner});
        const rate = await sale.getCurrentRate();
        await sale.buyTokens({from: accounts[8], value: values})
        const etherBalance = await web3.eth.getBalance(accounts[8]);
        const balance = await token.balanceOf(accounts[8]);
        const tokens = Math.pow(10,4) * values / 6 ;
        const reason = tokens / balance;

        //There might me difference due to significant digits in solidity vs javascript.
        // More precise test can be found in simulation.js
        assert.equal((tokens / balance).toFixed(15), 1.000000000000000);
    })

    it("Cap total amount that pools can buy", async () => {
      const value = 2.4 * Math.pow(10, 20);
      let purchases = [];
      for(var i = 1; i < 7; i++){
        const balance1 = await web3.eth.getBalance(accounts[i]);
        await sale.addWhitelisted(accounts[i], true ,{from: owner});
        await sale.buyTokens({from: accounts[i], value: value});
        const balance2 = await web3.eth.getBalance(accounts[i]);
        purchases.push(balance1.toNumber() - balance2.toNumber());
      }
      const total = await sale.poolEthSold();
      const cap = await sale.poolEthCap();
      assert.equal(cap.toNumber(), total.toNumber());
    })

    it("Provides the correct rate", async () => {
      const realRates = [700000000000000, 790000000000000, 860000000000000, 930000000000000];
      for(var i = 0; i < realRates.length; i++) {
        const rate = await sale.getCurrentRate();
        assert.equal(rate.toNumber(), realRates[i]);
        await increaseTimeTo(start + duration.weeks(i + 1))
      }
    })

  })


})
