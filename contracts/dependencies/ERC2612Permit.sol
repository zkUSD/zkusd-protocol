// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/IERC2612.sol";

abstract contract ERC2612Permit is IERC2612, ERC20 {
    string internal constant _VERSION = "1";

    // --- Data for EIP2612 ---

    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 internal constant _PERMIT_TYPEHASH =
        0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    // keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 internal constant _TYPE_HASH =
        0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;

    // Cache the domain separator as an immutable value, but also store the chain id that it corresponds to, in order to
    // invalidate the cached domain separator if the chain id changes.
    bytes32 internal immutable _CACHED_DOMAIN_SEPARATOR;
    uint256 internal immutable _CACHED_CHAIN_ID;

    bytes32 internal immutable _HASHED_NAME;
    bytes32 internal immutable _HASHED_VERSION;
    mapping(address => uint256) internal _nonces;

    constructor(string memory name) {
        bytes32 hashedName = keccak256(bytes(name));
        bytes32 hashedVersion = keccak256(bytes(_VERSION));

        _HASHED_NAME = hashedName;
        _HASHED_VERSION = hashedVersion;
        _CACHED_CHAIN_ID = _chainID();
        _CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator(
            _TYPE_HASH,
            hashedName,
            hashedVersion
        );
    }

    function domainSeparator() public view override returns (bytes32) {
        if (_chainID() == _CACHED_CHAIN_ID) {
            return _CACHED_DOMAIN_SEPARATOR;
        } else {
            return
                _buildDomainSeparator(
                    _TYPE_HASH,
                    _HASHED_NAME,
                    _HASHED_VERSION
                );
        }
    }

    function permit(
        address owner,
        address spender,
        uint amount,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(deadline >= block.timestamp, "ZKUSD: expired deadline");
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                domainSeparator(),
                keccak256(
                    abi.encode(
                        _PERMIT_TYPEHASH,
                        owner,
                        spender,
                        amount,
                        _nonces[owner]++,
                        deadline
                    )
                )
            )
        );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress == owner, "ZKUSD: invalid signature");
        _approve(owner, spender, amount);
    }

    function nonces(address owner) external view override returns (uint256) {
        // FOR EIP 2612
        return _nonces[owner];
    }

    // --- Internal operations ---

    function _chainID() private view returns (uint256 chainID) {
        assembly {
            chainID := chainid()
        }
    }

    function _buildDomainSeparator(
        bytes32 _typeHash,
        bytes32 _name,
        bytes32 _version
    ) private view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _typeHash,
                    _name,
                    _version,
                    _chainID(),
                    address(this)
                )
            );
    }

    function version() external pure override returns (string memory) {
        return _VERSION;
    }

    function permitTypeHash() external pure override returns (bytes32) {
        return _PERMIT_TYPEHASH;
    }
}
