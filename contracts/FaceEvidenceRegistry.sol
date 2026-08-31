// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FaceEvidenceRegistry
 * @dev Smart Contract for immutable anchoring and verification of biometric face-to-web evidence.
 * Compatible with Ethereum Sepolia, Polygon Amoy, Arbitrum, and local Hardhat/Anvil nodes.
 */
contract FaceEvidenceRegistry {
    
    struct EvidenceRecord {
        string recordId;
        string postUrl;
        string author;
        string imageHashSha256;
        string faceEmbeddingDigest;
        string merkleRoot;
        uint256 blockTimestamp;
        address recordedBy;
        bool exists;
    }

    // Mapping from recordId to EvidenceRecord
    mapping(string => EvidenceRecord) private _records;
    
    // Mapping from postUrl or imageHash to recordId for reverse lookup
    mapping(string => string) private _urlToRecordId;
    mapping(string => string) private _imageHashToRecordId;

    // Array of all recorded IDs
    string[] private _allRecordIds;

    // Contract administrator / verifier authority
    address public immutable verifierAuthority;

    // Events
    event EvidenceRecorded(
        string indexed recordId,
        string postUrl,
        string imageHashSha256,
        string faceEmbeddingDigest,
        string merkleRoot,
        uint256 timestamp,
        address indexed recordedBy
    );

    event EvidenceVerified(
        string indexed recordId,
        bool isValid,
        uint256 timestamp,
        address indexed verifier
    );

    modifier onlyAuthority() {
        require(msg.sender == verifierAuthority, "Caller is not the authorized verifier");
        _;
    }

    constructor() {
        verifierAuthority = msg.sender;
    }

    /**
     * @notice Anchor a discovered social media / web evidence record to the blockchain.
     */
    function recordEvidence(
        string calldata recordId,
        string calldata postUrl,
        string calldata author,
        string calldata imageHashSha256,
        string calldata faceEmbeddingDigest,
        string calldata merkleRoot
    ) external returns (bool) {
        require(!_records[recordId].exists, "Evidence record ID already exists");
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(bytes(imageHashSha256).length == 64, "Invalid SHA-256 image hash length");

        EvidenceRecord memory record = EvidenceRecord({
            recordId: recordId,
            postUrl: postUrl,
            author: author,
            imageHashSha256: imageHashSha256,
            faceEmbeddingDigest: faceEmbeddingDigest,
            merkleRoot: merkleRoot,
            blockTimestamp: block.timestamp,
            recordedBy: msg.sender,
            exists: true
        });

        _records[recordId] = record;
        _urlToRecordId[postUrl] = recordId;
        _imageHashToRecordId[imageHashSha256] = recordId;
        _allRecordIds.push(recordId);

        emit EvidenceRecorded(
            recordId,
            postUrl,
            imageHashSha256,
            faceEmbeddingDigest,
            merkleRoot,
            block.timestamp,
            msg.sender
        );

        return true;
    }

    /**
     * @notice Re-verify an evidence record against on-chain stored hashes.
     */
    function verifyEvidence(
        string calldata recordId,
        string calldata candidateImageHashSha256,
        string calldata candidatePostUrl
    ) external returns (bool isValid, uint256 timestamp, address recorder) {
        require(_records[recordId].exists, "Evidence record does not exist on-chain");

        EvidenceRecord memory record = _records[recordId];

        bool imageMatches = (keccak256(bytes(record.imageHashSha256)) == keccak256(bytes(candidateImageHashSha256)));
        bool urlMatches = (keccak256(bytes(record.postUrl)) == keccak256(bytes(candidatePostUrl)));

        isValid = (imageMatches && urlMatches);

        emit EvidenceVerified(recordId, isValid, block.timestamp, msg.sender);

        return (isValid, record.blockTimestamp, record.recordedBy);
    }

    /**
     * @notice Retrieve evidence details by recordId.
     */
    function getEvidence(string calldata recordId) external view returns (
        string memory postUrl,
        string memory author,
        string memory imageHashSha256,
        string memory faceEmbeddingDigest,
        string memory merkleRoot,
        uint256 blockTimestamp,
        address recordedBy
    ) {
        require(_records[recordId].exists, "Evidence record not found");
        EvidenceRecord memory r = _records[recordId];
        return (
            r.postUrl,
            r.author,
            r.imageHashSha256,
            r.faceEmbeddingDigest,
            r.merkleRoot,
            r.blockTimestamp,
            r.recordedBy
        );
    }

    /**
     * @notice Return total count of anchored evidence records.
     */
    function totalRecords() external view returns (uint256) {
        return _allRecordIds.length;
    }
}
