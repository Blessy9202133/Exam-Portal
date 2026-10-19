import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService } from '../../services/exam.service';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4" *ngIf="!isLoading && attempt">
      <!-- Executive Scorecard Banner -->
      <div
        class="card text-white py-3.5 px-4 rounded-4 shadow-sm mb-3 border-0"
        [ngClass]="attempt.status === 'PASSED' ? 'bg-gradient-success' : 'bg-gradient-danger'"
      >
        <div class="row align-items-center g-2">
          <div class="col-lg-8">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-white text-dark px-2.5 py-1 fw-bold fs-7 shadow-xs">
                <i class="bi bi-award-fill me-1 text-warning"></i> ASSESSMENT SCORECARD
              </span>
              <span
                class="badge px-2.5 py-1 fw-bold fs-7 shadow-xs"
                [ngClass]="attempt.status === 'PASSED' ? 'bg-success text-white' : 'bg-danger text-white'"
              >
                <i class="bi" [ngClass]="attempt.status === 'PASSED' ? 'bi-check-circle-fill me-1' : 'bi-x-circle-fill me-1'"></i>
                {{ attempt.status === 'PASSED' ? 'PASSED' : 'NEEDS IMPROVEMENT' }}
              </span>
            </div>

            <h4 class="fw-bold mb-1 fs-3">
              {{ attempt.status === 'PASSED' ? 'Congratulations! Assessment Passed' : 'Assessment Completed' }}
            </h4>

            <small class="opacity-90 small">
              Employee: <strong>{{ attempt.employeeName }}</strong> ({{ attempt.employeeId }}) &nbsp;|&nbsp;
              Department: <strong>{{ attempt.department }}</strong> &nbsp;|&nbsp;
              Level: <strong>{{ attempt.level }}</strong>
            </small>
          </div>

          <div class="col-lg-4 text-lg-end mt-2 mt-lg-0">
            <div class="bg-black bg-opacity-25 py-2 px-4 rounded-3 d-inline-block text-center shadow-xs border border-white border-opacity-25">
              <div class="fs-2 fw-bold mb-0 font-monospace lh-1">{{ attempt.score }} / {{ attempt.totalQuestions }}</div>
              <small class="fw-semibold opacity-90 small d-block">{{ attempt.percentage }}% Overall Score</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Summary Stat Cards Bar -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-secondary">
            <small class="text-muted fw-semibold text-uppercase small mb-1">Total Questions</small>
            <div class="fs-2 fw-bold text-dark font-monospace">{{ attempt.totalQuestions }}</div>
            <small class="text-muted fs-7">total exam set</small>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-primary">
            <small class="text-muted fw-semibold text-uppercase small mb-1">Total Attempted</small>
            <div class="fs-2 fw-bold text-primary font-monospace">{{ countAttempted() }}</div>
            <small class="text-muted fs-7">questions answered</small>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-warning">
            <small class="text-muted fw-semibold text-uppercase small mb-1">Unattempted</small>
            <div class="fs-2 fw-bold text-warning-emphasis font-monospace">{{ countUnattempted() }}</div>
            <small class="text-muted fs-7">questions skipped</small>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-success">
            <small class="text-muted fw-semibold text-uppercase small mb-1">Score Obtained</small>
            <div class="fs-2 fw-bold text-success font-monospace">{{ attempt.score }}</div>
            <small class="text-muted fs-7">correct answers</small>
          </div>
        </div>
      </div>

      <!-- Action Buttons Header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div class="d-flex gap-2">
          <a routerLink="/dashboard" class="btn btn-primary btn-sm px-3.5 py-2 fw-bold shadow-xs rounded-3">
            <i class="bi bi-house-door me-1"></i> Back to Dashboard
          </a>
          <a routerLink="/my-attempts" class="btn btn-outline-secondary btn-sm px-3.5 py-2 fw-bold rounded-3">
            <i class="bi bi-clock-history me-1"></i> View All Attempts History
          </a>
        </div>
      </div>

      <!-- Detailed Question Answer Review Section -->
      <div class="card border-0 shadow-sm rounded-4 mb-5">
        <div class="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h5 class="fw-bold mb-1 text-dark">
              <i class="bi bi-list-check me-2 text-primary"></i> Question Answer Review
            </h5>
            <p class="text-muted small mb-0">
              Select a view filter below to review your answers.
            </p>
          </div>

          <!-- Filter Pills Bar -->
          <div class="btn-group p-1 bg-light rounded-3 border">
            <button
              type="button"
              class="btn btn-sm fw-bold px-3 py-1.5 rounded-2"
              [ngClass]="activeFilter === 'WRONG_UNATTEMPTED' ? 'btn-danger text-white shadow-xs' : 'btn-light text-secondary border-0'"
              (click)="activeFilter = 'WRONG_UNATTEMPTED'"
            >
              <i class="bi bi-exclamation-octagon-fill me-1"></i>
              Wrong & Unattempted ({{ countWrongAndUnattempted() }})
            </button>
            <button
              type="button"
              class="btn btn-sm fw-bold px-3 py-1.5 rounded-2"
              [ngClass]="activeFilter === 'ATTEMPTED' ? 'btn-primary text-white shadow-xs' : 'btn-light text-secondary border-0'"
              (click)="activeFilter = 'ATTEMPTED'"
            >
              <i class="bi bi-pencil-square me-1"></i>
              Total Attempted Questions ({{ countAttempted() }})
            </button>
          </div>
        </div>

        <div class="card-body p-4">
          <!-- Empty State when no questions match filter -->
          <div *ngIf="filteredAnswers.length === 0" class="text-center py-5">
            <i class="bi bi-patch-check-fill text-success display-3 mb-3 d-block"></i>
            <h5 class="fw-bold text-dark">No Questions in This View</h5>
            <p class="text-muted small mb-0" *ngIf="activeFilter === 'WRONG_UNATTEMPTED'">
              Excellent! You got 100% correct answers with zero wrong or unattempted questions.
            </p>
            <p class="text-muted small mb-0" *ngIf="activeFilter === 'ATTEMPTED'">
              No questions were attempted in this exam attempt.
            </p>
          </div>

          <!-- Question Cards Container -->
          <div class="d-flex flex-column gap-4" *ngIf="filteredAnswers.length > 0">
            <div
              *ngFor="let q of filteredAnswers"
              class="p-4 border rounded-4 bg-white shadow-xs"
              [ngClass]="{
                'border-start border-4 border-danger': !q.isCorrect && !isUnattempted(q),
                'border-start border-4 border-warning': !q.isCorrect && isUnattempted(q),
                'border-start border-4 border-success': q.isCorrect
              }"
            >
              <!-- Question Header Row -->
              <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <span class="fw-bold text-dark fs-6">Question {{ getQuestionNumber(q) }} of {{ attempt.answers?.length }}</span>
                <div class="d-flex align-items-center gap-2">
                  <span
                    class="badge px-2.5 py-1.5 fw-bold fs-7"
                    [ngClass]="{
                      'bg-success bg-opacity-10 text-success border border-success border-opacity-25': q.difficulty === 'EASY',
                      'bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25': q.difficulty === 'MODERATE',
                      'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25': q.difficulty === 'TOUGH'
                    }"
                  >
                    {{ q.difficulty }}
                  </span>

                  <span
                    class="badge px-3 py-1.5 fw-bold fs-7"
                    [ngClass]="{
                      'bg-success text-white': q.isCorrect,
                      'bg-warning text-dark': !q.isCorrect && isUnattempted(q),
                      'bg-danger text-white': !q.isCorrect && !isUnattempted(q)
                    }"
                  >
                    <i
                      class="bi"
                      [ngClass]="{
                        'bi-check-circle-fill me-1': q.isCorrect,
                        'bi-dash-circle-fill me-1': !q.isCorrect && isUnattempted(q),
                        'bi-x-circle-fill me-1': !q.isCorrect && !isUnattempted(q)
                      }"
                    ></i>
                    {{ q.isCorrect ? 'CORRECT' : (isUnattempted(q) ? 'NOT ATTEMPTED' : 'INCORRECT') }}
                  </span>
                </div>
              </div>

              <!-- Question Text -->
              <h6 class="fw-bold text-dark mb-3 lead fs-6" style="line-height: 1.6;">
                {{ q.questionText }}
              </h6>

              <!-- Image Diagram (if present) -->
              <div class="mb-4 text-center p-3 bg-light rounded-3 border" *ngIf="q.imageUrl">
                <img [src]="q.imageUrl" class="img-fluid rounded-3 shadow-xs" style="max-height: 320px; object-fit: contain;" alt="Question Diagram" />
              </div>

              <!-- Options Grid (for MCQ and MULTIPLE) -->
              <div class="row g-3 mb-2" *ngIf="(!q.questionType || q.questionType !== 'FILL_BLANK') && q.options">
                <div
                  *ngFor="let opt of q.options; let optIdx = index"
                  class="col-md-6"
                >
                  <div
                    class="p-3 border rounded-3 d-flex align-items-center justify-content-between h-100 transition-all"
                    [ngClass]="{
                      'bg-success-subtle text-success-emphasis border-success border-2 fw-bold shadow-sm': isOptionCorrect(q, optIdx),
                      'bg-danger-subtle text-danger-emphasis border-danger border-2 fw-semibold shadow-sm': isOptionSelected(q, optIdx) && !isOptionCorrect(q, optIdx),
                      'bg-light text-dark border': !isOptionCorrect(q, optIdx) && !isOptionSelected(q, optIdx)
                    }"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <span
                        class="rounded-circle border d-inline-flex align-items-center justify-content-center fw-bold small"
                        style="width: 28px; height: 28px; min-width: 28px;"
                        [ngClass]="{
                          'bg-success text-white border-success': isOptionCorrect(q, optIdx),
                          'bg-danger text-white border-danger': isOptionSelected(q, optIdx) && !isOptionCorrect(q, optIdx),
                          'bg-white text-secondary': !isOptionCorrect(q, optIdx) && !isOptionSelected(q, optIdx)
                        }"
                      >
                        {{ getOptionLabel(optIdx) }}
                      </span>
                      <span class="fs-6 text-dark">{{ opt }}</span>
                    </div>

                    <div>
                      <span *ngIf="isOptionCorrect(q, optIdx)" class="badge bg-success text-white ms-1 px-2.5 py-1.5 fw-bold">
                        <i class="bi bi-check-lg me-1"></i> Correct
                      </span>
                      <span *ngIf="isOptionSelected(q, optIdx)" class="badge bg-primary text-white ms-1 px-2.5 py-1.5 fw-bold">
                        <i class="bi bi-person-check me-1"></i> Your Choice
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fill in the Blank Scorecard View -->
              <div class="p-3 bg-light rounded-3 border mb-2" *ngIf="q.questionType === 'FILL_BLANK'">
                <div class="mb-2">
                  <strong class="text-muted small">Your Submitted Answer: </strong>
                  <span class="fs-6 ms-2 fw-bold" [ngClass]="q.isCorrect ? 'text-success' : 'text-danger'">
                    {{ q.selectedTextAnswer || '(Not Attempted)' }}
                  </span>
                </div>
                <div>
                  <strong class="text-muted small">Correct Answer: </strong>
                  <span class="fs-6 ms-2 text-success fw-bold">{{ q.correctTextAnswer }}</span>
                </div>
              </div>

              <!-- Explanation Box -->
              <div *ngIf="q.explanation" class="small text-dark bg-info bg-opacity-10 p-3 border border-info border-opacity-25 rounded-3 mt-3">
                <i class="bi bi-lightbulb-fill text-warning me-1 fs-6"></i>
                <strong class="text-primary">Explanation:</strong> {{ q.explanation }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div class="container text-center py-5" *ngIf="!isLoading && !attempt">
      <div class="card border-0 shadow-sm p-5 rounded-4 max-w-500 mx-auto">
        <i class="bi bi-exclamation-triangle-fill text-warning display-1 mb-3"></i>
        <h4 class="fw-bold text-dark">Result Details Unavailable</h4>
        <p class="text-muted mb-4">
          Unable to retrieve the exam attempt details. Please return to your Dashboard or view your Score History.
        </p>
        <div class="d-flex justify-content-center gap-3">
          <a routerLink="/dashboard" class="btn btn-primary px-4 fw-bold">
            <i class="bi bi-house-door me-1"></i> Back to Dashboard
          </a>
          <a routerLink="/my-attempts" class="btn btn-outline-secondary px-4 fw-bold">
            <i class="bi bi-clock-history me-1"></i> Score History
          </a>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="container text-center py-5" *ngIf="isLoading">
      <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
      <h5 class="fw-bold">Loading Exam Results...</h5>
    </div>
  `,
  styles: [`
    .max-w-500 {
      max-width: 500px;
    }
    .fs-7 {
      font-size: 0.8rem;
    }
    .bg-gradient-success {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    }
    .bg-gradient-danger {
      background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
    }
  `]
})
export class ResultComponent implements OnInit {
  isLoading = true;
  attempt: any = null;
  activeFilter: 'WRONG_UNATTEMPTED' | 'ATTEMPTED' = 'WRONG_UNATTEMPTED';

  constructor(
    private route: ActivatedRoute,
    private examService: ExamService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('id');
    if (attemptId) {
      this.examService.getAttemptDetails(attemptId).subscribe({
        next: (res) => {
          this.attempt = res;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching result:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get filteredAnswers(): any[] {
    if (!this.attempt || !this.attempt.answers) return [];
    if (this.activeFilter === 'ATTEMPTED') {
      return this.attempt.answers.filter((q: any) => !this.isUnattempted(q));
    }
    return this.attempt.answers.filter((q: any) => !q.isCorrect);
  }

  countWrongAndUnattempted(): number {
    if (!this.attempt || !this.attempt.answers) return 0;
    return this.attempt.answers.filter((q: any) => !q.isCorrect).length;
  }

  countAttempted(): number {
    if (!this.attempt || !this.attempt.answers) return 0;
    return this.attempt.answers.filter((q: any) => !this.isUnattempted(q)).length;
  }

  countUnattempted(): number {
    if (!this.attempt || !this.attempt.answers) return 0;
    return this.attempt.answers.filter((q: any) => this.isUnattempted(q)).length;
  }

  isUnattempted(q: any): boolean {
    if (!q) return true;
    if (q.questionType === 'FILL_BLANK') {
      return !q.selectedTextAnswer || q.selectedTextAnswer.trim().length === 0;
    }
    if (q.questionType === 'MULTIPLE') {
      return !q.selectedOptionIndices || q.selectedOptionIndices.length === 0;
    }
    return q.selectedOptionIndex === null || q.selectedOptionIndex === undefined || q.selectedOptionIndex === -1;
  }

  isOptionSelected(q: any, optIdx: number): boolean {
    if (!q) return false;
    if (q.questionType === 'MULTIPLE') {
      return !!(q.selectedOptionIndices && q.selectedOptionIndices.includes(optIdx));
    }
    return q.selectedOptionIndex === optIdx;
  }

  isOptionCorrect(q: any, optIdx: number): boolean {
    if (!q) return false;
    if (q.questionType === 'MULTIPLE') {
      return !!(q.correctOptions && q.correctOptions.includes(optIdx));
    }
    return q.correctOptionIndex === optIdx;
  }

  getQuestionNumber(q: any): number {
    if (!this.attempt || !this.attempt.answers) return 1;
    const index = this.attempt.answers.findIndex((item: any) => item === q || item.questionId === q.questionId);
    return index >= 0 ? index + 1 : 1;
  }

  getOptionLabel(idx: number): string {
    return ['A', 'B', 'C', 'D'][idx] || '';
  }

  getPercentage(correct: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((correct / total) * 100);
  }
}
