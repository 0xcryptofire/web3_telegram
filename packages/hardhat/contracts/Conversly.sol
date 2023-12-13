// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract Conversly {
	address public owner;
	bool public isPrivate;
	string public conversationName; // Private key for symmetric encryption
	bytes32 private conversationKey; // Private key for symmetric encryption

	struct GroupEncryptedMessage {
		address sender;
		string encryptedContent;
	}

	GroupEncryptedMessage[] public groupEncryptedMessages;

	mapping(address => bytes32) public participantKeys; // Symmetric keys shared with each participant
	mapping(address participant => bool isParticipant) public participants;

	event GroupEncryptedMessageSent(
		address indexed sender,
		string encryptedContent
	);

	event ConversationCreated(address indexed creator);
	event ParticipantAdded(address indexed participant);

	modifier onlyOwner() {
		console.log(msg.sender);
		require(msg.sender == owner, "Only the owner can call this function");
		_;
	}

	modifier onlyParticipant() {
		console.log("only participant", msg.sender);
		require(
			participants[msg.sender],
			"Only participants can call this function"
		);
		_;
	}

	constructor(
		address _owner,
		string memory _name,
		bool _isPrivate,
		address[] memory initialParticipants
	) {
		owner = _owner;
		participants[_owner] = true;
		conversationName = _name;
		isPrivate = _isPrivate;
		emit ParticipantAdded(_owner);
		emit ConversationCreated(_owner);

		// Add initial participants
		for (uint256 i = 0; i < initialParticipants.length; i++) {
			address participant = initialParticipants[i];
			require(participant != address(0), "Invalid participant address");
			require(!participants[participant], "Participant already exists");
			participants[participant] = true;
			emit ParticipantAdded(participant);
		}
		// generate key
		generateAndSetConversationKey();
	}

	function addParticipant(address participant) public onlyOwner {
		require(!participants[participant], "Participant already exists");
		participants[participant] = true;
		emit ParticipantAdded(participant);
	}

	function joinConversation(address _user) public {
		require(!participants[_user], "Already a participant");
		require(!isPrivate, "You can only join public conversations");
		participants[_user] = true;
		emit ParticipantAdded(_user);

		console.log("Joined conversation", msg.sender);
	}

	function sendGroupEncryptedMessage(
		address _user,
		string memory encryptedContent
	) public {
		require(
			participants[_user],
			"Only participants can call this function"
		);
		groupEncryptedMessages.push(
			GroupEncryptedMessage(_user, encryptedContent)
		);
		emit GroupEncryptedMessageSent(_user, encryptedContent);
	}

	function getGroupEncryptedMessages(address _user) public view returns (string[] memory) {
		require(
			participants[_user],
			"Only participants can call this function"
		);
		string[] memory messages = new string[](groupEncryptedMessages.length);
		for (uint256 i = 0; i < groupEncryptedMessages.length; i++) {
			messages[i] = groupEncryptedMessages[i].encryptedContent;
		}
		return messages;
	}

	// Function to generate and set a unique conversation key
	function generateAndSetConversationKey() private {
		require(bytes32(conversationKey) == 0, "Conversation key already set");

		// Generate a new symmetric key for the conversation
		bytes32 newKey = keccak256(
			abi.encodePacked(block.timestamp, block.difficulty, msg.sender)
		);

		// Set the conversation key
		conversationKey = newKey;
	}

	// Function to retrieve the conversation key (only accessible to participants)
	// function getConversationKeys() public returns (bytes32) {
	// 	if (isPrivate) {
	// 		require(participants[msg.sender], "Caller is not a participant");
	// 	}

	// 	if (!isPrivate && !participants[msg.sender]) {
	// 		participants[msg.sender] = true;
	// 	}
	// 	// hasKey[msg.sender] = true; // Mark that the participant has retrieved the key
	// 	return conversationKey;
	// }

	function isParticipant(address _user) public view returns (bool) {
		console.log("isparticipant", _user);
		return participants[_user];
	}

	function getConversationKeys(address _user)
		public
		view
		returns (bytes32)
	{
		require(
			participants[_user],
			"Only participants can call this function"
		);
		console.log("getkey", msg.sender);
		return conversationKey;
	}
}
