import { S08PacketPlayerPosLook } from "../utils/mappings";
import playerUtils from "../utils/playerUtils";

let clipping = false;
let amount = 0;

register("command", (blocks) => pearlClip(blocks, false)).setName("pearlclip")

export function pearlClip(blocks) {
    blocks = parseFloat(blocks);
    if (isNaN(blocks) || !blocks || clipping || global.inFreeCam) return;

    amount = blocks;

    new Thread(() => {
        if (!Player.getHeldItem().getName().includes("Ender Pearl")) {
            playerUtils.swap("Ender Pearl");
            Thread.sleep(100);
        }
        
        preMotion.register();
    }).start();
}

const preMotion = register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Pre, (event) => {
    event.pitch = 90;
    clipping = true;
    postMotion.register();
    preMotion.unregister();
}).unregister();

const postMotion = register(Java.type("nukedenmark.events.impl.MotionUpdateEvent").Post, () => {
    playerUtils.rightClick();
    postMotion.unregister();
}).unregister();

register("packetReceived", (packet) => {
    if (!clipping) return;
    clipping = false;

    const [x, y, z] = [packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e()];

    Client.scheduleTask(1, () => {
        playerUtils.sendDebugMessage(`&7Pearlclipped ${amount} blocks down`);
        playerUtils.setPosition(x, y + amount, z);
        amount = 0;
    })
}).setFilteredClass(S08PacketPlayerPosLook)