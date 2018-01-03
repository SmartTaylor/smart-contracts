import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';
const { assertInvalidOpcode } = require('./helpers/assertThrow');

const TaylorToken = artifacts.require('../TaylorToken.sol');
const Crowdsale = artifacts.require('../Crowdsale.sol');

contract('Crowdsale contract', (accounts) => {

  const owner = accounts[0];
  const wallet = accounts[9];
  const tokensForSale = 7 * Math.pow(10,24);
  const start = latestTime() + duration.days(1);
  let token, sale = {}

  context("Sale initialization", async () => {

    before(async () => {

      token = await TaylorToken.new({from:owner});
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
      const realRates = [70000000000000, 79000000000000, 89000000000000, 93000000000000];
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
      sale = await  Crowdsale.new(start, 30, tokensForSale,token.address, wallet);
      await token.addWhitelisted(sale.address, { from: owner});
      await token.transfer(sale.address, tokensForSale, {from: owner});

    })

    it("Addresses can be whitelisted in batches", async () => {
      await sale.addWhitelisted(whited, {from: owner});
      for(var i = 0; i < whited.length ; i++){
        const whitelisted = await sale.whitelisted(whited[i]);
        assert.isTrue(whitelisted);
      }
    })

    it("Fails if sale hasn't started", async () => {
      return assertInvalidOpcode(async () => {
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
      assert.equal(balance.toNumber(), Math.pow(10,18)*value/70000000000000);
    })

    it("Fails if address isn't whitelisted", async () => {
      return assertInvalidOpcode(async () => {
        const value = 70000000000000000;
        await sale.buyTokens({from: accounts[8], value: value})
      })
    })

    it("Fails if amount is less than mininum", async () => {
      return assertInvalidOpcode(async () => {
        const value = 7000000000000;
        await sale.buyTokens({from: accounts[1], value: value})
      })
    })


    it("Fails if amount is greater than maximum isn't", async () => {
      const value = 6 * Math.pow(10,19);
      return assertInvalidOpcode(async () => {
        await sale.buyTokens({from: accounts[2], value: value})
      })
    })

    it("Don't let bidder buy more than maximum in multiples transactions", async () => {
        await sale.addWhitelisted([accounts[7]], {from: owner});
        const value = 2 * Math.pow(10,19);
        return assertInvalidOpcode(async () => {
          for(var i = 0; i < 4; i++ ){
            await sale.buyTokens({from:accounts[7], value: value})
          }
        })

    })

    it("Fails if sale has reached ende time", async() => {
      await increaseTimeTo(start + duration.weeks(5));
      const value = 2 * Math.pow(10,19);
      return assertInvalidOpcode(async () => {
        await sale.buyTokens({from: accounts[4], value: value})
      })
    })

  })
})
