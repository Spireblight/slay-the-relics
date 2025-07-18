package str_exporter.game_state;

public class HitBox {
    public final float x;
    public final float y;
    public final float w;
    public final float h;
    public final float z;

    public HitBox(float x, float y, float w, float h, float z) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.z = z;
    }

    public HitBox(float x, float y, float w, float h) {
        this(x, y, w, h, 0.0f);
    }
}
