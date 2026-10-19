import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ClientQuestion {
  questionId: string;
  sequence: number;
  questionType?: 'MCQ' | 'MULTIPLE' | 'FILL_BLANK';
  imageUrl?: string;
  questionText: string;
  difficulty: 'EASY' | 'MODERATE' | 'TOUGH';
  department: string;
  options: string[];
  optionMapping: number[];
}

export interface StartExamResponse {
  department: string;
  level: string;
  totalQuestions: number;
  quota: { easy: number; moderate: number; tough: number };
  questions: ClientQuestion[];
}

export interface ExamSubmissionPayload {
  answers: {
    questionId: string;
    selectedOptionIndex?: number | null;
    selectedOptionIndices?: number[];
    selectedTextAnswer?: string;
    optionMapping: number[];
  }[];
}

export interface ExamResultResponse {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  status: 'PASSED' | 'FAILED';
  breakdown: {
    easyTotal: number;
    easyCorrect: number;
    moderateTotal: number;
    moderateCorrect: number;
    toughTotal: number;
    toughCorrect: number;
  };
  completedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private apiUrl = 'http://localhost:5050/api/exam';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  startExam(): Observable<StartExamResponse> {
    return this.http.get<StartExamResponse>(`${this.apiUrl}/start`, {
      headers: this.getAuthHeaders(),
    });
  }

  submitExam(payload: ExamSubmissionPayload): Observable<ExamResultResponse> {
    return this.http.post<ExamResultResponse>(`${this.apiUrl}/submit`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  getMyAttempts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-attempts`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAttemptDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/attempts/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
