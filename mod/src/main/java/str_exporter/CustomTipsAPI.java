package str_exporter;

import basemod.BaseMod;
import basemod.interfaces.PostInitializeSubscriber;
import com.evacipated.cardcrawl.modthespire.Loader;
import com.evacipated.cardcrawl.modthespire.ModInfo;
import com.evacipated.cardcrawl.modthespire.Patcher;
import com.evacipated.cardcrawl.modthespire.lib.SpireInitializer;
import com.megacrit.cardcrawl.helpers.Hitbox;
import com.megacrit.cardcrawl.helpers.PowerTip;
import org.apache.logging.log4j.Logger;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Set;

@SpireInitializer
public class CustomTipsAPI implements PostInitializeSubscriber {

    private static final String CUSTOM_TIP_HITBOX_NAME = "slayTheRelicsHitboxes";
    private static final String CUSTOM_TIP_POWERTIPS_NAME = "slayTheRelicsPowerTips";

    private ArrayList<Field> externalHitboxFields = new ArrayList<>();
    private ArrayList<Field> externalPowerTipsFields = new ArrayList<>();

    private static Logger logger = SlayTheRelicsExporter.logger;

    public static CustomTipsAPI instance;

    private CustomTipsAPI() {
        BaseMod.subscribe(this);
    }

    public static void initialize() {
        instance = new CustomTipsAPI();
    }

    @Override
    public void receivePostInitialize() {
        findCustomTipImplementingClasses();
    }

    private void findCustomTipImplementingClasses() {
        logger.info("CHECKING FOR OTHER MODS THAT IMPLEMENT CUSTOM TIPS API");

        ClassLoader loader = SlayTheRelicsExporter.class.getClassLoader();

        for (ModInfo info : Loader.MODINFOS) {
            if (Patcher.annotationDBMap.containsKey(info.jarURL)) {
                Set<String> initializers = Patcher.annotationDBMap.get(info.jarURL).getAnnotationIndex().get(SpireInitializer.class.getName());
                if (initializers != null) {
                    System.out.println(" - " + info.Name);
                    for (String initializer : initializers) {
                        System.out.println("   - " + initializer);
                        try {
                            long startTime = System.nanoTime();

                            Class<?> c = loader.loadClass(initializer);

                            try {
                                Field hitboxes = c.getField(CUSTOM_TIP_HITBOX_NAME);
                                Field powerTips = c.getField(CUSTOM_TIP_POWERTIPS_NAME);

                                if (hitboxes.getType() == ArrayList.class && powerTips.getType() == ArrayList.class) {
                                    externalHitboxFields.add(hitboxes);
                                    externalPowerTipsFields.add(powerTips);
                                    logger.info("Fields found for class " + c.getCanonicalName());
                                }
                            } catch (NoSuchFieldException e) {
                                logger.info("No fields found for class " + c.getCanonicalName());
                            }

                            long endTime = System.nanoTime();
                            long duration = endTime - startTime;
                            logger.info("   - " + (duration / 1000000) + "ms");
                        } catch (ClassNotFoundException e) {
                            logger.info("WARNING: Unable to find method initialize() on class marked @SpireInitializer: " + initializer);
                        }
                    }
                }
            } else {
                System.err.println(info.jarURL + " Not in DB map. Something is very wrong");
            }
        }
    }

    public Object[] getTipsFromMods() {

        LinkedList<Hitbox> hitboxes = new LinkedList<>();
        LinkedList<ArrayList<PowerTip>> tip_lists = new LinkedList<>();

        for (int i = 0; i < externalHitboxFields.size(); i++) {

            try {

//                logger.info("class: " + hitbox_fields.get(i).getDeclaringClass().getSimpleName());

                ArrayList<Hitbox> mod_hitboxes = (ArrayList<Hitbox>) externalHitboxFields.get(i).get(null);
                ArrayList<ArrayList<PowerTip>> mod_tip_lists = (ArrayList<ArrayList<PowerTip>>) externalPowerTipsFields.get(i).get(null);

                if (mod_hitboxes.size() == mod_tip_lists.size()) {
//                    logger.info("found fields, adding " + mod_hitboxes.size() + " entries");
                    hitboxes.addAll(mod_hitboxes);
                    tip_lists.addAll(removeImagesFromPowerTipsLists(mod_tip_lists));
                } else {
//                    logger.info("hitboxes and powertip list don't have the same size for class: " + hitbox_fields.get(i).getDeclaringClass().getSimpleName());
                }

            } catch (IllegalAccessException e) {
                e.printStackTrace();
            }
        }

        return new Object[]{hitboxes, tip_lists};
    }



    private static ArrayList<ArrayList<PowerTip>> removeImagesFromPowerTipsLists(ArrayList<ArrayList<PowerTip>> tip_lists) {
        // removes any images
        ArrayList<ArrayList<PowerTip>> new_tip_lists = new ArrayList<>(tip_lists.size());

        for (int i = 0; i < tip_lists.size(); i++) {
            ArrayList<PowerTip> list = tip_lists.get(i);

            new_tip_lists.add(new ArrayList<>(list.size()));
            for (int j = 0; j < list.size(); j++) {
                new_tip_lists.get(i).add(new PowerTip(list.get(j).header, list.get(j).body));
            }
        }

        return new_tip_lists;
    }
}
