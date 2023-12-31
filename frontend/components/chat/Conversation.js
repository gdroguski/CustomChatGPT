import React from 'react';
import styles from "../../styles/Message.module.css";
import Message from "./Message";

const Conversation = ({messages, regenerateUserResponse, error}) => (
    <>
        {messages.map(message => <Message key={message.id} message={message}
                                          regenerateUserResponse={regenerateUserResponse}/>)}
        {error && <div className={styles.messageContent}><p className={styles.error}>{error}</p></div>}
    </>
);

export default Conversation;
