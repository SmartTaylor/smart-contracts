pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./TaylorToken.sol";

contract Crowdsale is Ownable {

  using SafeMath for uint256;

  /**
      EVENTS
      TODO: remove debug event
  **/
  event Purchase(address indexed buyer, uint256 weiAmount, uint256 tokenAmount);
  event Finalized(uint256 tokensSold, uint256 weiAmount);
  event Debug(uint256 vla);

  /**
      CONTRACT VARIABLES
  **/

  TaylorToken public taylorToken;

  uint256 public startTime;
  uint256 public endTime;
  uint256 public weiRaised;
  uint256 public tokensSold;
  uint256 public tokenCap;
  uint256[4] public rates;
  address public wallet;


  mapping (address => bool) public whitelisted;
  mapping (address => bool) public whitelistedPools;
  mapping (address => uint256) public contributors;

  /**
      CONSTRUCTOR
  **/

  function Crowdsale(
    uint256 _startTime,
    uint256 _duration,
    uint256 _tokenCap,
    address _token,
    address _wallet)
    public
  {
    require(_startTime >= now);
    require(_token != address(0));
    require(_wallet != address(0));

    taylorToken = TaylorToken(_token);

    startTime = _startTime;
    endTime = startTime + _duration * 1 days ;
    wallet = _wallet;
    tokenCap = _tokenCap;
    rates = [700000000000000, 790000000000000, 860000000000000, 930000000000000];
  }


  /**
      PUBLIC FUNCTIONS

  **/
  function () payable public {
    buyTokens();
  }

  function buyTokens() payable public {
    require(isValidPurchase());

    uint256 tokens;
    tokens  = calculateTokenAmount(msg.value);

    if(whitelistedPools[msg.sender]){
      require(contributors[msg.sender].add(msg.value) <= 250 ether);
    } else {
      require(contributors[msg.sender].add(msg.value) <= 50 ether);
    }

    contributors[msg.sender] = contributors[msg.sender].add(msg.value);
    taylorToken.transfer(msg.sender, tokens);

    tokensSold = tokensSold.add(tokens);
    weiRaised = weiRaised.add(msg.value);

    forwardFunds(msg.value);
    Purchase(msg.sender, msg.value, tokens);

    if(tokenCap - tokensSold < calculateTokenAmount(0.01 ether)){
      finalizeSale();
    }
  }

  function addWhitelisted(address _address, bool isPool)
    public
    onlyOwner
  {
    if(isPool) {
      whitelistedPools[_address] = true;
    } else {
      whitelisted[_address] = true;
    }
  }

  /**
      INTERNAL FUNCTIONS

  **/
  function isValidPurchase() returns(bool valid) {
    require(now >= startTime && now <= endTime);
    require(msg.value >= 0.01 ether);
    if(whitelistedPools[msg.sender]){
      require(msg.value <= 250 ether);
    } else if (whitelisted[msg.sender]){
      require(msg.value <= 50 ether);
    } else {
      return false;
    }
    return true;
  }

  function forwardFunds(uint256 _amount) internal {
    wallet.transfer(_amount);
  }

  function calculateTokenAmount(uint256 weiAmount) internal returns(uint tokenAmount){
    uint week = getCurrentWeek();
    return weiAmount.mul(10**18).div(rates[week]);
  }

  function getCurrentWeek() view internal returns(uint256 _week){
    return (now - startTime) / 1 weeks;
  }

  function finalizeSale() {
    taylorToken.burn(taylorToken.balanceOf(this));
    Finalized(tokensSold, weiRaised);
  }

  /**
      READ ONLY FUNCTIONS

  **/
  function getCurrentRate() view public returns(uint256 _rate){
    return rates[getCurrentWeek()];
  }


}
