import {
    clearContextHistory,
    popContext,
    pushContext,
    SavedContext,
} from "./contextHistory";
import { Logger } from "./logger";

let lastContext: SavedContext | null = null;

const player = Spicetify.Platform.PlayerAPI;

function startContextTracker() {
    Spicetify.Player.addEventListener("songchange", async () => {
        Logger.info("song changing");
        const data = Spicetify.Player.data;
        const isShuffled = Spicetify.Player.getShuffle();

        const newContext = {
            contextUri: data?.context.uri,
            trackUri: data?.item.uri,
            index: data?.index,
            progressMs: data?.positionAsOfTimestamp,
            isShuffled,
        };
        Logger.info("newContext", newContext);

        if (newContext && newContext !== lastContext) {
            if (lastContext) {
                pushContext(lastContext);
            }
            lastContext = newContext;
        }
    });
}

async function goBackToPreviousContext() {
    const prevContext = popContext();
    if (
        prevContext?.contextUri &&
        typeof prevContext.index.itemIndex === "number"
    ) {
        Logger.info("restoring previous context:", prevContext);

        // this must go before playUri()
        if (Spicetify.Player.getShuffle() !== prevContext.isShuffled) {
            Spicetify.Player.setShuffle(prevContext.isShuffled);
            // artificial delay so setShuffle can do its thang
            await new Promise((r) => setTimeout(r, 250));
        }

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
        Logger.info("No previous context");
    }
}

async function main() {
    Logger.info("Starting context-history");
    while (!Spicetify?.showNotification) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    Spicetify.showNotification("Context History loaded");

    startContextTracker();

    new Spicetify.Playbar.Button(
        "Go to previous context",
        "chevron-left",
        (self) => {
            Spicetify.showNotification("Back");
            goBackToPreviousContext();
        },
        false, // Whether the button is disabled.
        false // Whether the button is active.
    );

    new Spicetify.Playbar.Button(
        "Clear context history",
        "x",
        (self) => {
            Spicetify.showNotification("Cleared context history");
            clearContextHistory();
        },
        false, // Whether the button is disabled.
        false // Whether the button is active.
    );
}

export default main;
