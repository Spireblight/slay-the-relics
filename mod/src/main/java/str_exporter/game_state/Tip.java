package str_exporter.game_state;

public class Tip {
    public final String header;
    public final String description;
    public final String img;

    public Tip(String header, String description, String img) {
        this.header = header;
        this.description = description;
        this.img = img;
    }

    public Tip(String header, String description) {
        this(header, description, "");
    }
}
