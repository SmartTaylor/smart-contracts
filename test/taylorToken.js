const TaylorToken = artifacts.require('../TaylorToken.sol');
const { assertRevert } = require('./helpers/assertThrow');


contract('Taylor Token', function (accounts) {

  let token;
  const owner = accounts[0];

  context("Checking token initialization", async () => {

    before(async () => {
      token = await TaylorToken.new({from: owner});
    });

    it('Owner initializes correctly', async () => {
      let own = await token.owner();
      assert.equal(owner, own)
    })

    it('Total supply initializes correctly', async () => {
      let totalSupply = await token.totalSupply();
      assert.equal(totalSupply.toNumber(), Math.pow(10,25));
    });

    it('Decimals initializes correctly', async () => {
      let decimals = await token.decimals();
      assert.equal(decimals.toNumber(), 18);
    });

    it('Transferable status initializes correctly', async () => {
      let transferable = await token.transferable();
      assert.isFalse(transferable);
    });

    it('Owner is whitelisted for transfer', async () => {
      let whitelisted = await token.whitelistedTransfer(owner);
      assert.isTrue(whitelisted);
    })

  })

  context("Transfer mechanism", async () => {

    const amount = Math.pow(10,18);

    before(async () => {
      token = await TaylorToken.new({from: owner});
    })

    it('Should throw if transfer is disabled', async () => {
      return assertRevert(async () => {
        await token.transfer(accounts[1], amount, { from: accounts[7]})
      })
    })

    it('Should transfer correctly', async () => {
      await token.activateTransfers({ from: owner})
      let balance0 = await token.balanceOf(accounts[1]);
      await token.transfer(accounts[1], amount, {from: owner});
      let balance1 = await token.balanceOf(accounts[1]);
      assert.equal(balance0, balance1 - amount);
    });

    it('Should throw when trasnfering more than owned', async () => {
      const bal = await token.balanceOf(accounts[1]);
      return assertRevert(async () => {
        await token.transfer(accounts[2], bal + 1, { from: accounts[1]})
      })
    })

    it('Should throw  when trying to transfer to 0x0', async () => {
      return assertRevert(async () => {
        await token.transfer("0x00", amount, { from: accounts[0]})
      })
    });
  }) //context

  context("Allowances and tranferFrom mechanism", async() => {

    const amount = Math.pow(10,18);

    before(async () => {
      token = await TaylorToken.new({from: owner});
      await token.activateTransfers({ from: owner})

      await token.transfer(accounts[1], amount, { from: owner})
      await token.transfer(accounts[2], amount, { from: owner})
      await token.transfer(accounts[3], amount, { from: owner})

    })

    it('should return the correct allowance amount after approval', async () => {
      await token.approve(accounts[2], amount / 2, {from: accounts[1]});
      const allowance = await token.allowance(accounts[1], accounts[2]);
      assert.equal(allowance.toNumber(), amount / 2);
    });

    it('should return correct balances after transfering from another account', async function () {
      const balance0 = await token.balanceOf(accounts[1]);
      const balance1 = await token.balanceOf(accounts[5]);
      await token.transferFrom(accounts[1], accounts[5], amount / 4, { from: accounts[2] });
      const balance2 = await token.balanceOf(accounts[1]);
      const balance3 = await token.balanceOf(accounts[5]);
      assert.equal(balance0.toNumber(), balance2.toNumber() + amount / 4);
      assert.equal(balance1.toNumber(), balance3.toNumber() - amount / 4);
    });

    it("Shouldn't allow changing existing allowance for non zero value", async () => {
      return assertRevert(async () => {
        await token.approve(accounts[2], amount / 2, {from: accounts[1]});
      })
    })

    it("Should allow changing existing allowance for zero value", async () => {
      await token.approve(accounts[2], 0, {from: accounts[1]})
      const allowance = await token.allowance(accounts[1], accounts[2]);
      assert.equal(allowance, 0);
    })

    it("Shouldn't transfer more than allowed", async () =>  {
      const allowance = await token.allowance(accounts[1], accounts[2]);
      return assertRevert(async () => {
        await token.transferFrom(accounts[1], accounts[6], allowance.toNumber() + 1, {from: accounts[2]});
      })
    })

    it("Should trasfer more than `_from` have", async() => {
      await token.approve(accounts[2], amount * 2, { from: accounts[3]});
      return assertRevert(async () => {
        await token.transferFrom(accounts[3], accounts[6], amount * 2, { from: accounts[2]})
      })
    })
  })

  context("Burning mechanism", async() => {

    const amount = Math.pow(10,23);

    before(async() => {
      token = await TaylorToken.new({from: owner});
      await token.activateTransfers({ from: owner})

      await token.transfer(accounts[1], amount / 1000, { from: owner})
    })

    it("Allows for token owner to burn tokens", async() =>{
      const supply0 = await token.totalSupply();
      const balance0 = await token.balanceOf(owner);

      await token.burn(amount, { from: owner});

      const supply1 = await token.totalSupply();
      const balance1 = await token.balanceOf(owner);

      assert.equal(supply0.toNumber(), supply1.toNumber() + amount)
      assert.equal(balance0.toNumber(), balance1.toNumber() + amount)
    })

    it("Do not allow non-owner to burn", async () => {
      return assertRevert(async () => {
        await token.burn(amount / 1000, { from: accounts[1]});
      })
    })
  })


}); //contract
