/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";

const ChatBubble = ({ message, sender }: { message: string; sender: string }) => {
  return (
    <>
      <div className="d-flex justify-content-start mb-2">
        <div className="msg_cotainer">
          <p className="msg_sender">{sender}</p>
          {message}
        </div>
      </div>
    </>
  );
};

export default ChatBubble;
