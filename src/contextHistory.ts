const STORAGE_KEY = "contextStack";

export interface SavedContext {
    contextUri: string;
    trackUri: string;
    index: Spicetify.PlayerIndex;
    progressMs: number;
    isShuffled: boolean;
}

function getStack(): SavedContext[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
        return [];
    }
}

function saveStack(stack: SavedContext[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
}

export function pushContext(uri: SavedContext) {
    const stack = getStack();
    stack.push(uri);
    saveStack(stack);
}

export function popContext(): SavedContext | undefined {
    const stack = getStack();
    const prev = stack.pop();
    saveStack(stack);
    return prev;
}

export function clearContextHistory() {
    localStorage.removeItem(STORAGE_KEY);
}
