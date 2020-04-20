package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import com.mongodb.client.*;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;
import java.util.Set;

public class DBUtils {

    public static MongoCollection<Document> getCollection(String collectionName) {
        collectionName = StringLib.uncapitalize(collectionName);
        MongoTemplate template = SpringContext.getBean(MongoTemplate.class);
        return template.getCollection(collectionName);
    }

    public static void createIndex(String collectionName, Document index) {
        createIndex(collectionName, index, false);
    }

    public static void createIndex(String collectionName, Document index, boolean background) {
        DBUtils.getCollection(collectionName).createIndex(index, new IndexOptions().background(background));
    }

    public static MongoDatabase getDatabase() {
        MongoTemplate template = SpringContext.getBean(MongoTemplate.class);
        return template.getDb();
    }

    public static long count(String collectionName) {
        return count(collectionName, null);
    }


    public static long count(String collectionName, Bson filter) {
        filter = processIdFilter(filter);
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        return mongoCollection.count(filter);
    }

    public static List<Document> aggregate(String collectionName, List<Document> pipeline) {
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        AggregateIterable<Document> aggregateIterable = mongoCollection.aggregate(pipeline);
        aggregateIterable = aggregateIterable.allowDiskUse(true);
        MongoCursor<Document> mongoCursor = aggregateIterable.iterator();

        List<Document> list = Lists.newArrayList();
        while (mongoCursor.hasNext()) {
            Document document = mongoCursor.next();
            processObjectId(document);
            list.add(document);
        }
        return list;
    }

    private static void processObjectId(Document document) {
        if (document != null) {
            Set<String> keys = Sets.newHashSet(document.keySet());
            keys.stream().forEach(key -> {
                Object value = document.get(key);
                if (value instanceof ObjectId) {
                    String idValue = value.toString();
                    document.put(key, idValue);
                }
            });
        }
    }


    public static void drop(String collectionName) {
        MongoCollection mongoCollection = DBUtils.getCollection(collectionName);
        mongoCollection.drop();
    }

    public static Document findByID(String collectionName, String id) {
        return find(collectionName, Filters.eq("_id", new ObjectId(id)));
    }

    public static Document find(String collectionName, Bson filter) {
        return find(collectionName, filter, null);
    }

    public static Document find(String collectionName, Bson filter, Bson projection) {
        return find(collectionName, filter, projection, null);
    }

    public static Document find(String collectionName, Bson filter, Bson projection, Bson sort) {
        return find(collectionName, filter, projection, sort, 0);
    }

    public static Document find(String collectionName, Bson filter, Bson projection, Bson sort, int skip) {
        List<Document> list = list(collectionName, filter, projection, sort, 1, skip);
        if (CollectionUtils.isNotEmpty(list)) {
            return list.get(0);
        }
        return null;
    }

    public static void insertMany(String collectionName, List<Document> list) {
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        if (CollectionUtils.isNotEmpty(list)) {
            mongoCollection.insertMany(list);
        }
    }

    public static void insert(String collectionName, Document document) {
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        mongoCollection.insertOne(document);
    }

    public static void save(String collectionName, Document document) {
        EntityLib.deserializeID(document);
        ObjectId objectId = DocumentLib.getObjectId(document);
        if (objectId != null) {
            /*调用Update的方法*/
            DocumentLib.remove(document, "_id", "id");
            UpdateResult updateResult = DBUtils.updateOne(collectionName, DocumentLib.newDoc("_id", objectId), DocumentLib.new$Set(document));
            document.put("id", objectId.toString());
        } else {
            /*调用Insert的方法*/
            DBUtils.insert(collectionName, document);
            EntityLib.serializeID(document);
        }
    }

    public static UpdateResult updateMany(String collectionName, Bson filter, Bson update) {
        return updateMany(collectionName, filter, update, false);
    }

