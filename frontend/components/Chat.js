import React, {useEffect, useRef, useState} from 'react';
import styles from "../styles/Chat.module.css";
import {postChatConversation, postChatTitle} from "../api";
import Conversation from "./chat/Conversation";
import Button from "./chat/Button";
import {RegenerateIcon, StartIcon, StopIcon} from "../assets/SVGInputIcon";
import ChoiceButton from "./ModelButton";
import {useDispatch, useSelector} from "react-redux";
import {addMessage, changeTitle} from "../redux/currentConversation";
import {
    addConversationMessageThunk,
    addConversationVersionThunk,
    createConversationThunk,
    getConversationBranchedThunk,
    updateConversation
} from "../redux/conversations";
import {setStreaming} from "../redux/streaming";
import {AssistantRole, GPT35, MockTitle, UserRole} from "../utils/constants";
import {generateMockId} from "../utils/functions";


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

        // TODO: conversation in history sidebar when thunk is fulfilled -> later
        // TODO: in history sidebar sort by latest edited conversation after thunk is fulfilled -> later
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

    const generateResponse = async (prompt = inputRef.current.textContent, replaceLast = false) => {
        let newConversationMessages, newMessage;
        if (!replaceLast) {
            newMessage = {role: UserRole, content: prompt, id: generateMockId()};
            newConversationMessages = [...currVersion.messages, newMessage];
            addMessageToConversation(prompt, UserRole)
        } else {
            // TODO: think about it how to handle branching here for edited user's messages
            newConversationMessages = currVersion.messages.slice(0, -1);
            newMessage = {role: AssistantRole, content: "", id: generateMockId()};
            setVersionUpdatePromise(addVersionToConversation());
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
                        const conversationId = currVersion.conversation_id
                        await versionUpdatePromise;
                        setVersionUpdatePromise(null);
                        await addMessageToConversation(data, AssistantRole);
                        dispatch(getConversationBranchedThunk({conversationId}));
                    } else {
                        addMessageToConversation(data, AssistantRole);
                    }
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

    const regenerateResponse = () => {
        const lastUserMessage = [...currVersion.messages].reverse().find(message => message.role === UserRole);
        const lastAssistantMessage = [...currVersion.messages].reverse().find(message => message.role === AssistantRole);

        if (!lastUserMessage) return;

        generateResponse(lastUserMessage.content, true).catch(console.error);
    };

    const processText = (data) => {
        const newMessage = {role: AssistantRole, content: data, id: generateMockId()};
        dispatch(addMessage(newMessage));
    };

    const addMessageToConversation = (message, role) => {
        if (currVersion.title === MockTitle)
            return Promise.resolve();
        const newMessage = {role: role, content: message};
        return dispatch(addConversationMessageThunk({
            conversationId: currVersion.conversation_id,
            message: newMessage
        }));
    }

    const addVersionToConversation = async () => {
        if (currVersion.title === MockTitle)
            return;
        const lastMessageId = currVersion.messages[currVersion.messages.length - 1].id;
        await dispatch(addConversationVersionThunk({
            conversationId: currVersion.conversation_id,
            rootMessageId: lastMessageId
        }));
    }

    return (
        <div className={styles.chatContainer} ref={chatContainerRef}>
            <div className={styles.conversationContainer}>
                <Conversation conversation={currVersion.messages} error={error}/>
            </div>
            <div className={styles.chatInputContainer}>
                <div className={styles.choiceButtonContainer}>
                    <ChoiceButton disabled={isStreaming} chosenModel={chosenModel} onChoice={handleModelChoice}/>
                </div>
                <div className={styles.chatInput}>
                    <textarea
                        ref={inputRef}
                        className={styles.chatInputField}
                        placeholder="Type a message here..."
                        value={userInput}
                        onChange={handleInputChanged}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <Button
                        className={styles.generateButton}
                        SVGIcon={StartIcon}
                        onClick={handleGenerateClick}
                        disabled={!userInput || isStreaming}
                    />
                    <Button
                        className={styles.stopButton}
                        SVGIcon={StopIcon}
                        onClick={abortResponse}
                        disabled={!canStop}
                    />
                    <Button
                        className={styles.regenerateButton}
                        SVGIcon={RegenerateIcon}
                        onClick={regenerateResponse}
                        disabled={!canRegenerate}
                    />
                </div>
                <div className={styles.inputMock}/>
            </div>
        </div>
    );
};

export default Chat;
