import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import Conversation from "~~/components/Conversation";
import { MetaHeader } from "~~/components/MetaHeader";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const Manage: NextPage = () => {
  const [, setIsLoading] = useState(true);

  const [mychannels, setMychannels] = useState<any>([]);

  const { address: connectedAccount, isConnected } = useAccount();

  const { data: channelRegistryContract, isLoading: isLoadingConverslyRegistryContract } =
    useDeployedContractInfo("ChannelRegistry");
  const publicClient = usePublicClient();

  useEffect(() => {
    (async () => {
      if (!isConnected || isLoadingConverslyRegistryContract) return;

      setIsLoading(true);

      if (!channelRegistryContract?.address) return;
      if (!connectedAccount) return;

      const response = await publicClient.readContract({
        address: channelRegistryContract.address,
        abi: channelRegistryContract.abi,
        functionName: "getMyChannels",
        args: [connectedAccount],
      });

      setMychannels(response);
      console.log({ response });

      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingConverslyRegistryContract, isConnected]);

  return (
    <>
      <MetaHeader />
      <div className="ag-format-container">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>ChannelName</th>
                <th>Members</th>
                <th>Applicants</th>
              </tr>
            </thead>
            <tbody>
              {mychannels.map((channel: any, idx: number) => (
                <tr key={channel.channelAddress} className="hover">
                  <th>{idx + 1}</th>
                  <td>{channel.name}</td>
                  <td>{channel.members}</td>
                  <td>{channel.applicants?.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Manage;
