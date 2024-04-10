/* eslint-disable @next/next/no-img-element */

/* eslint-disable jsx-a11y/alt-text */

/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
};

const Chat: NextPage = () => {
  const [messages, setMessages] = useState<TMsg[]>([]);
  const [topic, setTopic] = useState<string>("");
  const [messageNo, setMessageNo] = useState<number>(0);
  const [unwatchFunctions, setUnwatchFunctions] = useState<any>([]);
  const [chat, setChat] = useState<any>("");
  const [pk, setPK] = useState<any>();
  const addressRef = useRef<any>();

  const [, setIsLoading] = useState(true);

  const router = useRouter();
  const slug = router?.query?.address;

  addressRef.current = slug; // Use a ref for address

  const { address: connectedAccount, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: signer } = useWalletClient();

  // Function to add a new message
  const addMessage = (user: string, newMessage: string) => {
    setMessages((prevMessages: any) => [...prevMessages, { user, message: newMessage }]);
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
          functionName: "getGroupEncryptedMessages",
          args: [connectedAccount],
        });

        const nMessages = [];
        for (let i = 0; i < msg.length; i++) {
          const element = msg[i];

          console.log("useEffect", element);

          const d = await decryptData(element.encryptedContent, pk);

          nMessages.push({ user: element.sender, message: d });
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

    // Watch for GroupEncryptedMessageSent event
    const unwatchGroupEncryptedMessageSent = publicClient.watchContractEvent({
      address: addressRef.current,
      abi: channel.abi,
      eventName: "GroupEncryptedMessageSent",
      onLogs: async logs => {
        for (let j = 0; j < logs.length; j++) {
          const element: any = logs[j];

          const m = element.args;
          console.log("watchContractEvents", m);

          const d = await decryptData(m.encryptedContent, pk);
          addMessage(m.sender, d);
          setMessageNo(messageNo + 1);
        }
      },
    });

    // Add the current unwatch function to the list
    setUnwatchFunctions((prevFunctions: any) => [...prevFunctions, unwatchGroupEncryptedMessageSent]);
  };

  useEffect(() => {
    watchContractEvents();

    // Cleanup function to unsubscribe from all watchers when the component unmounts
    return () => {
      unwatchAll();
    };
  }, [addressRef.current, pk]);

  const handleSend = async () => {
    try {
      if (chat === "") {
        return;
      }

      const data = await encryptData(chat, pk);
      console.log({ connectedAccount, data });

      const hash = await signer?.writeContract({
        address: addressRef.current,
        abi: channel.abi,
        functionName: "sendGroupEncryptedMessage",
        args: [connectedAccount, data],
      });

      if (!hash) return;

      await publicClient.waitForTransactionReceipt({ hash });
      // addMessage(chat);
      setChat("");
    } catch (error) {
      notification.error(`Error occured while trying to create conversation`);
      console.log(error);
      setChat("");
    }
  };

  async function getKey(key: any) {
    // Hexadecimal key
    // Convert hex key to Uint8Array
    const keyParsed = key.slice(2);
    const keyBytes = new Uint8Array(keyParsed.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16)));

    // Check key size
    if (keyBytes.length !== 32) {
      throw new Error("AES key must be 256 bits (32 bytes) in size.");
    }

    // Import key
    const cryptoKey = await window.crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, [
      "encrypt",
      "decrypt",
    ]);

    return cryptoKey;
  }

  // Function to encrypt data using an existing key
  async function encryptData(data: string | undefined, keyRaw: any) {
    // Generate a random Initialization Vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await getKey(keyRaw);

    // Decode the base64-encoded key
    // const decodedKey = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    // Convert the key and IV to CryptoKey object

    // Encrypt the data with the key and IV
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv: iv },
      key,
      new TextEncoder().encode(data),
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Encode the result as base64
    const result = btoa(String.fromCharCode(...combined));

    return result;
  }

  // Function to decrypt data using an existing key and IV
  async function decryptData(ciphertextWithIV: string, keyRaw: any) {
    // Decode the base64 input
    console.log({ ciphertextWithIV, keyRaw });

    const combined = new Uint8Array(
      atob(ciphertextWithIV)
        .split("")
        .map(char => char.charCodeAt(0)),
    );

    // Extract IV
    const iv = combined.slice(0, 16);
    const key = await getKey(keyRaw);

    // Convert the key and IV to CryptoKey objects
    // const cryptoKey = await window.crypto.subtle.importKey("raw", key, { name: "AES-CBC" }, false, ["decrypt"]);

    // Decrypt the data with the key and IV
    const decryptedData = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv: iv }, key, combined.slice(16));

    // Convert the decrypted data to a string
    const decryptedText = new TextDecoder().decode(decryptedData);

    return decryptedText;
  }
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
                  <ChatBubble key={index} sender={msg.user} message={msg.message} />
                ))}
              </div>
              <div className="card-footer">
                <div className="input-group">
                  <div className="input-group-append">
                    <span className="input-group-text attach_btn">
                      <i className="fas fa-paperclip"></i>
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
