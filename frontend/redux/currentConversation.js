import {createSlice} from '@reduxjs/toolkit';
import {addConversationMessageThunk, createConversationThunk, getConversationBranchedThunk} from "./conversations";
import {AssistantRole, MockId, MockTitle} from "../utils/constants";
import {postLogoutThunk} from "./auth";


const initialState = {
    id: MockId,
    title: MockTitle,
    conversation_id: MockId,
    root_message: "mock message",
    messages: [],
    active: true,
    parent_version: "mock version",
}

const currentConversationSlice = createSlice({
    name: 'currentConversation',
    initialState: initialState,
    reducers: {
        addMessage: (state, action) => {
            const lastMessage = state.messages[state.messages.length - 1];
            // If the last message was from the assistant, replace it as it is streaming.
            if (lastMessage && lastMessage.role === AssistantRole && action.payload.role === AssistantRole) {
                state.messages[state.messages.length - 1] = action.payload;
            } else {
                state.messages.push(action.payload);
            }
        },
        changeTitle: (state, action) => {
            state.title = action.payload;
        },
        startNewConversation: () => {
            return initialState;
        },
        setConversation: (state, action) => {
            console.log('\tsetConversation', action.payload);
            return action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createConversationThunk.fulfilled, (state, action) => {
                console.log('\tcreateConversationThunk.fulfilled', action.payload);
                const latestVersion = action.payload.versions.find(v => v.active);
                return {...latestVersion, title: action.payload.title};
            })
            .addCase(addConversationMessageThunk.fulfilled, (state, action) => {
                console.log('\taddConversationMessageThunk.fulfilled', action.payload);
                if (action.payload.hidden)
                    return;

                const lastMessage = state.messages[state.messages.length - 1];
                if (lastMessage && lastMessage.role === action.payload.role) {
                    state.messages[state.messages.length - 1] = action.payload.message;
                } else {
                    state.messages.push(action.payload.message);
                }
            })
            .addCase(getConversationBranchedThunk.fulfilled, (state, action) => {
                console.log('\tgetConversationBranchedThunk.fulfilled curr convo', action.payload);
                const latestVersion = action.payload.versions.find(v => v.active);
                return {...latestVersion, title: action.payload.title};
            })
            .addCase(postLogoutThunk.fulfilled, () => {
                return initialState;
            })
    }
});

export const {addMessage, changeTitle, startNewConversation, setConversation} = currentConversationSlice.actions;

export default currentConversationSlice.reducer;
