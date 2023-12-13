import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import axios from "axios";
import {backendApiBaseUrl} from "../config";

export const fetchConversationsThunk = createAsyncThunk(
    'conversations/fetch',
    async (_, thunkAPI) => {
        try {
            const response = await axios.get(`${backendApiBaseUrl}/chat/conversations_branched/`);
            const result = response.data.map(conversation => {
                return {
                    ...conversation,
                    active: false
                };
            });

            console.log("\tfetch conversations response", result); // TODO: remove this line
            return result;
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    });

export const createConversationThunk = createAsyncThunk(
    'conversations/create',
    async ({title, messages}, thunkAPI) => {
        if (messages.length < 2) {
            return thunkAPI.rejectWithValue({error: "At least two messages are required to create a conversation."});
        }

        try {
            console.log("\tcreate conversation request: ", {title, messages}); // TODO: remove this line

            const response = await axios.post(
                `${backendApiBaseUrl}/chat/conversations/add/`, {title: title, messages: messages});
            console.log("\tcreate conversation response", response.data); // TODO: remove this line
            return {
                ...response.data,
                active: true,
            }
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const changeConversationTitleThunk = createAsyncThunk(
    'conversations/changeTitle',
    async ({id, newTitle}, thunkAPI) => {
        try {
            await axios.put(
                `${backendApiBaseUrl}/chat/conversations/${id}/change_title/`, {title: newTitle});
            console.log("\tchangeTitle conversation response", {id, newTitle}); // TODO: remove this line
            return {id: id, title: newTitle};
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    }
);

export const deleteConversationThunk = createAsyncThunk(
    'conversations/delete',
    async ({id}, thunkAPI) => {
        try {
            await axios.put(
                `${backendApiBaseUrl}/chat/conversations/${id}/delete/`);
            console.log("\tdelete conversation response", {id}); // TODO: remove this line
            return id;
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    }
);

export const addConversationMessageThunk = createAsyncThunk(
    'conversations/addMessage',
    async ({conversationId, message}, thunkAPI) => {
        try {
            console.log("\taddMessage conversation request", {conversationId, message}); // TODO: remove this line
            const response = await axios.post(
                `${backendApiBaseUrl}/chat/conversations/${conversationId}/add_message/`, {
                    role: message.role,
                    content: message.content
                });
            console.log("\taddMessage conversation response", response.data); // TODO: remove this line
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const addConversationVersionThunk = createAsyncThunk(
    'conversations/addVersion',
    async ({conversationId, rootMessageId}, thunkAPI) => {
        try {
            console.log("\tcreateVersion conversation request", {conversationId, rootMessageId}); // TODO: remove this line
            const response = await axios.post(
                `${backendApiBaseUrl}/chat/conversations/${conversationId}/add_version/`,
                {root_message_id: rootMessageId}
            );
            console.log("\tcreateVersion conversation response", response.data); // TODO: remove this line
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    }
);


export const createVersionAndAddMessage = (conversationId, rootMessageId, message) => {
    return async (dispatch) => {
        const createVersionAction = await dispatch(addConversationVersionThunk({conversationId, rootMessageId}));
        if (createVersionAction.error) {
            throw createVersionAction.error;
        }

        const versionId = createVersionAction.payload.id;
        const addMessageAction = await dispatch(addConversationMessageThunk({conversationId, versionId, message}));
        if (addMessageAction.error) {
            throw addMessageAction.error;
        }
    };
};


export const switchConversationVersionThunk = createAsyncThunk(
    'conversations/switchVersion',
    async ({conversationId, versionId}, thunkAPI) => {
        try {
            await axios.put(
                `${backendApiBaseUrl}/chat/conversations/${conversationId}/switch_version/${versionId}/`);
            return {conversationId, versionId};
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    }
);


const allConversationsSlice = createSlice({
    name: 'allConversations',
    initialState: [],
    reducers: {
        addConversation: (state, {payload}) => {
            console.log('\taddConversation', payload);
            state.forEach(conversation => conversation.active = false);
            state.push(payload);
        },
        setActiveConversation: (state, {payload}) => {
            console.log('\tsetActiveConversation', payload);
            if (!payload) {
                state.forEach(conversation => conversation.active = false);
                return;
            }

            state.forEach(conversation => {
                conversation.active = conversation.id === payload.id;
            });
        },
        updateConversation: (state, {payload}) => {
            const conversationIndex = state.findIndex(conversation => conversation.id === payload.id);
            state[conversationIndex] = payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversationsThunk.fulfilled, (state, action) => {
                return action.payload;
            })
            .addCase(createConversationThunk.fulfilled, (state, action) => {
                state.forEach(conversation => conversation.active = false);
                state.push(action.payload);
            })
            .addCase(changeConversationTitleThunk.fulfilled, (state, action) => {
                const conversationIndex = state.findIndex(conversation => conversation.id === action.payload.id);
                state[conversationIndex].title = action.payload.title;
            })
            .addCase(deleteConversationThunk.fulfilled, (state, action) => {
                return state.filter(conversation => conversation.id !== action.payload);
            })
            .addCase(addConversationMessageThunk.fulfilled, (state, action) => {
                const conversationId = action.payload.conversation_id;
                const newMessage = action.payload.message;

                // Find the conversation that contains the version to update
                const conversation = state.find(conversation => conversation.id === conversationId);
                // Find the version to update within the conversation
                const version = conversation.versions.find(version => version.active);

                // Add the new message to the version's messages array
                version.messages.push(newMessage);
            })
            .addCase(addConversationVersionThunk.fulfilled, (state, action) => {
                const conversationId = action.payload.conversation_id;

                // Find the conversation that contains the version to update
                const conversation = state.find(conversation => conversation.id === conversationId);
                // make all versions inactive
                conversation.versions.forEach(version => version.active = false);
                // add the new version to the conversation's versions array
                conversation.versions.push({...action.payload, active: true});
                console.log('\taddConversationVersionThunk.fulfilled', action.payload, conversation);
            })
            .addCase(switchConversationVersionThunk.fulfilled, (state, action) => {
                const conversationId = action.payload.conversationId;
                const versionId = action.payload.versionId;

                // Find the conversation that contains the version to update
                const conversation = state.find(conversation => conversation.id === conversationId);
                // make all versions inactive
                conversation.versions.forEach(version => version.active = false);
                // make the new version active
                const version = conversation.versions.find(version => version.id === versionId);
                version.active = true;
                console.log('\tswitchConversationVersionThunk.fulfilled', action.payload, conversation);
            })
    }
});

export const {
    addConversation,
    setActiveConversation,
    updateConversation,
} = allConversationsSlice.actions;

export default allConversationsSlice.reducer;
