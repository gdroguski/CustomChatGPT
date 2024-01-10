import React from 'react';

const SVGButton = ({ SVGIcon, className, onClick, disabled, children }) => {

    return (
        <button
            className={className}
            type="button"
            onClick={onClick}
            disabled={disabled}
        >
            <SVGIcon />
            {children}
        </button>
    )
}

export default SVGButton;
