import React, {useCallback, useEffect, useState} from 'react';
import styles from "../../styles/Message.module.css";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {EditMessageIcon, LeftArrowIcon, NoIcon, RightArrowIcon, YesIcon} from "../../assets/SVGIcon";
import Button from "./Button";
import {useDispatch, useSelector} from "react-redux";
import {switchConversationVersionThunk} from "../../redux/conversations";
import {setConversation} from "../../redux/currentConversation";

const parseInlineCode = (text) => {
    return text.split("`").map((part, index) => {
        if (index % 2 === 1) {
            // This part is within backticks
            return <code key={index}>{part}</code>;
        }
        return part;
    });
};

const Message = ({message}) => {
    const isUser = message.role === 'user';
    const classRole = isUser ? styles.user : styles.assistant;
    const versions = message.versions;

    const dispatch = useDispatch();
    const currVersion = useSelector(state => state.currentConversation);
    const currConversation = useSelector(state => state.allConversations.find(c => c.id === currVersion.conversation_id));

    const [editing, setEditing] = useState(false);
    const [editedMessage, setEditedMessage] = useState('');
    const [numRows, setNumRows] = useState(1);

    useEffect(() => {
        setNumRows(editedMessage.split('\n').length);
        console.log("editedMessage", editedMessage);
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

    const renderAdditionalInfoAssistant = () => {
        const versions = message?.versions;
        if (!versions || versions.length <= 1) {
            return null;
        }

        const versionIndex = versions.findIndex(version => version.id === currVersion.id);
        const activeLeft = versionIndex > 0;
        const activeRight = versionIndex < versions.length - 1;
        return (
            <div className={styles.messageAdditionalInfo}>
                <div className={styles.infoContainer}>
                    <Button
                        className={`${styles.icon} ${activeLeft ? styles.alwaysVisible : ''}`}
                        SVGIcon={LeftArrowIcon}
                        onClick={() => switchVersion(versionIndex, 'left')}
                        disabled={!activeLeft}
                    />
                    <span>{versionIndex + 1}/{versions.length}</span>
                    <Button
                        className={`${styles.icon} ${activeRight ? styles.alwaysVisible : ''}`}
                        SVGIcon={RightArrowIcon}
                        onClick={() => switchVersion(versionIndex, 'right')}
                        disabled={!activeRight}
                    />
                </div>
            </div>
        )
    }

    const renderAdditionalInfoUser = () => {
        if (!editing) {
            return (
                <div className={styles.messageAdditionalInfo}>
                    <div className={styles.infoContainer}>
                        <Button
                            className={`${styles.icon} ${editing ? '' : styles.hoverVisible}`}
                            SVGIcon={EditMessageIcon}
                            onClick={() => {
                                setEditing(true);
                                setEditedMessage(message.content);
                                console.log(`Edit message ${message.id}`)
                            }}
                            disabled={editing}
                        />
                    </div>
                </div>
            )
        } else {
            const canConfirm = editedMessage.trim() !== '' && editedMessage !== message.content;
            const commonClass = `${styles.icon} ${styles.alwaysVisible}`;
            // TODO: handle thunks for editing messages here and in chat.js, refactor this to other components

            return (
                <div className={styles.messageAdditionalInfo}>
                    <div className={styles.infoContainer}>
                        <div className={styles.confirmationButtons}>
                            <Button
                                className={`${commonClass} ${canConfirm ? styles.okButton : ''}`}
                                SVGIcon={YesIcon}
                                onClick={() => {
                                    setEditing(false);
                                    console.log(`Save edit message ${message.id}`)
                                }}
                                disabled={!canConfirm || !editing}
                            />
                            <Button
                                className={`${commonClass} ${styles.cancelButton}`}
                                SVGIcon={NoIcon}
                                onClick={() => {
                                    setEditing(false);
                                    console.log(`Cancel edit message ${message.id}`)
                                }}
                                disabled={!editing}
                            />
                        </div>
                    </div>
                </div>
            )
        }
    }

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
                {isUser ? renderAdditionalInfoUser() : renderAdditionalInfoAssistant()}
            </div>
        </div>
    );
};

export default Message;
