import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  //private apiUrl = 'http://localhost:5050/api/admin';
  //public apiUrl: string = (window as any).runtimeConfig?.apiUrl || 'http://localhost:5050/api/admin';
  public apiUrl: string = `${(window as any).runtimeConfig?.apiUrl || '/api'}/admin`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers: this.getAuthHeaders() });
  }

  getAllAttempts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/attempts`, { headers: this.getAuthHeaders() });
  }

  downloadExcelTemplate(department: string = 'I&C'): Observable<Blob> {
    const token = this.authService.getToken();
    const encodedDept = encodeURIComponent(department);
    return this.http.get(`${this.apiUrl}/template/excel?department=${encodedDept}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      responseType: 'blob',
    });
  }

  downloadWordTemplate(department: string = 'I&C'): Observable<Blob> {
    const token = this.authService.getToken();
    const encodedDept = encodeURIComponent(department);
    return this.http.get(`${this.apiUrl}/template/word?department=${encodedDept}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      responseType: 'blob',
    });
  }

  exportQuestionsData(department: string = 'I&C'): Observable<Blob> {
    const token = this.authService.getToken();
    const encodedDept = encodeURIComponent(department);
    return this.http.get(`${this.apiUrl}/export-questions?department=${encodedDept}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      responseType: 'blob',
    });
  }

  uploadTemplateFile(file: File, department: string, mode: 'REPLACE' | 'APPEND' = 'REPLACE'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', department);
    formData.append('mode', mode);

    return this.http.post<any>(`${this.apiUrl}/upload-template`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employees`, { headers: this.getAuthHeaders() });
  }

  createEmployee(employeeData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/employees`, employeeData, {
      headers: this.getAuthHeaders(),
    });
  }

  updateEmployee(id: string, employeeData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/employees/${id}`, employeeData, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/employees/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  downloadEmployeeTemplate(): Observable<Blob> {
    const token = this.authService.getToken();
    return this.http.get(`${this.apiUrl}/employees/template`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      responseType: 'blob',
    });
  }

  uploadEmployeeExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/employees/bulk-upload`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  getExamAccessList(department?: string, status?: string, search?: string): Observable<any[]> {
    let params: string[] = [];
    if (department) params.push(`department=${encodeURIComponent(department)}`);
    if (status && status !== 'ALL') params.push(`status=${encodeURIComponent(status)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    const qs = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/exam-access${qs}`, {
      headers: this.getAuthHeaders(),
    });
  }

  enableExamLinks(employeeIds: string[], remark?: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/exam-access/enable`,
      { employeeIds, remark },
      { headers: this.getAuthHeaders() }
    );
  }

  grantReattempt(employeeId: string | string[], remark?: string): Observable<any> {
    const body: any = Array.isArray(employeeId)
      ? { employeeIds: employeeId, remark }
      : { employeeId, remark };
    return this.http.post<any>(
      `${this.apiUrl}/exam-access/grant-reattempt`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  revokeExamLink(employeeId: string | string[]): Observable<any> {
    const body: any = Array.isArray(employeeId)
      ? { employeeIds: employeeId }
      : { employeeId };
    return this.http.post<any>(
      `${this.apiUrl}/exam-access/revoke`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }
}
