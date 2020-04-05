package str_exporter;

import java.util.*;

public class StringCompression {

    private static final String WILDCARDS = "0123456789abcdefghijklmnopqrstvwxyzABCDEFGHIJKLMNOPQRSTVWXYZ_`[]/^%?@><=-+*:;,.()#$!'{}~";

    private static class Word implements Comparable<Word> {
        public String word;
        public int costSave;
        public LinkedList<Word> overlaps;
        public boolean selected;

        public Word(String word, int costSave) {
            this.word = word;
            this.costSave = costSave;
            this.selected = false;
            this.overlaps = new LinkedList<>();
        }

        public void addOverlap(Word word) {
            overlaps.add(word);
        }

        public boolean canBeSelected() {
            for (Word word : overlaps) {
                if (word.selected)
                    return false;
            }
            return true;
        }

        @Override
        public int compareTo(Word o) {
            return Integer.compare(costSave, o.costSave);
        }
    }

    public static String compress(String s) {

        long start = System.nanoTime();

        int uncompressedLength = s.length();

        s = s.replace('|', ':').replace('&', ':');
        ArrayList<String> compressionDict = new ArrayList<>();

        int[] ns = {1, 10, 9, 8, 7, 6, 5, 4, 3, 2};

//        int n = 1;
        for (int i = 0; i < ns.length && compressionDict.size() < WILDCARDS.length(); i++) {
//            System.out.printf("n=%d\n", n);

            String[] parts = s.split(" ");
            int n = Math.min(ns[i], parts.length);

            String[] ngrams = new String[parts.length - n + 1];

            HashMap<String, Word> costSave = new HashMap<>(5);
            // create list of all n-grams
            for (int j = 0; j < parts.length - n + 1; j++) {
                StringBuilder ngram = new StringBuilder();
                for (int k = 0; k < n; k++) {
                    ngram.append(parts[j + k]);
                    if (k < n - 1) {
                        ngram.append(' ');
                    }
                }

                ngrams[j] = ngram.toString();
            }

            // compute cost saving of compressing each n-gram
            for (int j = 0; j < ngrams.length; j++) {
                String word = ngrams[j];

                if (!costSave.containsKey(word)) {
                    costSave.put(word, new Word(word, -4));
                } else {
                    costSave.get(word).costSave += word.length() - 2;
                }
            }

            for (int j = 0; j < ngrams.length; j++) {

                Word word = costSave.get(ngrams[j]);
                for (int k = Math.max(0, j - n + 1); k < Math.min(ngrams.length, j + n); k++) {
                    if (k != j) {
                        word.addOverlap(costSave.get(ngrams[k]));
                    }
                }
            }

            // sort all n-grams by cost save in decreasing order
            Word[] Words = costSave.values().toArray(new Word[0]);
            Arrays.sort(Words, Collections.reverseOrder());

            // compress all net cost positive n-grams and move to n+=1
            for (int j = 0; j < Words.length; j++) {
                if (Words[j].costSave > 0 && Words[j].canBeSelected()) {
//                    System.out.printf("word \"%s\" cost save %d wildcard &%c\n", NGrams[j].word, NGrams[j].costSave, WILDCARDS.charAt(compressionDict.size()));
                    s = s.replace(Words[j].word, "&" + WILDCARDS.charAt(compressionDict.size()));
                    compressionDict.add(Words[j].word);
                    Words[j].selected = true;
                } else {
                    break;
                }

                if (compressionDict.size() == WILDCARDS.length())
                    break;
            }
        }

        StringBuilder sb = new StringBuilder();

        // prepend the compression dictionary
        for (int i = 0; i < compressionDict.size(); i++) {
            sb.append(compressionDict.get(i));
            sb.append('|');
        }

        sb.append('|');
        if (compressionDict.size() == 0) // case of compressing empty message
            sb.append('|');

        sb.append(s);

        s = sb.toString();
        int compressedLength = s.length();

        long end = System.nanoTime();

//        SlayTheRelicsExporter.logger.info(String.format("compression, original len: %s new len: %s ratio %.2f, duration %.2f ms", uncompressedLength, compressedLength, compressedLength * 1f / uncompressedLength, (end-start)/1e6));
        return s;
    }
}