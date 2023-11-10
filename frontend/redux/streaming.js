import {createSlice} from '@reduxjs/toolkit';

const streamingSlice = createSlice({
    name: 'streaming',
    initialState: false,
    reducers: {
        setStreaming: (state, action) => {
            return action.payload;
        }
    }
});

export const {setStreaming} = streamingSlice.actions;

export default streamingSlice.reducer;
