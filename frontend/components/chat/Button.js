import React, { useState } from 'react';
import styles from "../../styles/Chat.module.css";

const Button = ({ SVGIcon, className, onClick, disabled, children }) => {
    const [hover, setHover] = useState(false);

    const disabledClass = disabled ? styles.disabled : '';

    const onMouseEnter = () => {
        setHover(true);
    }

    const onMouseLeave = () => {
        setHover(false);
    }

    return (
        <button
            className={`${className} ${disabledClass}`}
            type="button"
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <SVGIcon hover={hover} disabled={disabled}/>
            {children}
        </button>
    )
}

export default Button;
