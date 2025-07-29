package str_exporter.game_state.integrations;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.game_state.Tip;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class RelicStatsIntegration {
    public static final Logger logger = LogManager.getLogger(RelicStatsIntegration.class.getName());

    private String header;
    private boolean tried = false;

    private void tryInitialize() {
        try {
            header = relicstats.RelicStats.statsHeader;
            logger.info("RelicStatsIntegration: RelicStatsIntegration initialized");
        } catch (NoClassDefFoundError e) {
            header = null;
            logger.info("RelicStatsIntegration: RelicStats not found, integration disabled");
        }
        tried = true;
    }

    public List<Tip> relicTips(List<String> relics) {
        if (!tried) {
            tryInitialize();
        }
        if (header == null) {
            return new ArrayList<>();
        }
        return relics.stream().map(r -> {
            String des = relicstats.RelicStats.getStatsDescription(r);
            return new Tip(header, des);
        }).collect(Collectors.toList());
    }
}
