import React from 'react';
import styles from "../../styles/Chat.module.css";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {LeftArrowIcon, RightArrowIcon} from "../../assets/SVGIcon";
import Button from "./Button";

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

    let parts;
    try {
        parts = isUser ? [message.content] : message.content.split('```');
    } catch (e) {
        console.error(e);
        return null;
    }

    const renderAdditionalInfo = () => {
        if (message.versions.length > 1) {
            return (
                <div className={styles.messageAdditionalInfo}>
                    <div className={styles.infoContainer}>
                        <Button
                            className={""}
                            SVGIcon={LeftArrowIcon}
                            onClick={() => {
                            }}
                            disabled={false}
                        />
                        <span>{message.versions.length}/{message.versions.length}</span>
                        <Button
                            className={""}
                            SVGIcon={RightArrowIcon}
                            onClick={() => {
                            }}
                            disabled={false}
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