    public static UpdateResult updateMany(String collectionName, Bson filter, Bson update, boolean upsert) {
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        filter = processIdFilter(filter);
        UpdateResult updateResult = mongoCollection.updateMany(filter, update, new UpdateOptions().upsert(upsert));
        return updateResult;
    }

    public static UpdateResult updateOne(String collectionName, Bson filter, Bson update) {
        return updateOne(collectionName, filter, update, false);
    }

    public static UpdateResult updateOne(String collectionName, Bson filter, Bson update, boolean upsert) {
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        /*check id operation*/
        filter = processIdFilter(filter);
        if (update instanceof Document) {
            Document updateDoc = (Document) update;
            DocumentLib.remove(updateDoc, "id");
            if (updateDoc.containsKey("$set")) {
                DocumentLib.remove(DocumentLib.getDocument(updateDoc, "$set"), "_id", "id");
            }
        }
        UpdateResult updateResult = mongoCollection.updateOne(filter, update, new UpdateOptions().upsert(upsert));
        return updateResult;
    }

    public static DeleteResult deleteOne(String collectionName, Bson filter) {
        filter = processIdFilter(filter);
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        DeleteResult deleteResult = mongoCollection.deleteOne(filter);
        return deleteResult;
    }

    public static DeleteResult deleteMany(String collectionName, Bson filter) {
        filter = processIdFilter(filter);
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        DeleteResult deleteResult = mongoCollection.deleteMany(filter);
        return deleteResult;
    }

    public static List<Document> list(String collectionName) {
        return list(collectionName, null);
    }

    public static List<Document> list(String collectionName, Bson filter) {
        return list(collectionName, filter, null);
    }

    public static List<Document> list(String collectionName, Bson filter, Bson projection) {
        return list(collectionName, filter, projection, null);
    }

    public static List<Document> list(String collectionName, Bson filter, Bson projection, Bson sort) {
        return list(collectionName, filter, projection, sort, 0);
    }

    public static List<Document> list(String collectionName, Bson filter, Bson projection, Bson sort, int limit) {
        return list(collectionName, filter, projection, sort, limit, 0);
    }

    public static List<Document> list(String collectionName, Bson filter, Bson projection, Bson sort, int limit, int skip) {
        MongoCollection<Document> mongoCollection = DBUtils.getCollection(collectionName);
        FindIterable<Document> findIterable = mongoCollection.find();
        if (filter != null) {
            filter = processIdFilter(filter);
            EntityLib.deserializeID(filter);
            findIterable = findIterable.filter(filter);
        }
        if (projection != null) {
            findIterable = findIterable.projection(projection);
        }
        if (sort != null) {
            findIterable = findIterable.sort(sort);
        }
        if (limit > 0) {
            findIterable = findIterable.limit(limit);
        }
        if (skip > 0) {
            findIterable = findIterable.skip(skip);
        }
        List<Document> list = Lists.newArrayList();
        MongoCursor<Document> mongoCursor = findIterable.iterator();
        while (mongoCursor.hasNext()) {
            Document document = mongoCursor.next();
            EntityLib.serializeID(document);
            list.add(document);
        }
        return list;
    }

    private static Bson processIdFilter(Bson bson) {
        if (bson != null) {
            Document doc = DocumentLib.bsonToDocument(bson);
            Object idValue = null;
            if (doc.containsKey("id")) {
                idValue = doc.get("id");
            } else if (doc.containsKey("_id")) {
                idValue = doc.get("_id");
            }
            if (idValue != null) {
                DocumentLib.remove(doc, "id", "_id");
                ObjectId objectIdValue = null;
                if (idValue instanceof ObjectId) {
                    objectIdValue = (ObjectId) idValue;
                } else if (idValue instanceof String) {
                    objectIdValue = new ObjectId(StringLib.toString(idValue));
                }
                if (objectIdValue != null) {
                    doc.put("_id", objectIdValue);
                }
            }
            return doc;
        }
        return bson;
    }

    public static Document runCommand(Bson command) {
        return getDatabase().runCommand(command);
    }
}
