package str_exporter.builders;

import str_exporter.client.BackendBroadcaster;
import str_exporter.config.Config;

public class JSONMessageBuilder {
    private final String version;
    private final int msg_type;

    private final Config config;

    public JSONMessageBuilder(Config config, String version, int msg_type) {
        this.config = config;
        this.version = version;
        this.msg_type = msg_type;
    }

    public String buildJson() {
        StringBuilder sb = new StringBuilder();

        sb.append("{");
        sb.append("\"msg_type\":");
        sb.append(msg_type);
        sb.append(",");
        sb.append("\"streamer\":{\"login\":\"" + config.getUser()+ "\",\"secret\":\"" + config.getOathToken()+ "\"},");
        sb.append("\"meta\":{\"version\": \"" + version + "\"},");
        sb.append("\"delay\":" + BackendBroadcaster.DELAY_PLACEHOLDER + ",");
        sb.append("\"message\":");

        buildMessage(sb);

        sb.append("}");

        return sb.toString();
    }

    protected void buildMessage(StringBuilder sb) {
        sb.append("\"\"");
    }
}
