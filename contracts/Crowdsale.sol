/**
    Copyright (c) 2018 SmartTaylor

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

    based on the contracts of OpenZeppelin:
    https://github.com/OpenZeppelin/zeppelin-solidity/tree/master/contracts

**/

pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./TaylorToken.sol";
import "./Pausable.sol";

/**
  @title Crowdsale

**/
contract Crowdsale is Ownable, Pausable {

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
  bool public finalized;
  address public wallet;

  uint256[4] public rates;

  mapping (address => bool) public whitelisted;
  mapping (address => bool) public whitelistedPools;
  mapping (address => uint256) public contributors;

  /**
      PUBLIC CONSTANTS
  **/
  uint256 public constant poolEthCap = 1250 ether;
  uint256 public constant minimumPoolPurchase = 100 ether;
  uint256 public constant minimumPurchase = 0.01 ether;
  uint256 public constant maximumPoolPurchase = 250 ether;
  uint256 public constant maximumPurchase = 50 ether;
  uint256 public constant specialPoolsRate = 600000000000000;



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

  /**
    @dev Fallback function that accepts eth and buy tokens
  **/
  function () payable whenNotPaused public {
    buyTokens();
  }

  /**
    @dev Allows participants to buy tokens
  **/
  function buyTokens() payable whenNotPaused public {
    require(isValidPurchase());

    uint256 tokens;
    uint256 amount = msg.value;


    if(whitelistedPools[msg.sender] && poolEthSold.add(amount) > poolEthCap){
      uint256 validAmount = poolEthCap.sub(poolEthSold);
      require(validAmount > 0);
      uint256 ch = amount.sub(validAmount);
      msg.sender.transfer(ch);
      amount = validAmount;
    }

    tokens  = calculateTokenAmount(amount);


    uint256 tokenPool = tokensSold.add(tokens);
    if(tokenPool > tokenCap){
      uint256 possibleTokens = tokenCap.sub(tokensSold);
      uint256 change = calculatePriceForTokens(tokens.sub(possibleTokens));
      msg.sender.transfer(change);
      tokens = possibleTokens;
      amount = amount.sub(change);
    }



    contributors[msg.sender] = contributors[msg.sender].add(amount);
    taylorToken.transfer(msg.sender, tokens);

    tokensSold = tokensSold.add(tokens);
    weiRaised = weiRaised.add(amount);
    if(whitelistedPools[msg.sender]){
      poolEthSold = poolEthSold.add(amount);
    }


    forwardFunds(amount);
    Purchase(msg.sender, amount, tokens);

    if(tokenCap.sub(tokensSold) < calculateTokenAmount(minimumPurchase)){
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
    whenNotPaused
  {
    if(isPool) {
      whitelistedPools[_address] = true;
    } else {
      whitelisted[_address] = true;
    }
  }

  /**
    @dev Triggers the finalization process
  **/
  function endSale() whenNotPaused public {
    require(finalized ==  false);
    require(now > endTime);
    finalized = true;
    finalizeSale();
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
    require(msg.value >= minimumPurchase);
    uint256 week = getCurrentWeek();
    if(week == 0 && whitelistedPools[msg.sender]){
      require(msg.value >= minimumPoolPurchase);
      require(contributors[msg.sender].add(msg.value) <= maximumPoolPurchase);
    } else {
      require(whitelisted[msg.sender] || whitelistedPools[msg.sender]);
      require(contributors[msg.sender].add(msg.value) <= maximumPurchase);
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
    uint256 week = getCurrentWeek();
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
    uint256 week = (now.sub(startTime)).div(1 weeks);
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
