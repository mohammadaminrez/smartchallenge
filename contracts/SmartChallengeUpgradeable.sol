// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract SmartChallengeUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    struct Challenge {
        uint256 challengeId;
        bytes32 flagHash;
        uint256 reward;
        string ipfsHash;
        uint8 difficulty; // 1 to 5
        uint256 submissionFee;
    }

    struct Player {
        bool isRegistered;
        uint256 score;
        mapping(uint256 => bool) solvedChallenges;
    }

    uint256 public challengeCounter;

    mapping(uint256 => Challenge) public challenges;
    mapping(address => Player) private players;
    address[] public playerAddresses;
    uint256[] public activeChallengeIds;

    event ChallengeSubmitted(address indexed player, uint256 challengeId, bool correct);
    event ChallengeAdded(uint256 indexed challengeId, bytes32 flagHash, uint256 reward, string ipfsHash, uint8 difficulty);
    event Funded(address indexed from, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function addChallenge(
        bytes32 _flagHash,
        uint256 _reward,
        string calldata _ipfsHash,
        uint8 _difficulty,
        uint256 _submissionFee
    ) external onlyOwner {
        require(_reward > 0, "Reward must be > 0");
        require(_difficulty >= 1 && _difficulty <= 5, "Invalid difficulty");
        challenges[challengeCounter] = Challenge(challengeCounter, _flagHash, _reward, _ipfsHash, _difficulty, _submissionFee);
        activeChallengeIds.push(challengeCounter);
        emit ChallengeAdded(challengeCounter, _flagHash, _reward, _ipfsHash, _difficulty);
        challengeCounter++;
    }

    function submitFlag(uint256 _challengeId, string calldata _flag) external payable whenNotPaused nonReentrant {
        Challenge storage c = challenges[_challengeId];
        require(msg.value >= c.submissionFee, "Insufficient fee");
        require(bytes(_flag).length > 0, "Flag is empty");
        require(!players[msg.sender].solvedChallenges[_challengeId], "Already solved");

        bool correct = keccak256(abi.encodePacked(_flag)) == c.flagHash;
        if (correct) {
            if (!players[msg.sender].isRegistered) {
                players[msg.sender].isRegistered = true;
                playerAddresses.push(msg.sender);
            }
            players[msg.sender].solvedChallenges[_challengeId] = true;
            players[msg.sender].score += c.reward;
            payable(msg.sender).transfer(c.reward);
        }
        emit ChallengeSubmitted(msg.sender, _challengeId, correct);
    }

    function getChallenges() external view returns (Challenge[] memory) {
        Challenge[] memory list = new Challenge[](activeChallengeIds.length);
        for (uint256 i = 0; i < activeChallengeIds.length; i++) {
            list[i] = challenges[activeChallengeIds[i]];
        }
        return list;
    }

    function getPlayer(address _player) external view returns (uint256 score) {
        return players[_player].score;
    }

    function isChallengeSolved(address _player, uint256 _challengeId) external view returns (bool) {
        return players[_player].solvedChallenges[_challengeId];
    }

    function getScores() external view returns (address[] memory, uint256[] memory) {
        uint256[] memory scores = new uint256[](playerAddresses.length);
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            scores[i] = players[playerAddresses[i]].score;
        }
        return (playerAddresses, scores);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    function deleteChallenge(uint256 challengeId) external onlyOwner {
        require(challenges[challengeId].reward > 0, "Challenge does not exist");
        delete challenges[challengeId];
        for (uint256 i = 0; i < activeChallengeIds.length; i++) {
            if (activeChallengeIds[i] == challengeId) {
                activeChallengeIds[i] = activeChallengeIds[activeChallengeIds.length - 1];
                activeChallengeIds.pop();
                break;
            }
        }
    }

    function updateChallenge(
        uint256 challengeId,
        bytes32 newFlagHash,
        uint256 newReward,
        string calldata newIpfsHash,
        uint8 newDifficulty,
        uint256 newSubmissionFee
    ) external onlyOwner {
        require(newReward > 0, "Reward must be > 0");
        require(newDifficulty >= 1 && newDifficulty <= 5, "Invalid difficulty");
        Challenge storage c = challenges[challengeId];
        require(c.reward > 0, "Challenge does not exist");
        c.flagHash = newFlagHash;
        c.reward = newReward;
        c.ipfsHash = newIpfsHash;
        c.difficulty = newDifficulty;
        c.submissionFee = newSubmissionFee;
    }

    function fund() external payable {
        require(msg.value > 0, "Must send ETH to fund");
        emit Funded(msg.sender, msg.value);
    }

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    function getActiveChallengeIds() external view returns (uint256[] memory) {
        return activeChallengeIds;
    }

    function getPlayerAddresses() external view returns (address[] memory) {
        return playerAddresses;
    }
}
