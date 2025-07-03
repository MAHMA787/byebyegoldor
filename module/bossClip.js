import config from "../config";
import { S08PacketPlayerPosLook, S32PacketConfirmTransaction } from "../utils/mappings";
import playerUtils from "../utils/playerUtils";

let delay = 0;

register("packetReceived", (packet) => {
    const x = Math.floor(packet.func_148932_c());
    const y = Math.floor(packet.func_148928_d());
    const z = Math.floor(packet.func_148933_e());

    if (config().bossClip && x == 73 && y == 221 && z == 14 && delay == 0) {
        delay = 10;
        Client.scheduleTask(0, () => playerUtils.setPosition(Player.getX(), Player.getY() - 40, Player.getZ()))
    };
}).setFilteredClass(S08PacketPlayerPosLook);

register("packetReceived", () => {
    if (delay > 0) delay--;
}).setFilteredClass(S32PacketConfirmTransaction)