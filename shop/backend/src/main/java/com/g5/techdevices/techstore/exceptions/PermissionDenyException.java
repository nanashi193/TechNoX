package com.g5.techdevices.techstore.exceptions;

public class PermissionDenyException extends RuntimeException {
    public PermissionDenyException()
    {
    }
    public PermissionDenyException(String message)
    {
        super(message);
    }
}
