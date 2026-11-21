// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SimpleStorage
/// @notice Part 2/3 of the lab: stores a single uint256 value on-chain.
/// @dev Demonstrates a state variable, a constructor, a state-changing
///      function (setNumber) and a read-only function (getNumber).
contract SimpleStorage {
    // State variable: stored permanently in contract storage on the EVM.
    uint256 private storedNumber;

    /// @notice Emitted whenever the stored number changes.
    event NumberChanged(uint256 oldValue, uint256 newValue, address changedBy);

    /// @notice Runs once, at deployment time, to initialise the value.
    /// @param _initialValue The value stored when the contract is deployed.
    constructor(uint256 _initialValue) {
        storedNumber = _initialValue;
    }

    /// @notice Updates the stored number. This changes state, so it must be
    ///         sent as a transaction and costs gas.
    /// @param _newNumber The new value to store.
    function setNumber(uint256 _newNumber) public {
        uint256 oldValue = storedNumber;
        storedNumber = _newNumber;
        emit NumberChanged(oldValue, _newNumber, msg.sender);
    }

    /// @notice Returns the currently stored number. Marked `view` because it
    ///         only reads state — calling it costs no gas and creates no
    ///         transaction.
    /// @return The stored uint256 value.
    function getNumber() public view returns (uint256) {
        return storedNumber;
    }
}
