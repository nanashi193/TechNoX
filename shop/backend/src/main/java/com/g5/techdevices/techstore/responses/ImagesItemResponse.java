package com.g5.techdevices.techstore.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor

public class ImagesItemResponse {
    private Integer id;     // id ảnh trong DB
    private String url;     // imageUrl
}
