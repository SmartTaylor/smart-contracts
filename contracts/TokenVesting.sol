pragma solidity ^0.4.18;

import './TaylorToken.sol';
import './Ownable.sol';
import './Utils/SafeMath.sol';

/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and vesting period.
 */
contract TokenVesting is Ownable {
  using SafeMath for uint256;

  event Released(uint256 amount);

  // beneficiary of tokens after they are released
  address public beneficiary;

  TaylorToken public token;

  uint256 public cliff;
  uint256 public start;
  uint256 public duration;

  uint256 public released;

  /**
   * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
   * _beneficiary, gradually in a linear fashion until _start + _duration. By then all
   * of the balance will have vested.
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _duration duration in seconds of the period in which the tokens will vest
   * @param _token The token to be vested
   */
  function TokenVesting(address _beneficiary,address _token, uint256 _start, uint256 _cliff, uint256 _duration) public {
    require(_beneficiary != address(0));
    require(_cliff <= _duration);

    beneficiary = _beneficiary;
    duration = _duration;
    token = TaylorToken(_token);
    cliff = _start.add(_cliff);
    start = _start;
  }

  /**
   * @notice Transfers vested tokens to beneficiary.
   */
  function release() public {
    uint256 unreleased = releasableAmount();
    require(unreleased > 0);

    released = released.add(unreleased);

    token.transfer(beneficiary, unreleased);

    Released(unreleased);
  }

  /**
   * @dev Calculates the amount that has already vested but hasn't been released yet.
   */
  function releasableAmount() public view returns (uint256) {
    return vestedAmount().sub(released);
  }

  /**
   * @dev Calculates the amount that has already vested.
   */
  function vestedAmount() public view returns (uint256) {
    uint256 currentBalance = token.balanceOf(this);
    uint256 totalBalance = currentBalance.add(released);

    if (now < cliff) {
      return 0;
    } else if (now >= cliff && now < start.add(duration)) {
      return totalBalance / 2;
    } else {
      return totalBalance;
    }
  }
}
