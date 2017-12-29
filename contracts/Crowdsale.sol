pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./TaylorToken.sol";

contract Crowdsale is Ownable {

  using SafeMath for uint256;

  /**
      EVENTS
  **/
  event Purchase(address indexed buyer, uint256 weiAmount, uint256 tokenAmount);
  /**
      CONTRACT VARIABLES
  **/

  TaylorToken public token;

  uint256 public startTime;
  uint256 public endTime;
  uint256 public weiRaised;
  uint256 public TokensSold;
  uint256 public cap;
  uint256[4] public rates;
  address public wallet;


  mapping (address => bool) public whitelisted;

  /**
      CONSTRUCTOR
  **/

  function Crowdsale(
    uint256 _startTime,
    uint256 duration,
    address _token,
    address _wallet)
    public
  {
    require(_startTime >= now);
    require(_rate > 0);
    require(_token != address(0));
    require(_wallet != address(0));

    startTime = _startTime;
    endTime = startTime + duration * 1 days ;
    rate = _rate;
    token = _token;
    wallet = _wallet;
  }


  /**
      PUBLIC FUNCTIONS

  **/
  function () payable public {
    buyTokens();
  }

  function buyTokens() payable public {
    require(isValidPurchase());

    uint amount = msg.value;

    if(weiRaised.add(amount) > cap){
      amount = cap.sub(weiRaised);
    }
    msg.sender.transfer(msg.value - amount);

    uint256 tokens = calculateTokenAmount(amount);

    /*
      TODO: transfer tokens to buyer 
    */

    forwardFunds();
    Purchase(msg.sender, msg.value);
  }

  /**
      INTERNAL FUNCTIONS

  **/
  function isValidPurchase() returns(bool valid) {
    require(whitelisted[msg.sender]);
    require(msg.value >= 0.01 ether && msg.value <= 50 ether);
    require(now >= startTime && now <= endTime);
    return true;
  }

  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  function calculateTokenAmount(uint256 weiAmount) internal {
    return weiAmount.mul(rates[getCurrentWeek()]);
  }

  function getCurrentWeek() pure internal {
    return (now - startTime) / 1 weeks;
  }

}
