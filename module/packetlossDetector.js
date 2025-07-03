import config from "../config";
import { S32PacketConfirmTransaction } from "../utils/mappings";
import playerUtils from "../utils/playerUtils";

let lastTransaction = 0;
let notify = false;

register("packetReceived", () => {
    if (!config().packetlossDetector) return;
    if (notify) playerUtils.sendMessage(`&7Packet loss detected (${getTimePassed()}ms)`);
    lastTransaction = Date.now();
    notify = false;
}).setFilteredClass(S32PacketConfirmTransaction)

register("tick", () => {
    if (config().packetlossDetector && getTimePassed() >= 500) notify = true;
})

function getTimePassed() {
    return Date.now() - lastTransaction;
}