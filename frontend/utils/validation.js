export const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

export const isLongEnough = (password) => {
    return password.length >= 8;
};

export const hasUppercase = (password) => {
    return /[A-Z]/.test(password);
};

export const hasLowercase = (password) => {
    return /[a-z]/.test(password);
};

export const hasNumber = (password) => {
    return /[0-9]/.test(password);
};

export const hasSpecialCharacter = (password) => {
    return /[!@#\$%\^&\*]/.test(password);
};

export const validatePassword = (password) => {
    return isLongEnough(password) &&
        hasUppercase(password) &&
        hasLowercase(password) &&
        hasNumber(password) &&
        hasSpecialCharacter(password);
};
