const STORAGE_KEY = "contextStack";

function getStack(): string[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
        return [];
    }
}

function saveStack(stack: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
}

export function pushContext(uri: string) {
    const stack = getStack();
    stack.push(uri);
    saveStack(stack);
}

export function popContext(): string | undefined {
    const stack = getStack();
    const prev = stack.pop();
    saveStack(stack);
    return prev;
}

export function clearContextHistory() {
    localStorage.removeItem(STORAGE_KEY);
}
