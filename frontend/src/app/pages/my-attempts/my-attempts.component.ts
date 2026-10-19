import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExamService } from '../../services/exam.service';

@Component({
  selector: 'app-my-attempts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 class="fw-bold mb-1">My Exam Attempt History</h3>
          <p class="text-muted small mb-0">Track all your competitive exam performances and scores</p>
        </div>
        <a routerLink="/exam" class="btn btn-primary fw-semibold">
          <i class="bi bi-plus-lg me-1"></i> Take New Exam
        </a>
      </div>

      <div class="card border-0 shadow-sm rounded-4" *ngIf="!isLoading">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Date & Time</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th class="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let attempt of attempts">
                  <td class="ps-4">
                    <div class="fw-semibold">{{ attempt.completedAt | date: 'mediumDate' }}</div>
                    <small class="text-muted">{{ attempt.completedAt | date: 'shortTime' }}</small>
                  </td>
                  <td><span class="badge bg-primary">{{ attempt.department }}</span></td>
                  <td><span class="badge bg-info text-dark">{{ attempt.level }}</span></td>
                  <td class="fw-bold fs-6">{{ attempt.score }} / {{ attempt.totalQuestions }}</td>
                  <td>
                    <div class="fw-semibold">{{ attempt.percentage }}%</div>
                  </td>
                  <td>
                    <span
                      class="badge px-3 py-1.5"
                      [ngClass]="attempt.status === 'PASSED' ? 'bg-success' : 'bg-danger'"
                    >
                      {{ attempt.status }}
                    </span>
                  </td>
                  <td class="pe-4 text-end">
                    <a [routerLink]="['/result', attempt._id]" class="btn btn-outline-primary btn-sm">
                      View Report <i class="bi bi-chevron-right ms-1"></i>
                    </a>
                  </td>
                </tr>
                <tr *ngIf="attempts.length === 0">
                  <td colspan="7" class="text-center py-5 text-muted">
                    <i class="bi bi-journal-x fs-1 d-block mb-2"></i>
                    No exam attempts found yet. Click "Take New Exam" to begin.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="text-center py-5" *ngIf="isLoading">
        <div class="spinner-border text-primary"></div>
      </div>
    </div>
  `
})
export class MyAttemptsComponent implements OnInit {
  isLoading = true;
  attempts: any[] = [];

  constructor(
    private examService: ExamService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.examService.getMyAttempts().subscribe({
      next: (res) => {
        this.attempts = res || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading attempts:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
