import {
    clearContextHistory,
    popContext,
    printContextHistory,
    pushContext,
    SavedContext,
} from "./contextHistory";
import { Logger } from "./logger";

declare global {
    interface Window {
        printContextHistory: typeof printContextHistory;
        clearContextHistory: typeof clearContextHistory;
    }
}

let prevContext: SavedContext | null = null;
let prevContextUri: string | null = null;

function startContextTracker() {
    Spicetify.Player.addEventListener("songchange", async () => {
        const data = Spicetify.Player.data;
        const isShuffled = Spicetify.Player.getShuffle();

        setTimeout(async () => {
            const queueData = await Spicetify.Platform.PlayerAPI.getQueue();
            const nextFrom = queueData.nextUp;

            if (!data) return;

            const newContextUri = data.context.uri;

            Logger.debug(`lastContextUri: ${prevContextUri}`);

            const newContext: SavedContext = {
                contextUri: newContextUri,
                trackUri: data.item.uri,
                trackName: data.item.name,
                index: data.index,
                progressMs: data.positionAsOfTimestamp,
                isShuffled,
                nextFrom,
            };

            if (newContextUri !== prevContextUri) {
                Logger.debug(
                    `Context changed from ${prevContextUri} to ${newContextUri}`
                );

                Logger.info(
                    `pushing new context to storage. playing: ${newContext.trackName}. next up: ${newContext.nextFrom?.[0]?.name}`
                );
                pushContext(newContext);
                prevContext = newContext;
            }

            prevContextUri = newContextUri;
        }, 250); // delay so that when we call getQueue, it happens after the context is changed
    });
}

async function goBackToPreviousContext() {
    const prevContext = popContext();
    if (!prevContext) {
        Spicetify.showNotification("No previous context");
        return;
    }

    Logger.info("restoring previous context:", prevContext);

    await Spicetify.Player.playUri(
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

    if (prevContext.nextFrom?.length) {
        await addTracksToNextUpQueue(prevContext.nextFrom);

        Logger.info("Restored context and Next From");
    }
}

/**
 * Given a list of tracks, insert them at the top of the nextUp queue.
 * Removes any previously existing instances of those tracks from the nextUp queue
 */
async function addTracksToNextUpQueue(tracks: Spicetify.PlayerTrack[]) {
    Logger.debug("addToNext", tracks);
    const uriObjects = tracks.map((track) => ({ uri: track.uri }));
    const uriList = uriObjects.reduce<string[]>((acc, uriObject) => {
        acc.push(uriObject.uri);
        return acc;
    }, []);
    Logger.debug("uriObjects:", uriObjects);

    const queue = await Spicetify.Platform.PlayerAPI.getQueue();
    Logger.debug("queue:", queue);

    // save a list of the current nextUp queue so we can remove them later
    const replacedTracks: Spicetify.PlayerTrack[] = queue.nextUp.filter(
        (track: Spicetify.PlayerTrack) => uriList.includes(track.uri)
    );

    const beforeTrack = {
        uri: queue.nextUp[0]?.uri,
        uid: queue.nextUp[0]?.uid,
    };

    // put the new songs in the nextUp queue
    await Spicetify.Platform.PlayerAPI.insertIntoQueue(uriObjects, {
        ...(beforeTrack.uri ? { before: beforeTrack } : {}),
    })
        .then(() => Logger.debug("Added to Play Next"))
        .catch((err) => {
            Logger.error("Failed to add to queue", err);
            Spicetify.showNotification("Unable to Add! Check Console.", true);
        });

    // remove the songs we replaced
    await Spicetify.Platform.PlayerAPI.removeFromQueue(replacedTracks)
        .then(() => Logger.debug("Removed from Play Next"))
        .catch((err) => {
            Logger.error("Failed to remove from queue", err);
            Spicetify.showNotification("Unable to Add! Check Console.", true);
        });
}

async function main() {
    Logger.info("Starting context-history");
    while (!Spicetify?.showNotification) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    Logger.debug("Context History loaded");

    startContextTracker();

    new Spicetify.Playbar.Button(
        "Go to previous context",
        "chevron-left",
        () => {
            goBackToPreviousContext();
            Spicetify.showNotification("Restored previous context");
        },
        false, // Whether the button is disabled.
        false // Whether the button is active.
    );
}

window.printContextHistory = printContextHistory;
window.clearContextHistory = clearContextHistory;

export default main;
