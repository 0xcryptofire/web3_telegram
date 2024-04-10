/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import channel from "~~/abi/channel";
import { notification } from "~~/utils/scaffold-eth";

const Conversation = ({ topic, allowed, address }: { topic: string; allowed: boolean; address: string }) => {
  const router = useRouter();
  const [, setIsLoading] = useState(true);

  const { address: connectedAccount, isConnected } = useAccount();

  const publicClient = usePublicClient();
  const { data: signer } = useWalletClient();

  const handleClick = async () => {
    if (allowed) {
      router.push(`/chat/${address}`);
    } else {
      try {
        const hash: `0x${string}` | undefined = await signer?.writeContract({
          address: address,
          abi: channel.abi,
          functionName: "applyJoinGroup",
          args: [connectedAccount],
        });

        if (!hash) return;

        await publicClient.waitForTransactionReceipt({ hash });
      } catch (error) {
        console.log(error);
        notification.error(`${error}`);
      } finally {
        // await getKeyFromContract();
        notification.info(`Your request successfully submitted`);
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (!isConnected) return;

      setIsLoading(true);

      if (!connectedAccount) return;

      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <div className="ag-courses_item">
      <div className="ag-courses-item_link" onClick={handleClick}>
        <div className="ag-courses-item_bg"></div>

        <div className="ag-courses-item_title">{topic}</div>
        <p className="ag-courses-item_date">{allowed ? "Click to join" : "Click to apply"} </p>
        <div className="ag-courses-item_date-box">
          <span className="ag-courses-item_date"> {allowed ? "Allowed" : "Not Allowed"}</span>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
