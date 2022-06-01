// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import "hardhat/console.sol";

library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCall(target, data, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        require(isContract(target), "Address: call to non-contract");

        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");

        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");

        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verifies that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}


/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(oldAllowance >= value, "SafeERC20: decreased allowance below zero");
            uint256 newAllowance = oldAllowance - value;
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            // Return data is optional
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}
contract mockStakingRewards{
    struct UserInfo {
        uint256 amount; // mock LP tokens user has deposited.
        uint256 rewardDebt; // Cumulative amount of reward paid to user.

        // We do some fancy math here. Basically, any point in time, the amount of ERC20s entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * poolInfo.accERC20PerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a poolInfo. Here's what happens:
        //   1. The poolInfo's `accERC20PerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    struct PoolInfo {
        uint256 lastRewardBlock; // Last block number that mock distribution occurs.
        uint256 accmockPerShare; // Accumulated mock per reward share.
    }

    using SafeERC20 for IERC20;

    // reduce contract codesize with 40 bit type
    uint256 constant REWARDS_MULTIPLIER = 10**12;
    // absolute max fund amount at one time - 15M tokens
    uint256 constant MAX_FUND_LIMIT = 15 * 10**6 * 10**18;

    // The block number when farming can begin
    uint256 public immutable startBlock;

    // The total amount of mock ERC20 that's paid out as reward.
    uint256 public totalPaidOut;
    // ERC20 tokens rewarded per block.
    uint256 public rewardPerBlock;
    // The block number when farming ends  given current funding and reward rate
    uint256 public endBlock;
    // Last timestamp that `fund` func was called
    uint256 public lastFunded;
    // Maximum allowable fund amount
    uint256 public maxFundAmount;

    // TODO: consider adding options array of additional rewards contracts

    // TODO: pausing logic in or out

    // Address of the mock ERC20 Token contract.
    IERC20 mockTokenContract;
    // mock LP token contract
    IERC20 mockLpTokenContract; // Address of mock LP token contract.
    PoolInfo public poolInfo;

    //Rewarder Address
    address public rewarder;
    mapping(address => UserInfo) public userInfo;

    event Funding(
        address indexed admin,
        uint256 amount,
        uint256 rewardPerBlock,
        uint256 endBlock
    );
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Harvest(address indexed user, uint256 amount);
    event MaxFundSet(uint256 newMaxFundAmount);

    // event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        address mockTokenContractAddress, 
        address mockLpTokenContractAddress, 
        uint256 startBlock_
    ) {
        require(
            mockTokenContractAddress != address(0),
            "token address cannot be zero"
        );

        mockTokenContract = IERC20(mockTokenContractAddress);

        require(
            mockLpTokenContractAddress != address(0),
            "lp token address cannot be zero"
        );

        mockLpTokenContract = IERC20(mockLpTokenContractAddress);

        startBlock = startBlock_;
        endBlock = startBlock_;
        poolInfo.lastRewardBlock = startBlock_;
        rewarder = msg.sender;
    }

    modifier onlyAuthorized{
        require(msg.sender == rewarder, "Not Rewarder");
        _;
    }

    function getUserDepositedAmount(address _user)
        external
        view
        returns (uint256)
    {
        return userInfo[_user].amount;
    }

    function getUserPendingReward(address _user)
        external
        view
        returns (uint256)
    {
        UserInfo memory user = userInfo[_user];

        uint256 latestmockPerShare = getLatestRewardPerShare();

        return
            (user.amount * latestmockPerShare) /
            REWARDS_MULTIPLIER -
            user.rewardDebt;
    }

    function getTotalPending() external view returns (uint256) {
        if (block.number <= startBlock) {
            return 0;
        }

        (uint256 lpSupply, ) = getLpSupplyAndLastBlock();
        uint256 latestmockPerShare = getLatestRewardPerShare();

        return ((lpSupply * latestmockPerShare) / REWARDS_MULTIPLIER) - totalPaidOut;
    }

    function getLatestRewardPerShare()
        public
        view
        returns (uint256 accmockPerShare)
    {
        PoolInfo memory plInfo = poolInfo;

        accmockPerShare = plInfo.accmockPerShare;

        (uint256 lpSupply, uint256 lastBlock) = getLpSupplyAndLastBlock();

        if (lastBlock > startBlock && lpSupply > 0) {
            uint256 mockReward = (lastBlock - plInfo.lastRewardBlock) *
                rewardPerBlock;

            accmockPerShare += (mockReward * REWARDS_MULTIPLIER) / lpSupply;
        }
    }

    function getLpSupplyAndLastBlock()
        public
        view
        returns (uint256 lpSupply, uint256 lastBlock)
    {
        lpSupply = mockLpTokenContract.balanceOf(address(this));
        lastBlock = _getLastBlock();
    }

    function setMaxFundAmount(uint256 _newMaxFundAmount)
        external
        onlyAuthorized
    {
        require(_newMaxFundAmount <= MAX_FUND_LIMIT, "new max exceeds limit");
        maxFundAmount = _newMaxFundAmount;

        emit MaxFundSet(_newMaxFundAmount);
    }

    function _getLastBlock() private view returns (uint256 lastBlock) {
        lastBlock = block.number < endBlock ? block.number : endBlock;
    }

    // Fund the farm with rewards, increases the end block
    // !!! Integer math consideration - amount should be much larger than rate
    // sanity check with maxFundAmount
    // TODO: additional sanity checks like 10 min moratorium on deposits?
    function fund(uint256 _amount, uint256 _rewardPerBlock)
        external
        onlyAuthorized
    {
        require(_amount <= maxFundAmount, "amount exceeds max allowable");
        require(_rewardPerBlock < _amount, "reward must be less than amount");

        updatePool();

        rewardPerBlock = _rewardPerBlock;

        mockTokenContract.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amount
        );

        uint256 referenceBlock = block.number > startBlock
            ? block.number
            : startBlock;

        endBlock =
            referenceBlock +
            (mockTokenContract.balanceOf(address(this)) / _rewardPerBlock);

        lastFunded = block.timestamp;

        emit Funding(msg.sender, _amount, _rewardPerBlock, endBlock);
    }

    function updatePool() public {
        uint256 lastBlock = _getLastBlock();

        if (lastBlock == poolInfo.lastRewardBlock || lastBlock <= startBlock) {
            return;
        }

        uint256 lpSupply = mockLpTokenContract.balanceOf(address(this));

        if (lpSupply > 0) {
            uint256 mockReward = (lastBlock - poolInfo.lastRewardBlock) *
                rewardPerBlock;

            poolInfo.accmockPerShare +=
                (mockReward * REWARDS_MULTIPLIER) /
                lpSupply;
        }

        poolInfo.lastRewardBlock = lastBlock;
    }

    function deposit(uint256 _amount) external {
        require(_amount > 0, "amount must be greater than 0");

        UserInfo storage user = userInfo[msg.sender];
        uint256 userAmount = user.amount;
        uint256 userRewardDebt = user.rewardDebt;

        // call before LP transfer
        _harvest(msg.sender, userAmount, userRewardDebt);

        mockLpTokenContract.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amount
        );

        // Add total mock LP token to senders staked tokens
        user.amount += _amount;
        // Then recompute the new rewardDebt
        user.rewardDebt =
            (user.amount * poolInfo.accmockPerShare) /
            REWARDS_MULTIPLIER;

        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external {
        require(_amount > 0, "amount must be greater than 0");

        UserInfo storage user = userInfo[msg.sender];
        uint256 userAmount = user.amount;
        uint256 userRewardDebt = user.rewardDebt;

        require(
            userAmount >= _amount,
            "withdraw: can't withdraw more than deposit"
        );

        _harvest(msg.sender, userAmount, userRewardDebt);

        // Update the reduced amount
        user.amount -= _amount;
        // Then pdate the reward debt
        user.rewardDebt =
            (user.amount * poolInfo.accmockPerShare) /
            REWARDS_MULTIPLIER;
        // Transfer the LP Token back
        mockLpTokenContract.safeTransfer(address(msg.sender), _amount);

        emit Withdraw(msg.sender, _amount);
    }

    function harvest(address _to) public {
        require(_to != address(0), "receiver cannot be zero address");

        UserInfo storage user = userInfo[msg.sender];

        user.rewardDebt = _harvest(_to, user.amount, user.rewardDebt);
    }

    // used to sweep token dust and unclaimed tokens
    function sweep() external onlyAuthorized {
        require(
            block.timestamp > lastFunded + 90 days,
            "90 days since last fund required"
        );

        mockTokenContract.safeTransfer(
            msg.sender,
            mockTokenContract.balanceOf(address(this))
        );

        endBlock = block.number;
        poolInfo = PoolInfo(block.number, 0);
    }

    // cheaper than memory or storage struct - doesn't set any user fields in here
    function _harvest(
        address _to,
        uint256 userAmount,
        uint256 userRewardDebt
    ) private returns (uint256 accumulatedmock) {
        updatePool();

        if (userAmount == 0) {
            accumulatedmock = 0;
        } else {
            accumulatedmock =
                (userAmount * poolInfo.accmockPerShare) /
                REWARDS_MULTIPLIER;
            uint256 pendingmock = accumulatedmock - userRewardDebt;

            if (pendingmock > 0) {
                _mockRewardsTransfer(_to, pendingmock);

                emit Harvest(msg.sender, pendingmock);
            }
        }
    }

    function _mockRewardsTransfer(address _to, uint256 _amount) private {
        mockTokenContract.safeTransfer(_to, _amount);
        totalPaidOut += _amount;
    }
}
