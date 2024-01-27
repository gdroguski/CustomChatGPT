import {configureStore} from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import allConversations from "./conversations";
import currentConversation from "./currentConversation";
import streaming from "./streaming";
import loading from "./loading";
import auth from "./auth";

export const store = configureStore({
    reducer: {
        allConversations,
        currentConversation,
        streaming,
        loading,
        auth,
    },
    middleware: [thunk],
})
