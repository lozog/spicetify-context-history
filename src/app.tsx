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
        const data = Spicetify.Player.data;
        const isShuffled = Spicetify.Player.getShuffle();
        const queueData = await Spicetify.Platform.PlayerAPI.getQueue();
        const nextFrom = queueData.nextUp;
        // const nextFrom = queueData.nextUp.map(
        //     (track: Spicetify.PlayerTrack) => track.uri
        // );

        const newContext: SavedContext = {
            contextUri: data?.context.uri,
            trackUri: data?.item.uri,
            index: data?.index,
            progressMs: data?.positionAsOfTimestamp,
            isShuffled,
            nextFrom,
        };
        // Logger.info("newContext", newContext);

        Logger.info(
            `saving new context. current song: ${data?.item.name}  ${newContext.trackUri}. next up: ${newContext.nextFrom?.[0].name} ${newContext.nextFrom?.[0].uri}`
        );

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

    // Logger.info("restoring previous context:", prevContext);
    // Logger.info(
    //     `restoring previous context. current song: ${prevContext.trackUri}. next up: ${prevContext.nextFrom[0]}`
    // );
    Logger.info(
        `restoring previous context. current song: ${prevContext.trackUri}. next up: ${prevContext.nextFrom?.[0].name} ${prevContext.nextFrom?.[0].uri}`
    );

    // Force deterministic playback
    // await Spicetify.Player.setShuffle(false);
    // await new Promise((r) => setTimeout(r, 200));

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
        // for (const uri of prevContext.nextFrom) {
        //     Spicetify.Platform.PlayerAPI._queueURI(uri); // _queueURI is not defined
        // }

        addToNext([prevContext.nextFrom[0]]);

        // const insertions = prevContext.nextFrom.map((uri) => ({
        //     uri,
        //     // uri: track.uri,
        //     provider: "context",
        // }));
        // const queue = await Spicetify.Platform.PlayerAPI._queue.getQueue();
        // Logger.info([insertions[0]]);
        // Logger.info("next up before:", queue);

        // Spicetify.Platform.PlayerAPI._queue.insertIntoQueue([insertions[0]], {
        //     before: queue.nextUp[0],
        // });
        // const queue2 = await Spicetify.Platform.PlayerAPI._queue.getQueue();

        // Logger.info("next up after:", queue2);
    }
    Spicetify.showNotification("Restored context and Next From");
}

async function addToNext(uris) {
    Logger.info("addToNext", uris);
    const uriObjects = uris.map((uri) => ({ uri }));

    const queue = await Spicetify.Platform.PlayerAPI.getQueue();
    if (queue.queued.length > 0) {
        //Not empty, add all the tracks before first track
        const beforeTrack = {
            uri: queue.queued[0].uri,
            uid: queue.queued[0].uid,
        };
        await Spicetify.Platform.PlayerAPI.insertIntoQueue(uriObjects, {
            before: beforeTrack,
        })
            .then(() => Spicetify.showNotification("Added to Play Next"))
            .catch((err) => {
                console.error("Failed to add to queue", err);
                Spicetify.showNotification(
                    "Unable to Add! Check Console.",
                    true
                );
            });
    } else {
        //if queue is empty, simply add to queue
        await Spicetify.addToQueue(uriObjects)
            .then(() => Spicetify.showNotification("Added to Play Next"))
            .catch((err) => {
                console.error("Failed to add to queue", err);
                Spicetify.showNotification(
                    "Unable to Add! Check Console.",
                    true
                );
            });
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
