import { popContext, pushContext } from "./contextHistory";

let lastContext: string | null = null;

function startContextTracker() {
    Spicetify.Player.addEventListener("songchange", () => {
        console.log("song changing");
        const data = Spicetify.Player.data;
        console.log(data);
        const newContext = data?.context.uri;
        console.log("newContext", newContext);

        if (newContext && newContext !== lastContext) {
            if (lastContext) {
                pushContext(lastContext);
            }
            lastContext = newContext;
        }
    });
}

async function main() {
    while (!Spicetify?.showNotification) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Show message on start.
    Spicetify.showNotification("Context History loaded!");

    startContextTracker();
    console.log("main");

    const button = new Spicetify.Playbar.Button(
        "Go to Previous Context",
        "chevron-left",
        (self) => {
            Spicetify.showNotification("Back");
            const prev = popContext();
            if (prev) {
                Spicetify.Player.playUri(prev);
                Spicetify.showNotification("Restored previous context");
            } else {
                Spicetify.showNotification("No previous context");
            }
        },
        false, // Whether the button is disabled.
        false // Whether the button is active.
    );
}

export default main;
