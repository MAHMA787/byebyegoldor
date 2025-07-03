import { Keybind } from "../../KeybindFix";

import { S12PacketEntityVelocity } from "../utils/mappings";
import config from "../config";
import playerUtils from "../utils/playerUtils";

let enabled = false;

register("command", () => enabled = !enabled).setName("lavaclip")
new Keybind("LavaClip", Keyboard.KEY_NONE, "byebyegoldor").registerKeyPress(() => enabled = !enabled);

register("step", () => {

    
})

register("packetReceived", (packet, event) => {

}).setFilteredClass(S12PacketEntityVelocity)

register("renderOverlay", () => {
    if (enabled) Renderer.drawStringWithShadow("&4LAVA CLIPPING", Renderer.screen.getWidth() / 2 - Renderer.getStringWidth("LAVA CLIPPING") / 2, Renderer.screen.getHeight() / 2 + 15);
})

export const lavaClip = (b = false) => enabled = b;