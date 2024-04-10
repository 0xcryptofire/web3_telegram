/* eslint-disable @next/next/no-img-element */

/* eslint-disable jsx-a11y/alt-text */

/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { isAddress } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Create: NextPage = () => {
  // component states
  const router = useRouter();
  const [topic, setTopic] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [paricipants, setParicipants] = useState<string>("");

  const { address: connectedAccount } = useAccount();
  const publicClient = usePublicClient();
  const { data: signer, isLoading: isLoadingSigner } = useWalletClient();

  const { data: channelRegistryContract, isLoading: isLoadingChannelRegistryContract } =
    useDeployedContractInfo("ChannelRegistry");

  const handleCreate = async () => {
    if (isCreating) {
      notification.info(`Busy`);
      return;
    }
    if (isLoadingSigner || isLoadingChannelRegistryContract || !channelRegistryContract || !connectedAccount) return;

    setIsLoading(true);
    setIsCreating(true);

    const notificationId = notification.loading(`Creating Channel`);

    const sAddress = [];
    const pArray = paricipants.split(",");

    if (pArray.length > 0) {
      for (let i = 0; i < pArray.length; i++) {
        const element = pArray[i];
        if (element === "") continue;
        if (!isAddress(element)) {
          notification.error(`${element} is not a valid address`);
          break;
        }

        sAddress.push(element);
      }
    }
    console.log({ sAddress });

    try {
      const hash: `0x${string}` | undefined = await signer?.writeContract({
        address: channelRegistryContract?.address,
        abi: channelRegistryContract?.abi,
        functionName: "createChannel",
        args: [topic, connectedAccount, sAddress],
      });

      if (!hash) return;

      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error) {
      notification.error(`Error occured while trying to create conversation`);
      console.log(error);
    }

    notification.remove(notificationId);
    notification.info(`Conversation created`);

    setIsLoading(false);
    setIsCreating(false);
    router.push("/");
  };
  return (
    <>
      <MetaHeader />
      <div className="main-content">
        <div className="container-c">
          <div className="text">Create your channel</div>
          <form action="#">
            <div className="form-row">
              <div className="input-data">
                <input
                  onChange={e => {
                    setTopic(e.target.value);
                  }}
                  type="text"
                  required
                />
                <div className="underline"></div>
                <label htmlFor=""> Channel name</label>
              </div>
            </div>

            <div className="form-row">
              <div className="input-data">
                <input
                  onChange={e => {
                    setParicipants(e.target.value);
                  }}
                  type="text"
                />
                <div className="underline"></div>
                <label htmlFor="">Add Members (comma seperated, no space)</label>
                <br />
              </div>
            </div>
            <div className="form-row">
              <div className="input-data">
                <div className="underline"></div>
                <label htmlFor="">Channel owner will be {connectedAccount}</label>
              </div>
            </div>
            <div className="form-row submit-btn">
              <div className="input-data" id="btn-s">
                <div className="inner"></div>
                <input
                  onClick={e => {
                    e.preventDefault();
                    handleCreate();
                  }}
                  disabled={isLoading || isCreating ? true : false}
                  type="submit"
                  value="submit"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Create;
