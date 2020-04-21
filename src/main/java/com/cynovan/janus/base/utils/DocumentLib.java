package com.cynovan.janus.base.utils;

import com.google.common.collect.Lists;
import com.mongodb.MongoClient;
import org.bson.BsonDocument;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;

import java.util.Arrays;
import java.util.Date;
import java.util.List;

public class DocumentLib {

    public static Document parse(String value) {
        return Document.parse(value);
    }

    public static int getInt(Document document, String key) {
        return StringLib.toInteger(get(document, key));
    }

    public static Date getDate(Document document, String key) {
        if (document != null) {
            Object value = get(document, key);
            if (value != null) {
                if (value instanceof Date) {
                    return (Date) value;
                }
                if (value instanceof String) {
                    try {
                        return DateUtils.parseDate(value);
                    } catch (Exception e) {
                        try {
                            long unixMillis = StringLib.toLong(value);
                            if (unixMillis > 0) {
                                return new Date(unixMillis);
                            }
                        } catch (NumberFormatException ex) {
                            return null;
                        }
                    }
                }
            }
        }
        return null;
    }

    public static String getID(Document document) {
        if (document != null) {
            String id = null;
            if (document.containsKey("_id")) {
                Object objectId = document.get("_id");
                if (objectId instanceof ObjectId) {
                    id = objectId.toString();
                } else {
                    return StringLib.toString(objectId);
                }
            }
            if (StringLib.isEmpty(id)) {
                if (document.containsKey("id")) {
                    id = document.getString("id");
                }
            }
            return id;
        }
        return null;
    }

    public static ObjectId getObjectId(Document document) {
        if (document != null) {
            if (document.containsKey("_id")) {
                return document.getObjectId("_id");
            }
            if (document.containsKey("id")) {
                String id = getString(document, "id");
                return new ObjectId(id);
            }
        }
        return null;
    }

    public static Long getLong(Document document, String key) {
        return StringLib.toLong(get(document, key));
    }

    /**
     *
     * 如果document 为空或者key或者key为空都返回null
     * 这个函数关于输入的key如果key是以‘。’连接的字符串的话那么如果在这个所有字符串点的分割的字符串数组的长度下的最后一个docment对象的值的get("filed')的值如果这个搜索过程中碰到了任何的一个，
     * 为空的value或者是 不是document类型的value那么就会直接返回null
     * 如果是单独的一个单词的话那么就直接从document 中取出这个key(menuIndex|appId)所对应的值
     * @param document  document 对象
     * @param key 类似与menuIndex 或者是appID
     * @return
     */
    private static Object get(Document document, String key) {
        if (document == null) {
            return null;
        }
        if (StringLib.isNotEmpty(key)) {
            ///如果key中含有"."那么将这个字符串以.为分隔符化成为一个字符串的数组，取
            if (StringLib.contains(key, ".")) {
                String[] fieldArr = StringLib.split(key, ".");
                int fieldArrLen = fieldArr.length;
                String lastField = fieldArr[fieldArrLen - 1];


                Document loopDoc = document;
                int i = 0;//表示这个field的深度例如如果一个document的value值还是一个document的话那么将这个深度的变量加一

                int deepLen = fieldArrLen - 1;
                while (i < deepLen) {
                    String field = fieldArr[i];
                    Object value = loopDoc.get(field);
//                    如果任意的一个filed为空那么就直接返回null
                    if (value == null) {
                        return null;
                    }
//                    如果有深度那么就访问下个.后面元素对应的值，使得这个document成为最后一个最后一部分字符串对应的document

                    if (value instanceof Document) {
                        loopDoc = (Document) value;
                        i++;
                    } else {//如果这个元素不是documnet 那么就直接返回null
                        return null;
                    }
                }

                if (loopDoc != null && loopDoc.containsKey(lastField)) {
                    return loopDoc.get(lastField);
                }
            } else {
                return document.get(key);
            }
        }
        return null;
    }

    public static Double getDouble(Document document, String key) {
        return StringLib.toDouble(get(document, key));
    }

//    处理Document 对象

    public static String getString(Document document, String key) {
        return StringLib.toString(get(document, key));
    }

    public static Document getDocument(Document document, String key) {
        Object value = get(document, key);
        if (value != null && value instanceof Document) {
            return (Document) value;
        }
        return newDoc();
    }

    public static Document newDoc() {
        return new Document();
    }

    public static List newList() {
        return Lists.newArrayList();
    }

    public static List newList(Object... o) {
        return Lists.newArrayList(o);
    }

    public static Document newDoc(String key, Object value) {
        Document document = newDoc();
        document.put(key, value);
        return document;
    }

    public static List getList(Document document, String key) {
        Object value = get(document, key);
        if (value != null && value instanceof List) {
            return (List) value;
        }
        return Lists.newArrayList();
    }

    public static void remove(Document document, String... fields) {
        if (fields != null && fields.length > 0) {
            Arrays.stream(fields).forEach(field -> {
                if (document.containsKey(field)) {
                    document.remove(field);
                }
            });
        }
    }

    public static Document new$Set(Document document) {
        return newDoc("$set", document);
    }

    public static Document new$unSet(Document document) {
        return newDoc("$unset", document);
    }

    public static Document new$Set(String key, Object value) {
        return newDoc("$set", newDoc(key, value));
    }

    public static boolean getBoolean(Document document, String key) {
        Object value = get(document, key);
        if (value != null) {
            if (value instanceof String) {
                String strValue = StringLib.lowerCase(StringLib.toString(value));
                if (StringLib.equalsAny(strValue, "true", "1")) {
                    return true;
                }
            } else if (value instanceof Boolean) {
                return (Boolean) value;
            }
        }
        return false;
    }

    public static Document copy(Document document) {
        return new Document(document);
    }

    public static Document bsonToDocument(Bson bson) {
        if (bson != null) {
            if (bson instanceof Document) {
                return (Document) bson;
            } else {
                BsonDocument doc = bson.toBsonDocument(BsonDocument.class, MongoClient.getDefaultCodecRegistry());
                return Document.parse(doc.toJson());
            }

        }
        return null;
    }
}
