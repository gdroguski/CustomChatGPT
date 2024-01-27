import {backendApiBaseUrl} from "../config";


export const getCsrfToken = async () => {
    try {
        const response = await fetch(`${backendApiBaseUrl}/auth/csrf_token/`, {
            method: 'GET',
            credentials: 'include',
        })
        const responseJson = await response.json();

        if (response.ok) {
            return {
                data: responseJson.data,
                ok: true,
            };
        } else {
            return {
                data: 'Error occurred while getting CSRF token.',
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

export const postLogin = async ({username, password}) => {
    try {
        const response = await fetch(`${backendApiBaseUrl}/auth/login/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": username,
                "password": password,
            }),
        });

        if (response.ok) {
            return {
                data: 'ok',
                ok: true,
            };
        } else {
            return {
                data: 'Invalid username or password.',
                ok: false,
            }
        }
    } catch (error) {
        console.error('An unexpected error occurred during login:', error);
        return {
            data: 'An unexpected error occurred during login.',
            ok: false,
        };
    }
};


export const postLogout = async (csrfToken) => {
    console.log('postLogout', csrfToken);
    try {
        const response = await fetch(`${backendApiBaseUrl}/auth/logout/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
        });

        if (response.ok) {
            return {
                data: 'ok',
                ok: true,
            };
        } else {
            return {
                data: 'Error occurred while logging out.',
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


export async function getServerSidePropsAuthHelper(context) {
    let isAuthenticated = false;

    const session = context.req.cookies.sessionid || null;

    if (session) {
        const response = await fetch(`${backendApiBaseUrl}/auth/verify_session`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cookie': `sessionid=${session}`,
            }
        });
        const responseJson = await response.json();

        isAuthenticated = responseJson.data;
    }

    if (!isAuthenticated) {
        console.log('not authenticated');
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
