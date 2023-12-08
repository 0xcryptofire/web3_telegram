/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";

const ChatBubble = ({ message }: { message: string }) => {
  return (
    <div className="d-flex justify-content-start mb-5">
      <div className="img_cont_msg">
        <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg" className="rounded-circle user_img_msg" />
      </div>
      <div className="msg_cotainer">{message}</div>
    </div>
  );
};

export default ChatBubble;
