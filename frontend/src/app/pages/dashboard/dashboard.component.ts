import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, Employee } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4" *ngIf="employee">
      <!-- Welcome Hero Banner -->
      <div class="card bg-gradient bg-dark text-white p-4 mb-4 rounded-4 shadow-sm border-0">
        <div class="row align-items-center">
          <div class="col-md-7">
            <h2 class="fw-bold mb-1">Welcome, {{ employee.name }}!</h2>
            <p class="text-light opacity-75 mb-0">
              Department: <strong class="text-warning">{{ employee.department }}</strong> | Level: <strong class="text-info">{{ employee.level }}</strong>
            </p>
          </div>
          <div class="col-md-5 text-md-end mt-3 mt-md-0">
            <!-- ADMIN Action Button -->
            <a *ngIf="employee.role === 'ADMIN'" routerLink="/admin" class="btn btn-warning btn-lg px-4 fw-bold shadow-sm me-2">
              <i class="bi bi-speedometer2 me-1"></i> Admin Panel
            </a>

            <!-- Employee Start Exam Button (when link is active & attempt available) -->
            <a *ngIf="isExamAllowed()" routerLink="/exam" class="btn btn-success btn-lg px-4 fw-bold shadow-sm">
              <i class="bi bi-play-circle-fill me-2"></i> Start Exam Now
            </a>

            <!-- Employee Locked Button (when attempt consumed) -->
            <button *ngIf="!isExamAllowed() && isAttemptConsumed()" class="btn btn-danger btn-lg px-4 fw-bold shadow-sm" disabled>
              <i class="bi bi-lock-fill me-2"></i> Attempt Consumed
            </button>

            <!-- Employee Inactive Button (when link not sent yet) -->
            <button *ngIf="!isExamAllowed() && !isAttemptConsumed() && employee.role !== 'ADMIN'" class="btn btn-secondary btn-lg px-4 fw-bold shadow-sm" disabled>
              <i class="bi bi-hourglass-split me-2"></i> Exam Link Inactive
            </button>
          </div>
        </div>
      </div>

      <!-- Exam Link & Attempt Status Alert Banner for Employees -->
      <div *ngIf="employee.role !== 'ADMIN'" class="mb-4">
        <!-- Active Link State -->
        <div *ngIf="isExamAllowed()" class="alert alert-success border-success border-2 rounded-4 shadow-sm py-3 px-4 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <i class="bi bi-check-circle-fill text-success fs-3"></i>
            <div>
              <strong class="d-block text-dark fs-6">Exam Link is Active — 1 Attempt Available</strong>
              <span class="text-muted small">Admin has enabled your exam link. Once started, this link permits exactly <strong>1 exam attempt</strong>. Please ensure you have a quiet environment and stable internet before clicking "Start Exam Now".</span>
            </div>
          </div>
          <span class="badge bg-success text-white px-3 py-2 fw-bold fs-7">
            Allowed: {{ employee.examAccess?.attemptsAllowed || 1 }} | Used: {{ employee.examAccess?.attemptsUsed || 0 }}
          </span>
        </div>

        <!-- Attempt Consumed / Locked State -->
        <div *ngIf="isAttemptConsumed()" class="alert alert-danger border-danger border-2 rounded-4 shadow-sm py-3 px-4 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <i class="bi bi-shield-lock-fill text-danger fs-3"></i>
            <div>
              <strong class="d-block text-dark fs-6">Exam Attempt Limit Reached (Used: {{ employee.examAccess?.attemptsUsed }} / {{ employee.examAccess?.attemptsAllowed }})</strong>
              <span class="text-muted small">
                You have already used your single allowed exam attempt. 
                If your test was interrupted, crashed, or you experienced any problem, <strong>please contact your Admin (MS. Sushma) to grant permission for one more attempt</strong>.
              </span>
            </div>
          </div>
          <span class="badge bg-danger text-white px-3 py-2 fw-bold fs-7">LOCKED</span>
        </div>

        <!-- Link Not Sent / Inactive State -->
        <div *ngIf="!isExamAllowed() && !isAttemptConsumed()" class="alert alert-warning border-warning border-2 rounded-4 shadow-sm py-3 px-4 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <i class="bi bi-exclamation-triangle-fill text-warning fs-3"></i>
            <div>
              <strong class="d-block text-dark fs-6">Exam Link Not Yet Enabled</strong>
              <span class="text-muted small">
                The Admin has not yet enabled an exam link for your account. You will receive an access link or your supervisor will activate your attempt when testing starts.
              </span>
            </div>
          </div>
          <span class="badge bg-warning text-dark px-3 py-2 fw-bold fs-7">AWAITING LINK</span>
        </div>
      </div>

      <div class="row g-4">
        <!-- Exam Pattern & Instructions Card -->
        <div class="col-lg-8">
          <div class="card h-100 border-0 shadow-sm rounded-4">
            <div class="card-header bg-white py-3 border-0">
              <h5 class="fw-bold mb-0 text-primary">
                <i class="bi bi-info-circle-fill me-2"></i> Exam Pattern & Instructions
              </h5>
            </div>
            <div class="card-body">
              <ul class="list-group list-group-flush text-secondary fs-6">
                <li class="list-group-item px-0 py-3">
                  <div class="d-flex align-items-start gap-3">
                    <i class="bi bi-key-fill text-primary fs-4"></i>
                    <div>
                      <strong class="text-dark d-block mb-1">Single Attempt Policy</strong>
                      <span>Each enabled exam link allows exactly <strong>one attempt</strong>. In case of unexpected interruption, only Admin can grant permission to unlock a re-attempt.</span>
                    </div>
                  </div>
                </li>
                <li class="list-group-item px-0 py-3">
                  <div class="d-flex align-items-start gap-3">
                    <i class="bi bi-file-earmark-text-fill text-primary fs-4"></i>
                    <div>
                      <strong class="text-dark d-block mb-1">Exam Questions & Format</strong>
                      <span>Total 25 questions dynamically generated for {{ employee.department }} (MCQ, Multi-select, Fill in the blanks with diagrams).</span>
                    </div>
                  </div>
                </li>
                <li class="list-group-item px-0 py-3">
                  <div class="d-flex align-items-start gap-3">
                    <i class="bi bi-clock-history text-primary fs-4"></i>
                    <div>
                      <strong class="text-dark d-block mb-1">Duration & Time Limit</strong>
                      <span>30 Minutes countdown timer. Auto-submits when time expires.</span>
                    </div>
                  </div>
                </li>
                <li class="list-group-item px-0 py-3 border-bottom-0">
                  <div class="d-flex align-items-start gap-3">
                    <i class="bi bi-shield-check text-primary fs-4"></i>
                    <div>
                      <strong class="text-dark d-block mb-1">Anti-Cheating Monitoring</strong>
                      <span>Tab switching and window minimize events are tracked in real-time. Exceeding 3 tab switches will auto-submit the exam.</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Employee Info Card -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body">
              <h5 class="fw-bold text-dark mb-3">Employee Details</h5>
              <table class="table table-sm table-borderless small mb-0">
                <tbody>
                  <tr>
                    <td class="text-muted">Employee ID:</td>
                    <td class="fw-bold"><code>{{ employee.employeeId }}</code></td>
                  </tr>
                  <tr>
                    <td class="text-muted">Full Name:</td>
                    <td class="fw-bold">{{ employee.name }}</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Email:</td>
                    <td>{{ employee.email }}</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Department:</td>
                    <td><span class="badge bg-primary">{{ employee.department }}</span></td>
                  </tr>
                  <tr>
                    <td class="text-muted">Level:</td>
                    <td><span class="badge bg-info text-dark">{{ employee.level }}</span></td>
                  </tr>
                  <tr>
                    <td class="text-muted">Exam Access:</td>
                    <td>
                      <span *ngIf="employee.role === 'ADMIN'" class="badge bg-dark">ADMIN UNLIMITED</span>
                      <span *ngIf="employee.role !== 'ADMIN' && isExamAllowed()" class="badge bg-success">LINK ACTIVE</span>
                      <span *ngIf="employee.role !== 'ADMIN' && isAttemptConsumed()" class="badge bg-danger">ATTEMPT USED</span>
                      <span *ngIf="employee.role !== 'ADMIN' && !isExamAllowed() && !isAttemptConsumed()" class="badge bg-secondary">NOT ENABLED</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card bg-primary-subtle border-primary-subtle text-primary-emphasis rounded-4">
            <div class="card-body">
              <h6 class="fw-bold"><i class="bi bi-award me-1"></i> Score History</h6>
              <p class="small mb-3">Review your past exam attempts and score breakdowns.</p>
              <a routerLink="/my-attempts" class="btn btn-primary btn-sm w-100 fw-bold">
                View Past Results
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  employee: Employee | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.employee = this.authService.getStoredEmployee();
    // Fetch live profile to reflect any freshly enabled exam link or admin re-attempt permission
    this.authService.refreshProfile().subscribe({
      next: (emp) => {
        this.employee = emp;
      },
      error: () => {}
    });
  }

  isExamAllowed(): boolean {
    if (!this.employee) return false;
    if (this.employee.role === 'ADMIN') return true;
    const access = this.employee.examAccess;
    if (!access) return false;
    return access.isLinkActive && (access.attemptsUsed < access.attemptsAllowed);
  }

  isAttemptConsumed(): boolean {
    if (!this.employee || this.employee.role === 'ADMIN') return false;
    const access = this.employee.examAccess;
    if (!access) return false;
    return (access.attemptsAllowed > 0) && (access.attemptsUsed >= access.attemptsAllowed);
  }
}
