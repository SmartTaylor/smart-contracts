pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./TaylorToken.sol";
import "./Ownable.sol";

contract TaylorTokenTGE is Ownable {
  using SafeMath for uint256;

  uint256 constant internal DECIMAL_CASES = 10**18;
  TaylorToken public token;
  bool ready = false;

  uint256 constant public FOUNDERS = 10**6 * DECIMAL_CASES;
  uint256 constant public ADVISORS = 4 * 10**5 * DECIMAL_CASES;
  uint256 constant public TEAM = 3 * 10**5 * DECIMAL_CASES;
  uint256 constant public REFERRAL_PROGRAMS = 7 * 10**5 * DECIMAL_CASES;
  uint256 constant public PRESALE = 1065 * 10**3 * DECIMAL_CASES;
  uint256 constant public PUBLICSALE = 6535 * 10**3 * DECIMAL_CASES;

  address public founders_address;
  address public advisors_address;
  address public team_address;
  address public referral_address;
  address public presale_address;
  address public publicsale_address;

  /**
    @dev Sets up alll the addresses needed for the token distribution
    @param _token address The address of the token that will be distributed
    @param _founders addresses The address that the founders share will be sent to
    @param _advisors addresses The address that the advisors share will be sent to
    @param _team addresses The address that the team share will be sent to
    @param _referral addresses The address that the referral share will be sent to
    @param _presale addresses The address that presale share will be sent to
    @param _publicSale addresses The address that the public sale
  **/
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

  /**
    @dev Distributes all the tokens belonging to this contract to it's defined destinationss
  **/
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
