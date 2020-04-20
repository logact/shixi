package com.cynovan.janus.base.utils;

import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.slf4j.LoggerFactory;

/**
 * Created by Aric on 2016/11/15.
 */
public class EntityLib {

    protected static org.slf4j.Logger logger = LoggerFactory.getLogger(EntityLib.class);

    public static Document serializeID(Document document) {
        if (document != null) {
            String id = DocumentLib.getID(document);
            if (StringLib.isNotEmpty(id)) {
                document.remove("_id");
                document.put("id", id);
            }
        }
        return document;
    }

    public static Document deserializeID(Bson bson) {
        if (bson != null && bson instanceof Document) {
            Document document = (Document) bson;
            Object id = null;
            if (document.containsKey("id")) {
                id = document.get("id");
                document.remove("id");
            } else if (document.containsKey("_id")) {
                id = document.get("_id");
            }
            if (id != null && id instanceof String) {
                ObjectId objId = new ObjectId(StringLib.toString(id));
                document.put("_id", objId);
            }
            return document;
        }
        return null;
    }

    public static boolean isNew(Document Document) {
        if (Document == null) {
            return true;
        }
        String id = Document.getString("id");
        return isNew(id);
    }

    public static boolean isNew(String id) {
        return !StringLib.isNotEmpty(id);
    }

    public static Document newIDQuery(String id) {
        Document query = new Document();
        query.put("_id", new ObjectId(id));
        return query;
    }
}
