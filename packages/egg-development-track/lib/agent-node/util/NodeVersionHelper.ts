export class NodeVersionHelper {
    private static major: number;
    private static minor: number;
    private static revision: number;

    private static fillInVersionNumbers() {
        const v = process.version.substring(1, process.version.length);
        const splits = v.split('.');
        NodeVersionHelper.major = parseInt(splits[0], 10);
        NodeVersionHelper.minor = parseInt(splits[1], 10);
        NodeVersionHelper.revision = parseInt(splits[2], 10);
    }

    public static getMajor(): number {
        if (!NodeVersionHelper.major) {
            NodeVersionHelper.fillInVersionNumbers();
        }
        return NodeVersionHelper.major;
    }

    public static getMinor(): number {
        if (!NodeVersionHelper.minor) {
            NodeVersionHelper.fillInVersionNumbers();
        }
        return NodeVersionHelper.minor;
    }

    public static getRevision(): number {
        if (!NodeVersionHelper.revision) {
            NodeVersionHelper.fillInVersionNumbers();
        }
        return NodeVersionHelper.revision;
    }
}
