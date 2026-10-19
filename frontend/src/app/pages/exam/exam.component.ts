import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ExamService, ClientQuestion, ExamSubmissionPayload } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

interface UserAnswer {
  questionId: string;
  questionType?: 'MCQ' | 'MULTIPLE' | 'FILL_BLANK';
  imageUrl?: string;
  selectedOptionIndex: number | null;
  selectedOptionIndices: number[];
  selectedTextAnswer: string;
  optionMapping: number[];
  isMarkedForReview: boolean;
}

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Main Exam Interface -->
    <div class="container-fluid py-4 px-4" *ngIf="!isLoading && !errorMessage && questions.length > 0 && currentQuestion">
      <!-- Anti-Cheating Warning Banner -->
      <div class="alert alert-warning border-warning border-2 rounded-4 shadow-sm mb-3 d-flex align-items-center justify-content-between py-2.5 px-3" *ngIf="tabSwitchCount > 0">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
          <span class="fw-bold text-dark">
            ANTI-CHEATING WARNING (Switch {{ tabSwitchCount }}/3): Tab switching or opening new tabs is strictly monitored! Exceeding 3 switches will auto-submit your exam.
          </span>
        </div>
        <span class="badge bg-danger text-white px-2.5 py-1.5 fw-bold">Violations: {{ tabSwitchCount }} / 3</span>
      </div>

      <!-- Top Exam Header Bar -->
      <div class="card border-0 shadow-sm rounded-4 mb-4 bg-white border-start border-4 border-primary">
        <div class="card-body py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary px-3 py-1.5 fw-bold fs-6">
                <i class="bi bi-file-earmark-text me-1"></i> {{ department }} ASSESSMENT
              </span>
              <span class="badge bg-info text-dark px-2.5 py-1.5 fw-semibold">LEVEL {{ level }}</span>
              <span class="badge bg-secondary px-2.5 py-1.5 fw-semibold" *ngIf="tabSwitchCount === 0">
                <i class="bi bi-shield-check me-1"></i> Anti-Cheating Enabled
              </span>
            </div>
            <small class="text-muted fw-semibold">
              Total Questions: {{ questions.length }} | Easy: {{ quota.easy }} | Moderate: {{ quota.moderate }} | Tough: {{ quota.tough }}
            </small>
          </div>

          <div class="d-flex align-items-center gap-3">
            <!-- Timer Box -->
            <div class="timer-box d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-3 border border-2 border-warning shadow-sm">
              <i class="bi bi-clock-fill text-warning fs-5"></i>
              <span class="fw-bold font-monospace fs-4 text-dark">{{ formatTime(remainingSeconds) }}</span>
            </div>

            <button class="btn btn-danger fw-bold px-4 shadow-sm" (click)="confirmSubmit()">
              <i class="bi bi-check-circle-fill me-1"></i> Submit Exam
            </button>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Main Question Area -->
        <div class="col-lg-8 col-xl-9">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <span class="fw-bold text-dark fs-6">
                Question {{ currentIndex + 1 }} of {{ questions.length }}
              </span>
              <span
                class="badge px-3 py-2 fs-6 fw-bold"
                [ngClass]="{
                  'bg-success': currentQuestion?.difficulty === 'EASY',
                  'bg-warning text-dark': currentQuestion?.difficulty === 'MODERATE',
                  'bg-danger': currentQuestion?.difficulty === 'TOUGH'
                }"
              >
                {{ currentQuestion?.difficulty }}
              </span>
            </div>

            <div class="card-body p-4 p-md-5 user-select-none">
              <!-- Question Text -->
              <div class="d-flex align-items-center gap-2 mb-4">
                <h5 class="fw-bold text-dark mb-0 fs-5" style="line-height: 1.6;">
                  {{ currentQuestion?.questionText }}
                </h5>
                <span *ngIf="currentQuestion?.questionType === 'MULTIPLE'" class="badge bg-warning-subtle text-dark border border-warning ms-1">
                  <i class="bi bi-ui-checks me-1"></i> Select All That Apply
                </span>
                <span *ngIf="currentQuestion?.questionType === 'FILL_BLANK'" class="badge bg-info-subtle text-info-emphasis border border-info ms-1">
                  <i class="bi bi-pencil-square me-1"></i> Fill in the Blank
                </span>
              </div>

              <!-- Image Diagram (if attached) -->
              <div class="mb-4 text-center p-3 bg-light rounded-4 border" *ngIf="currentQuestion?.imageUrl">
                <img [src]="currentQuestion.imageUrl" class="img-fluid rounded-3 shadow-xs" style="max-height: 360px; object-fit: contain;" alt="Question Diagram" />
              </div>

              <!-- MCQ Options List (Single Choice) -->
              <div class="d-flex flex-column gap-3 mb-4" *ngIf="(!currentQuestion?.questionType || currentQuestion?.questionType === 'MCQ') && currentQuestion?.options">
                <div
                  *ngFor="let option of currentQuestion.options; let optIdx = index"
                  class="p-3.5 border rounded-4 cursor-pointer transition-all d-flex align-items-center gap-3"
                  [ngClass]="{
                    'border-primary bg-primary bg-opacity-10 text-primary fw-bold shadow-sm':
                      userAnswers[currentIndex]?.selectedOptionIndex === optIdx,
                    'bg-white hover-bg-light border-2':
                      userAnswers[currentIndex]?.selectedOptionIndex !== optIdx
                  }"
                  (click)="selectOption(optIdx)"
                >
                  <div
                    class="rounded-circle border d-flex align-items-center justify-content-center fw-bold"
                    style="width: 36px; height: 36px; min-width: 36px;"
                    [ngClass]="{
                      'bg-primary text-white border-primary':
                        userAnswers[currentIndex]?.selectedOptionIndex === optIdx,
                      'bg-light text-secondary':
                        userAnswers[currentIndex]?.selectedOptionIndex !== optIdx
                    }"
                  >
                    {{ getOptionLabel(optIdx) }}
                  </div>
                  <div class="flex-grow-1 fs-6 text-dark">{{ option }}</div>
                </div>
              </div>

              <!-- MULTIPLE Select Options List (Checkboxes) -->
              <div class="d-flex flex-column gap-3 mb-4" *ngIf="currentQuestion?.questionType === 'MULTIPLE' && currentQuestion?.options">
                <div
                  *ngFor="let option of currentQuestion.options; let optIdx = index"
                  class="p-3.5 border rounded-4 cursor-pointer transition-all d-flex align-items-center gap-3"
                  [ngClass]="{
                    'border-primary bg-primary bg-opacity-10 text-primary fw-bold shadow-sm':
                      isMultipleOptionSelected(optIdx),
                    'bg-white hover-bg-light border-2':
                      !isMultipleOptionSelected(optIdx)
                  }"
                  (click)="toggleMultipleOption(optIdx)"
                >
                  <div
                    class="rounded-3 border d-flex align-items-center justify-content-center fw-bold"
                    style="width: 36px; height: 36px; min-width: 36px;"
                    [ngClass]="{
                      'bg-primary text-white border-primary':
                        isMultipleOptionSelected(optIdx),
                      'bg-light text-secondary':
                        !isMultipleOptionSelected(optIdx)
                    }"
                  >
                    <i *ngIf="isMultipleOptionSelected(optIdx)" class="bi bi-check-lg fs-5"></i>
                    <span *ngIf="!isMultipleOptionSelected(optIdx)">{{ getOptionLabel(optIdx) }}</span>
                  </div>
                  <div class="flex-grow-1 fs-6 text-dark">{{ option }}</div>
                </div>
              </div>

              <!-- FILL IN THE BLANK Input Box -->
              <div class="mb-4 p-4 bg-light rounded-4 border" *ngIf="currentQuestion?.questionType === 'FILL_BLANK'">
                <label class="form-label fw-bold text-dark mb-2">Type Your Answer Below:</label>
                <input
                  type="text"
                  class="form-control form-control-lg rounded-3 border-2"
                  placeholder="Enter answer text..."
                  [value]="userAnswers[currentIndex]?.selectedTextAnswer || ''"
                  (input)="onTextAnswerInput($event)"
                />
              </div>
            </div>

            <!-- Footer Controls -->
            <div class="card-footer bg-white border-top py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div class="d-flex gap-2">
                <button
                  class="btn btn-outline-secondary px-3 fw-semibold"
                  [disabled]="currentIndex === 0"
                  (click)="previousQuestion()"
                >
                  <i class="bi bi-arrow-left me-1"></i> Previous
                </button>
                <button
                  class="btn btn-outline-warning px-3 fw-semibold text-dark"
                  (click)="toggleMarkForReview()"
                >
                  <i class="bi bi-bookmark-star me-1"></i>
                  {{ userAnswers[currentIndex]?.isMarkedForReview ? 'Unmark Review' : 'Mark for Review' }}
                </button>
              </div>

              <div class="d-flex gap-2">
                <button
                  class="btn btn-outline-danger px-3 fw-semibold"
                  *ngIf="isCurrentQuestionAnswered()"
                  (click)="clearSelection()"
                >
                  Clear Choice
                </button>
                <button
                  class="btn btn-primary px-4 fw-bold shadow-sm"
                  *ngIf="currentIndex < questions.length - 1"
                  (click)="nextQuestion()"
                >
                  Next <i class="bi bi-arrow-right ms-1"></i>
                </button>
                <button
                  class="btn btn-success px-4 fw-bold shadow-sm"
                  *ngIf="currentIndex === questions.length - 1"
                  (click)="confirmSubmit()"
                >
                  Submit Exam
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Navigation Palette Side Panel -->
        <div class="col-lg-4 col-xl-3">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white py-3 border-bottom">
              <h6 class="fw-bold mb-0 text-dark">
                <i class="bi bi-grid-3x3-gap-fill me-2 text-primary"></i> Question Palette
              </h6>
            </div>
            <div class="card-body">
              <!-- Legend Status Indicators -->
              <div class="d-flex flex-wrap gap-2 small text-muted mb-3 pb-3 border-bottom">
                <div class="d-flex align-items-center gap-1">
                  <span class="badge bg-success" style="width:20px; height:20px; font-size:10px;">✓</span> Answered
                </div>
                <div class="d-flex align-items-center gap-1">
                  <span class="badge bg-secondary opacity-50" style="width:20px; height:20px; font-size:10px;">•</span> Unanswered
                </div>
                <div class="d-flex align-items-center gap-1">
                  <span class="badge bg-warning text-dark" style="width:20px; height:20px; font-size:10px;">★</span> Review
                </div>
              </div>

              <!-- Question Palette Grid -->
              <div class="d-flex flex-wrap gap-2 justify-content-start">
                <button
                  *ngFor="let q of questions; let idx = index"
                  type="button"
                  class="btn btn-sm fw-bold rounded-3 position-relative"
                  style="width: 40px; height: 40px;"
                  [ngClass]="{
                    'btn-success text-white': userAnswers[idx]?.selectedOptionIndex !== null && userAnswers[idx]?.selectedOptionIndex !== undefined && !userAnswers[idx]?.isMarkedForReview,
                    'btn-warning text-dark': userAnswers[idx]?.isMarkedForReview,
                    'btn-outline-secondary': (userAnswers[idx]?.selectedOptionIndex === null || userAnswers[idx]?.selectedOptionIndex === undefined) && !userAnswers[idx]?.isMarkedForReview,
                    'border-3 border-primary shadow-sm': currentIndex === idx
                  }"
                  (click)="goToQuestion(idx)"
                >
                  {{ idx + 1 }}
                </button>
              </div>

              <!-- Summary Counter -->
              <div class="mt-4 p-3 bg-light rounded-3 small border">
                <div class="d-flex justify-content-between mb-1">
                  <span>Answered:</span>
                  <strong class="text-success">{{ countAnswered() }}</strong>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span>Marked for Review:</span>
                  <strong class="text-warning">{{ countReview() }}</strong>
                </div>
                <div class="d-flex justify-content-between">
                  <span>Unanswered:</span>
                  <strong class="text-secondary">{{ countUnanswered() }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div class="container text-center py-5" *ngIf="!isLoading && errorMessage">
      <div class="card border-0 shadow-sm p-5 rounded-4 max-w-500 mx-auto">
        <i *ngIf="isAccessLocked" class="bi bi-shield-lock-fill text-danger display-1 mb-3"></i>
        <i *ngIf="!isAccessLocked" class="bi bi-exclamation-triangle-fill text-warning display-1 mb-3"></i>
        <h4 class="fw-bold text-dark">{{ isAccessLocked ? 'Exam Access Locked' : 'Exam Notice' }}</h4>
        <p class="text-muted mb-4" style="line-height: 1.6;">{{ errorMessage }}</p>
        <div class="d-flex justify-content-center flex-wrap gap-2">
          <a *ngIf="isAccessLocked" routerLink="/dashboard" class="btn btn-primary px-4 fw-bold shadow-xs">
            <i class="bi bi-house-door me-1"></i> Return to Dashboard
          </a>
          <a *ngIf="isAccessLocked" routerLink="/my-attempts" class="btn btn-outline-secondary px-4 fw-semibold shadow-xs">
            <i class="bi bi-clock-history me-1"></i> Past Attempts
          </a>
          <button *ngIf="!isAccessLocked" class="btn btn-outline-primary px-4 fw-bold" (click)="retryLoadExam()">
            <i class="bi bi-arrow-clockwise me-1"></i> Retry Loading
          </button>
          <a *ngIf="!isAccessLocked" routerLink="/login" class="btn btn-primary px-4 fw-bold">
            <i class="bi bi-box-arrow-in-right me-1"></i> Back to Login
          </a>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="container text-center py-5" *ngIf="!isLoading && !errorMessage && questions.length === 0">
      <div class="card border-0 shadow-sm p-5 rounded-4 max-w-500 mx-auto">
        <i class="bi bi-file-earmark-x text-warning display-1 mb-3"></i>
        <h4 class="fw-bold text-dark">No Questions Found</h4>
        <p class="text-muted mb-4">
          There are currently no active assessment questions seeded or uploaded for the <strong>{{ department }}</strong> department.
        </p>
        <div class="d-flex justify-content-center gap-3">
          <a routerLink="/dashboard" class="btn btn-primary px-4 fw-bold">
            <i class="bi bi-house-door me-1"></i> Back to Dashboard
          </a>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="container text-center py-5" *ngIf="isLoading">
      <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
      <h5 class="fw-bold">Generating Your Custom Assessment...</h5>
      <p class="text-muted">Fetching 25 jumbled questions based on your Department & Level...</p>
    </div>

    <!-- Submit Confirmation Modal Overlay -->
    <div class="modal fade show d-block bg-dark bg-opacity-50" tabIndex="-1" *ngIf="showSubmitModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header bg-primary text-white rounded-top-4 py-3">
            <h5 class="modal-title fw-bold">Submit Exam?</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showSubmitModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <p class="mb-3">Are you sure you want to submit your exam now?</p>
            <div class="bg-light p-3 rounded-3 small mb-3 border">
              <div class="d-flex justify-content-between mb-1">
                <span>Total Questions:</span> <strong>{{ questions.length }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span>Answered Questions:</span> <strong class="text-success">{{ countAnswered() }}</strong>
              </div>
              <div class="d-flex justify-content-between">
                <span>Unanswered Questions:</span> <strong class="text-danger">{{ countUnanswered() }}</strong>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-outline-secondary" (click)="showSubmitModal = false">Continue Exam</button>
            <button type="button" class="btn btn-success fw-bold px-4" (click)="submitExam()">Confirm & Submit</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 10-Second Tab Switch Return Countdown & Warning Overlay Modal -->
    <div class="modal fade show d-block bg-dark bg-opacity-75" tabIndex="-1" *ngIf="isTabAway || showTabWarningModal" style="z-index: 99999;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-danger border-3 shadow-lg overflow-hidden">
          <div class="modal-header bg-danger text-white py-3 px-4">
            <h5 class="modal-title fw-bold d-flex align-items-center gap-2 mb-0 fs-5">
              <i class="bi bi-exclamation-octagon-fill fs-3 text-warning"></i>
              ANTI-CHEATING WARNING: TAB SWITCH DETECTED
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeTabWarningModal()" *ngIf="!isTabAway"></button>
          </div>
          <div class="modal-body p-4 p-md-5 text-center bg-white">
            <!-- Active 10-Second Countdown Display (While tab is away / active countdown) -->
            <div *ngIf="isTabAway" class="py-2">
              <div class="display-2 fw-bolder text-danger font-monospace mb-2 tracking-wider">
                00:{{ tabAwayRemaining < 10 ? '0' + tabAwayRemaining : tabAwayRemaining }}
              </div>
              <h4 class="fw-bold text-dark mb-2">Return to the Exam Tab Immediately!</h4>
              <p class="text-muted fs-6 mb-3">
                You have <strong>{{ tabAwayRemaining }} seconds</strong> remaining to return to this exam page before your assessment is automatically submitted.
              </p>
              <div class="progress rounded-pill shadow-xs" style="height: 14px;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-danger" 
                  role="progressbar" 
                  [style.width.%]="(tabAwayRemaining / 10) * 100"
                ></div>
              </div>
            </div>

            <!-- Returned within 10s Warning Pop-up Message Box -->
            <div *ngIf="!isTabAway && showTabWarningModal" class="py-2">
              <div class="d-inline-block badge bg-danger text-white fs-6 px-4 py-2.5 mb-3 rounded-pill fw-bold shadow-sm">
                <i class="bi bi-shield-exclamation me-1"></i> Violation {{ tabSwitchCount }} of 3 Allowed Tab Switches
              </div>

              <h4 class="fw-bold text-dark mb-2">Tab Switch Recorded!</h4>
              <p class="text-secondary fs-6 mb-3">
                You were away from the exam screen for <strong class="text-danger">{{ lastAwayDuration }} second(s)</strong>.
              </p>

              <div class="alert alert-warning border-warning border-2 text-start p-3.5 rounded-3 mb-0">
                <div class="d-flex gap-2">
                  <i class="bi bi-info-circle-fill text-warning fs-5 flex-shrink-0"></i>
                  <div>
                    <strong class="text-dark">Strict Assessment Rules:</strong>
                    <ul class="mb-0 mt-1.5 ps-3 small text-muted">
                      <li>Tab switching or opening external windows is strictly monitored.</li>
                      <li>Exceeding <strong>3 total tab switches</strong> will trigger <strong>instant automatic submission</strong>.</li>
                      <li>Remaining away for <strong>10 seconds or longer</strong> will immediately submit your exam.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 justify-content-center bg-light py-3 px-4">
            <button 
              type="button" 
              class="btn btn-danger btn-lg fw-bold px-5 py-2.5 rounded-3 shadow-sm fs-6" 
              (click)="closeTabWarningModal()"
              *ngIf="!isTabAway"
            >
              <i class="bi bi-shield-check me-1"></i> I Understand & Return to Exam
            </button>
            <div *ngIf="isTabAway" class="text-danger fw-bold fs-6">
              <i class="bi bi-lock-fill me-1"></i> Assessment navigation locked — Return to this tab now!
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hover-bg-light:hover {
      background-color: #f8fafc !important;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .max-w-500 {
      max-width: 500px;
    }
    .user-select-none {
      user-select: none;
      -webkit-user-select: none;
    }
  `]
})
export class ExamComponent implements OnInit, OnDestroy {
  isLoading = true;
  errorMessage = '';
  isAccessLocked = false;
  questions: ClientQuestion[] = [];
  userAnswers: UserAnswer[] = [];
  currentIndex = 0;
  department = '';
  level = '';
  quota = { easy: 0, moderate: 0, tough: 0 };

  remainingSeconds = 1800; // 30 mins
  timerInterval: any;
  showSubmitModal = false;
  tabSwitchCount = 0;

  isTabAway = false;
  showTabWarningModal = false;
  tabAwayRemaining = 10;
  tabAwayStartTime = 0;
  tabAwayInterval: any = null;
  lastAwayDuration = 0;
  originalDocumentTitle = 'HBL ASSESSMENT PORTAL';

  constructor(
    private examService: ExamService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Restrict window / tab closing during active assessment
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (!this.isLoading && this.questions.length > 0) {
      $event.returnValue = 'Warning: Leaving or refreshing this page will not pause your exam timer.';
    }
  }

  // Lock browser Back & Forward navigation buttons during active assessment
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any): void {
    if (!this.isLoading && this.questions.length > 0) {
      history.pushState(null, '', location.href);
      alert('Browser Back/Forward navigation is disabled during active exam assessment.');
    }
  }

  // Anti-Cheating: Detect tab switching / window blur and focus changes
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (this.isLoading || this.questions.length === 0) return;

    if (document.hidden) {
      if (!this.isTabAway) {
        this.triggerTabAway();
      }
    } else {
      if (this.isTabAway) {
        this.handleTabReturn();
      }
    }
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    if (this.isLoading || this.questions.length === 0) return;
    if (!this.isTabAway && (document.hidden || !document.hasFocus())) {
      this.triggerTabAway();
    }
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    if (this.isLoading || this.questions.length === 0) return;
    if (this.isTabAway && !document.hidden && document.hasFocus()) {
      this.handleTabReturn();
    }
  }

  private triggerTabAway(): void {
    this.isTabAway = true;
    this.tabAwayStartTime = Date.now();
    this.tabAwayRemaining = 10;
    this.startTabAwayCountdown();
  }

  private handleTabReturn(): void {
    this.isTabAway = false;
    this.stopTabAwayCountdown();

    const awayMs = Date.now() - this.tabAwayStartTime;
    const awaySec = Math.max(1, Math.floor(awayMs / 1000));
    this.lastAwayDuration = awaySec;

    if (awaySec >= 10) {
      alert(`Anti-Cheating Violation: You were away from the exam screen for ${awaySec} seconds (exceeding the 10-second return limit)! Your exam has been automatically submitted.`);
      this.submitExam();
    } else {
      this.tabSwitchCount++;
      this.showTabWarningModal = true;
      this.cdr.detectChanges();

      if (this.tabSwitchCount >= 3) {
        this.showTabWarningModal = false;
        alert(`Maximum allowed tab switches (3/3) exceeded! (You were away for ${awaySec} second(s)). Your exam is being automatically submitted for anti-cheating compliance.`);
        this.submitExam();
      }
    }
  }

  private startTabAwayCountdown(): void {
    if (this.tabAwayInterval) {
      clearInterval(this.tabAwayInterval);
    }
    this.originalDocumentTitle = document.title;

    this.tabAwayInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - this.tabAwayStartTime) / 1000);
      this.tabAwayRemaining = Math.max(0, 10 - elapsedSec);
      document.title = `⚠️ RETURN TO EXAM (${this.tabAwayRemaining}s) - HBL Portal`;
      this.cdr.detectChanges();

      if (this.tabAwayRemaining <= 0) {
        this.stopTabAwayCountdown();
        if (this.isTabAway) {
          this.isTabAway = false;
          alert('Anti-Cheating Timeout: 10-second tab return limit expired! Your exam is being automatically submitted.');
          this.submitExam();
        }
      }
    }, 250);
  }

  private stopTabAwayCountdown(): void {
    if (this.tabAwayInterval) {
      clearInterval(this.tabAwayInterval);
      this.tabAwayInterval = null;
    }
    document.title = 'HBL ASSESSMENT PORTAL';
  }

  closeTabWarningModal(): void {
    this.showTabWarningModal = false;
  }

  // Disable Right-Click Context Menu
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (!this.isLoading && this.questions.length > 0) {
      event.preventDefault();
    }
  }

  // Disable Copying and Pasting Questions
  @HostListener('copy', ['$event'])
  @HostListener('paste', ['$event'])
  onCopyPaste(event: Event): void {
    if (!this.isLoading && this.questions.length > 0) {
      event.preventDefault();
    }
  }

  // Disable Developer Tool & Copy Key Shortcuts (F12, Ctrl+C, Ctrl+V, Ctrl+U)
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isLoading && this.questions.length > 0) {
      if (
        event.key === 'F12' ||
        (event.ctrlKey && ['c', 'v', 'u', 'C', 'V', 'U'].includes(event.key))
      ) {
        event.preventDefault();
      }
    }
  }

  ngOnInit(): void {
    this.loadExam();
  }

  loadExam(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.examService.startExam().subscribe({
      next: (res) => {
        this.department = res.department || '';
        this.level = res.level || '';
        this.quota = res.quota || { easy: 0, moderate: 0, tough: 0 };
        this.questions = res.questions || [];

        if (this.questions.length > 0) {
          history.pushState(null, '', location.href);
          this.userAnswers = this.questions.map((q) => ({
            questionId: q.questionId,
            questionType: q.questionType || 'MCQ',
            imageUrl: q.imageUrl || '',
            selectedOptionIndex: null,
            selectedOptionIndices: [],
            selectedTextAnswer: '',
            optionMapping: q.optionMapping || [],
            isMarkedForReview: false,
          }));
          this.initPersistentTimer();
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load exam:', err);
        this.isLoading = false;

        if (err.status === 403 || err.error?.locked) {
          this.isAccessLocked = true;
          this.errorMessage = err.error?.message || 'Exam access is locked or your allowed attempt has already been consumed. If you faced an interruption or problem, please contact your Admin to grant permission for another attempt.';
          this.clearExamTimerStorage();
        } else if (err.status === 0) {
          this.errorMessage = 'Unable to connect to the Exam Portal backend server. Please ensure the backend is running.';
        } else if (err.status === 404 || err.status === 401) {
          this.errorMessage = 'Session expired or invalid employee profile. Please log in again using the instant login button.';
          this.clearExamTimerStorage();
          this.authService.logout();
        } else {
          this.errorMessage = err.error?.message || 'Failed to load exam questions. Please try logging in again.';
        }

        this.cdr.detectChanges();
      },
    });
  }

  // Persistent Timer: Preserves exact remaining seconds across browser refreshes / window reloads
  private initPersistentTimer(): void {
    const emp = this.authService.getStoredEmployee();
    const storageKey = emp ? `exam_end_time_${emp.employeeId}` : 'exam_end_time_default';
    const savedEndTime = localStorage.getItem(storageKey);

    const now = Date.now();
    let targetEndTime: number;

    if (savedEndTime && !isNaN(parseInt(savedEndTime, 10))) {
      targetEndTime = parseInt(savedEndTime, 10);
      const diffSeconds = Math.floor((targetEndTime - now) / 1000);
      if (diffSeconds > 0) {
        this.remainingSeconds = diffSeconds;
      } else {
        this.remainingSeconds = 0;
      }
    } else {
      targetEndTime = now + (1800 * 1000); // 30 mins from now
      localStorage.setItem(storageKey, targetEndTime.toString());
      this.remainingSeconds = 1800;
    }

    this.startTimer(storageKey, targetEndTime);
  }

  private startTimer(storageKey: string, targetEndTime: number): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const diffSeconds = Math.floor((targetEndTime - now) / 1000);

      if (diffSeconds > 0) {
        this.remainingSeconds = diffSeconds;
        this.cdr.detectChanges();
      } else {
        this.remainingSeconds = 0;
        clearInterval(this.timerInterval);
        this.clearExamTimerStorage();
        alert('Time is up! Submitting your exam automatically.');
        this.submitExam();
      }
    }, 1000);
  }

  private clearExamTimerStorage(): void {
    const emp = this.authService.getStoredEmployee();
    const storageKey = emp ? `exam_end_time_${emp.employeeId}` : 'exam_end_time_default';
    localStorage.removeItem(storageKey);
  }

  retryLoadExam(): void {
    this.loadExam();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.stopTabAwayCountdown();
  }

  get currentQuestion(): ClientQuestion | null {
    return this.questions && this.questions[this.currentIndex] ? this.questions[this.currentIndex] : null;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getOptionLabel(idx: number): string {
    return ['A', 'B', 'C', 'D'][idx] || '';
  }

  selectOption(optIdx: number): void {
    if (this.userAnswers[this.currentIndex]) {
      this.userAnswers[this.currentIndex].selectedOptionIndex = optIdx;
    }
  }

  toggleMultipleOption(optIdx: number): void {
    const curAns = this.userAnswers[this.currentIndex];
    if (!curAns) return;
    if (!curAns.selectedOptionIndices) {
      curAns.selectedOptionIndices = [];
    }
    const idx = curAns.selectedOptionIndices.indexOf(optIdx);
    if (idx >= 0) {
      curAns.selectedOptionIndices.splice(idx, 1);
    } else {
      curAns.selectedOptionIndices.push(optIdx);
    }
  }

  isMultipleOptionSelected(optIdx: number): boolean {
    const curAns = this.userAnswers[this.currentIndex];
    return !!(curAns && curAns.selectedOptionIndices && curAns.selectedOptionIndices.includes(optIdx));
  }

  onTextAnswerInput(event: any): void {
    const val = event.target ? event.target.value : '';
    if (this.userAnswers[this.currentIndex]) {
      this.userAnswers[this.currentIndex].selectedTextAnswer = val;
    }
  }

  isCurrentQuestionAnswered(): boolean {
    const curAns = this.userAnswers[this.currentIndex];
    if (!curAns) return false;
    return this.isAnsAnswered(curAns);
  }

  isAnsAnswered(a: UserAnswer): boolean {
    if (!a) return false;
    if (a.questionType === 'FILL_BLANK') {
      return !!(a.selectedTextAnswer && a.selectedTextAnswer.trim().length > 0);
    }
    if (a.questionType === 'MULTIPLE') {
      return !!(a.selectedOptionIndices && a.selectedOptionIndices.length > 0);
    }
    return a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined;
  }

  clearSelection(): void {
    if (this.userAnswers[this.currentIndex]) {
      this.userAnswers[this.currentIndex].selectedOptionIndex = null;
      this.userAnswers[this.currentIndex].selectedOptionIndices = [];
      this.userAnswers[this.currentIndex].selectedTextAnswer = '';
    }
  }

  toggleMarkForReview(): void {
    if (this.userAnswers[this.currentIndex]) {
      this.userAnswers[this.currentIndex].isMarkedForReview =
        !this.userAnswers[this.currentIndex].isMarkedForReview;
    }
  }

  goToQuestion(idx: number): void {
    this.currentIndex = idx;
  }

  nextQuestion(): void {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  countAnswered(): number {
    return this.userAnswers.filter((a) => this.isAnsAnswered(a)).length;
  }

  countReview(): number {
    return this.userAnswers.filter((a) => a.isMarkedForReview).length;
  }

  countUnanswered(): number {
    return this.userAnswers.filter((a) => !this.isAnsAnswered(a)).length;
  }

  confirmSubmit(): void {
    this.showSubmitModal = true;
  }

  submitExam(): void {
    this.showSubmitModal = false;
    this.isTabAway = false;
    this.showTabWarningModal = false;
    this.stopTabAwayCountdown();
    this.isLoading = true;
    this.clearExamTimerStorage();

    const payload: ExamSubmissionPayload = {
      answers: this.userAnswers.map((a) => ({
        questionId: a.questionId,
        selectedOptionIndex: a.selectedOptionIndex,
        selectedOptionIndices: a.selectedOptionIndices,
        selectedTextAnswer: a.selectedTextAnswer,
        optionMapping: a.optionMapping,
      })),
    };

    this.examService.submitExam(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/result', res.attemptId], { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        alert('Error submitting exam: ' + (err.error?.message || 'Server error'));
        this.cdr.detectChanges();
      },
    });
  }
}
