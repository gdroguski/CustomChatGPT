import React from 'react';
import styles from "../../styles/Chat.module.css";
import Message from "./Message";

const Conversation = ({conversation, error}) => (
    <>
        {conversation.map(message => <Message key={message.id} message={message}/>)}
        {error && <div className={styles.message}><p className={styles.error}>{error}</p></div>}
    </>
);

export default Conversation;
