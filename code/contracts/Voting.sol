// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Voting
/// @notice Part 4 of the lab: a simple decentralised voting system.
/// @dev Rules enforced by the contract itself (not by the frontend):
///      - at least three candidates, created in the constructor;
///      - one vote per Ethereum address (tracked with a mapping);
///      - votes for invalid candidate ids are rejected with require();
///      - every successful vote emits a VoteCast event.
contract Voting {
    /// @notice A single candidate in the election.
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // All candidates, in order. candidates[0] has id 0, and so on.
    Candidate[] public candidates;

    // Tracks which addresses have already voted: voted[addr] == true
    // means that address has used its one vote.
    mapping(address => bool) private voted;

    /// @notice Emitted when a vote is successfully recorded.
    /// @param voter The address that cast the vote (msg.sender).
    /// @param candidateId The id of the candidate voted for.
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    /// @notice Creates the election with three candidates.
    constructor() {
        _addCandidate("Alice Sharma");
        _addCandidate("Rohan Verma");
        _addCandidate("Priya Nair");
    }

    function _addCandidate(string memory _name) private {
        candidates.push(Candidate({id: candidates.length, name: _name, voteCount: 0}));
    }

    /// @notice Casts one vote for a candidate.
    /// @param _candidateId Id of the candidate (0, 1 or 2).
    function vote(uint256 _candidateId) public {
        require(!voted[msg.sender], "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");

        voted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;

        emit VoteCast(msg.sender, _candidateId);
    }

    /// @notice Returns the details of one candidate.
    function getCandidate(uint256 _candidateId)
        public
        view
        returns (uint256 id, string memory name, uint256 voteCount)
    {
        require(_candidateId < candidates.length, "Invalid candidate ID");
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    /// @notice Returns how many candidates there are.
    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    /// @notice Returns true if the given address has already voted.
    function hasVoted(address _voter) public view returns (bool) {
        return voted[_voter];
    }

    /// @notice Convenience helper for the frontend: returns every candidate
    ///         in a single call.
    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }
}
