package str_exporter.builders;

import str_exporter.client.Message;
import str_exporter.config.Config;

import java.util.HashMap;
import java.util.Map;

public class JSONMessageBuilder {
    private final String version;
    private final int msg_type;

    private final Config config;

    public JSONMessageBuilder(Config config, String version, int msg_type) {
        this.config = config;
        this.version = version;
        this.msg_type = msg_type;
    }

    public Message buildJson(Object msg) {
        Map<String, String> meta = new HashMap<>();
        meta.put("version", version);

        Message.Streamer streamer = new Message.Streamer();
        streamer.login = config.getUser();
        streamer.secret = config.getOathToken();

        Message message = new Message();
        message.msg_type = msg_type;
        message.streamer = streamer;
        message.meta = meta;
        message.message = msg;

        return message;
    }
}
