pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./TaylorToken.sol";

/**
  @title Crowdsale
**/
contract Crowdsale is Ownable {

  using SafeMath for uint256;

  /**
      EVENTS
  **/
  event Purchase(address indexed buyer, uint256 weiAmount, uint256 tokenAmount);
  event Finalized(uint256 tokensSold, uint256 weiAmount);
  /**
      CONTRACT VARIABLES
  **/

  TaylorToken public taylorToken;

  uint256 public startTime;
  uint256 public endTime;
  uint256 public weiRaised;
  uint256 public tokensSold;
  uint256 public tokenCap;
  uint256 public poolEthSold;
  uint256 public poolEthCap;
  uint256[4] public rates;
  uint256 public specialPoolsRate;
  address public wallet;


  mapping (address => bool) public whitelisted;
  mapping (address => bool) public whitelistedPools;
  mapping (address => uint256) public contributors;

  /**
      CONSTRUCTOR
  **/

  /**
    @dev ICO CONSTRUCTOR
    @param _startTime uint256 timestamp that the sale will begin
    @param _duration uint256  how long(in days) the sale will last
    @param _tokenCap uint256 How many tokens will be sold sale
    @param _token address the address of the token contract
    @param _wallet address the address of the wallet that will recieve funds
  **/
  function Crowdsale(
    uint256 _startTime,
    uint256 _duration,
    uint256 _tokenCap,
    address _token,
    address _wallet)
    public
  {
    //require(_startTime >= now);
    require(_token != address(0));
    require(_wallet != address(0));

    taylorToken = TaylorToken(_token);

    startTime = _startTime;
    endTime = startTime + _duration * 1 days ;
    wallet = _wallet;
    tokenCap = _tokenCap;
    poolEthCap = 1250 ether;
    rates = [700000000000000, 790000000000000, 860000000000000, 930000000000000];
    specialPoolsRate = 600000000000000;
  }


  /**
      PUBLIC FUNCTIONS

  **/

  /**
    @dev Fallback function that accepts eth and buy tokens
  **/
  function () payable public {
    buyTokens();
  }

  /**
    @dev Allows participants to buy tokens
  **/
  function buyTokens() payable public {
    require(isValidPurchase());

    uint256 tokens;
    uint256 amount = msg.value;

    if(whitelistedPools[msg.sender]){
      require(contributors[msg.sender].add(amount) <= 250 ether);
    } else {
      require(contributors[msg.sender].add(amount) <= 50 ether);
    }

    uint256 ch;
    if(poolEthSold.add(amount) > poolEthCap){
      uint256 validAmount = poolEthCap.sub(poolEthSold);
      ch = amount.sub(validAmount);
      msg.sender.transfer(ch);
      amount = validAmount;
    }

    tokens  = calculateTokenAmount(amount);


    uint change;
    uint tokenPool = tokensSold.add(tokens);
    if(tokenPool > tokenCap){
      uint256 possibleTokens = tokenCap.sub(tokensSold);
      change = calculatePriceForTokens(tokens.sub(possibleTokens));
      msg.sender.transfer(change);
      tokens = possibleTokens;
    }

    amount = amount.sub(change);

    contributors[msg.sender] = contributors[msg.sender].add(amount);
    taylorToken.transfer(msg.sender, tokens);

    tokensSold = tokensSold.add(tokens);
    weiRaised = weiRaised.add(amount);
    if(whitelistedPools[msg.sender]){
      poolEthSold = poolEthSold.add(amount);
    }


    forwardFunds(amount);
    Purchase(msg.sender, amount, tokens);

    if(tokenCap - tokensSold < calculateTokenAmount(0.01 ether)){
      finalizeSale();
    }
  }

  /**
    @dev Allows owner to add addresses to the whitelisted
    @param _address address The address to be added
    @param isPool bool Indicating if address represents a buying pool
  **/
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

  /**
    @dev Checks if purchase is valid
    @return Bool Indicating if purchase is valid
  **/
  function isValidPurchase() view internal returns(bool valid) {
    require(now >= startTime && now <= endTime);
    require(msg.value >= 0.01 ether);
    uint256 week = getCurrentWeek();
    if(whitelistedPools[msg.sender] && week == 0){
      require(msg.value <= 250 ether);
    } else if (whitelisted[msg.sender] || whitelistedPools[msg.sender]){
      require(msg.value <= 50 ether);
    } else {
      return false;
    }
    return true;
  }

  /**
    @dev Internal function that redirects recieved funds to wallet
    @param _amount uint256 The amount to be fowarded
  **/
  function forwardFunds(uint256 _amount) internal {
    wallet.transfer(_amount);
  }

  /**
    @dev Calculates the amount of tokens that buyer will recieve
    @param weiAmount uint256 The amount, in Wei, that will be bought
    @return uint256 Representing the amount of tokens that weiAmount buys in
    the current stage of the sale
  **/
  function calculateTokenAmount(uint256 weiAmount) view internal returns(uint256 tokenAmount){
    uint week = getCurrentWeek();
    if(week == 0 && whitelistedPools[msg.sender]){
      return weiAmount.mul(10**18).div(specialPoolsRate);
    }
    return weiAmount.mul(10**18).div(rates[week]);
  }

  /**
    @dev Calculates wei cost of specific amount of tokens
    @param tokenAmount uint256 The amount of tokens to be calculated
    @return uint256 Representing the total cost, in wei, for tokenAmount
  **/
  function calculatePriceForTokens(uint256 tokenAmount) view internal returns(uint256 weiAmount){
    uint256 week = getCurrentWeek();
    return tokenAmount.div(10**18).mul(rates[week]);
  }

  /**
    @dev Checks the current week in the sale. It's zero indexed, so the first
    week returns 0, the sencond 1, and so forth.
    @return Uint representing the current week
  **/
  function getCurrentWeek() view internal returns(uint256 _week){
    uint256 week = (now - startTime) / 1 weeks;
    if(week > 3){
      week = 3;
    }
    return week;
  }

  /**
    @dev Triggers the sale finalizations process
  **/
  function finalizeSale() internal {
    taylorToken.burn(taylorToken.balanceOf(this));
    Finalized(tokensSold, weiRaised);
  }

  /**
      READ ONLY FUNCTIONS

  **/

  /**
    @dev Give the current rate(in Wei) that buys exactly one token
  **/
  function getCurrentRate() view public returns(uint256 _rate){
    return rates[getCurrentWeek()];
  }


}
