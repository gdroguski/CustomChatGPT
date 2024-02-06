import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import {getCsrfToken, postLogin, postLogout} from "../api/auth";


export const fetchCsrfTokenThunk = createAsyncThunk(
    'auth/fetchCsrfToken',
    async (_, thunkAPI) => {
        try {
            const result = await getCsrfToken();
            console.log('fetchCsrfTokenThunk', result);  // delete this line later

            return result;
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    }
);

export const postLoginThunk = createAsyncThunk(
    'auth/postLogin',
    async ({email, password}, thunkAPI) => {
        try {
            const result = await postLogin({email, password});
            const payload = {...result, email: email};
            console.log('postLoginThunk', payload);  // delete this line later

            if (result.ok) {
                return payload;
            } else {
                return thunkAPI.rejectWithValue(payload);
            }
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    }
);


export const postLogoutThunk = createAsyncThunk(
    'auth/postLogout',
    async ({csrfToken}, thunkAPI) => {
        try {
            const result = await postLogout(csrfToken);
            console.log('postLogoutThunk', result);  // delete this line later

            return result;
        } catch (error) {
            return thunkAPI.rejectWithValue({error: error.message});
        }
    }
);


const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: Cookies.get('user') || null,
        csrfToken: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCsrfTokenThunk.fulfilled, (state, action) => {
                console.log('fetchCsrfTokenThunk.fulfilled', action.payload);  // delete this line later
                state.csrfToken = action.payload.data;
            })
            .addCase(postLoginThunk.fulfilled, (state, action) => {
                console.log('postLoginThunk.fulfilled', action.payload);  // delete this line later
                const email = action.payload.email;
                state.user = email;
                Cookies.set('user', email, {sameSite: 'None', secure: true});
            })
            .addCase(postLogoutThunk.fulfilled, (state, action) => {
                console.log('postLogoutThunk.fulfilled', action.payload);  // delete this line later
                state.user = null;
                Cookies.remove('user', {sameSite: 'None', secure: true});
            });
    }
});

export default authSlice.reducer;
