const STORAGE_KEY = "contextStack";
const MAX_STACK_SIZE = 3;

export interface SavedContext {
    contextUri: string;
    trackUri: string;
    trackName: string;
    index: Spicetify.PlayerIndex;
    progressMs: number;
    isShuffled: boolean;
    nextFrom?: Spicetify.PlayerTrack[];
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

    if (stack.length > MAX_STACK_SIZE) {
        console.log("Max stack size reached. Removing oldest items.");
        stack.splice(0, stack.length - MAX_STACK_SIZE); // remove oldest items
    }

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

export function printContextHistory() {
    const stack = getStack();

    if (stack.length === 0) {
        console.log("No context history");
        return;
    }

    stack.forEach((savedContext, i) => {
        console.log(
            `context ${i}, playing: ${savedContext.trackName}, next up: ${savedContext.nextFrom?.[0]?.name}, ${savedContext.nextFrom?.[1]?.name}, ${savedContext.nextFrom?.[2]?.name}`
        );
    });
}
