const channel = {
  abi: [
    {
      inputs: [
        {
          internalType: "address",
          name: "_owner",
          type: "address",
        },
        {
          internalType: "string",
          name: "_name",
          type: "string",
        },
        {
          internalType: "address[]",
          name: "initialParticipants",
          type: "address[]",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "APPLICANT_ALREADY_JOINED",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "encryptedContent",
          type: "string",
        },
      ],
      name: "GroupEncryptedMessageSent",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "participant",
          type: "address",
        },
      ],
      name: "ParticipantAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "participant",
          type: "address",
        },
      ],
      name: "ParticipantAllowed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "creator",
          type: "address",
        },
      ],
      name: "channelCreated",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "participant",
          type: "address",
        },
      ],
      name: "allowParticipant",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "user",
          type: "address",
        },
      ],
      name: "applyJoinGroup",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "channelName",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "countApplicant",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_user",
          type: "address",
        },
      ],
      name: "getGroupEncryptedMessages",
      outputs: [
        {
          components: [
            {
              internalType: "address",
              name: "sender",
              type: "address",
            },
            {
              internalType: "string",
              name: "encryptedContent",
              type: "string",
            },
          ],
          internalType: "struct Channel.GroupEncryptedMessage[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getNumberOfParticipant",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "address[]",
          name: "",
          type: "address[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_user",
          type: "address",
        },
      ],
      name: "getchannelKeys",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "groupEncryptedMessages",
      outputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          internalType: "string",
          name: "encryptedContent",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_user",
          type: "address",
        },
      ],
      name: "isParticipant",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "membersForKey",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "participantKeys",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "participant",
          type: "address",
        },
      ],
      name: "participants",
      outputs: [
        {
          internalType: "bool",
          name: "isAllowed",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_user",
          type: "address",
        },
        {
          internalType: "string",
          name: "encryptedContent",
          type: "string",
        },
      ],
      name: "sendGroupEncryptedMessage",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
};

export default channel;
