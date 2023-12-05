import React, {useState} from 'react';
import styles from '../../styles/sidebars/Sidebar.module.css';
import {SidebarChevronIcon} from "../../assets/SVGIcon";
import Button from "../chat/Button";


/**
 * Sidebar component.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.navElements - Function to generate navigation elements.
 * @param {string} props.description - Description text.
 */
const Sidebar = ({navElements, description, width = "200px"}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const containerClassName = isCollapsed
        ? `${styles.sidebarContainer} ${styles.collapsed}` : styles.sidebarContainer;

    const handleClicked = () => {
        setIsCollapsed(!isCollapsed);
    }

    return (
        <div className={containerClassName} style={{width: isCollapsed ? "" : width }}>
            <nav className={isCollapsed ? styles.hidden : ''}>
                {navElements()}
            </nav>
            <div className={styles.collapseButtonContainer}>
                <Button
                    className={`${styles.collapseButton} ${isCollapsed ? styles.mirrored : ''}`}
                    SVGIcon={SidebarChevronIcon}
                    onClick={handleClicked}
                    disabled={false}
                >
                {isCollapsed ? <span>{description}</span> : <span>Hide</span>}
                </Button>
            </div>
        </div>
    );
}

export default Sidebar;
