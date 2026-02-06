import { Timestamp } from "firebase/firestore";

export interface Event {
    timestamp: Timestamp;
    changeDescription: string;
    currentLevel: string;
    levelDescription: string;
    trigger: string;
    type: string;
}

export interface State {
    timestamp: Timestamp;
    currentState: string;
    stateDescription: string;
    trigger: string;
    type: string;
}