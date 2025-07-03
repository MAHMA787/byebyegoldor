class mathUtils {
    constructor() {}

    /**
     * Converts an angle measured in degrees to an equivalent angle measured in radians
     * @param {Number} num
    */
    toRadians(num) {
        return num / 180.0 * Math.PI;
    }

    /**
     * Converts an angle measured in radians to an approximately equivalent angle measured in degrees
     * @param {Number} num
    */
    toDegrees(num) {
        return num * 180.0 / PI;
    }
}

export default new mathUtils();