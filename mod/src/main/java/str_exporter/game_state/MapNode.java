package str_exporter.game_state;

import java.util.List;

public class MapNode {
    public final String type;
    public final List<Integer> parents;

    public MapNode(String type, List<Integer> parents) {
        this.type = type;
        this.parents = parents;
    }
}
