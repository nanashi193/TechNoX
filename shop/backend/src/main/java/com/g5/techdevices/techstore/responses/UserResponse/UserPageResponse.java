package com.g5.techdevices.techstore.responses.UserResponse;

import java.util.List;

public class UserPageResponse<T> {
    private List<T> items;
    private long total;
    // (Thêm getters/setters)
    public List<T> getItems() { return items; }
    public void setItems(List<T> items) { this.items = items; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
}
