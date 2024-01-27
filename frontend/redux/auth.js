import {createSlice} from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        csrfToken: null,
    },
    reducers: {
        setUser: (state, action) => {
            console.log('setUser', action.payload);  // delete this line later
            return {...state, user: action.payload};
        },
        setCsrfToken: (state, action) => {
            console.log('setCsrfToken', action.payload);  // delete this line later
            return {...state, csrfToken: action.payload};
        }
    }
});

export const {setUser, setCsrfToken} = authSlice.actions;

export default authSlice.reducer;
