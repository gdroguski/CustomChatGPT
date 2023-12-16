import {createSlice} from '@reduxjs/toolkit';
import {
    addConversationMessageThunk,
    addVersionAndUpdateConversationThunk,
    createConversationThunk
} from "./conversations";
import {AssistantRole, MockId, MockTitle} from "../utils/constants";
import {isMockId} from "../utils/functions";


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
                state.messages[state.messages.length - 1] = action.payload; // TODO: here we could handle user role editions
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
                state.messages = state.messages.map(message => isMockId(message.id) ? action.payload.message : message);
            })
            .addCase(addVersionAndUpdateConversationThunk.fulfilled, (state, action) => {
                console.log('\taddVersionAndUpdateConversationThunk.fulfilled curr convo', action.payload);
                const latestVersion = action.payload.versions.find(v => v.active);
                const newState = {...latestVersion, title: action.payload.title};
                console.log('\taddVersionAndUpdateConversationThunk.fulfilled curr convo new state', newState);
                return {...latestVersion, title: state.title};
            })
    }
});

export const {addMessage, changeTitle, startNewConversation, setConversation} = currentConversationSlice.actions;

export default currentConversationSlice.reducer;
