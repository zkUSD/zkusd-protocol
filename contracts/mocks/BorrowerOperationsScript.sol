// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../dependencies/CheckContract.sol";
import "../interfaces/IBorrowerOperations.sol";

contract BorrowerOperationsScript is CheckContract {
    IBorrowerOperations immutable borrowerOperations;

    constructor(IBorrowerOperations _borrowerOperations) public {
        checkContract(address(_borrowerOperations));
        borrowerOperations = _borrowerOperations;
    }

    function openTrove(
        uint _maxFee,
        uint _ZKUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external payable {
        borrowerOperations.openTrove{value: msg.value}(
            _maxFee,
            _ZKUSDAmount,
            _upperHint,
            _lowerHint
        );
    }

    function addColl(address _upperHint, address _lowerHint) external payable {
        borrowerOperations.addColl{value: msg.value}(_upperHint, _lowerHint);
    }

    function withdrawColl(
        uint _amount,
        address _upperHint,
        address _lowerHint
    ) external {
        borrowerOperations.withdrawColl(_amount, _upperHint, _lowerHint);
    }

    function withdrawZKUSD(
        uint _maxFee,
        uint _amount,
        address _upperHint,
        address _lowerHint
    ) external {
        borrowerOperations.withdrawZKUSD(
            _maxFee,
            _amount,
            _upperHint,
            _lowerHint
        );
    }

    function repayZKUSD(
        uint _amount,
        address _upperHint,
        address _lowerHint
    ) external {
        borrowerOperations.repayZKUSD(_amount, _upperHint, _lowerHint);
    }

    function closeTrove() external {
        borrowerOperations.closeTrove();
    }

    function adjustTrove(
        uint _maxFee,
        uint _collWithdrawal,
        uint _debtChange,
        bool isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable {
        borrowerOperations.adjustTrove{value: msg.value}(
            _maxFee,
            _collWithdrawal,
            _debtChange,
            isDebtIncrease,
            _upperHint,
            _lowerHint
        );
    }

    function claimCollateral() external {
        borrowerOperations.claimCollateral();
    }
}
