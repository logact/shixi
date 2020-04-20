package com.cynovan.janus.addons.dataservice.dto;

/**
 * Created by Aric on 2016/12/8.
 */
public class TableColumn {
    private String name;
    private String data;
    private boolean query = true;
    private boolean search = false;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public boolean isQuery() {
        return query;
    }

    public void setQuery(boolean query) {
        this.query = query;
    }

    public boolean isSearch() {
        return search;
    }

    public void setSearch(boolean search) {
        this.search = search;
    }
}
