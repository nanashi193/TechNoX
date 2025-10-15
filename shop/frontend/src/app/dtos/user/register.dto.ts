import {
    IsString,
    IsNotEmpty,
    IsPhoneNumber,
    IsDate, IsBoolean, IsEmail
} from 'class-validator';

export class RegisterDTO {
    @IsString()
    FullName: string;

    @IsBoolean()
    @IsNotEmpty()
    Gender: boolean;

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsPhoneNumber()
    PhoneNumber: string;



    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    RepeatPassword: string;

    FacebookAccountId: number = 0;
    GoogleAccountId: number = 0;
    RoleId: number = 3;
    constructor(data: any) {
        this.FullName = data.FullName;
        this.Gender = data.Gender;
        this.email = data.email;
        this.PhoneNumber = data.PhoneNumber;
        this.password = data.password;
        this.RepeatPassword = data.RepeatPassword;
        this.FacebookAccountId = data.FacebookAccountId || 0;
        this.GoogleAccountId = data.GoogleAccountId || 0;
        this.RoleId = data.RoleId || 3;
    }
}