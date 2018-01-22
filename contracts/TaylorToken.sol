pragma solidity 0.4.18;

import "./Utils/SafeMath.sol";
import "./Ownable.sol";

/**
  @title TaylorToken
**/
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

    //this address can transfer even when transfer is disabled.
    mapping (address => bool) public whitelistedTransfer;
    mapping (address => bool) public whitelistedBurn;

    string public name = "Taylor";
    string public symbol = "TAY";
    uint8 public decimals = 18;
    uint256 constant internal DECIMAL_CASES = 10**18;
    uint256 public totalSupply = 10**7 * DECIMAL_CASES;
    bool public transferable = false;

    /**
        MODIFIERS
    **/
    modifier onlyWhenTransferable(){
      if(!whitelistedTransfer[msg.sender]){
        require(transferable);
      }
      _;
    }

    /**
        CONSTRUCTOR
    **/

    /**
      @dev Constructor function executed on contract creation
    **/
    function TaylorToken()
      Ownable()
      public
    {
      balances[owner] = balances[owner].add(totalSupply);
      whitelistedTransfer[msg.sender] = true;
      whitelistedBurn[msg.sender] = true;
    }

    /**
        OWNER ONLY FUNCTIONS
    **/

    /**
      @dev Activates the trasfer for all users
    **/
    function activateTransfers()
      public
      onlyOwner
    {
      transferable = true;
    }

    /**
      @dev Allows the owner to add addresse that can bypass the
      transfer lock. Eg: ICO contract, TGE contract.
      @param _address address Address to be added
    **/
    function addWhitelistedTransfer(address _address)
      public
      onlyOwner
    {
      whitelistedTransfer[_address] = true;
    }

    /**
      @dev Sends all avaible TAY to the TGE contract to be properly
      distribute
      @param _tgeAddress address Address of the token distribution
      contract
    **/
    function distribute(address _tgeAddress)
      public
      onlyOwner
    {
      whitelistedTransfer[_tgeAddress] = true;
      transfer(_tgeAddress, balances[owner]);
    }


    /**
      @dev Allows the owner to add addresse that can burn tokens
      Eg: ICO contract, TGE contract.
      @param _address address Address to be added
    **/
    function addWhitelistedBurn(address _address)
      public
      onlyOwner
    {
      whitelistedBurn[_address] = true;
    }

    /**
        PUBLIC FUNCTIONS
    **/

    /**
    * @dev transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
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

    /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
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

    /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
    For security reasons, if one need to change the value from a existing allowance, it must furst sets
    it to zero and then sets the new value

   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
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
      @dev Allows for msg.sender to burn his on tokens
      @param _amount uint256 The amount of tokens to be burned
    **/
    function burn(uint256 _amount)
      public
      returns (bool success)
    {
      require(whitelistedBurn[msg.sender]);
      require(_amount <= balances[msg.sender]);
      balances[msg.sender] = balances[msg.sender].sub(_amount);
      totalSupply =  totalSupply.sub(_amount);
      Burn(msg.sender, _amount);
      return true;
    }


    /**
        CONSTANT FUNCTIONS
    **/

    /**
    * @dev Gets the balance of the specified address.
    * @param _owner The address to query the the balance of.
    * @return An uint256 representing the amount owned by the passed address.
    */
    function balanceOf(address _owner) view public returns (uint256 balance) {
        return balances[_owner];
    }

    /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _spender address The address which will spend the funds.
   * @return A uint256 specifying the amount of tokens still available for the spender.
   */
    function allowance(address _owner, address _spender)
      view
      public
      returns (uint256 remaining)
    {
      return allowed[_owner][_spender];
    }

}
