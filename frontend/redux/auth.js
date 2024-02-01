import {createSlice} from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: Cookies.get('user') || null,
        csrfToken: null,
    },
    reducers: {
        setUser: (state, action) => {
            console.log('setUser', action.payload);  // delete this line later
            Cookies.set('user', action.payload);
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
