/* eslint-disable @next/next/no-img-element */

/* eslint-disable jsx-a11y/alt-text */

/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";
import { useState } from "react";
import type { NextPage } from "next";
import { isAddress } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Create: NextPage = () => {
  // component states
  const [topic, setTopic] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [paricipants, setParicipants] = useState<string>("");

  const { address: connectedAccount } = useAccount();
  const publicClient = usePublicClient();
  const { data: signer, isLoading: isLoadingSigner } = useWalletClient();

  const { data: converslyRegistryContract, isLoading: isLoadingConverslyRegistryContract } =
    useDeployedContractInfo("ConverslyRegistry");

  const handleCreate = async () => {
    if (isCreating) {
      notification.info(`Busy`);
      return;
    }
    console.log(
      "Why 1",
      converslyRegistryContract,
      isLoadingSigner || isLoadingConverslyRegistryContract || !converslyRegistryContract || !connectedAccount,
      isLoadingSigner,
      isLoadingConverslyRegistryContract,
      !converslyRegistryContract,
      !connectedAccount,
    );

    if (isLoadingSigner || isLoadingConverslyRegistryContract || !converslyRegistryContract || !connectedAccount)
      return;

    console.log("Why 2");

    setIsLoading(true);
    setIsCreating(true);

    const notificationId = notification.loading(`Creating Conversation`);

    const isP = isPrivate === "true" ? true : false;

    // parse address

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

    try {
      const hash: `0x${string}` | undefined = await signer?.writeContract({
        address: converslyRegistryContract?.address,
        abi: converslyRegistryContract?.abi,
        functionName: "startConversation",
        args: [topic, isP, connectedAccount, sAddress],
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
  };
  return (
    <>
      <MetaHeader />
      <div className="main-content">
        <div className="container-c">
          <div className="text">Start your conversation</div>
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
                <label htmlFor=""> Conversation topic</label>
              </div>
            </div>
            <div className="form-row">
              <div className="input-data">
                <input
                  onChange={e => {
                    setIsPrivate(e.target.value);
                  }}
                  type="text"
                />
                <div className="underline"></div>
                <label htmlFor="">Private? (true or false)</label>
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
                <label htmlFor="">Add Paricipants (comma seperated)</label>
                <br />
                <div className="form-row submit-btn">
                  <div className="input-data" id="btn-s">
                    <div className="inner"></div>
                    <input
                      // onSubmit={e => {
                      //   e.preventDefault();
                      //   handleCreate();
                      // }}
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
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Create;
