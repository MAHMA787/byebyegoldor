import { getEtherwarpBlock, getLastSentLook } from "../../BloomCore/utils/Utils";
import config from "../config";
import { C06PacketPlayerPosLook, C08PacketPlayerBlockPlacement, S02PacketChat, S08PacketPlayerPosLook } from "../utils/mappings";
import playerUtils from "../utils/playerUtils";

const FAILWATCHPERIOD = 20;
const MAXFAILSPERFAILPERIOD = 3;
const MAXQUEUEDPACKETS = 3;
const recentFails = [];
export const recentlySentC06s = [];

const checkAllowedFails = () => {
    if (Server.getIP() == "localhost") return true;
    if (recentlySentC06s.length >= MAXQUEUEDPACKETS) return false;
    while (recentFails.length && Date.now() - recentFails[0] > FAILWATCHPERIOD * 1000) recentFails.shift();
    return recentFails.length < MAXFAILSPERFAILPERIOD;
}

const validEtherwarpItems = new Set([
    "ASPECT_OF_THE_END",
    "ASPECT_OF_THE_VOID",
    "ETHERWARP_CONDUIT",
])

export const isHoldingEtherwarpItem = () => {
    if (Server.getIP() == "localhost") return Player?.getHeldItem()?.getName()?.toLowerCase()?.includes("aspect of the void");
    if (!validEtherwarpItems.has(playerUtils.getHeldItemID())) return false;
    return Player?.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.ethermerge == 1 || playerUtils.getHeldItemID() == "ETHERWARP_CONDUIT";
}

const getTunerBonusDistance = () => {
    if (Server.getIP() == "localhost") return 5;
    return Player?.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.tuned_transmission || 0;
}

const doZeroPingEtherwarp = () => {
    const rt = getEtherwarpBlock(true, 57 + getTunerBonusDistance() - 1);
    if (!rt) return;

    let [pitch, yaw] = getLastSentLook();
    yaw %= 360;
    if (yaw < 0) yaw += 360;

    let [x, y, z] = rt;

    x += 0.5;
    y += 1.05;
    z += 0.5;

    if (Server.getIP() != "localhost") recentlySentC06s.push({ pitch, yaw, x, y, z });

    Client.scheduleTask(0, () => {
        Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, Player.asPlayerMP().isOnGround()));
        Player.getPlayer().func_70107_b(x, y, z);
        if (!config().keepMotion) Player.getPlayer().func_70016_h(0, 0, 0);
    })
}

const blacklistedIds = [
    54,
    146
]

register("packetSent", (packet) => {
    if (!config().zeroPingEtherwarp || !global.hasMana) return;

    const dir = packet.func_149568_f();
    if (dir !== 255) return;

    const blockID = Player?.lookingAt()?.getType()?.getID();

    if (!isHoldingEtherwarpItem() || !getLastSentLook() || !playerUtils.isSneaking && playerUtils.getHeldItemID() !== "ETHERWARP_CONDUIT" || blacklistedIds.includes(blockID)) return;
    if (!checkAllowedFails()) return;

    doZeroPingEtherwarp();
}).setFilteredClass(C08PacketPlayerBlockPlacement)

const isWithinTolerence = (n1, n2) => Math.abs(n1 - n2) < 1e-4;

register("packetReceived", (packet, event) => {
    if (Server.getIP() == "localhost" || !recentlySentC06s.length) return;

    const { pitch, yaw, x, y, z } = recentlySentC06s.shift();

    const newPitch = packet.func_148930_g();
    const newYaw = packet.func_148931_f();
    const newX = packet.func_148932_c();
    const newY = packet.func_148928_d();
    const newZ = packet.func_148933_e();

    const lastPresetPacketComparison = {
        pitch: isWithinTolerence(pitch, newPitch) || newPitch == 0,
        yaw: isWithinTolerence(yaw, newYaw) || newYaw == 0,
        x: x == newX,
        y: y == newY,
        z: z == newZ
    }

    const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a == true);
    if (wasPredictionCorrect) return cancel(event);

    recentFails.push(Date.now());
    while (recentlySentC06s.length) recentlySentC06s.shift();
}).setFilteredClass(S08PacketPlayerPosLook)

register("packetReceived", (packet) => {
    const type = packet.func_179841_c();
    if (type == 2) {
        const text = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());
        if (text.includes("NOT ENOUGH MANA")) global.hasMana = false;
        else global.hasMana = true;
    }
}).setFilteredClass(S02PacketChat)