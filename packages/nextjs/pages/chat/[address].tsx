/* eslint-disable @next/next/no-img-element */

/* eslint-disable jsx-a11y/alt-text */

/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import conversly from "~~/abi/conversly";
import ChatBubble from "~~/components/Chat";
import { MetaHeader } from "~~/components/MetaHeader";
import { notification } from "~~/utils/scaffold-eth";

const Chat: NextPage = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [topic, setTopic] = useState<string>("");
  const [hasJoined, setHasJoined] = useState<boolean>(false);
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
  const addMessage = (newMessage: string) => {
    setMessages((prevMessages: any) => [...prevMessages, newMessage]);
  };

  // get encryption key
  const getKeyFromContract = async () => {
    // get encryption key
    const response: any = await publicClient.readContract({
      address: addressRef.current,
      abi: conversly.abi,
      functionName: "getConversationKeys",
      args: [connectedAccount],
    });

    setPK(response);
  };

  // join conversation
  const joinConversation = async () => {
    const notificationId = notification.loading(`Joining Conversation`);

    try {
      console.log(addressRef.current, signer);
      const hash: `0x${string}` | undefined = await signer?.writeContract({
        address: addressRef.current,
        abi: conversly.abi,
        functionName: "joinConversation",
        args: [connectedAccount],
      });
      console.log("first34", hash);

      if (!hash) return;

      await publicClient.waitForTransactionReceipt({ hash });
      await getKeyFromContract();
    } catch (error) {
      console.log(error);
      notification.remove(notificationId);
    } finally {
      // await getKeyFromContract();
      notification.remove(notificationId);
    }
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
          abi: conversly.abi,
          functionName: "isParticipant",
          args: [connectedAccount],
        });

        if (isParticipant) {
          await getKeyFromContract();
        }

        setHasJoined(isParticipant);

        console.log("isParticipant", isParticipant);
      } catch (error) {
        console.error("Error fetching data:", error);
      }

      try {
        // get conversation topic
        const topicR: any = await publicClient.readContract({
          address: addressRef.current,
          abi: conversly.abi,
          functionName: "conversationName",
        });

        setTopic(topicR);

        if (hasJoined) {
          // get and set messages
          const msg: any = await publicClient.readContract({
            address: addressRef.current,
            abi: conversly.abi,
            functionName: "getGroupEncryptedMessages",
            args: [connectedAccount],
          });

          const nMessages = [];
          for (let i = 0; i < msg.length; i++) {
            const element = msg[i];

            const d = await decryptData(element, pk);

            nMessages.push(d);
          }

          setMessages(nMessages);
          setMessageNo(nMessages.length);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, addressRef.current, pk, hasJoined]);

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
      abi: conversly.abi,
      eventName: "GroupEncryptedMessageSent",
      onLogs: async logs => {
        for (let j = 0; j < logs.length; j++) {
          const element: any = logs[j];
          const m = element.args.encryptedContent;
          const d = await decryptData(m, pk);
          addMessage(d);
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

      const hash = await signer?.writeContract({
        address: addressRef.current,
        abi: conversly.abi,
        functionName: "sendGroupEncryptedMessage",
        args: [connectedAccount, data],
      });

      if (!hash) return;

      await publicClient.waitForTransactionReceipt({ hash });
      // addMessage(chat);
    } catch (error) {
      notification.error(`Error occured while trying to create conversation`);
      console.log(error);
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
                    <img
                      src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                      className="rounded-circle user_img"
                    />
                    <span className="online_icon"></span>
                  </div>
                  <div className="user_info">
                    <span>{topic}</span>
                    <p>{messageNo} Messages</p>
                  </div>
                </div>
                {!hasJoined ? (
                  <span
                    onClick={joinConversation}
                    style={{ fontSize: "12px" }}
                    className="btn btn-outline"
                    id="action_menu_btn"
                  >
                    {/* <i className="fas fa-ellipsis-v"></i> */}
                    Join Conversation
                  </span>
                ) : (
                  ""
                )}
              </div>
              <div className="card-body msg_card_body">
                {messages.map((msg, index) => (
                  <ChatBubble key={index} message={msg} />
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
