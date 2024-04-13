/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";

const PINATA_GETWAY = "https://turquoise-adverse-leopon-276.mypinata.cloud/ipfs";

const ChatBubble = ({ message, sender, file }: { message: string; sender: string; file: string }) => {
  return (
    <>
      <div className="d-flex justify-content-start mb-2">
        <div className="msg_cotainer">
          {file === "" ? (
            <></>
          ) : (
            <a
              href={`${PINATA_GETWAY}/${file}`}
              target="_blank"
              className="input-group-text attach_btn"
              rel="noreferrer"
            >
              <i className="fas fa-paperclip"></i>
            </a>
          )}
          <p className="msg_sender">{sender}</p>
          {message}
        </div>
      </div>
    </>
  );
};

export default ChatBubble;
