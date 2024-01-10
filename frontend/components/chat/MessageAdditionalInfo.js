import React from 'react';
import styles from "../../styles/chat/Message.module.css";
import {EditMessageIcon, LeftArrowIcon, NoIcon, RightArrowIcon, YesIcon} from "../../assets/SVGIcon";
import SVGButton from "../common/SVGButton";


export const AdditionalInfo = ({isUser, message, isStreaming, editProps, versionsProps}) => {
    const additionalInfoEdit = isUser && <AdditionalInfoEdit message={message} isStreaming={isStreaming} {...editProps} />;
    const additionalInfoVersions = editProps.editing ? null : <AdditionalInfoVersions message={message} isStreaming={isStreaming} {...versionsProps} />;
    const versions = message?.versions;

    if (!isUser && (!versions || versions.length <= 1)) {
        return null;
    }

    return (
        <div className={styles.messageAdditionalInfo}>
            <div className={styles.infoContainer}>
                {additionalInfoVersions}
                {additionalInfoEdit}
            </div>
        </div>
    )
};


export const AdditionalInfoEdit = ({isStreaming, editing, setEditing, editedMessage, setEditedMessage, message, messageEditConfirm}) => {
    if (!editing) {
        return (
            <SVGButton
                className={`${styles.icon} ${editing ? '' : styles.hoverVisible}`}
                SVGIcon={EditMessageIcon}
                onClick={() => {
                    setEditing(true);
                    setEditedMessage(message.content);
                    console.log(`Edit message ${message.id}`)
                }}
                disabled={editing}
            />
        )
    }
    else {
        const canConfirm = editedMessage.trim() !== '' && editedMessage !== message.content;
        const commonClass = `${styles.icon} ${styles.alwaysVisible}`;

        return (
            <div className={styles.confirmationButtons}>
                <SVGButton
                    className={`${commonClass} ${canConfirm ? styles.okButton : ''}`}
                    SVGIcon={YesIcon}
                    onClick={() => {
                        setEditing(false);
                        messageEditConfirm(message.id, editedMessage);
                    }}
                    disabled={!canConfirm || !editing || isStreaming}
                />
                <SVGButton
                    className={`${commonClass} ${styles.cancelButton}`}
                    SVGIcon={NoIcon}
                    onClick={() => {
                        setEditing(false);
                        console.log(`Cancel edit message ${message.id}`)
                    }}
                    disabled={!editing}
                />
            </div>
        )
    }
};

export const AdditionalInfoVersions = ({isStreaming, message, switchVersion, currVersionId}) => {
        const versions = message?.versions;
        if (!versions || versions.length <= 1) {
            return null;
        }

        const versionIndex = versions.findIndex(version => version.id === currVersionId);
        const activeLeft = versionIndex > 0;
        const activeRight = versionIndex < versions.length - 1;
        return (
            <>
                <SVGButton
                    className={`${styles.icon} ${activeLeft ? styles.alwaysVisible : ''}`}
                    SVGIcon={LeftArrowIcon}
                    onClick={() => switchVersion(versionIndex, 'left')}
                    disabled={!activeLeft || isStreaming}
                />
                <span>{versionIndex + 1}/{versions.length}</span>
                <SVGButton
                    className={`${styles.icon} ${activeRight ? styles.alwaysVisible : ''}`}
                    SVGIcon={RightArrowIcon}
                    onClick={() => switchVersion(versionIndex, 'right')}
                    disabled={!activeRight || isStreaming}
                />
            </>
        )
    }
