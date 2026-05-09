// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PrivateVoting
/// @notice Minimal confidential voting example for the Zama tutorial.
/// @dev Keeps vote choices and intermediate tallies encrypted while exposing
/// public metadata such as title, options and voting window.
contract PrivateVoting is ZamaEthereumConfig {
    uint8 public constant MAX_OPTIONS = 3;

    error InvalidVotingWindow();
    error InvalidOptionCount();
    error VotingNotStarted();
    error VotingClosed();
    error AlreadyVoted();
    error ResultsUnavailable();
    error ResultsAlreadyPublished();
    error OptionOutOfBounds();

    // 公开变量
    address public immutable owner;
    string public title;
    uint64 public startTime;
    uint64 public endTime;
    bool public resultsPublished;

    // 私有变量
    string[] private _options; // 选项列表 (虽未加密，但设为私有)
    mapping(address voter => bool voted) private _hasVoted;
    mapping(uint8 optionIndex => euint8 tally) private _encryptedTallies;

    event VoteSubmitted(address indexed voter);
    event ResultsPublished();
    event ResultAccessGranted(address indexed viewer);

    constructor(string memory title_, string[] memory options_, uint64 startTime_, uint64 endTime_) {
        if (options_.length < 2 || options_.length > MAX_OPTIONS) {
            revert InvalidOptionCount();
        }
        if (startTime_ >= endTime_) {
            revert InvalidVotingWindow();
        }

        owner = msg.sender;
        title = title_;
        startTime = startTime_;
        endTime = endTime_;

        for (uint8 i = 0; i < options_.length; i++) {
            _options.push(options_[i]);
            _encryptedTallies[i] = FHE.asEuint8(0);
            FHE.allowThis(_encryptedTallies[i]);
        }
    }

    function optionCount() external view returns (uint256) {
        return _options.length;
    }

    function getOptions() external view returns (string[] memory) {
        return _options;
    }

    function hasVoted(address voter) external view returns (bool) {
        return _hasVoted[voter];
    }

    function vote(externalEuint8 encryptedOption, bytes calldata inputProof) external {
        // 1. 前置校验：检查投票窗口、是否重复投票。
        if (block.timestamp < startTime) {
            revert VotingNotStarted();
        }
        if (block.timestamp >= endTime) {
            revert VotingClosed();
        }
        if (_hasVoted[msg.sender]) {
            revert AlreadyVoted();
        }

        // 2. 转换加密输入
        euint8 choice = FHE.fromExternal(encryptedOption, inputProof);

        // 3. 同态计算票数
        for (uint8 i = 0; i < _options.length; i++) {
            ebool isSelected = FHE.eq(choice, i);
            euint8 increment = FHE.select(isSelected, FHE.asEuint8(1), FHE.asEuint8(0));
            _encryptedTallies[i] = FHE.add(_encryptedTallies[i], increment);
            FHE.allowThis(_encryptedTallies[i]);
        }

        _hasVoted[msg.sender] = true;
        emit VoteSubmitted(msg.sender);
    }

    // 权限切换与数据公开准备
    function publishResults() external {
        // 1. 时机控制：只能在投票结束后调用。
        if (block.timestamp < endTime) {
            revert ResultsUnavailable();
        }
        if (resultsPublished) {
            revert ResultsAlreadyPublished();
        }

        resultsPublished = true;

        for (uint8 i = 0; i < _options.length; i++) {
            FHE.allowThis(_encryptedTallies[i]);
            FHE.allow(_encryptedTallies[i], owner); // 权限授予
        }

        emit ResultsPublished();
    }

    // 允许 owner 在结果公布后，向特定地址（viewer）授予查看加密票数的权限。
    function grantResultAccess(address viewer) external {
        if (!resultsPublished) {
            revert ResultsUnavailable();
        }

        for (uint8 i = 0; i < _options.length; i++) {
            FHE.allow(_encryptedTallies[i], viewer);
        }

        emit ResultAccessGranted(viewer);
    }

    // 获得授权的地址（通过 FHE.allow）可以调用此函数，获取加密的票数 euint8。
    function getEncryptedTally(uint8 optionIndex) external view returns (euint8) {
        if (!resultsPublished) {
            revert ResultsUnavailable();
        }
        if (optionIndex >= _options.length) {
            revert OptionOutOfBounds();
        }

        return _encryptedTallies[optionIndex];
    }
}
