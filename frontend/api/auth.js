import {axiosInstance} from "./axios";


export const getCsrfToken = async () => {
    try {
        const response = await axiosInstance.get(`/auth/csrf_token/`);

        if (response.status === 200) {
            const responseData = response.data;
            return {
                data: responseData.data,
                ok: true,
            };
        } else {
            return {
                data: response.error || 'Error occurred while getting CSRF token.',
                ok: false,
            }
        }
    } catch (error) {
        console.error('An unexpected error occurred while getting CSRF token:', error);
        return {
            data: 'An unexpected error occurred while getting CSRF token.',
            ok: false,
        };
    }
}

export const postLogin = async ({email, password}) => {
    try {
        const response = await axiosInstance.post(`/auth/login/`,
            {
                email,
                password
            });

        if (response.status === 200) {
            return {
                data: 'ok',
                ok: true,
            };
        } else {
            return {
                data: response.error || 'Invalid username or password.',
                ok: false,
            }
        }
    } catch (error) {
        if (error.response && error.response.status  === 401) {
            const serverResponse = error.response.data.error;
            return {
                data: serverResponse || 'Invalid username or password.',
                ok: false,
            };
        }

        return {
            data: 'An unexpected error occurred during login.',
            ok: false,
        };
    }
};


export const postLogout = async (csrfToken) => {
    console.log('postLogout', csrfToken);
    try {
        const response = await axiosInstance.post(`/auth/logout/`,
            {}
        );

        if (response.status === 200) {
            return {
                data: 'ok',
                ok: true,
            };
        } else {
            return {
                data: response.error || 'Error occurred while logging out.',
                ok: false,
            }
        }
    } catch (error) {
        console.error('An unexpected error occurred during logout:', error);
        return {
            data: 'An unexpected error occurred during logout.',
            ok: false,
        };
    }
}


export const postRegister = async ({email, password}) => {
    try {
        const response = await axiosInstance.post(`/auth/register/`,
            {
                email,
                password
            });
        console.log('postRegister', response);

        if (response.status === 201) {
            return {
                data: 'ok',
                ok: true,
            };
        } else {
            return {
                data: response.error || 'An error occurred during registration.',
                ok: false,
            }
        }
    } catch (error) {
        console.error('An unexpected error occurred during registration:', error);
        return {
            data: 'An unexpected error occurred during registration.',
            ok: false,
        };
    }
};


export async function getServerSidePropsAuthHelper(context) {
    let isAuthenticated = false;

    const session = context.req.cookies.sessionid || null;
    const currUser = context.req.cookies.user || null;

    if (!currUser) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }


    if (session) {
        const response = (await axiosInstance.get(`/auth/verify_session`,
            {
                headers: {
                    'Cookie': `sessionid=${session}`,
                }
            })).data;

        isAuthenticated = response.data;
    }

    if (!isAuthenticated) {
        console.log('User is not authenticated, redirecting to login page.');
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    return {
        props: {
            isAuthenticated,
        },
    };
}
