package com.cynovan.janus.base.gridfs.eventbus;

import org.bson.Document;
import org.springframework.context.ApplicationEvent;

public class FileUploadEvent extends ApplicationEvent {

    private Document file = null;

    public FileUploadEvent(Object source, Document _file) {
        super(source);
        this.file = _file;
    }

    public Document getFile() {
        return file;
    }

    public void setFile(Document file) {
        this.file = file;
    }
}
