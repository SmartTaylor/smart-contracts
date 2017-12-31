import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';

const { assertInvalidOpcode } = require('./helpers/assertThrow');
const BigNumber = web3.BigNumber;

const TaylorToken = artifacts.require('../TaylorToken.sol');
const TokenVesting = artifacts.require('../TokenVesting.sol');

contract('TokenVesting', (accounts) => {

  const owner = accounts[0];
  const beneficiary =  accounts[1];
  const amount = Math.pow(10,20)
  let token, start, cliff, vestDuration, vesting = {}

  beforeEach(async () => {
    token = await TaylorToken.new({ from: owner });

    start = latestTime() + duration.minutes(1); // +1 minute so it starts after contract instantiation
    cliff = duration.years(1);
    vestDuration = duration.years(2);
    vesting = await TokenVesting.new(beneficiary, token.address, start, cliff, vestDuration, { from: owner })
    await token.setTransferable(true, { form: owner});
    await token.transferFromOwner(vesting.address, amount,{from: owner});
  });

  it('cannot be released before cliff', async () => {
    return assertInvalidOpcode(async ()=> {
      await vesting.release();
    })
  });

  it('can be released after cliff', async function () {
    await increaseTimeTo(start + cliff + duration.weeks(1));
    const balance0 = await token.balanceOf(vesting.address)
    const balance1 = await token.balanceOf(beneficiary)

    await vesting.release();

    const released = await vesting.released();

    const balance2 = await token.balanceOf(vesting.address)
    const balance3 = await token.balanceOf(beneficiary)

    assert.equal(balance0.toNumber(), balance2.toNumber() + released.toNumber());
    assert.equal(balance1.toNumber(), balance3.toNumber() - released.toNumber());
  });

  it('should release proper amount after cliff', async () => {
    await increaseTimeTo(start + cliff);

    const { receipt } = await vesting.release();
    const releaseTime = await web3.eth.getBlock(receipt.blockNumber).timestamp;

    const balance = await token.balanceOf(beneficiary);
    assert.equal(balance, amount * (releaseTime - start) / vestDuration)
  });

  it('should linearly release tokens during vesting period', async () => {
    const vestingPeriod = vestDuration - cliff;
    const checkpoints = 4;

    for (let i = 1; i <= checkpoints; i++) {
      const now = start + cliff + i * (vestingPeriod / checkpoints);
      await increaseTimeTo(now);

      await vesting.release();
      const balance = await token.balanceOf(beneficiary);
      const expectedVesting = amount * (now - start) / vestDuration;

      assert.equal(balance, expectedVesting)
    }
  });

  it('should have released all after end', async () => {
    await increaseTimeTo(start + vestDuration);
    await vesting.release();
    const balance = await token.balanceOf(beneficiary);
    assert.equal(balance.toNumber(), amount);
  });
});
