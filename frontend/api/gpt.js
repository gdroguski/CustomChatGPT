import {backendApiBaseUrl} from "../config";

/**
 * Posts a new chat conversation to the backend API.
 *
 * @param {Object[]} newConversation - The new conversation to post.
 * @param {string} newConversation[].role - The role of the message sender. Can be 'user' or 'assistant'.
 * @param {string} newConversation[].content - The content of the message.
 * @param {int} newConversation[].id - The id of the message.
 * @param {string} model - The model to use for the conversation.
 * @param fetchOptions - The fetch options for aborting the request.
 * @param {AbortSignal} fetchOptions.signal - The signal to abort the fetch request.
 *
 * @returns {ReadableStreamDefaultReader} The reader from the response's body.
 *
 * @throws Will throw an error if the fetch call status is not OK.
 *
 * @example
 * const abortController = new AbortController();
 * const model = "gpt35";
 * const newConversation = [
 *     {
 *         "role": "user",
 *         "content": "Hello",
 *         "id": 1
 *     },
 *     {
 *         "role": "assistant",
 *         "content": "Hi, how can I help you?",
 *         "id": 2
 *     },
 * ];
 * const reader = await postChatConversation(newConversation, model, {signal: abortController.signal});
 */
export const postChatConversation = async (newConversation, model, fetchOptions = {}) => {
    const response = await fetch(`${backendApiBaseUrl}/gpt/conversation/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "conversation": newConversation,
            "model": model,
        }),
        ...fetchOptions,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body.getReader();
};


/**
 * Posts a single chat question to the backend API.
 *
 * @param {string} question - The question to post.
 *
 * @returns {ReadableStreamDefaultReader} The reader from the response's body.
 *
 * @throws Will throw an error if the fetch call status is not OK.
 *
 * @example
 * const question = "Tell me a dad joke";
 * const reader = await postChatSingleQuestion(question);
 */
export const postChatSingleQuestion = async (question) => {
    const response = await fetch(`${backendApiBaseUrl}/gpt/question/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "user_question": question
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body.getReader();
}

export const postChatTitle = async ({user_question, chatbot_response}) => {
    const response = await fetch(`${backendApiBaseUrl}/gpt/title/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "user_question": user_question,
            "chatbot_response": chatbot_response,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
}
