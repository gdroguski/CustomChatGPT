import React, {useCallback, useEffect, useRef, useState} from 'react';
import styles from "../../styles/chat/Main.module.css";
import {postChatConversation, postChatTitle} from "../../api/gpt";
import Conversation from "./Conversation";
import ChoiceButton from "./ModelButton";
import {useDispatch, useSelector} from "react-redux";
import {addMessage, changeTitle, setConversation} from "../../redux/currentConversation";
import {
    addConversationMessageThunk,
    addConversationVersionThunk,
    createConversationThunk,
    getConversationBranchedThunk,
    updateConversation
} from "../../redux/conversations";
import {setStreaming} from "../../redux/streaming";
import {AssistantRole, GPT35, MessageTypes, MockTitle, UserRole} from "../../utils/constants";
import {generateMockId} from "../../utils/functions";
import {ControlButtons} from "./ControlButtons";


const Chat = () => {
    const currVersion = useSelector(state => state.currentConversation);
    const isStreaming = useSelector(state => state.streaming);
    const dispatch = useDispatch();

    const chatContainerRef = useRef(null);
    const inputRef = useRef();
    const [userInput, setUserInput] = useState('');
    const [canStop, setCanStop] = useState(false);
    const [canRegenerate, setCanRegenerate] = useState(false);
    const [versionUpdatePromise, setVersionUpdatePromise] = useState(null);
    const [error, setError] = useState(null);
    const [chosenModel, setChosenModel] = useState(GPT35);

    let abortController = useRef(new AbortController());


    useEffect(() => {
        const element = chatContainerRef.current;
        element.scrollTop = element.scrollHeight;
        const currMessages = currVersion.messages;

        dispatch(updateConversation(currVersion));

        const hasUserInput = currMessages.some(message => message.role === UserRole);
        const lastMessage = currMessages[currMessages.length - 1];
        const hasChatResponse = lastMessage && lastMessage.role === AssistantRole && lastMessage.content !== '';
        setCanRegenerate(hasUserInput && hasChatResponse && !isStreaming);
        setCanStop(isStreaming && hasChatResponse)

        if (currMessages.length === 2 && !isStreaming && currVersion.title === MockTitle) {
            generateTitle().catch(console.error);
        }
    }, [currVersion, isStreaming]);

    useEffect(() => {
        console.log('conversation on useEffect end isStreaming', currVersion);
    }, [isStreaming]);

    useEffect(() => {
        let isCancelled = false;

        const checkVersionUpdatePromise = async () => {
            if (versionUpdatePromise) {
                await versionUpdatePromise;
                if (!isCancelled) {
                    setVersionUpdatePromise(null);
                }
            }
        };

        checkVersionUpdatePromise().catch(console.error);

        return () => {
            isCancelled = true;
        };
    }, [versionUpdatePromise]);


    const generateTitle = async () => {
        const lastTwoMessages = currVersion.messages.slice(-2);
        const lastUserMessage = lastTwoMessages.find(message => message.role === UserRole).content;
        const lastAssistantMessage = lastTwoMessages.find(message => message.role === AssistantRole).content;

        let title;
        try {
            title = await postChatTitle({
                "user_question": lastUserMessage,
                "chatbot_response": lastAssistantMessage,
            });
        } catch (error) {
            console.error("Error generating title", error);
            title = "Error generating title";
        }

        const newConversation = {
            title: title,
            messages: currVersion.messages,
        }
        console.log('gen title newConversation', newConversation);
        dispatch(changeTitle(title));
        dispatch(createConversationThunk(newConversation));
    }

    const handleInputChanged = (e) => {
        setUserInput(e.target.value);
        updateInputHeight();
    }

    const handleKeyDown = (e) => {
        const currentText = e.currentTarget.value;
        if (!currentText && e.key !== "Enter") return;

        setUserInput(currentText);
        updateInputHeight();

        if (e.key === "Enter") {
            if (e.shiftKey) {
                e.preventDefault();
                const {selectionStart, selectionEnd} = e.currentTarget;
                const newValue = currentText.slice(0, selectionStart) + '\n' + currentText.slice(selectionEnd);
                setUserInput(newValue);
                const textarea = e.currentTarget;
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
                }, 0);
            } else {
                e.preventDefault();
                generateResponse(currentText).catch(console.error);
            }
        }
    };

    const handleGenerateClick = () => {
        generateResponse().catch(console.error);
    }

    const updateInputHeight = () => {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }

    const resetInputHeight = () => {
        inputRef.current.textContent = '';
        inputRef.current.style.height = "auto";
    }

    const handleModelChoice = (model) => {
        setChosenModel(model);
    }

    const generateResponse = async (prompt = inputRef.current.textContent, messageType = MessageTypes.UserMessage, messageId = null) => {
        let newConversationMessages, newMessage;
        const regenerateMessage = messageType === MessageTypes.RegenerateAssistantMessage || messageType === MessageTypes.RegenerateUserMessage;

        switch (messageType) {
            case MessageTypes.UserMessage:
                newMessage = {role: UserRole, content: prompt, id: generateMockId()};
                newConversationMessages = [...currVersion.messages, newMessage];
                addMessageToConversation(prompt, UserRole)
                break;
            case MessageTypes.RegenerateAssistantMessage:
                newMessage = {role: AssistantRole, content: "", id: generateMockId()};
                newConversationMessages = currVersion.messages.slice(0, -1);
                setVersionUpdatePromise(addVersionToConversation());
                break;
            case MessageTypes.RegenerateUserMessage:
                newMessage = {role: AssistantRole, content: "", id: generateMockId()};
                const messageIndex = currVersion.messages.findIndex(message => message.id === messageId);
                const messages = currVersion.messages.slice(0, messageIndex + 1);
                messages[messageIndex] = {role: UserRole, content: prompt, id: generateMockId()}
                const newVersion = {...currVersion, messages: messages};
                dispatch(setConversation(newVersion));

                newConversationMessages = newVersion.messages;
                setVersionUpdatePromise(
                    addVersionToConversation(messageId)
                        .then(() => addMessageToConversation(prompt, UserRole, true))
                );
                break;
            default:
                throw new Error(`Unknown message type: ${messageType}`);
        }
        dispatch(addMessage(newMessage));

        setUserInput('');
        inputRef.current.textContent = '';
        resetInputHeight();
        setError(null);
        dispatch(setStreaming(true));

        try {
            const reader = await postChatConversation(
                newConversationMessages.map(m => ({role: m.role, content: m.content})),
                chosenModel,
                {signal: abortController.current.signal}
            );
            const decoder = new TextDecoder();
            let data = '';

            while (true) {
                const {done, value} = await reader.read();
                if (done) {
                    processText(data);
                    if (versionUpdatePromise) {
                        await versionUpdatePromise;
                        await addMessageToConversation(data, AssistantRole);
                        setVersionUpdatePromise(null);
                    } else {
                        addMessageToConversation(data, AssistantRole);
                    }
                    if (regenerateMessage)
                        dispatch(getConversationBranchedThunk({conversationId: currVersion.conversation_id}));
                    break;
                }
                data += decoder.decode(value, {stream: true});
                processText(data);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                setError(`There was an error: ${error.message}`);
            }
        } finally {
            dispatch(setStreaming(false));
        }
    };

    const abortResponse = async () => {
        abortController.current.abort();
        abortController.current = new AbortController();
        dispatch(setStreaming(false));
        const lastMessage = currVersion.messages[currVersion.messages.length - 1];
        if (versionUpdatePromise) {
            await versionUpdatePromise;
            setVersionUpdatePromise(null);
        }
        await addMessageToConversation(lastMessage.content, AssistantRole)
        dispatch(getConversationBranchedThunk({conversationId: currVersion.conversation_id}));
    }

    const regenerateAssistantResponse = () => {
        const lastUserMessage = [...currVersion.messages].reverse().find(message => message.role === UserRole);

        if (!lastUserMessage) return;

        generateResponse(lastUserMessage.content, MessageTypes.RegenerateAssistantMessage).catch(console.error);
    };

    const regenerateUserResponse = useCallback((messageId, newContent) => {
        console.log("messageEditConfirm", messageId, newContent);

        generateResponse(newContent, MessageTypes.RegenerateUserMessage, messageId).catch(console.error);
    }, [currVersion.messages]);

    const processText = (data) => {
        const newMessage = {role: AssistantRole, content: data, id: generateMockId()};
        dispatch(addMessage(newMessage));
    };

    const addMessageToConversation = (message, role, hidden = false) => {
        if (currVersion.title === MockTitle)
            return Promise.resolve();
        const newMessage = {role: role, content: message};
        // if this is first user's message then hidden = true
        if (role === UserRole && currVersion.messages.length === 2) {
            hidden = true;
        }
        return dispatch(addConversationMessageThunk({
            conversationId: currVersion.conversation_id,
            message: newMessage,
            hidden: hidden
        }));
    }

    const addVersionToConversation = async (rootMessageId = null) => {
        if (currVersion.title === MockTitle)
            return;
        if (!rootMessageId)
            rootMessageId = currVersion.messages[currVersion.messages.length - 1].id;

        await dispatch(addConversationVersionThunk({
            conversationId: currVersion.conversation_id,
            rootMessageId: rootMessageId
        }));
    }

    const renderChoiceButton = () => {
        return (
            <div className={styles.choiceButtonContainer}>
                <ChoiceButton disabled={isStreaming} chosenModel={chosenModel} onChoice={handleModelChoice}/>
            </div>
        )
    }

    const renderChatInput = () => {
        return (
            <div className={styles.chatInputContainer}>
                <textarea
                    ref={inputRef}
                    placeholder="Type a message here..."
                    value={userInput}
                    onChange={handleInputChanged}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
            </div>
        )
    }

    const renderControlButtons = () => {
        const generateProps = {
            onClick: handleGenerateClick,
            disabled: !userInput || isStreaming,
        };
        const stopProps = {
            onClick: abortResponse,
            disabled: !canStop,
        };
        const regenerateProps = {
            onClick: regenerateAssistantResponse,
            disabled: !canRegenerate,
        };

        return (
            <div className={styles.controlButtonsContainer}>
                <ControlButtons generateProps={generateProps} stopProps={stopProps} regenerateProps={regenerateProps}/>
            </div>
        )
    }

    return (
        <div className={styles.chatContainer} ref={chatContainerRef}>
            <div className={styles.conversationContainer}>
                <Conversation messages={currVersion.messages} regenerateUserResponse={regenerateUserResponse}
                              error={error}/>
            </div>
            <div className={styles.chatControlContainer}>
                {renderChoiceButton()}
                {renderChatInput()}
                {renderControlButtons()}
            </div>
        </div>
    );
};

export default Chat;
