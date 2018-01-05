pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./TaylorToken.sol";
import "./Ownable.sol";

contract TaylorTokenTGE is Ownable {
  using SafeMath for uint256;

  uint256 constant internal DECIMAL_CASES = 10**18;
  TaylorToken public token;
  bool ready = false;

  uint256 constant FOUNDERS = 10**6 * DECIMAL_CASES;
  uint256 constant ADVISORS = 4 * 10**5 * DECIMAL_CASES;
  uint256 constant TEAM = 3 * 10**5 * DECIMAL_CASES;
  uint256 constant REFERRAL_PROGRAMS = 7 * 10**5 * DECIMAL_CASES;
  uint256 constant PRESALE = 1065 * 10**3 * DECIMAL_CASES;
  uint256 constant PUBLICSALE = 6535 * 10**3 * DECIMAL_CASES;

  address founders_address;
  address advisors_address;
  address team_address;
  address referral_address;
  address presale_address;
  address publicsale_address;

  function setUp(address _token, address _founders, address _advisors, address _team, address _referral, address _presale, address _publicSale) public onlyOwner{
    token = TaylorToken(_token);
    founders_address = _founders;
    advisors_address = _advisors;
    team_address = _team;
    referral_address = _referral;
    presale_address = _presale;
    publicsale_address = _publicSale;
    ready = true;
  }

  function distribute() public onlyOwner {
    uint256 total = FOUNDERS.add(ADVISORS).add(TEAM).add(REFERRAL_PROGRAMS).add(PRESALE).add(PUBLICSALE);
    require(total >= token.balanceOf(this));
    token.transfer(founders_address, FOUNDERS);
    token.transfer(advisors_address, ADVISORS);
    token.transfer(team_address, TEAM);
    token.transfer(referral_address, REFERRAL_PROGRAMS);
    token.transfer(presale_address, PRESALE);
    token.transfer(publicsale_address, PUBLICSALE);
  }

}
