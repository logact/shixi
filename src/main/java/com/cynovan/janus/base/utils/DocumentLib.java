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

    private static Object get(Document document, String key) {
        if (document == null) {
            return null;
        }
        if (StringLib.isNotEmpty(key)) {
            if (StringLib.contains(key, ".")) {
                String[] fieldArr = StringLib.split(key, ".");
                int fieldArrLen = fieldArr.length;
                String lastField = fieldArr[fieldArrLen - 1];


                Document loopDoc = document;
                int i = 0;

                int deepLen = fieldArrLen - 1;
                while (i < deepLen) {
                    String field = fieldArr[i];
                    Object value = loopDoc.get(field);
                    if (value == null) {
                        return null;
                    }
                    if (value instanceof Document) {
                        loopDoc = (Document) value;
                        i++;
                    } else {
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
