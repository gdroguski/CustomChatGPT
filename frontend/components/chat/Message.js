import React, {useCallback} from 'react';
import styles from "../../styles/Message.module.css";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {LeftArrowIcon, RightArrowIcon} from "../../assets/SVGIcon";
import Button from "./Button";
import {useSelector} from "react-redux";

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
    const currVersion = useSelector(state => state.currentConversation.id);

    let parts;
    try {
        parts = isUser ? [message.content] : message.content.split('```');
    } catch (e) {
        console.error(e);
        return null;
    }

    const switchVersion = useCallback((currVersionIndex, where) => {
        if (where === 'left') {
            const newVersion = versions[currVersionIndex - 1];
            console.log("left", newVersion);
        } else {
            const newVersion = versions[currVersionIndex + 1];
            console.log("right", newVersion);
        }
    }, [versions]);

    const renderAdditionalInfo = () => {
        if (message.versions.length > 1) {
            const versionIndex = versions.findIndex(version => version.id === currVersion);
            const activeLeft = versionIndex > 0;
            const activeRight = versionIndex < versions.length - 1;
            return (
                <div className={styles.messageAdditionalInfo}>
                    <div className={styles.infoContainer}>
                        <Button
                            className={""}
                            SVGIcon={LeftArrowIcon}
                            onClick={() => switchVersion(versionIndex, 'left')}
                            disabled={!activeLeft}
                        />
                        <span>{versionIndex+1}/{versions.length}</span>
                        <Button
                            className={""}
                            SVGIcon={RightArrowIcon}
                            onClick={() => switchVersion(versionIndex, 'right')}
                            disabled={!activeRight}
                        />
                    </div>
                </div>
            )
        } else {
            return null;
        }
    }

    return (
        <div className={`${styles.messageContainer} `}>
            <div className={`${styles.messageContent}  ${classRole}`}>
                {parts.map((part, index) => {
                    if (index % 2 === 0) {
                        return part.split('\n').map(
                            (line, lineIndex) => line ?
                                <p key={lineIndex}>{isUser ? line : parseInlineCode(line)}</p> : null);
                    } else {
                        let [language, ...codeLines] = part.split('\n');
                        let code = codeLines.join('\n');
                        return <SyntaxHighlighter key={index} language={language} style={darcula} children={code}/>
                    }
                })}
                {renderAdditionalInfo()}
            </div>
        </div>
    );
};

export default Message;
