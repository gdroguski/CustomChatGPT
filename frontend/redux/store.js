import {configureStore} from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import allConversations from "./conversations";
import currentConversation from "./currentConversation";
import streaming from "./streaming";

export const store = configureStore({
    reducer: {
        allConversations,
        currentConversation,
        streaming,
    },
    middleware: [thunk],
})
