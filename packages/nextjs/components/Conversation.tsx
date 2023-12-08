/* eslint-disable react/no-unescaped-entities */
// import Link from "next/link";

const Conversation = ({ topic, isPrivate, address }: { topic: string; isPrivate: boolean; address: string }) => {
  return (
    <div className="ag-courses_item">
      <a href={`/chat/${address}`} className="ag-courses-item_link">
        <div className="ag-courses-item_bg"></div>

        <div className="ag-courses-item_title">{topic}</div>

        <div className="ag-courses-item_date-box">
          <span className="ag-courses-item_date"> {isPrivate ? "Private" : "Public"}</span>
        </div>
      </a>
    </div>
  );
};

export default Conversation;
