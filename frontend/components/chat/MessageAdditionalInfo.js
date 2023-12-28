import React from 'react';
import styles from "../../styles/Message.module.css";
import {EditMessageIcon, LeftArrowIcon, NoIcon, RightArrowIcon, YesIcon} from "../../assets/SVGIcon";
import Button from "./Button";

export const AdditionalInfoUser = ({editing, setEditing, editedMessage, setEditedMessage, message}) => {
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
    }
    else {
        const canConfirm = editedMessage.trim() !== '' && editedMessage !== message.content;
        const commonClass = `${styles.icon} ${styles.alwaysVisible}`;

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
};

export const AdditionalInfoAssistant = ({message, switchVersion, currVersionId}) => {
        const versions = message?.versions;
        if (!versions || versions.length <= 1) {
            return null;
        }

        const versionIndex = versions.findIndex(version => version.id === currVersionId);
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
