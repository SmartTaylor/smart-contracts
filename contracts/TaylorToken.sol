pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./Ownable.sol";

contract TaylorToken is Ownable{

    using SafeMath for uint256;

    /**
        EVENTS
    **/
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Burn(address indexed _owner, uint256 _amount);
    /**
        CONTRACT VARIABLES
    **/
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    string public name = "Taylor";
    string public symbol = "TAY";
    uint8 public decimals = 18;
    uint256 constant internal DECIMAL_CASES = 10**18;
    uint256 public totalSupply = 10**6 * DECIMAL_CASES;
    bool public transferable = false;

    /**
        MODIFIERS
    **/
    modifier onlyWhenTransferable(){
      require(transferable);
      _;
    }

    /**
        CONSTRUCTOR
    **/
    function TaylorToken()
      Ownable()
      public
    {
      balances[owner] = balances[owner].add(totalSupply);
    }

    /**
        OWNER ONLY FUNCTIONS
    **/
    function setTransferable(bool _transferable)
      public
      onlyOwner
      returns (bool success)
    {
      transferable = _transferable;
    }

    function transferFromOwner(address _to, uint256 _value)
      public
      onlyOwner
      returns (bool success)
    {
      require(_to != address(0));
      require(_value <= balances[msg.sender]);

      balances[msg.sender] = balances[msg.sender].sub(_value);
      balances[_to] = balances[_to].add(_value);
      Transfer(owner, _to, _value);
      return true;
    }

    function burn(uint256 _amount)
      public
      onlyOwner
      returns (bool success)
    {
      require(_amount <= balances[msg.sender]);
      balances[msg.sender] = balances[msg.sender].sub(_amount);
      totalSupply =  totalSupply.sub(_amount);
      Burn(msg.sender, _amount);
      return true;
    }

    /**
        PUBLIC FUNCTIONS
    **/
    function transfer(address _to, uint256 _value)
      public
      onlyWhenTransferable
      returns (bool success)
    {
          require(_to != address(0));
          require(_value <= balances[msg.sender]);

          balances[msg.sender] = balances[msg.sender].sub(_value);
          balances[_to] = balances[_to].add(_value);
          Transfer(msg.sender, _to, _value);
          return true;
    }

    function transferFrom
      (address _from,
        address _to,
        uint256 _value)
        public
        onlyWhenTransferable
        returns (bool success) {
      require(_to != address(0));
      require(_value <= balances[_from]);
      require(_value <= allowed[_from][msg.sender]);

      balances[_from] = balances[_from].sub(_value);
      balances[_to] = balances[_to].add(_value);
      allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
      Transfer(_from, _to, _value);
      return true;
    }

    function approve(address _spender, uint256 _value)
      public
      onlyWhenTransferable
      returns (bool success)
    {
        if(allowed[msg.sender][_spender] != 0){
          require(_value == 0);
        }

        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }


    /**
        CONSTANT FUNCTIONS
    **/
    function balanceOf(address _owner) view public returns (uint256 balance) {
        return balances[_owner];
    }

    function allowance(address _owner, address _spender)
      view
      public
      returns (uint256 remaining)
    {
      return allowed[_owner][_spender];
    }

    function decimals() constant returns (uint8 _decimals) {
      return decimals;
    }

    function totalSupply() constant returns (uint256 _totalSupply) {
      return totalSupply;
    }

}
