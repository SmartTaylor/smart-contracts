const TaylorToken = artifacts.require('../TaylorToken.sol');
const TaylorTGE = artifacts.require('../TaylorTokenTGE.sol');
const { assertRevert } = require('./helpers/assertThrow');

contract("Taylor TGE", (accounts) => {

  let token, tge ={}
  const owner = accounts[0];
  const founders = accounts[1];
  const advisors = accounts[2];
  const team = accounts[3];
  const referral = accounts[4];
  const presale = accounts[5];
  const publicsale = accounts[6];

  before(async () => {
    token = await TaylorToken.new({from: owner});
    tge = await TaylorTGE.new({from: owner});
    await token.addWhitelistedTransfer(tge.address, {from: owner});
  })

  it("Fails to distribute if it hasn't been setup", async () => {
    return assertRevert(async () => {
      await tge.distribute({from: owner});
    })
  })

  it("Sets up correctly", async () => {
    await tge.setUp(token.address, founders, advisors, team, referral, presale, publicsale, { from: owner});
    assert.equal(await tge.token(), token.address);
    assert.equal(await tge.founders_address(), founders);
    assert.equal(await tge.advisors_address(), advisors);
    assert.equal(await tge.team_address(), team);
    assert.equal(await tge.referral_address(), referral);
    assert.equal(await tge.presale_address(), presale);
    assert.equal(await tge.publicsale_address(), publicsale);
  })

  it("Fails to distribute contracts doesn't have the funds", async () => {
    return assertRevert(async () => {
      await tge.distribute({from: owner});
    })
  })

  it("Distributes correctly", async () => {
    await token.transfer(tge.address, Math.pow(10,25));
    await tge.distribute({from: owner});

    const compareFetchs = async function(data1, data2){
      let d1, d2;
      return data1.then((result) => {
        d1 = result.toNumber();
        return data2
      }).then((result) => {
        d2 = result.toNumber()
        return d1 == d2;
      })
    }

    assert.isTrue(await compareFetchs(token.balanceOf(founders), tge.FOUNDERS()));
    assert.isTrue(await compareFetchs(token.balanceOf(advisors), tge.ADVISORS()));
    assert.isTrue(await compareFetchs(token.balanceOf(team), tge.TEAM()));
    assert.isTrue(await compareFetchs(token.balanceOf(referral), tge.REFERRAL_PROGRAMS()));
    assert.isTrue(await compareFetchs(token.balanceOf(presale), tge.PRESALE()));
    assert.isTrue(await compareFetchs(token.balanceOf(publicsale), tge.PUBLICSALE()));
  })

})
