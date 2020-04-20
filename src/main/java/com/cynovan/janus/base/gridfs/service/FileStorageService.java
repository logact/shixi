package com.cynovan.janus.base.gridfs.service;

import com.cynovan.janus.base.config.bean.InitializeWeb;
import com.cynovan.janus.base.gridfs.jdo.QFileInfo;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

/**
 * @author ian.lan@cynovan.com
 */
@Service
public class FileStorageService {

    @Autowired
    GridFsTemplate gridFsTemplate;

    @Autowired
    MongoTemplate mongoTemplate;

    private GridFSBucket gridFSBucket = null;

    /**
     * 根据上传文件，计算 md5, 存在 gridfs 中
     * <p>
     * 将 md5, fildId 存在 fileInfo 中
     *
     * @param file 上传的文件
     * @param tags 文件 tag
     * @return 返回文件的 md5 与 fileId
     * <p>
     * Aric.chen 每次都要保存新的FileInfo，而文件只保存一份,FileInfo是为了让用户查找上传的数据，是存储多份的，里面有create_date
     */
    public ObjectNode storeFile(MultipartFile file, String tags) {
        try {
            return storeFile(file.getInputStream(), file.getOriginalFilename(), tags);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    public ObjectNode storeFile(InputStream inputStream, String fileName, String tags) {
        try {
            ObjectNode result = JsonLib.createObjNode();

            fileName = StringUtils.cleanPath(fileName);

            /*检查文件是否在文件服务器存在，使用md5验证*/
//            String md5 = DigestLib.md5Hex(IOUtils.toByteArray(inputStream));
            inputStream.mark(Integer.MAX_VALUE);
            String md5 = DigestUtils.md5Hex(inputStream);
            inputStream.reset();


            GridFSFile storedFile = gridFsTemplate.findOne(Query.query(Criteria.where("md5").is(md5)));
            if (storedFile == null) {
                /*如果不存在，则存储在DB中*/
                String fileType = FilenameUtils.getExtension(fileName);
                Document metadata = DocumentLib.newDoc();
                metadata.put("type", fileType);
                gridFsTemplate.store(inputStream, fileName, metadata);
                storedFile = gridFsTemplate.findOne(Query.query(Criteria.where("md5").is(md5)));
            }

            List<String> tagList = Lists.newArrayList();
            if (StringLib.isNotEmpty(tags)) {
                tags = StringLib.replaceAll(tags, "，", ",");
                tagList = Arrays.asList(StringLib.split(tags, ","));
            }

            /*创建文件对应的FileInfo，此处只是存储对应关系*/
            Document fileInfo = createFileInfo(storedFile, fileName, tagList);

            result.put("fileId", DocumentLib.getString(fileInfo, "fileId"));
            result.put("fileInfoId", DocumentLib.getID(fileInfo));
            result.put("md5", DocumentLib.getString(fileInfo, "md5"));
            result.put("name", fileName);
            result.put("size", inputStream.available());
            return result;
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    public byte[] getGridFsByteArray(String fileId) {
        GridFSFile file = fetchFile(fileId);
        return getGridFsByteArray(file);
    }

    public byte[] getGridFsByteArray(GridFSFile file) {
        try {
            if (file == null) {
                return null;
            }
            GridFsResource gridFsResource = new GridFsResource(file, getGridFs().openDownloadStream(file.getObjectId()));
            return IOUtils.toByteArray(gridFsResource.getInputStream());
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    public void download(GridFSFile file, HttpServletResponse response) throws IOException {
        if (file != null) {
            String contentType = getFileContentType(file);
            response.addHeader("Cache-Control", "max-age=" + InitializeWeb.expireSecond);
            response.addHeader("Accept-Ranges", "bytes");
            response.setDateHeader("Expires", InitializeWeb.expiredDate);
            response.setContentType(contentType);
            FilenameUtil.setFilenameHeader(response, file.getFilename());

            byte[] by = getGridFsByteArray(file);
            int fileLength = by.length;
            response.setContentLength(fileLength);
            response.addHeader("Accept-Ranges", "bytes");
            response.addHeader("Content-Range", "bytes 0-" + fileLength + "/" + fileLength);
            response.addHeader("Content-Type", "application/octet-stream; charset=UTF-8");
            OutputStream out = response.getOutputStream();
            IOUtils.write(by, out);
            out.flush();
            out.close();
        }
    }

    private static final Pattern IMAGE_PATTERN = Pattern.compile("([\\s\\S]+\\.(?i)(jpg|png|gif|bmp))$");

    private String getFileContentType(GridFSFile file) {
        String contentType = DocumentLib.getString(file.getMetadata(), "type");
        if (StringLib.isEmpty(contentType)) {
            if (IMAGE_PATTERN.matcher(file.getFilename()).matches()) {
                contentType = MediaType.IMAGE_PNG_VALUE;
            }
        }
        if (StringLib.isEmpty(contentType)) {
            contentType = "application/octet-stream";
        }
        return contentType;
    }

    private GridFSBucket getGridFs() {
        if (gridFSBucket == null) {
            MongoDatabase database = DBUtils.getDatabase();
            gridFSBucket = GridFSBuckets.create(database);
        }
        return gridFSBucket;
    }

    /**
     * 根据 key 搜索在 fileInfo 对应的文件
     *
     * @param key
     * @return 文件列表
     */
    public List<Document> listFile(String key) {
        key = StringLib.replaceAll(key, "，", ",");

        String[] keywordList = StringLib.split(key, ",");

        List<Document> orList = Lists.newArrayList();
        if (keywordList.length > 1) {
            Document nameQuery = DocumentLib.newDoc("name", DocumentLib.newDoc("$in", keywordList));
            Document tagQuery = DocumentLib.newDoc("tags", DocumentLib.newDoc("$in", keywordList));
            orList.add(nameQuery);
            orList.add(tagQuery);
        } else {
            Document nameQuery = DocumentLib.newDoc("name", keywordList[0]);
            Document tagQuery = DocumentLib.newDoc("tags", keywordList[0]);
            orList.add(nameQuery);
            orList.add(tagQuery);
        }

        List<Document> fileList = DBUtils.list(QFileInfo.collectionName, DocumentLib.newDoc("$or", orList), null,
                DocumentLib.newDoc("create_date", -1), 10);

        return fileList;
    }


    /**
     * 根据 fileId 读取文件
     *
     * @param fileId
     * @return
     */
    public GridFSFile fetchFile(String fileId) {
        return gridFsTemplate.findOne(Query.query(Criteria.where("_id").is(new ObjectId(fileId))));
    }

    /**
     * 根据 md5 读取文件
     *
     * @param md5
     * @return
     */
    public GridFSFile fetchFileByMd5(String md5) {
        return gridFsTemplate.findOne(buildQuery("md5", md5));
    }

    private static Query buildQuery(String field, String value) {
        return Query.query(Criteria.where(field).is(value));
    }

    private Document createFileInfo(GridFSFile file, String fileName, List<String> tagList) {
        Document fileInfo = DocumentLib.newDoc();
        fileInfo.put("fileId", file.getObjectId().toString());
        fileInfo.put("md5", file.getMD5());
        fileInfo.put("name", Lists.newArrayList(fileName));
        fileInfo.put("tags", tagList);
        fileInfo.put("create_date", new Date());
        fileInfo.put("size", file.getLength());
        DBUtils.save(QFileInfo.collectionName, fileInfo);
        return fileInfo;
    }
}
