import { Keybind } from "../../KeybindFix";
import RenderLibV2 from "../../RenderLibV2";

import playerUtils from "../utils/playerUtils";
import rotationUtils from "../utils/rotationUtils";

global.inFreeCam = false;

let position = [];
let motion = [];

new Keybind("FreeCam", Keyboard.KEY_NONE, "byebyegoldor").registerKeyPress(() => {
    global.inFreeCam = !global.inFreeCam
    global.inFreeCam ? enable() : disable();
});

function enable() {

}

function disable() {

}

register("gameUnload", () => {
    if (global.inFreeCam) disable();
});

register("worldUnload", () => {
    if (global.inFreeCam) disable();
})

const fieldHandler = register("renderWorld", () => {
    Player.getPlayer().field_71075_bZ.field_75101_c = true;
    Player.getPlayer().field_70145_X = true;
}).unregister();

const renderHandler = register("renderWorld", () => {

}).unregister();

const packetHandler = register("packetSent", (packet, event) => {
}).unregister();