// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUnipool {
    function setParams(
        address _lqtyTokenAddress,
        address _uniTokenAddress,
        uint256 _duration
    ) external;

    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function earned(address account) external view returns (uint256);

    function withdrawAndClaim() external;

    function claimReward() external;
}