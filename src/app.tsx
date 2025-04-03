import { popContext, pushContext, SavedContext } from "./contextHistory";

let lastContext: SavedContext | null = null;

const player = Spicetify.Platform.PlayerAPI;

function startContextTracker() {
    Spicetify.Player.addEventListener("songchange", () => {
        console.log("song changing");
        const data = Spicetify.Player.data;
        console.log(data);
        const newContext = {
            contextUri: data?.context.uri,
            trackUri: data?.item.uri,
            index: data?.index,
            progressMs: data?.positionAsOfTimestamp,
        };
        console.log("newContext", newContext);

        if (newContext && newContext !== lastContext) {
            if (lastContext) {
                pushContext(lastContext);
            }
            lastContext = newContext;
        }
    });
}

async function goBackToPreviousContext() {
    const queue = await Spicetify.Platform.PlayerAPI.getQueue();
    console.log("Current queue:", queue);

    const prevContext = popContext();
    if (
        prevContext?.contextUri &&
        typeof prevContext.index.itemIndex === "number"
    ) {
        console.log("restoring previous context:", prevContext);

        Spicetify.Player.playUri(
            prevContext.contextUri,
            {
                featureIdentifier: "context_back_button",
            },
            {
                skipTo: {
                    index: prevContext.index.itemIndex,
                    pageIndex: prevContext.index.pageIndex,
                },
            }
        );
    } else {
        console.log("No previous context");
    }
}

async function main() {
    while (!Spicetify?.showNotification) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Show message on start.
    Spicetify.showNotification("Context History loaded 20:09!");

    startContextTracker();
    console.log("main");

    const button = new Spicetify.Playbar.Button(
        "Go to Previous Context",
        "chevron-left",
        (self) => {
            Spicetify.showNotification("Back");
            goBackToPreviousContext();
        },
        false, // Whether the button is disabled.
        false // Whether the button is active.
    );
}

export default main;
