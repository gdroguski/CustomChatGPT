import {v4 as uuidv4} from 'uuid';
import {MockId} from "./constants";


export const generateMockId = () => {
    return MockId + '_' + uuidv4();
};

export const isMockId = (id) => {
    return id.startsWith(MockId);
};
