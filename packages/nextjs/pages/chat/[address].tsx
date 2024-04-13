/* eslint-disable @next/next/no-img-element */

/* eslint-disable jsx-a11y/alt-text */

/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import channel from "~~/abi/channel";
import ChatBubble from "~~/components/Chat";
import { MetaHeader } from "~~/components/MetaHeader";
import { notification } from "~~/utils/scaffold-eth";

type TMsg = {
  user: string;
  message: string;
  fileInfo: string;
};

const pinataApiKey = "49a9a84dabcc1bb67c72";
const pinataApiSecret = "7b10c23810beabac8b57e04dc4cb212c40250f0b97a97eb7be11a1226ee30269";
const PINATA_API_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

const Chat: NextPage = () => {
  const [messages, setMessages] = useState<TMsg[]>([]);
  const [topic, setTopic] = useState<string>("");
  const [messageNo, setMessageNo] = useState<number>(0);
  const [unwatchFunctions, setUnwatchFunctions] = useState<any>([]);
  const [chat, setChat] = useState<any>("");
  const [pk, setPK] = useState<any>();
  const addressRef = useRef<any>();

  const [, setIsLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const router = useRouter();
  const slug = router?.query?.address;

  addressRef.current = slug; // Use a ref for address

  const { address: connectedAccount, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: signer } = useWalletClient();

  // Function to add a new message
  const addMessage = (user: string, newMessage: string, fileInfo: string) => {
    setMessages((prevMessages: any) => [...prevMessages, { user, message: newMessage, fileInfo }]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        console.log({ file });
        setFilePreview(file.name);
        // setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(PINATA_API_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataApiSecret,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("File uploaded to Pinata IPFS. IPFS Hash:", data.IpfsHash);
        return data.IpfsHash;
        // Handle success, display IPFS hash or save it for later use
      } else {
        console.error("Failed to upload file to Pinata IPFS");
        // Handle error
      }
    } catch (error) {
      console.error("Error uploading file to Pinata IPFS:", error);
      // Handle error
    }
  };

  // get encryption key
  const getKeyFromContract = async () => {
    // get encryption key
    const response: any = await publicClient.readContract({
      address: addressRef.current,
      abi: channel.abi,
      functionName: "getchannelKeys",
      args: [connectedAccount],
    });
    console.log("get pk", response);

    if (typeof response === "undefined") return;
    setPK(response);
  };

  useEffect(() => {
    (async () => {
      if (!isConnected) return;

      setIsLoading(true);

      if (!connectedAccount || !addressRef.current) return;

      try {
        // get encryption key
        const isParticipant: any = await publicClient.readContract({
          address: addressRef.current,
          abi: channel.abi,
          functionName: "isParticipant",
          args: [connectedAccount],
        });

        if (isParticipant) {
          await getKeyFromContract();
        } else {
          return;
        }

        console.log("isParticipant", isParticipant);
      } catch (error) {
        console.error("Error fetching data:", error);
      }

      // joinConversation();

      try {
        // get conversation topic
        const topicR: any = await publicClient.readContract({
          address: addressRef.current,
          abi: channel.abi,
          functionName: "channelName",
        });

        setTopic(topicR);

        // get and set messages
        const msg: any = await publicClient.readContract({
          address: addressRef.current,
          abi: channel.abi,
          functionName: "getGroupMessages",
          args: [connectedAccount],
        });

        const nMessages = [];
        for (let i = 0; i < msg.length; i++) {
          const element = msg[i];

          if (typeof pk !== "undefined" && typeof element.message !== "undefined") {
            // const d = await decryptData(element.message, pk);

            nMessages.push({ user: element.sender, message: element.message, fileInfo: element.fileInfo });
          }
        }

        setMessages(nMessages);
        setMessageNo(nMessages.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, addressRef.current, pk]);

  // watch contracts
  // Function to unsubscribe from all watchers
  const unwatchAll = () => {
    unwatchFunctions.forEach((unwatch: any) => {
      unwatch(); // Call each unwatch function
    });
    setUnwatchFunctions([]); // Clear the unwatch functions list
  };

  const watchContractEvents = () => {
    // First, unsubscribe from any existing watchers
    unwatchAll();

    // Watch for GroupMessageSent event
    const unwatchGroupMessageSent = publicClient.watchContractEvent({
      address: addressRef.current,
      abi: channel.abi,
      eventName: "GroupMessageSent",
      onLogs: async logs => {
        for (let j = 0; j < logs.length; j++) {
          const element: any = logs[j];

          const m = element.args;
          console.log("watchContractEvents", m, pk);
          if (typeof pk !== "undefined" && typeof m.message !== "undefined") {
            // const d = await decryptData(m.message, pk);
            addMessage(m.sender, m.message, m.fileInfo);
            setMessageNo(messageNo + 1);
          }
        }
      },
    });

    // Add the current unwatch function to the list
    setUnwatchFunctions((prevFunctions: any) => [...prevFunctions, unwatchGroupMessageSent]);
  };

  useEffect(() => {
    watchContractEvents();

    // Cleanup function to unsubscribe from all watchers when the component unmounts
    return () => {
      unwatchAll();
    };
  }, [addressRef.current, pk]);

  const handleSend = async () => {
    let hashedFileUrl = "";

    if (selectedFile) {
      const notiId = notification.loading("File is uploading");

      try {
        hashedFileUrl = await handleFileUpload();
        setSelectedFile(null);
        setFilePreview(null);

        notification.remove(notiId);
      } catch (error) {
        notification.error("IPFS upload error:" + error);
      }
    }

    try {
      if (chat === "") {
        return;
      }

      // const data = await encryptData(chat, pk);
      // console.log({ connectedAccount, data });

      const hash = await signer?.writeContract({
        address: addressRef.current,
        abi: channel.abi,
        functionName: "sendGroupMessage",
        args: [connectedAccount, chat, hashedFileUrl],
      });

      if (!hash) return;

      await publicClient.waitForTransactionReceipt({ hash });
      // addMessage(chat);
      setChat("");
    } catch (error) {
      notification.error(`Error occured while trying to create conversation`);
      console.log(error);
      setChat("");
      setFilePreview("");
    }
  };

  return (
    <>
      <MetaHeader />
      <div className="container-fluid h-100">
        <div className="row justify-content-center h-100">
          <div className="col-md-12 col-xl-12 chat">
            <div className="card">
              <div className="card-header msg_head">
                <div className="d-flex bd-highlight">
                  <div className="img_cont">
                    <Image alt="SE2 logo" className="cursor-pointer rounded-circle user_img" fill src="/favicon.png" />
                    <span className="online_icon"></span>
                  </div>
                  <div className="user_info">
                    <span style={{ color: "black" }}>{topic}</span>
                    <p style={{ color: "black" }}>{messageNo} Messages</p>
                  </div>
                </div>
              </div>
              <div className="card-body msg_card_body">
                {messages.map((msg: TMsg, index) => (
                  <ChatBubble key={index} sender={msg.user} message={msg.message} file={msg.fileInfo} />
                ))}
              </div>
              {selectedFile && (
                <div>
                  <p>{filePreview}</p>
                  <button onClick={handleFileUpload}>Upload</button>
                </div>
              )}
              <div className="card-footer">
                <div className="input-group">
                  <div className="input-group-append">
                    <span className="input-group-text attach_btn">
                      <input type="file" className="fas fa-paperclip" onChange={handleFileChange}></input>
                    </span>
                  </div>
                  <textarea
                    onChange={e => {
                      setChat(e.target.value);
                    }}
                    name=""
                    className="form-control type_msg"
                    placeholder="Type your message..."
                    value={chat}
                  ></textarea>
                  <div onClick={handleSend} className="input-group-append">
                    <span className="input-group-text send_btn">
                      <i className="fas fa-location-arrow"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
