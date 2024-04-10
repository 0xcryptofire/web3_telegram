// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

error APPLICANT_ALREADY_APPLY();
error APPLICANT_ALREADY_JOINED();
// error CHANNEL_NOT_ALLOWED();

contract Channel {
	address public owner;
	string public channelName;
	bytes32 private channelKey;
	address[] public membersForKey;
	uint256 public countApplicant;

	struct GroupEncryptedMessage {
		address sender;
		string encryptedContent;
	}

	GroupEncryptedMessage[] public groupEncryptedMessages;

	mapping(address => bytes32) public participantKeys;
	mapping(address participant => bool isAllowed) public participants;

	event GroupEncryptedMessageSent(
		address indexed sender,
		string encryptedContent
	);

	event channelCreated(address indexed creator);
	event ParticipantAdded(address indexed participant);
	event ParticipantAllowed(address indexed participant);

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
		address[] memory initialParticipants
	) {
		owner = _owner;
		participants[_owner] = true;
		channelName = _name;
		countApplicant = 0;

		if (!containsKey(_owner)) {
			membersForKey.push(_owner);
		}

		emit ParticipantAdded(_owner);
		emit ParticipantAllowed(_owner);
		emit channelCreated(_owner);

		for (uint256 i = 0; i < initialParticipants.length; i++) {
			address participant = initialParticipants[i];
			require(participant != address(0), "Invalid participant address");
			require(!participants[participant], "Participant already exists");
			participants[participant] = true;

			if (!containsKey(participant)) {
				membersForKey.push(participant);
			}
			emit ParticipantAdded(participant);
		}

		// generate key
		generateAndSetchannelKey();
	}

	// // Channel ower alowed access
	function allowParticipant(address participant) public onlyOwner {
		if (participants[participant] == true) {
			revert APPLICANT_ALREADY_JOINED();
		}
		participants[participant] = true;
		countApplicant--;
		emit ParticipantAllowed(participant);
	}

	function applyJoinGroup(address user) external {
		if (participants[user]) {
			revert APPLICANT_ALREADY_JOINED();
		}

		participants[user] = false;

		if (!containsKey(user)) {
			membersForKey.push(user);
			countApplicant++;
		}
	}

	function containsKey(address key) internal view returns (bool) {
		for (uint256 i = 0; i < membersForKey.length; i++) {
			if (membersForKey[i] == key) {
				return true;
			}
		}
		return false;
	}

	function getNumberOfParticipant()
		external
		view
		returns (uint256, address[] memory)
	{
		uint256 count = 0;
		uint256 countApplicantNum = 0;
		address[] memory applicants = new address[](countApplicant);

		for (uint256 i = 0; i < membersForKey.length; i++) {
			if (participants[membersForKey[i]] == true) {
				count++;
			} else if (participants[membersForKey[i]] == false) {
				applicants[countApplicantNum] = (membersForKey[i]);
				countApplicantNum++;
			}
		}
		return (count, applicants);
	}

	// function joinchannel(address _user) public {
	// 	if (participants[_user] != true) {
	// 		revert CHANNEL_NOT_ALLOWED();
	// 	}
	// 	emit ParticipantAdded(_user);
	// }

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

	function getGroupEncryptedMessages(
		address _user
	) public view returns (GroupEncryptedMessage[] memory) {
		require(
			participants[_user],
			"Only participants can call this function"
		);
		// GroupEncryptedMessage[] memory messages = new GroupEncryptedMessage[](groupEncryptedMessages.length);
		// for (uint256 i = 0; i < groupEncryptedMessages.length; i++) {
		// 	messages[i] = GroupEncryptedMessage(groupEncryptedMessages[i].encryptedContent);
		// }
		return groupEncryptedMessages;
	}

	// // Function to generate and set a unique channel key
	function generateAndSetchannelKey() private {
		require(bytes32(channelKey) == 0, "channel key already set");

		// Generate a new symmetric key for the channel
		bytes32 newKey = keccak256(
			abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
		);

		// Set the channel key
		channelKey = newKey;
	}

	function isParticipant(address _user) public view returns (bool) {
		console.log("isparticipant", _user);
		return participants[_user];
	}

	function getchannelKeys(address _user) public view returns (bytes32) {
		require(
			participants[_user],
			"Only participants can call this function"
		);
		console.log("getkey", msg.sender);
		return channelKey;
	}
}
