// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

import "./Conversly.sol";

contract ConverslyRegistry {
	address[] public publicConversations;
	address[] private privateConversations;

    mapping(address => bool) privateConversationExists;
    mapping(address => bool) publicConversationExists;

	struct ConversationInfo {
		address conversationAddress;
		string name;
		bool isPrivate; // Added visibility flag
	}

    function startConversation(string memory _name, bool _isPrivate, address _owner, address[] memory _participants) public {
        Conversly newConversation = new Conversly(_owner, _name, _isPrivate, _participants );
        address conversationAddress = address(newConversation);
        privateConversationExists[conversationAddress] = _isPrivate;
        publicConversationExists[conversationAddress] = !_isPrivate;

        if (_isPrivate) {
            require(privateConversationExists[conversationAddress], "Private conversation creation failed");
			privateConversations.push(conversationAddress);

        } else {
            require(publicConversationExists[conversationAddress], "Public conversation creation failed");
            publicConversations.push(conversationAddress);
        }
    }

    function getPublicConversations() public view returns (address[] memory) {
        return publicConversations;
    }

	function getAllConversationInfo(address _user) public view returns (ConversationInfo[] memory) {
		uint256 numberOfPublicConversations = publicConversations.length;
		uint256 numberOfPrivateConversations = 0;

		// Count the number of private conversations the user is a participant in
		for (uint256 i = 0; i < privateConversations.length; i++) {
			address conversationAddress = privateConversations[i];
			Conversly conversation = Conversly(conversationAddress);

			if (conversation.participants(_user) && privateConversationExists[conversationAddress]) {
				numberOfPrivateConversations++;
			}
		}

		ConversationInfo[] memory conversationInfo = new ConversationInfo[](
			numberOfPublicConversations + numberOfPrivateConversations
		);

		uint256 count = 0;

		// Add public conversations to the result
		for (uint256 i = 0; i < numberOfPublicConversations; i++) {
			address conversationAddress = publicConversations[i];
			Conversly conversation = Conversly(conversationAddress);
			conversationInfo[count] = ConversationInfo(
				conversationAddress,
				// bytes32ToString(conversation.conversationName()), // Convert bytes32 to string
				conversation.conversationName(),
				false
			);
			count++;
		}

		// Add private conversations that the user is a participant in to the result
		for (uint256 i = 0; i < privateConversations.length; i++) {
			address conversationAddress = privateConversations[i];

			Conversly conversation = Conversly(conversationAddress);

			console.log("hello", msg.sender,_user,conversation.participants(_user));

			if (conversation.participants(_user) && privateConversationExists[conversationAddress]) {
				conversationInfo[count] = ConversationInfo(
					conversationAddress,
					// bytes32ToString(conversation.conversationName()), // Convert bytes32 to string
					conversation.conversationName(),
					true
				);
				count++;
			}
		}

		console.log("hello 6");


		return conversationInfo;
	}

	// Helper function to convert bytes32 to string
	function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
		// Convert bytes32 to bytes and then to string
		bytes memory byteArray = new bytes(32);
		for (uint i = 0; i < 32; i++) {
			byteArray[i] = _bytes32[i];
		}
		return string(byteArray);
	}

}
