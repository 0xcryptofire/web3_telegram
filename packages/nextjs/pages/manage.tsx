import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import channel from "~~/abi/channel";
import { MetaHeader } from "~~/components/MetaHeader";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Manage: NextPage = () => {
  const [, setIsLoading] = useState(true);
  const router = useRouter();

  const [mychannels, setMychannels] = useState<any>([]);
  const [selectedChannelApplicant, setSelectedChannelApplicant] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  const { address: connectedAccount, isConnected } = useAccount();
  const { data: signer } = useWalletClient();

  const { data: channelRegistryContract, isLoading: isLoadingChannelRegistryContract } =
    useDeployedContractInfo("ChannelRegistry");
  const publicClient = usePublicClient();

  const handleAccept = (channel: any, channelAddress: string) => {
    setSelectedChannelApplicant(channel);
    setSelectedChannel(channelAddress);
  };

  const sendAllowRequest = async (addr: string) => {
    try {
      const hash: `0x${string}` | undefined = await signer?.writeContract({
        address: selectedChannel,
        abi: channel.abi,
        functionName: "allowParticipant",
        args: [addr],
      });

      if (!hash) return;

      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.log(error);
      notification.error(`${error}`);
    } finally {
      notification.info(`Allowed`);
      router.reload();
    }
  };

  useEffect(() => {
    (async () => {
      if (!isConnected || isLoadingChannelRegistryContract) return;

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
  }, [isLoadingChannelRegistryContract, isConnected]);

  return (
    <>
      <MetaHeader />
      <div className="ag-format-container">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead>
              <tr>
                <th></th>
                <th>Owner</th>
                <th>ChannelName</th>
                <th>Members</th>
                <th>Applicants</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mychannels.map((channel: any, idx: number) => (
                <tr key={channel.channelAddress}>
                  <th>{idx + 1}</th>
                  <th>{channel.channelAddress}</th>
                  <td>{channel.name}</td>
                  <td>{channel.members?.toString()}</td>
                  <td>{channel.applicants?.length}</td>
                  <td onClick={() => handleAccept(channel.applicants, channel.channelAddress)}>
                    <label htmlFor="modal" className="link">
                      Accept
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <input type="checkbox" id="modal" className="modal-toggle" />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <table className="table table-xs">
            <thead>
              <tr>
                <th></th>
                <th>Users</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedChannelApplicant.map((applicant: string, idx: number) => (
                <tr key={idx}>
                  <th>{idx + 1}</th>
                  <td>{applicant}</td>
                  <td onClick={() => sendAllowRequest(applicant)}>
                    <label htmlFor="modal" className="link">
                      Accept
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="modal-backdrop" htmlFor="modal">
          Close
        </label>
      </div>
    </>
  );
};

export default Manage;
