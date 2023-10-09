package str_exporter.client;

import java.util.Map;

public class Message {
    public int msg_type;
    public Streamer streamer;
    public Map<String, String> meta;
    public long delay;
    public Object message;

    public static class Streamer {
        public String login;
        public String secret;
    }
}
