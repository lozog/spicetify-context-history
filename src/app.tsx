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
        const queueData = await Spicetify.Platform.PlayerAPI.getQueue();
        const nextFrom = queueData.nextUp.map(
            (track: Spicetify.PlayerTrack) => track.uri
        );

        const newContext = {
            contextUri: data?.context.uri,
            trackUri: data?.item.uri,
            index: data?.index,
            progressMs: data?.positionAsOfTimestamp,
            isShuffled,
            nextFrom,
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
    if (!prevContext) {
        Spicetify.showNotification("No previous context");
        return;
    }

    Logger.info("restoring previous context:", prevContext);

    // TODO: restore songs from previous context into current nextUp queue
    //   Spicetify.Platform.PlayerAPI.addToQueue = (items) => {
    //     Spicetify.Platform.PlayerAPI._queue.insertIntoQueue(
    //         items.map((i) => ({ uri: i.uri, provider: "context" })),
    //         { before: Spicetify.Platform.PlayerAPI._queue.getQueue().nextUp[0] }
    //     );
    // };

    // Force deterministic playback
    await Spicetify.Player.setShuffle(false);
    await new Promise((r) => setTimeout(r, 200));

    Spicetify.Player.playUri(
        prevContext.contextUri,
        {
            featureIdentifier: "context_back_button",
        },
        {
            skipTo: {
                index: prevContext.index.itemIndex,
                pageIndex: prevContext.index.pageIndex ?? 0,
            },
        }
    );

    //   // TODO: Restore playback position
    //   if (prevContext.progressMs) {
    //     setTimeout(() => {
    //         Spicetify.Player.seek(prevContext.progressMs);
    //     }, 1000); // wait for track to load
    // }

    // Restore Next From queue manually
    if (prevContext.nextFrom?.length) {
        for (const uri of prevContext.nextFrom) {
            Spicetify.Platform.PlayerAPI._queueURI(uri);
        }
    }
    Spicetify.showNotification("Restored context and Next From");
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
