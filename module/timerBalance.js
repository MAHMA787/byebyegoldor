import config from "../config";
import { C03PacketPlayer, S08PacketPlayerPosLook } from "../utils/mappings";

let lastPacket;
let lastRemove = 0;
let delay = 0;
let inBoss = false;

register("packetSent", (packet, event) => {



}).setFilteredClasses([C03PacketPlayer])

register("packetReceived", (packet) => {
    if (Math.floor(packet.func_148932_c()) == 73 && Math.floor(packet.func_148928_d()) == 221 && Math.floor(packet.func_148933_e()) == 14) delay = 50;
}).setFilteredClass(S08PacketPlayerPosLook)

register("renderOverlay", () => {
    if (!config().timerBalance || !config().displayPackets) return;
    const scale = 2;
    Renderer.scale(scale);
    Renderer.drawStringWithShadow(global.balancePackets, (Renderer.screen.getWidth() / scale - Renderer.getStringWidth(global.balancePackets)) / 2, Renderer.screen.getHeight() / scale / 2 + 30);
})

register("worldUnload", () => {
    inBoss = false;
    lastPacket = null;
    global.balancePackets = 0;
    delay = 50;
})

register("worldLoad", () => {
    inBoss = false;

})

register("tick", () => {
    if (global.balancePackets >= config().removeAmount && Date.now() - lastRemove >= config().removeInterval * 1000 && Server.getIP() != "localhost") {
        global.balancePackets -= config().removeAmount;
        lastRemove = Date.now();
    }
})

register("chat", () => inBoss = true).setCriteria("[BOSS] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!");