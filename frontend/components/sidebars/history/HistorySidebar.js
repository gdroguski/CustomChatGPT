import React, {useCallback, useEffect, useState} from "react";
import Sidebar from "../Sidebar";
import styles from "../../../styles/sidebars/HistorySidebar.module.css";
import {useDispatch, useSelector} from "react-redux";
import {setConversation, startNewConversation} from "../../../redux/currentConversation";
import {
    setActiveConversation,
    changeConversationTitleThunk,
    deleteConversationThunk,
    fetchConversationsThunk,
} from "../../../redux/conversations";
import HistoryItem from "./HistoryItem";
import {DeleteModal, EditModal} from "./Modals";
import {MockId} from "../../../utils/constants";

const HistorySidebar = () => {
    const allConversations = useSelector(state => state.allConversations);
    const currConversation = useSelector(state => state.currentConversation);
    const isStreaming = useSelector(state => state.streaming);
    const dispatch = useDispatch();

    const [hasConversations, setHasConversations] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(currConversation.id);
    const [editTitle, setEditTitle] = useState("");

    const canStartNewConversation = currConversation.messages.length > 1 && !isStreaming;
    const disabledClass = canStartNewConversation ? '' : styles.disabled;

    useEffect(() => {
        dispatch(fetchConversationsThunk());
    }, [dispatch]);

    useEffect(() => {
        if (allConversations.length > 0) {
            setHasConversations(true);
        }
    }, [allConversations]);

    const handleOpenEditModal = (conversationId) => {
        const currentTitle = allConversations.find(c => c.id === conversationId).title;
        setEditTitle(currentTitle);
        setIsEditModalOpen(true);
    }

    const handleCloseEditModal = (newTitle) => {
        setIsEditModalOpen(false);
        if (newTitle) {
            dispatch(changeConversationTitleThunk({id: selectedId, newTitle}));
            setEditTitle('');
        }
    }

    const handleOpenDeleteModal = (conversationId) => {
        setSelectedId(conversationId);
        setIsDeleteModalOpen(true);
    }

    const handleDeleteConversation = () => {
        dispatch(deleteConversationThunk({id: selectedId}));
        setIsDeleteModalOpen(false);
        dispatch(startNewConversation());
    }

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
    }

    const handleNewConversation = () => {
        dispatch(setActiveConversation(null));
        dispatch(startNewConversation());
        setSelectedId(MockId);
    }

    const handleSelectConversation = useCallback((conversationId) => {
        const selectedConversation = allConversations.find(c => c.id === conversationId);
        if (selectedConversation) {
            const latestVersion = selectedConversation.versions.find(v => v.active);
            dispatch(setActiveConversation(selectedConversation.id));
            dispatch(setConversation({...latestVersion, title: selectedConversation.title}));
            setSelectedId(selectedConversation.id);
        }
    }, [allConversations]);


    const navElements = useCallback(() => {
        return (
            <div className={styles.historySidebarContainer}>
                <h1>History</h1>
                <button
                    className={`${styles.newChatButton} ${disabledClass}`}
                    onClick={handleNewConversation}
                    disabled={!canStartNewConversation}
                >
                    <span>New chat</span>
                </button>

                <div className={styles.historyContainer}>
                    <ul>
                        {allConversations.slice(0).sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at)).map((conversation) => (
                            <HistoryItem
                                key={conversation.active_version}
                                conversation={conversation}
                                handleSelectConversation={handleSelectConversation}
                                handleOpenEditModal={handleOpenEditModal}
                                handleOpenDeleteModal={handleOpenDeleteModal}
                                selectedId={selectedId}
                            />
                        ))}
                    </ul>
                    <EditModal
                        isOpen={isEditModalOpen}
                        onRequestClose={handleCloseEditModal}
                        selectedTitle={editTitle}
                    />
                    <DeleteModal
                        isOpen={isDeleteModalOpen}
                        onRequestClose={handleCloseDeleteModal}
                        onDeleteConfirm={handleDeleteConversation}
                    />
                </div>
            </div>
        )
    }, [hasConversations, isStreaming, isEditModalOpen, isDeleteModalOpen, selectedId]);

    const description = "History";

    return (
        <Sidebar navElements={navElements} description={description} width={"250px"}/>
    );
}

export default HistorySidebar;
