import { Keybind } from "../../KeybindFix";

import { data, getNearest, isLogging } from "./configManager";
import { C06PacketPlayerPosLook, KeyInputEvent, MouseEvent, S0DPacketCollectItem } from "../utils/mappings";
import playerUtils from "../utils/playerUtils";
import rotationUtils from "../utils/rotationUtils";
import config from "../config";
import dungeonUtils from "../utils/dungeonUtils";
import { pearlClip } from "../module/pearlClip";
import { lavaClip } from "../module/lavaClip";

let end;
const autoRouteTypes = [
    "etherwarp",
    "tp",
    "impact",
    "pearl",
    "pearlclip"
];

register("renderWorld", () => {
    
})

register(KeyInputEvent, () => {
    if (end) playerUtils.stopMovement();
})

register(MouseEvent, (event) => {
    if (event.button == 0 && event.buttonstate) {
        Object.entries(data.points).forEach(([config, points]) => points.forEach(point => point.near = false));
        awaitSecret();
    }
})

register("packetReceived", (packet) => {
    const item = World.getWorld().func_73045_a(packet.func_149354_c())?.func_92059_d()?.func_82833_r()?.removeFormatting();
    if (dungeonUtils.isDungeonItem(item)) awaitSecret();
}).setFilteredClass(S0DPacketCollectItem)

new Keybind("Toggle", Keyboard.KEY_NONE, "byebyegoldor").registerKeyPress(() => {
    config().autoP3 = !config().autoP3;
    playerUtils.sendMessage(config().autoP3 ? "&aEnabled" : "&cDisabled");
    end = null;
})

function awaitSecret() {
    const nearest = getNearest();
    if (!nearest) return;

    const { point, index } = nearest;

    if (point.awaitsecret) {
        point.awaitsecret = false;
        data.save();

        Client.scheduleTask(1, () => {
            point.awaitsecret = true;
            data.save();
        });
    }
}