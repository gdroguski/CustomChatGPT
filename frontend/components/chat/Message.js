import React, {useCallback, useEffect, useState} from 'react';
import styles from "../../styles/chat/Message.module.css";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {useDispatch, useSelector} from "react-redux";
import {switchConversationVersionThunk} from "../../redux/conversations";
import {setConversation} from "../../redux/currentConversation";
import {AdditionalInfoVersions, AdditionalInfoEdit, AdditionalInfo} from "./MessageAdditionalInfo";

const parseInlineCode = (text) => {
    return text.split("`").map((part, index) => {
        if (index % 2 === 1) {
            // This part is within backticks
            return <code key={index}>{part}</code>;
        }
        return part;
    });
};

const Message = ({message, regenerateUserResponse}) => {
    const isUser = message.role === 'user';
    const classRole = isUser ? styles.user : styles.assistant;
    const versions = message.versions;

    const dispatch = useDispatch();
    const currVersion = useSelector(state => state.currentConversation);
    const currConversation = useSelector(state => state.allConversations.find(c => c.id === currVersion.conversation_id));
    const isStreaming = useSelector(state => state.streaming);

    const [editing, setEditing] = useState(false);
    const [editedMessage, setEditedMessage] = useState('');
    const [numRows, setNumRows] = useState(1);

    useEffect(() => {
        setNumRows(editedMessage.split('\n').length);
    }, [editedMessage]);

    let parts;
    try {
        parts = isUser ? [message.content] : message.content.split('```');
    } catch (e) {
        console.error(e);
        return null;
    }

    const switchVersion = useCallback((currVersionIndex, where) => {
        let newVersionId;
        if (where === 'left') {
            newVersionId = versions[currVersionIndex - 1].id;
            console.log("left", newVersionId, currConversation.id);
        } else {
            newVersionId = versions[currVersionIndex + 1].id;
            console.log("right", newVersionId, currConversation.id);
        }

        dispatch(switchConversationVersionThunk({conversationId: currConversation.id, versionId: newVersionId}));
        let newVersion = currConversation.versions.find(version => version.id === newVersionId);
        newVersion = {...newVersion, title: currConversation.title};
        console.log("newVersion", newVersion);
        dispatch(setConversation(newVersion));

    }, [versions]);

    const renderAdditionalInfo = () => {
        const editProps = {
            editing,
            setEditing,
            editedMessage,
            setEditedMessage,
            messageEditConfirm: regenerateUserResponse,
        };

        const versionProps = {
            switchVersion,
            currVersionId: currVersion.id,
        };

        return <AdditionalInfo isUser={isUser} message={message} isStreaming={isStreaming} editProps={editProps} versionsProps={versionProps}/>;
    };


    return (
        <div className={`${styles.messageContainer} `}>
            <div className={`${styles.messageContent}  ${classRole}`}>
                {editing ? (
                    <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        rows={numRows}
                    />
                ) : (
                    parts.map((part, index) => {
                        if (index % 2 === 0) {
                            return part.split('\n').map(
                                (line, lineIndex) => line ?
                                    <p key={lineIndex}>{isUser ? line : parseInlineCode(line)}</p> : null);
                        } else {
                            let [language, ...codeLines] = part.split('\n');
                            let code = codeLines.join('\n');
                            return <SyntaxHighlighter key={index} language={language} style={darcula} children={code}/>
                        }
                    })
                )}
                {renderAdditionalInfo()}
            </div>
        </div>
    );
};

export default Message;
