package com.g5.techdevices.techstore.exceptions;

public class DataNotFoundException extends RuntimeException
{
    public DataNotFoundException()
    {
    }
    public DataNotFoundException(String message)
    {
        super(message);
    }
}
