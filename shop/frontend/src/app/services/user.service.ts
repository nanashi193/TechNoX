import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import { RegisterDTO } from '../dtos/user/register.dto';
import {LoginDTO} from '../dtos/user/login.dto';
import {environment} from "../environments/environment";
import { User } from '../models/user.model';
@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiRegister = `${environment.apiBaseUrl}/users/register`;
    private apiLogin = `${environment.apiBaseUrl}/users/login`;
    private apiVerifyEmail = `${environment.apiBaseUrl}/users/verify-email`;
    private apiResendEmail = `${environment.apiBaseUrl}/users/resend-verification`;
    private apiUserDetails = `${environment.apiBaseUrl}/users`;
    private apiGetMe = `${environment.apiBaseUrl}/users/me`;
    private apiUpdateMe = `${environment.apiBaseUrl}/users/me`;

    private apiConfig = {
        headers: this.createHeaders(),
    }
    constructor(private http : HttpClient) { }
    private createHeaders(): HttpHeaders{
        return new HttpHeaders({
            'Content-Type': 'application/json'
        });
    }
    register(registerDTO: RegisterDTO):Observable<any> {
        return this.http.post(this.apiRegister, registerDTO, this.apiConfig);
    }
    login(loginDTO: LoginDTO): Observable<any> {
        return this.http.post(this.apiLogin, loginDTO, this.apiConfig);
    }
    getUserById(id: string): Observable<User> {
        const url = `${this.apiUserDetails}/${id}`;
        return this.http.get<User>(url);
    }
    //Lay thong tin user dang dang nhap
    getMe(): Observable<User> {
        return this.http.get<User>(this.apiGetMe);
    }
    updateMe(userObject: User): Observable<User> {
        return this.http.put<User>(this.apiUpdateMe, userObject);
    }
}
