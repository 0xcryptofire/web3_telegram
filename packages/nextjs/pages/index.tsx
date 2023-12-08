import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import Conversation from "~~/components/Conversation";
import { MetaHeader } from "~~/components/MetaHeader";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [, setIsLoading] = useState(true);

  const [conversations, setConversations] = useState<any>([]);

  const { address: connectedAccount, isConnected } = useAccount();

  const { data: converslyRegistryContract, isLoading: isLoadingConverslyRegistryContract } =
    useDeployedContractInfo("ConverslyRegistry");
  const publicClient = usePublicClient();

  useEffect(() => {
    (async () => {
      if (!isConnected || isLoadingConverslyRegistryContract) return;

      setIsLoading(true);

      if (!converslyRegistryContract?.address) return;
      if (!connectedAccount) return;

      const response = await publicClient.readContract({
        address: converslyRegistryContract.address,
        abi: converslyRegistryContract.abi,
        functionName: "getAllConversationInfo",
        args: [connectedAccount],
      });

      setConversations(response);

      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingConverslyRegistryContract, isConnected]);

  return (
    <>
      <MetaHeader />
      <div className="ag-format-container">
        <div className="ag-courses_box">
          {conversations.map((conversation: any) => (
            <Conversation
              key={conversation.conversationAddress}
              address={conversation.conversationAddress}
              topic={conversation.name}
              isPrivate={conversation.isPrivate}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
