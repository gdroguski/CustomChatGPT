import React, {useEffect, useState} from 'react';
import Modal from 'react-modal';
import styles from "../../../styles/sidebars/Modals.module.css";
import {NoIcon, YesIcon} from "../../../assets/SVGIcon";

export const EditModal = ({isOpen, onRequestClose, selectedTitle}) => {
    const [title, setTitle] = useState(selectedTitle);
    const [isTitleChanged, setIsTitleChanged] = useState(false);

    useEffect(() => {
        setTitle(selectedTitle);
    }, [selectedTitle]);

    const handleClose = () => {
        onRequestClose();
    }

    const handleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setIsTitleChanged(newTitle !== selectedTitle);
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (title !== "" && isTitleChanged) {
            onRequestClose(title);
        } else {
            onRequestClose("");
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            className={styles.conversationModal__Content}
            overlayClassName={styles.conversationModal__Overlay}
        >
            <h2>Edit title</h2>
            <div className={styles.inputContainer}>
                <input
                    type={"text"}
                    value={title}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    autoFocus={true}
                />
                <ConfirmationButtons
                    onConfirm={handleSubmit}
                    onCancel={handleClose}
                />
            </div>
        </Modal>
    );
}

export const DeleteModal = ({isOpen, onRequestClose, onDeleteConfirm}) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            className={styles.conversationModal__Content}
            overlayClassName={styles.conversationModal__Overlay}
        >
            <h2>Are you sure you want to delete this chat?</h2>
            <div className={styles.inputContainer}>
                <ConfirmationButtons
                    onConfirm={onDeleteConfirm}
                    onCancel={onRequestClose}
                    alignCenter={true}
                />
            </div>
        </Modal>
    );
}

const ConfirmationButtons = ({onConfirm, onCancel, alignCenter=false}) => {
    const alignClass = alignCenter ? styles.alignCenter : '';

    return (
        <div className={`${styles.buttonsContainer} ${alignClass}`}>
            <button
                className={styles.okButton}
                title={"Ok"}
                onClick={onConfirm}
            >
                <YesIcon/>
            </button>
            <button
                className={styles.cancelButton}
                title={"Cancel"}
                onClick={onCancel}
            >
                <NoIcon/>
            </button>
        </div>
    );
}
