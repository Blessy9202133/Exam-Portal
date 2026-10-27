import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface ExamAccessInfo {
  isLinkActive: boolean;
  accessCode?: string;
  attemptsAllowed: number;
  attemptsUsed: number;
  status: 'NOT_ASSIGNED' | 'LINK_ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
  computedStatus?: string;
  linkGeneratedAt?: string;
  lastAttemptAt?: string;
  adminRemark?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  level: string;
  role: 'EMPLOYEE' | 'ADMIN';
  examAccess?: ExamAccessInfo;
}

export interface LoginResponse {
  token: string;
  employee: Employee;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //private apiUrl = 'http://localhost:5050/api/auth';
  //public apiUrl: string = (window as any).runtimeConfig?.apiUrl || 'http://localhost:5050/api/auth';
  public apiUrl: string = `${(window as any).runtimeConfig?.apiUrl || '/api'}/auth`;
  
  private currentEmployeeSubject = new BehaviorSubject<Employee | null>(this.getStoredEmployee());
  public currentEmployee$ = this.currentEmployeeSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: { employeeId: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('employee', JSON.stringify(res.employee));
        this.currentEmployeeSubject.next(res.employee);
      })
    );
  }

  refreshProfile(): Observable<Employee> {
    const token = this.getToken();
    return this.http.get<Employee>(`${this.apiUrl}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap((emp) => {
        if (emp) {
          const current = this.getStoredEmployee() || {};
          const updated = { ...current, ...emp };
          localStorage.setItem('employee', JSON.stringify(updated));
          this.currentEmployeeSubject.next(updated as Employee);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    this.currentEmployeeSubject.next(null);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      return null;
    }
    return token;
  }

  getStoredEmployee(): Employee | null {
    const data = localStorage.getItem('employee');
    if (!data || data === 'null' || data === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getStoredEmployee();
  }

  isAdmin(): boolean {
    const emp = this.getStoredEmployee();
    return emp?.role === 'ADMIN';
  }
}
