import { C09PacketHeldItemChange } from "./mappings";
import playerUtils from "./playerUtils";

class itemUtils {
    constructor() {
        this.swapped = false;
        this.slot = -1;

        register("packetSent", (packet, event) => {
            if (this.swapped) cancel(event);
        }).setFilteredClass(C09PacketHeldItemChange)

        register("gameUnload", () => this.resetServerRotations());
    }

    /**
     * Returns the Index of the item
     * @param {string} itemName 
     */
    findItem(itemName){
        let itemID = Player.getInventory()?.getItems()?.find(a => a?.getName() && a.getName().removeFormatting().includes(itemName))?.getID();
        if (!itemID) return playerUtils.sendMessage(`${itemName} not found!`);
        let itemSlot = Player.getInventory()?.indexOf(itemID);
        return itemSlot
    }

    /**
     * Swaps to an item with the provided name
     * @param {String} name
    */
    swap(name) {
        const item = Player?.getInventory()?.getItems()?.findIndex(item => item?.getName()?.toLowerCase()?.includes(name.toLowerCase()));
        if (item <= 8 && item >= 0) Player.setHeldItemIndex(item);
    }

    /**
     * Swaps to the specified slot
     * @param {Number} slot
    */
    swap(slot) {
        if (slot > 8 || slot < 0) return;

        Player.setHeldItemIndex(slot);
    }

    /**
     * Swaps to the specified slot server-side
     * @param {Number} slot
    */
    serverSwap(slot) {
        if (slot > 8 || slot < 0) return;

        Client.scheduleTask(new C09PacketHeldItemChange(slot));
        this.swapped = true;
        this.slot = slot;
    }

    /**
     * Resets the server-side held item
    */
    resetServerItem() {
        this.swapped = false;
        if (this.slot != Player.getHeldItemIndex()) Client.sendPacket(new C09PacketHeldItemChange(Player.getHeldItemIndex()));
        this.slot = -1;
    }
}

export default new itemUtils();