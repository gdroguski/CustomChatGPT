import React from 'react';
import styles from "../../../styles/sidebars/HistorySidebar.module.css";
import {ChatIcon, DeleteIcon, EditTitleIcon} from "../../../assets/SVGIcon";

const HistoryItem = ({
                              conversation,
                              handleSelectConversation,
                              handleOpenEditModal,
                              handleOpenDeleteModal,
                              selectedId
                          }) => {
    const disabledClass = conversation.id === selectedId ? styles.disabled : '';

    return (
        <li
            className={`${styles.conversationItem} ${disabledClass}`}
        >
            <a
                className={`${styles.conversationButton}`}
                title={conversation.title}
                onClick={(e) => {
                    e.preventDefault();
                    if (conversation.id !== selectedId) {
                        handleSelectConversation(conversation.id);
                    }
                }}
            >
                <div className={`${styles.chatIconContainer} ${disabledClass}`}>
                    <ChatIcon/>
                </div>
                <span>{conversation.title}</span>
                <div className={styles.manageConversationContainer}>
                    <button
                        className={disabledClass}
                        title={"Edit title"}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(conversation.id);
                        }}
                    >
                        <EditTitleIcon/>
                    </button>
                    <button
                        className={disabledClass}
                        title={"Delete chat"}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteModal(conversation.id);
                        }}
                    >
                        <DeleteIcon/>
                    </button>
                </div>
            </a>
        </li>
    );
}

export default HistoryItem;
