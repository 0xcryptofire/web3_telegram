// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

import "./Channel.sol";

contract ChannelRegistry {
	address[] public channels;
	mapping(address => address[]) public myChannels;

	struct ChannelInfo {
		address channelAddress;
		string name;
		bool allowed;
	}

	struct MyChannelInfo {
		address channelAddress;
		string name;
		uint256 members;
		address[] applicants;
	}

	// This fucntion seems create new channel
	function createChannel(
		string memory _name,
		address _owner,
		address[] memory _participants
	) public {
		Channel newChannel = new Channel(_owner, _name, _participants);

		address channelAddress = address(newChannel);

		address[] storage myChannelsArray = myChannels[_owner];
		myChannelsArray.push(channelAddress);

		myChannels[_owner] = myChannelsArray;

		channels.push(channelAddress);
	}

	function getMyChannels(
		address _user
	) public view returns (MyChannelInfo[] memory) {
		address[] memory seleted = myChannels[_user];
		MyChannelInfo[] memory myChannelInfo = new MyChannelInfo[](
			seleted.length
		);

		for (uint i = 0; i < seleted.length; i++) {
			address myChannelAddress = seleted[i];
			Channel channel = Channel(myChannelAddress);

			(
				uint256 countMychannelMember,
				address[] memory applicants
			) = channel.getNumberOfParticipant();

			myChannelInfo[i] = MyChannelInfo(
				myChannelAddress,
				channel.channelName(),
				countMychannelMember,
				applicants
			);
		}
		return myChannelInfo;
	}

	function getAllChannelInfo(
		address _user
	) public view returns (ChannelInfo[] memory) {
		uint256 numberOfChannels = channels.length;

		ChannelInfo[] memory channelInfo = new ChannelInfo[](numberOfChannels);

		// Count the number of private conversations the user is a participant in
		for (uint256 i = 0; i < numberOfChannels; i++) {
			address channelAddress = channels[i];

			Channel channel = Channel(channelAddress);

			if (channel.participants(_user)) {
				channelInfo[i] = ChannelInfo(
					channelAddress,
					channel.channelName(),
					true
				);
			} else {
				channelInfo[i] = ChannelInfo(
					channelAddress,
					channel.channelName(),
					false
				);
			}
		}

		return channelInfo;
	}

	// // Helper function to convert bytes32 to string
	function bytes32ToString(
		bytes32 _bytes32
	) internal pure returns (string memory) {
		// Convert bytes32 to bytes and then to string
		bytes memory byteArray = new bytes(32);
		for (uint i = 0; i < 32; i++) {
			byteArray[i] = _bytes32[i];
		}
		return string(byteArray);
	}
}
